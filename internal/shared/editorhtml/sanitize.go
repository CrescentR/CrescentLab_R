package editorhtml

import (
	"regexp"

	"github.com/microcosm-cc/bluemonday"
)

var (
	dataTypePattern     = regexp.MustCompile(`^(taskList|taskItem)$`)
	booleanPattern      = regexp.MustCompile(`^(true|false)$`)
	codeLanguagePattern = regexp.MustCompile(`^[a-zA-Z0-9_+-]+$`)
	codeClassPattern    = regexp.MustCompile(`^language-[a-zA-Z0-9_+-]+$`)
	wenKaiClassPattern  = regexp.MustCompile(`^wenkai-text$`)
	codeFontSizePattern = regexp.MustCompile(`^(1[2-8])px$`)
	codeIndentPattern   = regexp.MustCompile(`^(2|4|8)$`)
)

func Sanitize(raw string) string {
	policy := bluemonday.UGCPolicy()
	policy.AllowElements("table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col")
	policy.AllowAttrs("data-type").Matching(dataTypePattern).OnElements("ul", "li")
	policy.AllowAttrs("data-checked").Matching(booleanPattern).OnElements("li")
	policy.AllowAttrs("colspan", "rowspan").Matching(regexp.MustCompile(`^[1-9][0-9]*$`)).OnElements("th", "td")
	policy.AllowAttrs("checked", "disabled", "type").OnElements("input")
	policy.AllowAttrs("class").Matching(codeClassPattern).OnElements("pre", "code")
	policy.AllowAttrs("class").Matching(wenKaiClassPattern).OnElements("span")
	policy.AllowAttrs("data-language").Matching(codeLanguagePattern).OnElements("pre")
	policy.AllowAttrs("data-line-numbers", "data-word-wrap").Matching(booleanPattern).OnElements("pre")
	policy.AllowAttrs("data-font-size").Matching(codeFontSizePattern).OnElements("pre")
	policy.AllowAttrs("data-indent-width").Matching(codeIndentPattern).OnElements("pre")
	return policy.Sanitize(raw)
}
