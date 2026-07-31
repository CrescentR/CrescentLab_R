# 后台编辑补齐与模块雏形

日期：2026-07-31

## 目标

1. 把「只有发布/新建、无法回看编辑」的内容模块补齐编辑闭环  
2. 把完全未实现的后台模块从占位页升级为可操作的本地雏形

## 验收标准

- [x] 文章：列表 → 编辑加载详情 → 保存/发布/删除
- [x] 观测台：编辑时拉取 `content_md`，不再清空正文
- [x] 媒体 / 评论 / 用户 / 插件 / 主题 / 构建中：本地可 CRUD 的雏形工作台
- [x] 导航「内容」指向文章列表；新增「构建中」入口

## Checklist

- [x] `ArticleWorkspace` + `ArticleEditorWorkspace` 支持 `initialArticleId`
- [x] 修复 `ObservatoryPanel.handleEditNote`
- [x] `AdminPrototypeWorkbench` + seed 数据
- [x] 更新 changelog
