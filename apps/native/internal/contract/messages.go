package contract

import "runtime"

const (
	HostName          = "nowly.client"
	InstallFolderName = "NowlyClient"
	ExtensionID       = "abbegmindbabanjcabnmcjmamaoffbam"
	DiscordClientID   = "1510223984392671302"

)

var HostVersion = "0.0.0-dev"

func HostExecutableName() string {
	if runtime.GOOS == "windows" {
		return "nowly-host.exe"
	}
	return "nowly-host"
}

type MessageType string

const (
	MessagePing          MessageType = "PING"
	MessageSetActivity   MessageType = "SET_ACTIVITY"
	MessageClearActivity MessageType = "CLEAR_ACTIVITY"
)

type ErrorCode string

const (
	ErrorDiscordIPCAccessDenied ErrorCode = "DISCORD_IPC_ACCESS_DENIED"
)

type ResponseType string

const (
	ResponsePong      ResponseType = "PONG"
	ResponseConnected ResponseType = "CONNECTED"
	ResponseOK        ResponseType = "OK"
	ResponseError     ResponseType = "ERROR"
)

type NativeMessage struct {
	Type     MessageType      `json:"type"`
	Presence *PresencePayload `json:"presence,omitempty"`
}

type PresenceButton struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

type PresencePayload struct {
	Name       string            `json:"name,omitempty"`
	Details    string            `json:"details,omitempty"`
	State      string            `json:"state,omitempty"`
	StartTime  int64             `json:"startTime,omitempty"`
	EndTime    int64             `json:"endTime,omitempty"`
	LargeImage string            `json:"largeImage,omitempty"`
	LargeText  string            `json:"largeText,omitempty"`
	SmallImage string            `json:"smallImage,omitempty"`
	SmallText  string            `json:"smallText,omitempty"`
	Type       int               `json:"type,omitempty"`
	Buttons    []PresenceButton  `json:"buttons,omitempty"`
}

type NativeResponse struct {
	Type      ResponseType    `json:"type"`
	Connected bool            `json:"connected,omitempty"`
	Discord    bool            `json:"discordConnected,omitempty"`
	Status    string          `json:"status,omitempty"`
	Version   string          `json:"version,omitempty"`
	Profile   *DiscordProfile `json:"profile,omitempty"`
	Code      ErrorCode       `json:"code,omitempty"`
	Error     string          `json:"error,omitempty"`
}

type DiscordProfile struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	GlobalName string `json:"globalName,omitempty"`
	Avatar     string `json:"avatar,omitempty"`
}

func Pong(connected bool, status string) NativeResponse {
	return NativeResponse{Type: ResponsePong, Connected: connected, Status: status, Version: HostVersion}
}

func PongWithProfile(connected bool, discordConnected bool, status string, profile *DiscordProfile) NativeResponse {
	return NativeResponse{Type: ResponsePong, Connected: connected, Discord: discordConnected, Status: status, Version: HostVersion, Profile: profile}
}

func Connected() NativeResponse {
	return NativeResponse{Type: ResponseConnected, Version: HostVersion}
}

func OK() NativeResponse {
	return NativeResponse{Type: ResponseOK}
}

func Error(message string) NativeResponse {
	return NativeResponse{Type: ResponseError, Error: message}
}

func ErrorWithCode(code ErrorCode, message string) NativeResponse {
	return NativeResponse{Type: ResponseError, Code: code, Error: message}
}
