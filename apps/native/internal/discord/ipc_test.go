package discord

import (
	"errors"
	"io"
	"net"
	"os"
	"testing"
	"time"
)

// silentConn blocks on Read like a Discord pipe that never answers, and has no
// SetReadDeadline, like a Windows pipe opened with os.OpenFile.
type silentConn struct{ closed chan struct{} }

func newSilentConn() *silentConn { return &silentConn{closed: make(chan struct{})} }

func (c *silentConn) Read([]byte) (int, error) {
	<-c.closed
	return 0, io.EOF
}
func (c *silentConn) Write(p []byte) (int, error) { return len(p), nil }
func (c *silentConn) Close() error                { close(c.closed); return nil }

func TestReadPacketTimeoutWithoutDeadlineSupport(t *testing.T) {
	conn := newSilentConn()
	defer conn.Close()

	start := time.Now()
	_, err := readPacketTimeout(conn, 50*time.Millisecond)
	if !errors.Is(err, errReadTimeout) {
		t.Fatalf("err = %v, want errReadTimeout", err)
	}
	if elapsed := time.Since(start); elapsed > time.Second {
		t.Fatalf("read took %v, want ~50ms", elapsed)
	}
}

func TestReadPacketTimeoutWithDeadlineSupport(t *testing.T) {
	server, client := net.Pipe()
	defer server.Close()
	defer client.Close()

	_, err := readPacketTimeout(client, 50*time.Millisecond)
	if !errors.Is(err, errReadTimeout) {
		t.Fatalf("err = %v, want errReadTimeout", err)
	}
}

func TestReadPacketTimeoutReturnsPacket(t *testing.T) {
	server, client := net.Pipe()
	defer server.Close()
	defer client.Close()

	go func() { _, _ = server.Write(encode(opFrame, map[string]any{"evt": "READY"})) }()

	packet, err := readPacketTimeout(client, time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if packet.Data["evt"] != "READY" {
		t.Fatalf("packet = %+v", packet.Data)
	}
}

func TestDropAfterTimeoutDoesNotBlockAndResetsClient(t *testing.T) {
	conn := newSilentConn()
	c := &Client{conn: conn, ready: true, profile: &Profile{ID: "1"}}

	done := make(chan struct{})
	go func() { c.drop(errReadTimeout); close(done) }()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("drop blocked")
	}
	if c.Connected() || c.conn != nil || c.profile != nil {
		t.Fatalf("client not reset: %+v", c)
	}
}

func TestIsAccessDenied(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{name: "permission sentinel", err: errors.Join(errors.New("open failed"), os.ErrPermission), want: true},
		{name: "windows message", err: errors.New(`open \\.\pipe\discord-ipc-0: Access is denied.`), want: true},
		{name: "other error", err: errors.New("The system cannot find the file specified."), want: false},
		{name: "nil", err: nil, want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := IsAccessDenied(test.err); got != test.want {
				t.Fatalf("IsAccessDenied(%v) = %t, want %t", test.err, got, test.want)
			}
		})
	}
}
