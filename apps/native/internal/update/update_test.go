package update

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestIsNewer(t *testing.T) {
	cases := []struct {
		candidate, current string
		want               bool
	}{
		{"1.4.9", "1.4.8", true},
		{"1.5.0", "1.4.8", true},
		{"2.0.0", "1.9.9", true},
		{"1.4.8", "1.4.8", false},
		{"1.4.7", "1.4.8", false},
		{"1.10.0", "1.9.0", true},
		{"1.5.0", "1.5.0-beta.1", true},
		{"1.5.0-beta.1", "1.5.0", false},
		{"v1.5.0", "1.4.8", true},
		{"1.5.0", "0.0.0-dev", false},
		{"garbage", "1.4.8", false},
		{"1.5.0", "garbage", false},
	}
	for _, tc := range cases {
		if got := IsNewer(tc.candidate, tc.current); got != tc.want {
			t.Errorf("IsNewer(%q, %q) = %v, want %v", tc.candidate, tc.current, got, tc.want)
		}
	}
}

func TestCheckerReportsNewerVersion(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"version":"1.5.0","windows":{}}`))
	}))
	defer server.Close()

	checker := NewChecker("1.4.8", nil)
	checker.url = server.URL
	if _, newer := checker.Latest(); newer {
		t.Fatal("no update expected before first check")
	}
	checker.refresh(context.Background())
	latest, newer := checker.Latest()
	if latest != "1.5.0" || !newer {
		t.Fatalf("got %q newer=%v", latest, newer)
	}
}

func TestCheckerKeepsStateOnFailure(t *testing.T) {
	status := http.StatusOK
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if status != http.StatusOK {
			w.WriteHeader(status)
			return
		}
		_, _ = w.Write([]byte(`{"version":"1.5.0"}`))
	}))
	defer server.Close()

	checker := NewChecker("1.4.8", nil)
	checker.url = server.URL
	checker.refresh(context.Background())
	status = http.StatusInternalServerError
	checker.refresh(context.Background())
	if latest, newer := checker.Latest(); latest != "1.5.0" || !newer {
		t.Fatalf("state lost after failure: %q newer=%v", latest, newer)
	}
}

func TestCheckerRejectsInvalidManifest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"version":"nope"}`))
	}))
	defer server.Close()

	checker := NewChecker("1.4.8", nil)
	checker.url = server.URL
	checker.refresh(context.Background())
	if latest, _ := checker.Latest(); latest != "" {
		t.Fatalf("invalid version stored: %q", latest)
	}
}
