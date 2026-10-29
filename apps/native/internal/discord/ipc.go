package discord

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"nowly.client/native/internal/logging"
)

const (
	opHandshake uint32 = 0
	opFrame     uint32 = 1

	// Discord can accept the pipe connection while it is still starting and
	// never answer; without a bound the single-threaded host would freeze.
	readTimeout = 5 * time.Second
	ipcSlots    = 10
)

var errReadTimeout = errors.New("discord ipc read timed out")

type Client struct {
	clientID string
	conn     io.ReadWriteCloser
	ready    bool
	profile  *Profile
	logger   *logging.Logger
}

type Profile struct {
	ID         string
	Username   string
	GlobalName string
	Avatar     string
}

type Packet struct {
	Op   uint32
	Data map[string]any
}

func NewClient(clientID string) *Client {
	return &Client{clientID: clientID}
}

func (c *Client) SetLogger(logger *logging.Logger) {
	c.logger = logger
}

func (c *Client) Connected() bool {
	return c.conn != nil && c.ready
}

func (c *Client) Profile() *Profile {
	return c.profile
}

func (c *Client) Connect() error {
	if c.Connected() {
		return nil
	}

	c.Close()
	c.log("discord connect: scanning for discord-ipc socket")

	conn, err := dialIPC()
	if err != nil {
		c.log("discord connect open failed: %v", err)
		return err
	}
	c.conn = conn

	if _, err := c.conn.Write(encode(opHandshake, map[string]any{
		"v":         1,
		"client_id": c.clientID,
	})); err != nil {
		c.Close()
		c.log("discord handshake write failed: %v", err)
		return err
	}

	packet, err := readPacketTimeout(c.conn, readTimeout)
	if err != nil {
		c.drop(err)
		c.log("discord handshake read failed: %v", err)
		return err
	}
	c.log("discord handshake response: %+v", packet.Data)

	if event, _ := packet.Data["evt"].(string); event != "READY" {
		c.Close()
		return errors.New("discord handshake failed")
	}

	// Snapshot the user identity from the READY payload so the extension can
	// show a real connected preview.
	c.profile = parseReadyProfile(packet.Data)

	c.ready = true
	c.log("discord connected")
	return nil
}

func (c *Client) SetActivity(activity Activity) error {
	return c.sendActivity(activity)
}

func (c *Client) ClearActivity() error {
	return c.sendActivity(nil)
}

func (c *Client) sendActivity(activity any) error {
	if err := c.Connect(); err != nil {
		return err
	}

	write := func() error {
		return c.writeCommand(map[string]any{
			"cmd": "SET_ACTIVITY",
			"args": map[string]any{
				"pid":      os.Getpid(),
				"activity": activity,
			},
			"nonce": nonce(),
		})
	}

	if err := write(); err == nil {
		return nil
	}

	c.Close()
	if err := c.Connect(); err != nil {
		return err
	}
	return write()
}

func (c *Client) Close() {
	if c.conn != nil {
		_ = c.conn.Close()
	}
	c.conn = nil
	c.ready = false
	c.profile = nil
}

// drop discards the connection after a failure. A timed-out read may still be
// pending on a handle that cannot be interrupted, so closing it must not block
// the host loop.
func (c *Client) drop(err error) {
	if !errors.Is(err, errReadTimeout) {
		c.Close()
		return
	}
	if c.conn != nil {
		go c.conn.Close()
	}
	c.conn = nil
	c.ready = false
	c.profile = nil
}

func parseReadyProfile(payload map[string]any) *Profile {
	data, ok := payload["data"].(map[string]any)
	if !ok {
		return nil
	}
	user, ok := data["user"].(map[string]any)
	if !ok {
		return nil
	}

	id, _ := user["id"].(string)
	username, _ := user["username"].(string)
	if id == "" || username == "" {
		return nil
	}

	globalName, _ := user["global_name"].(string)
	avatar, _ := user["avatar"].(string)

	return &Profile{ID: id, Username: username, GlobalName: globalName, Avatar: avatar}
}

func (c *Client) writeCommand(payload map[string]any) error {
	if c.conn == nil {
		return errors.New("discord ipc is not connected")
	}
	if _, err := c.conn.Write(encode(opFrame, payload)); err != nil {
		c.log("discord command write failed: %v", err)
		return err
	}

	packet, err := readPacketTimeout(c.conn, readTimeout)
	if err != nil {
		c.log("discord command read failed: %v", err)
		c.drop(err)
		return err
	}

	if event, _ := packet.Data["evt"].(string); event == "ERROR" {
		c.log("discord command error response: op=%d data=%+v", packet.Op, packet.Data)
		if data, ok := packet.Data["data"].(map[string]any); ok {
			code := data["code"]
			message := data["message"]
			return fmt.Errorf("discord rpc error %v: %v", code, message)
		}
		return errors.New("discord rpc error")
	}

	return nil
}

