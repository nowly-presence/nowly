package logging

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Logger struct {
	mu   sync.Mutex
	file *os.File
}

const maxLogSizeBytes int64 = 1024 * 1024

func New(folder string) (*Logger, error) {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return nil, err
	}
	dir := filepath.Join(cacheDir, folder)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	path := filepath.Join(dir, "nowly-host.log")
	rotateIfNeeded(path)

	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, err
	}

	return &Logger{file: file}, nil
}

func rotateIfNeeded(path string) {
	info, err := os.Stat(path)
	if err != nil || info.Size() <= maxLogSizeBytes {
		return
	}

	backupPath := path + ".1"
	_ = os.Remove(backupPath)
	if err := os.Rename(path, backupPath); err != nil {
		_ = os.Truncate(path, 0)
	}
}

func (l *Logger) Close() {
	if l == nil || l.file == nil {
		return
	}
	_ = l.file.Close()
}

func (l *Logger) Printf(format string, args ...any) {
	if l == nil || l.file == nil {
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	line := fmt.Sprintf(format, args...)
	_, _ = fmt.Fprintf(l.file, "%s %s\n", time.Now().Format(time.RFC3339Nano), line)
}
