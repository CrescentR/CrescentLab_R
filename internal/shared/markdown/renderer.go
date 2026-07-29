package markdown

import (
	"bytes"
	"regexp"
	"strings"
	"unicode"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/renderer/html"
	xhtml "golang.org/x/net/html"
)

const wordsPerMinute = 300

type Result struct {
	HTML               string
	WordCount          int
	ReadingTimeMinutes int
}

type Renderer struct {
	markdown goldmark.Markdown
	policy   *bluemonday.Policy
}

func NewRenderer() *Renderer {
	return &Renderer{
		markdown: goldmark.New(
			goldmark.WithExtensions(extension.GFM),
			goldmark.WithRendererOptions(html.WithUnsafe()),
		),
		policy: newSanitizationPolicy(),
	}
}

func (r *Renderer) Render(source string) (Result, error) {
	if strings.TrimSpace(source) == "" {
		return Result{}, nil
	}

	var rendered bytes.Buffer
	if err := r.markdown.Convert([]byte(source), &rendered); err != nil {
		return Result{}, err
	}

	safeHTML := r.policy.Sanitize(rendered.String())
	wordCount := countWords(safeHTML)
	readingTime := wordCount / wordsPerMinute
	if readingTime < 1 && wordCount > 0 {
		readingTime = 1
	}

	return Result{
		HTML:               safeHTML,
		WordCount:          wordCount,
		ReadingTimeMinutes: readingTime,
	}, nil
}

func newSanitizationPolicy() *bluemonday.Policy {
	policy := bluemonday.NewPolicy()
	policy.AllowElements(
		"h1", "h2", "h3", "h4", "h5", "h6",
		"p", "ul", "ol", "li", "blockquote", "pre", "code",
		"a", "img", "strong", "em", "hr", "br",
		"table", "thead", "tbody", "tr", "th", "td",
	)
	policy.AllowAttrs("href", "title").OnElements("a")
	policy.AllowAttrs("src", "alt", "title").OnElements("img")
	policy.AllowAttrs("class").Matching(regexp.MustCompile(`^language-[a-zA-Z0-9_+-]+$`)).OnElements("code")
	policy.RequireParseableURLs(true)
	policy.AllowURLSchemes("http", "https")
	return policy
}

func countWords(renderedHTML string) int {
	document, err := xhtml.Parse(strings.NewReader(renderedHTML))
	if err != nil {
		return 0
	}

	count := 0
	var walk func(*xhtml.Node)
	walk = func(node *xhtml.Node) {
		if node.Type == xhtml.TextNode {
			count += countTextWords(node.Data)
		}
		for child := node.FirstChild; child != nil; child = child.NextSibling {
			walk(child)
		}
	}
	walk(document)
	return count
}

func countTextWords(text string) int {
	count := 0
	inWord := false
	for _, r := range text {
		if unicode.In(r, unicode.Han, unicode.Hiragana, unicode.Katakana, unicode.Hangul) {
			count++
			inWord = false
			continue
		}
		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			if !inWord {
				count++
				inWord = true
			}
			continue
		}
		inWord = false
	}
	return count
}