func (c *Client) log(format string, args ...any) {
	if c.logger == nil {
		return
	}
	c.logger.Printf(format, args...)
}

// IsAccessDenied reports the Windows named-pipe error produced when Discord
// runs at a higher integrity level than the native host.
func IsAccessDenied(err error) bool {
	if err == nil {
		return false
	}
	return errors.Is(err, os.ErrPermission) || strings.Contains(strings.ToLower(err.Error()), "access is denied")
}

// dialIPC connects to the Discord IPC endpoint. On Windows it is a named pipe
// that opens as a file. On Unix it is a domain socket; Discord may expose it as
// discord-ipc-0..9 (Stable/PTB/Canary, or a stale -0) under any of several temp
// dirs, so scan every base/index and keep the first that connects.
func dialIPC() (io.ReadWriteCloser, error) {
	if runtime.GOOS == "windows" {
		return dialPipe()
	}

	var lastErr error
	for _, base := range ipcBases() {
		for i := 0; i < ipcSlots; i++ {
			conn, err := net.Dial("unix", filepath.Join(base, fmt.Sprintf("discord-ipc-%d", i)))
			if err == nil {
				return conn, nil
			}
			lastErr = err
		}
	}
	if lastErr == nil {
		lastErr = errors.New("no discord-ipc socket found")
	}
	return nil, lastErr
}

// dialPipe opens the first Discord named pipe that accepts a connection.
// Discord takes the first free slot in discord-ipc-0..9, so slot 0 is not
// always the one it owns. An access-denied error wins over the others so the
// elevated-Discord warning still fires.
func dialPipe() (io.ReadWriteCloser, error) {
	var lastErr, deniedErr error
	for i := 0; i < ipcSlots; i++ {
		file, err := os.OpenFile(fmt.Sprintf(`\\.\pipe\discord-ipc-%d`, i), os.O_RDWR, 0)
		if err == nil {
			return file, nil
		}
		lastErr = err
		if IsAccessDenied(err) && deniedErr == nil {
			deniedErr = err
		}
	}
	if deniedErr != nil {
		return nil, deniedErr
	}
	return nil, lastErr
}

type readDeadliner interface {
	SetReadDeadline(time.Time) error
}

// readPacketTimeout reads one packet but gives up after d. Connections that
// support deadlines use them; Windows pipes opened as plain files do not, so
// the read runs in a goroutine that is abandoned on timeout.
func readPacketTimeout(conn io.ReadWriteCloser, d time.Duration) (*Packet, error) {
	if dl, ok := conn.(readDeadliner); ok {
		if err := dl.SetReadDeadline(time.Now().Add(d)); err == nil {
			defer dl.SetReadDeadline(time.Time{})
			packet, err := readPacket(conn)
			if errors.Is(err, os.ErrDeadlineExceeded) {
				return nil, errReadTimeout
			}
			return packet, err
		}
	}

	type result struct {
		packet *Packet
		err    error
	}
	done := make(chan result, 1)
	go func() {
		packet, err := readPacket(conn)
		done <- result{packet, err}
	}()

	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case r := <-done:
		return r.packet, r.err
	case <-timer.C:
		return nil, errReadTimeout
	}
}

// ipcBases returns Discord's candidate temp dirs in its own resolution order.
// XDG_RUNTIME_DIR being set does not mean the socket lives there (common macOS
// failure), so try all of them, not just the first that exists.
func ipcBases() []string {
	var bases []string
	for _, k := range []string{"XDG_RUNTIME_DIR", "TMPDIR", "TMP", "TEMP"} {
		if v := os.Getenv(k); v != "" {
			bases = append(bases, v)
		}
	}
	return append(bases, "/tmp")
}

func encode(op uint32, payload any) []byte {
	body, _ := json.Marshal(payload)
	buffer := new(bytes.Buffer)
	_ = binary.Write(buffer, binary.LittleEndian, op)
	_ = binary.Write(buffer, binary.LittleEndian, uint32(len(body)))
	_, _ = buffer.Write(body)
	return buffer.Bytes()
}

func readPacket(reader io.Reader) (*Packet, error) {
	var header [8]byte
	if _, err := io.ReadFull(reader, header[:]); err != nil {
		return nil, err
	}

	length := binary.LittleEndian.Uint32(header[4:8])
	body := make([]byte, length)
	if _, err := io.ReadFull(reader, body); err != nil {
		return nil, err
	}

	var data map[string]any
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("decode discord packet: %w", err)
	}

	return &Packet{
		Op:   binary.LittleEndian.Uint32(header[0:4]),
		Data: data,
	}, nil
}

func nonce() string {
	return time.Now().Format("20060102150405.000000000")
}
