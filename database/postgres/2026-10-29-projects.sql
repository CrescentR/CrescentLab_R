-- 手动执行一次；不在应用启动时执行。升级前请先备份。
-- 项目状态只表示可见性（draft / published）。旧的 archived 项目转为公开 + 下弦；
-- 未填写退出类型的按「归档」处理，退出原因保持原样，不代写。
BEGIN;
UPDATE projects
SET status = 'published',
    phase = 'waning',
    closure_kind = CASE WHEN closure_kind = '' THEN 'archived' ELSE closure_kind END,
    published_at = COALESCE(published_at, updated_at)
WHERE status = 'archived';
COMMIT;
