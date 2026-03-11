# Alger Storage 管理器

一个功能强大的 Chrome 扩展，用于管理网站的 LocalStorage 和 SessionStorage 数据，提供现代化的专业界面。

[English](README.md) | [使用说明](USAGE.md)

## 功能特点

- **双存储支持** — 一键切换管理 LocalStorage 和 SessionStorage
- **智能类型检测** — 自动识别 JSON、时间戳、数字、布尔值、字符串类型
- **批量操作** — 多选数据项进行批量删除、导出等操作
- **撤销 / 重做** — 完整的操作历史记录，支持 Ctrl+Z / Ctrl+Shift+Z（最多 50 步）
- **导入 / 导出** — 导出为 JSON 文件，支持合并或替换模式导入
- **存储容量** — 可视化进度条展示当前用量 vs 5MB 上限
- **自动刷新** — 检测外部存储变更后自动刷新（3 秒轮询）
- **列排序** — 按键名、数据类型或值大小排序
- **防抖搜索** — 快速过滤键和值（300ms 防抖）
- **侧边编辑面板** — 右侧滑出面板，内置 CodeMirror 编辑器
- **详情窗口** — 大型 JSON 或文本值可在独立弹窗中全屏编辑
- **时间戳工具** — 自动将时间戳转换为可读日期，一键更新为当前时间
- **日 / 夜模式** — 自适应中性配色，支持跟随系统和手动切换
- **国际化** — 中英文双语，自动检测系统语言
- **错误边界** — 优雅的错误处理，防止 UI 整体崩溃
- **复制设置代码** — 生成可在控制台执行的代码以复制存储数据

## 技术栈

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- CodeMirror 6
- Chrome Extension Manifest V3

## 项目架构

```
src/
├── hooks/          # useStorage, useTheme, useUndoRedo, useStorageWatch, useDebounce
├── contexts/       # AppContext (useReducer), LocaleContext (i18n)
├── components/
│   ├── Common/     # Toast, Modal, Tooltip, ConfirmDialog, ErrorBoundary, StorageCapacity
│   ├── Layout/     # Header, SidePanel
│   ├── Storage/    # StorageTable, StorageRow, TypeBadge, EmptyState
│   ├── Actions/    # AddDialog
│   └── Editor/     # CodeEditor (CodeMirror 封装)
├── pages/          # App (弹出页), Detail (编辑窗口)
├── utils/          # typeDetection, clipboard, exportImport
├── types/          # 共享 TypeScript 接口
└── locales/        # zh_CN, en_US
```

## 快速开始

### 环境要求

- Node.js 18+ 或 Bun
- Chrome 浏览器

### 安装与构建

```bash
# 安装依赖
bun install

# 开发模式
bun run dev

# 生产构建
bun run build
```

### 加载扩展

1. 执行 `bun run build`
2. 打开 Chrome → `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」→ 选择 `dist/` 目录

## 快捷键

| 操作 | 快捷键 |
|------|--------|
| 撤销 | Ctrl/Cmd + Z |
| 重做 | Ctrl/Cmd + Shift + Z |
| 关闭侧边面板 | Escape |

## 许可证

MIT
