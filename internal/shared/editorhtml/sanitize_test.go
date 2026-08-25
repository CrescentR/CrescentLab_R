package editorhtml

import (
	"strings"
	"testing"
)

func TestSanitizePreservesEditorStructuresAndRemovesScripts(t *testing.T) {
	raw := `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><input type="checkbox" checked disabled><p>Done</p></li></ul><table><tbody><tr><td colspan="2">Cell</td></tr></tbody></table><pre class="language-java" data-language="java" data-line-numbers="true" data-word-wrap="false" data-font-size="14px" data-indent-width="4"><code>class Demo {}</code></pre><p>普通文字，<span class="wenkai-text">文楷句子</span></p><span class="untrusted-class">不受信任的样式</span><script>alert(1)</script>`
	result := Sanitize(raw)
	for _, expected := range []string{
		`data-type="taskList"`,
		`data-checked="true"`,
		"<table>",
		`colspan="2"`,
		`class="language-java"`,
		`data-language="java"`,
		`data-line-numbers="true"`,
		`data-font-size="14px"`,
		`data-indent-width="4"`,
		`class="wenkai-text"`,
	} {
		if !strings.Contains(result, expected) {
			t.Fatalf("sanitized HTML missing %q: %s", expected, result)
		}
	}
	if strings.Contains(result, "<script") {
		t.Fatalf("sanitized HTML retained script: %s", result)
	}
	if strings.Contains(result, "untrusted-class") {
		t.Fatalf("sanitized HTML retained an untrusted class: %s", result)
	}
}
