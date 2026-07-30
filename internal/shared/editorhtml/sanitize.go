package editorhtml

import (
	"regexp"

	"github.com/microcosm-cc/bluemonday"
)

var (
	dataTypePattern = regexp.MustCompile(`^(taskList|taskItem)$`)
	booleanPattern  = regexp.MustCompile(`^(true|false)$`)
)

func Sanitize(raw string) string {
	policy := bluemonday.UGCPolicy()
	policy.AllowElements("table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col")
	policy.AllowAttrs("data-type").Matching(dataTypePattern).OnElements("ul", "li")
	policy.AllowAttrs("data-checked").Matching(booleanPattern).OnElements("li")
	policy.AllowAttrs("colspan", "rowspan").Matching(regexp.MustCompile(`^[1-9][0-9]*$`)).OnElements("th", "td")
	policy.AllowAttrs("checked", "disabled", "type").OnElements("input")
	return policy.Sanitize(raw)
}
