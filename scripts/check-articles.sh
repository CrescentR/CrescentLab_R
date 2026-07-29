#!/bin/bash
# 检查 PostgreSQL 中的文章数据

echo "========================================="
echo "PostgreSQL 文章数据查询"
echo "========================================="
echo ""

# 连接 PostgreSQL 并查询
PGPASSWORD=crescentlab psql -h localhost -U crescentlab -d crescentlab << 'EOF'
-- 查询所有文章的基本信息
SELECT 
    id, 
    public_id, 
    slug, 
    title, 
    status,
    COALESCE(published_at::text, '未发布') as published_at,
    CASE 
        WHEN deleted_at IS NOT NULL THEN '已删除'
        ELSE '正常'
    END as state
FROM articles 
ORDER BY id;

echo ""
echo "========================================="
echo "统计信息"
echo "========================================="

SELECT 
    status, 
    COUNT(*) as count 
FROM articles 
WHERE deleted_at IS NULL 
GROUP BY status;

EOF

echo ""
echo "========================================="
echo "测试 slug 't1tb55'"
echo "========================================="

PGPASSWORD=crescentlab psql -h localhost -U crescentlab -d crescentlab -c "
SELECT id, public_id, slug, title, status 
FROM articles 
WHERE slug = 't1tb55' 
   OR public_id = 't1tb55'
   OR id::text = 't1tb55';
"