package markdown

import (
	"strings"
	"testing"
)

func TestRendererRendersMarkdownFeatures(t *testing.T) {
	result, err := NewRenderer().Render("# Title\n\n- one\n- two\n\n```go\nfmt.Println(\"ok\")\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |")
	if err != nil {
		t.Fatalf("Render returned error: %v", err)
	}

	for _, fragment := range []string{"<h1>Title</h1>", "<ul>", `<code class="language-go">`, "<table>"} {
		if !strings.Contains(result.HTML, fragment) {
			t.Fatalf("rendered HTML does not contain %q: %s", fragment, result.HTML)
		}
	}
}

func TestRendererSanitizesUnsafeHTMLAndURLs(t *testing.T) {
	source := `<script>alert(1)</script>

<img src="https://example.com/image.png" onerror="alert(1)">

[unsafe](javascript:alert(1))

[safe](https://example.com)`

	result, err := NewRenderer().Render(source)
	if err != nil {
		t.Fatalf("Render returned error: %v", err)
	}

	for _, unsafe := range []string{"<script", "onerror", "javascript:"} {
		if strings.Contains(strings.ToLower(result.HTML), unsafe) {
			t.Fatalf("rendered HTML contains unsafe fragment %q: %s", unsafe, result.HTML)
		}
	}
	if !strings.Contains(result.HTML, `href="https://example.com"`) {
		t.Fatalf("safe HTTPS link was removed: %s", result.HTML)
	}
	if !strings.Contains(result.HTML, `src="https://example.com/image.png"`) {
		t.Fatalf("safe HTTPS image was removed: %s", result.HTML)
	}
}

func TestRendererCountsCJKAndEnglishWords(t *testing.T) {
	result, err := NewRenderer().Render("你好世界 hello world 2026")
	if err != nil {
		t.Fatalf("Render returned error: %v", err)
	}
	if result.WordCount != 7 {
		t.Fatalf("WordCount = %d, want 7", result.WordCount)
	}
	if result.ReadingTimeMinutes != 1 {
		t.Fatalf("ReadingTimeMinutes = %d, want 1", result.ReadingTimeMinutes)
	}
}

func TestRendererUsesFloorReadingTimeWithMinimumOne(t *testing.T) {
	words := strings.TrimSpace(strings.Repeat("word ", 600))
	result, err := NewRenderer().Render(words)
	if err != nil {
		t.Fatalf("Render returned error: %v", err)
	}
	if result.WordCount != 600 {
		t.Fatalf("WordCount = %d, want 600", result.WordCount)
	}
	if result.ReadingTimeMinutes != 2 {
		t.Fatalf("ReadingTimeMinutes = %d, want 2", result.ReadingTimeMinutes)
	}

	empty, err := NewRenderer().Render("")
	if err != nil {
		t.Fatalf("Render empty source returned error: %v", err)
	}
	if empty != (Result{}) {
		t.Fatalf("empty result = %#v, want zero value", empty)
	}
}
