# PostgreSQL 文章数据检查脚本

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 文章数据查询" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "crescentlab"

Write-Host "查询所有文章：" -ForegroundColor Yellow
& psql -h localhost -U crescentlab -d crescentlab -c @"
SELECT 
    id, 
    COALESCE(public_id, 'NULL') as public_id, 
    slug, 
    title, 
    status,
    COALESCE(published_at::text, 'NULL') as published_at,
    CASE 
        WHEN deleted_at IS NOT NULL THEN '已删除'
        ELSE '正常'
    END as state
FROM articles 
ORDER BY id;
"@

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "文章状态统计" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

& psql -h localhost -U crescentlab -d crescentlab -c @"
SELECT 
    status, 
    COUNT(*) as count 
FROM articles 
WHERE deleted_at IS NULL 
GROUP BY status;
"@

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "查找 slug='t1tb55' 的文章" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

& psql -h localhost -U crescentlab -d crescentlab -c @"
SELECT id, public_id, slug, title, status 
FROM articles 
WHERE slug = 't1tb55' 
   OR public_id = 't1tb55'
   OR id::text = 't1tb55';
"@

Remove-Item Env:\PGPASSWORD