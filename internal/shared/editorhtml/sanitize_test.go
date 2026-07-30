package editorhtml

import (
	"strings"
	"testing"
)

func TestSanitizePreservesEditorStructuresAndRemovesScripts(t *testing.T) {
	raw := `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><input type="checkbox" checked disabled><p>Done</p></li></ul><table><tbody><tr><td colspan="2">Cell</td></tr></tbody></table><script>alert(1)</script>`
	result := Sanitize(raw)
	for _, expected := range []string{`data-type="taskList"`, `data-checked="true"`, "<table>", `colspan="2"`} {
		if !strings.Contains(result, expected) {
			t.Fatalf("sanitized HTML missing %q: %s", expected, result)
		}
	}
	if strings.Contains(result, "<script") {
		t.Fatalf("sanitized HTML retained script: %s", result)
	}
}
