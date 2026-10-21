"""Create an isolated fixture database. Never accepts an existing database."""
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def seed(connection):
    for index, phase in enumerate(["research", "building", "live", "waning", "waning"], 1):
        closure = "archived" if index == 4 else "abandoned" if index == 5 else ""
        connection.execute(
            "INSERT INTO projects (id,name,slug,tagline,status,phase,goal,boundary,current_work,progress_percent,closure_kind,closure_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (index, f"验收项目 {index}", f"editorial-test-{index}", "隔离环境的项目说明", "archived" if closure else "published", phase,
             "验证真实目标", "保持范围清楚", "正在验证主路径", 37, closure, "验证结束，归档保留" if index == 4 else "投入成本超过收益，停止开发" if index == 5 else ""),
        )
    connection.execute("INSERT INTO post_categories (id,name,slug,description) VALUES (1,'验收合集','editorial-test-collection','连续阅读的验收合集')")
    cover = "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80"
    for index, status, visibility in [(1, "published", "public"), (2, "published", "public"), (3, "draft", "public"), (4, "published", "private")]:
        html = '<h2>从问题出发</h2><p>记录问题和边界。</p><pre><code class="language-js">const phase = "building";</code></pre><h2>把过程留下来</h2>' + '<p>这是隔离环境的阅读测试内容。</p>' * 50
        connection.execute(
            "INSERT INTO articles (id,title,slug,excerpt,content_html,status,visibility,project_id,category_id,title_emphasis,revisions_json,cover_url,word_count,reading_time_minutes,published_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (index, "验收长文：让一个想法逐渐成为完整的表达" if index == 1 else f"验收文章 {index} & 过程", "editorial-preview-note" if index == 1 else f"editorial-test-article-{index}", "只用于隔离环境的验收内容。", html,
             status, visibility, 2, 1, "完整的表达" if index == 1 else "", json.dumps([{"date": "2026-10-19", "summary": "补充验收修订说明"}], ensure_ascii=False), cover, 1200, 6, f"2026-10-{20-index:02d} 10:00:00", "2026-10-01 10:00:00"),
        )
    for index in range(1, 24):
        connection.execute(
            "INSERT INTO observatory_notes (id,title,observation,status,visibility,project_id,tags,created_at) VALUES (?,?,?,?,?,?,?,?)",
            (index, f"验收札记 {index}", "公开的过程记录", "abandoned" if index == 2 else "active", "public", 2,
             '["验证"]', "2026-09-01 10:00:00" if index == 23 else f"2026-10-{min(index,21):02d} 09:00:00"),
        )
    connection.execute("INSERT INTO builds (name,slug,stage,status,project_id,latest_progress,progressed_at) VALUES ('验收构建','editorial-test-build','development','published',2,'主链路已接通','2026-10-18 08:00:00')")
    connection.commit()


if __name__ == "__main__":
    target = Path(sys.argv[1]).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("xb"):
        pass
    with sqlite3.connect(target) as connection:
        connection.executescript((ROOT / "database/sqlite/schema.sql").read_text(encoding="utf-8"))
        seed(connection)
    print("Isolated editorial fixture created.")
