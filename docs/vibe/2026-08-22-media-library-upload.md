# 媒体库真实上传

> 日期：2026-08-22  
> 范围：后台 `/admin/media`

## 目标

将媒体页从 localStorage 雏形改为真实上传库，管理图片与视频等媒体文件。

## 验收标准

- [x] 列表读取 `GET /api/admin/storage/files`
- [x] 上传走默认存储策略 `POST /api/admin/storage/upload`
- [x] 支持图片与视频，单文件 ≤ 20MB
- [x] 支持拖拽上传、类型筛选、预览、复制站内链接
- [ ] 删除 / 搜索后端分页 / 更大视频体积（后续）

## Checklist

- [x] 替换 `media/page.tsx` 为真实面板
- [x] 补媒体库样式
- [x] 更新 changelog
