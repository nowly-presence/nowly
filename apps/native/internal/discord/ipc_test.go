package discord

import (
	"errors"
	"os"
	"testing"
)

func TestIsAccessDenied(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
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
