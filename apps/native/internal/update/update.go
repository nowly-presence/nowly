package update

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	ManifestURL   = "https://cdn.nowly.me/installer/latest.json"
	CheckInterval = 6 * time.Hour
	requestLimit  = 10 * time.Second
	maxBodyBytes  = 1 << 20
)

type Logger interface {
	Printf(format string, args ...any)
}

// Checker polls the published host manifest in the background so the host
// loop never waits on the network.
type Checker struct {
	current string
	url     string
	client  *http.Client
	logger  Logger

	mu     sync.RWMutex
	latest string
}

func NewChecker(current string, logger Logger) *Checker {
	return &Checker{
		current: current,
		url:     ManifestURL,
		client:  &http.Client{Timeout: requestLimit},
		logger:  logger,
	}
}

// Latest returns the newest published version and whether it is newer than the
// running host. It returns false until a check has succeeded.
func (c *Checker) Latest() (string, bool) {
	c.mu.RLock()
	latest := c.latest
	c.mu.RUnlock()
	if latest == "" {
		return "", false
	}
	return latest, IsNewer(latest, c.current)
}

// Run checks immediately and then every CheckInterval until ctx is cancelled.
func (c *Checker) Run(ctx context.Context) {
	if !Comparable(c.current) {
		return
	}
	ticker := time.NewTicker(CheckInterval)
	defer ticker.Stop()
	for {
		c.refresh(ctx)
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (c *Checker) refresh(ctx context.Context) {
	version, err := c.fetch(ctx)
	if err != nil {
		if c.logger != nil {
			c.logger.Printf("update: check failed: %v", err)
		}
		return
	}
	c.mu.Lock()
	c.latest = version
	c.mu.Unlock()
	if c.logger != nil && IsNewer(version, c.current) {
		c.logger.Printf("update: version %s available (running %s)", version, c.current)
	}
}

func (c *Checker) fetch(ctx context.Context) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var manifest struct {
		Version string `json:"version"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxBodyBytes)).Decode(&manifest); err != nil {
		return "", err
	}
	if _, ok := parse(manifest.Version); !ok {
		return "", fmt.Errorf("invalid version %q", manifest.Version)
	}
	return manifest.Version, nil
}

type semver struct {
	major, minor, patch int
	pre                 string
}

func parse(raw string) (semver, bool) {
	raw = strings.TrimPrefix(strings.TrimSpace(raw), "v")
	if i := strings.IndexByte(raw, '+'); i >= 0 {
		raw = raw[:i]
	}
	var v semver
	if i := strings.IndexByte(raw, '-'); i >= 0 {
		v.pre = raw[i+1:]
		raw = raw[:i]
	}
	parts := strings.Split(raw, ".")
	if len(parts) != 3 {
		return v, false
	}
	nums := [3]int{}
	for i, part := range parts {
		n, err := strconv.Atoi(part)
		if err != nil || n < 0 {
			return v, false
		}
		nums[i] = n
	}
	v.major, v.minor, v.patch = nums[0], nums[1], nums[2]
	return v, true
}

// Comparable reports whether a version can take part in update checks.
// Unparsable versions and local dev builds (0.0.0-dev) are skipped.
func Comparable(version string) bool {
	v, ok := parse(version)
	return ok && !(v.major == 0 && v.minor == 0 && v.patch == 0)
}

// IsNewer reports whether candidate is a strictly newer release than current.
func IsNewer(candidate, current string) bool {
	if !Comparable(current) {
		return false
	}
	a, okA := parse(candidate)
	b, okB := parse(current)
	if !okA || !okB {
		return false
	}
	switch {
	case a.major != b.major:
		return a.major > b.major
	case a.minor != b.minor:
		return a.minor > b.minor
	case a.patch != b.patch:
		return a.patch > b.patch
	case a.pre == b.pre:
		return false
	case a.pre == "":
		return true
	case b.pre == "":
		return false
	}
	return a.pre > b.pre
}
