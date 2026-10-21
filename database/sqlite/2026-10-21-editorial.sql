-- 手动执行一次；不在应用启动时执行。旧项目不推断阶段。
BEGIN;
ALTER TABLE projects ADD COLUMN phase TEXT NOT NULL DEFAULT '' CHECK (phase IN ('', 'research', 'building', 'live', 'waning'));
ALTER TABLE projects ADD COLUMN goal TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN boundary TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN current_work TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN progress_percent INTEGER CHECK (progress_percent BETWEEN 0 AND 100);
ALTER TABLE projects ADD COLUMN closure_kind TEXT NOT NULL DEFAULT '' CHECK (closure_kind IN ('', 'archived', 'abandoned'));
ALTER TABLE projects ADD COLUMN closure_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN project_id BIGINT;
ALTER TABLE articles ADD COLUMN revisions_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE observatory_notes ADD COLUMN project_id BIGINT;
ALTER TABLE builds ADD COLUMN project_id BIGINT;
ALTER TABLE articles ADD COLUMN title_emphasis TEXT NOT NULL DEFAULT '';
COMMIT;
