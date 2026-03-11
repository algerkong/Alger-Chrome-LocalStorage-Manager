<div align="center">

<img src="public/icons/icon128.png" alt="Alger Storage Manager" width="96" height="96" />

# Alger Storage Manager

**一站式 Chrome 扩展 — 管理 LocalStorage、SessionStorage、Cookie 和 IndexedDB。**

[![CI](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/actions/workflows/ci.yml/badge.svg)](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/algerkong/Alger-Chrome-LocalStorage-Manager?color=blue)](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/releases)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)

[English](README.md)&nbsp;&nbsp;·&nbsp;&nbsp;[使用指南](USAGE.md)&nbsp;&nbsp;·&nbsp;&nbsp;[版本发布](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/releases)

[![Donate](https://img.shields.io/badge/捐赠-支持本项目-ff69b4?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://donate.alger.fun/donate)

</div>

---

## 亮点

<table>
<tr>
<td width="50%">

### 🗂 统一数据管理
在 **LocalStorage**、**SessionStorage**、**Cookie** 和 **IndexedDB** 之间一键切换 — 告别在多个 DevTools 面板之间来回跳转。

</td>
<td width="50%">

### ✏️ 强大的编辑能力
双击行内编辑、CodeMirror 侧边面板编辑复杂数据、保存前 **Diff 视图** 审查变更。

</td>
</tr>
<tr>
<td width="50%">

### 📸 快照系统
保存和恢复完整存储状态 — 适合在开发/测试/生产环境之间快速切换。

</td>
<td width="50%">

### 🔍 高级搜索
支持纯文本和**正则表达式**搜索切换。300ms 防抖过滤，跨键名和值实时匹配。

</td>
</tr>
</table>

---

## 功能

<details>
<summary><strong>存储管理（LocalStorage & SessionStorage）</strong></summary>

- 智能类型检测 — JSON、时间戳、数字、布尔值、字符串
- 批量选择、删除、导出
- 撤销 / 重做 — Ctrl+Z / Ctrl+Shift+Z（最多 50 步）
- 导入 / 导出 — JSON 文件，支持合并或替换模式
- 存储容量条 — 可视化当前用量 vs 5MB 上限
- 外部变更自动刷新（3 秒轮询）
- 列排序 — 按键名、类型或大小
- 复制设置代码 — 生成可在控制台执行的脚本以复制数据

</details>

<details>
<summary><strong>Cookie 管理</strong></summary>

- 完整 CRUD — 创建、读取、修改、删除，支持全部属性
- 标志指示 — HttpOnly (H)、Secure (S)、SameSite (St/Lx/No)
- 复制为 `document.cookie` 代码
- 批量选择与删除
- 快捷操作 — 一键延长过期时间 7 天或 30 天

</details>

<details>
<summary><strong>IndexedDB 浏览</strong></summary>

- 数据库与对象存储导航器
- 分页记录列表，JSON 格式展示
- 记录内搜索
- 单条或批量删除

</details>

<details>
<summary><strong>快照</strong></summary>

- 将完整存储状态保存为命名快照
- 一键恢复
- 导出 / 导入快照 JSON 文件
- 存储在扩展侧 IndexedDB（跨页面刷新持久化）

</details>

<details>
<summary><strong>编辑</strong></summary>

- 双击行内编辑短值
- CodeMirror 侧边面板（JSON 语法高亮）
- Diff 视图 — 保存前红/绿行级差异对比
- 详情窗口 — 大型数据全屏弹窗编辑
- 时间戳工具 — 自动格式化，一键更新为当前时间

</details>

<details>
<summary><strong>界面与体验</strong></summary>

- 深色 / 浅色模式，自动检测系统主题
- 国际化 — 中英双语，自动检测系统语言
- 右键菜单 — Quick View 与 Full Manager 快捷入口
- 错误边界 — 优雅的崩溃恢复
- 右键菜单全页模式

</details>

---

## 技术栈

| 层级 | 技术 |
|------|-----|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 编辑器 | CodeMirror 6 |
| 扩展 | Chrome Manifest V3 |
| 状态管理 | useReducer + Context |
| CI/CD | GitHub Actions |

---

## 项目架构

```
src/
├── background.ts            # Service Worker — 右键菜单
├── contentScript.ts         # Content Script — 存储访问
├── pages/                   # App（弹出页）· Detail（编辑窗口）
├── contexts/                # AppContext (useReducer) · LocaleContext (i18n)
├── hooks/
│   ├── useStorage           # LocalStorage / SessionStorage CRUD
│   ├── useCookies           # Cookie CRUD（chrome.cookies）
│   ├── useIndexedDB         # IndexedDB 浏览（chrome.scripting）
│   ├── useSnapshots         # 快照 保存 / 恢复 / 导出
│   ├── useUndoRedo          # 撤销 / 重做栈
│   └── ...                  # useTheme · useDebounce · useStorageWatch
├── components/
│   ├── Layout/              # Header（4-Tab 栏）· SidePanel（Diff 视图）
│   ├── Storage/             # StorageTable · CookieTable · IDBTable · IDBNavigator
│   ├── Actions/             # AddDialog · SnapshotManager · CookieEditor
│   ├── Common/              # Toast · ConfirmDialog · ErrorBoundary · StorageCapacity
│   └── Editor/              # CodeEditor（CodeMirror 封装）
├── utils/                   # typeDetection · clipboard · exportImport · snapshotDB · lineDiff
├── types/                   # 共享 TypeScript 接口
└── locales/                 # en_US · zh_CN
```

---

## 快速开始

### 环境要求

- **Node.js 18+** 或 **Bun**
- Chrome / Edge / Brave（基于 Chromium 的浏览器）

### 安装与构建

```bash
# 克隆仓库
git clone https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager.git
cd Alger-Chrome-LocalStorage-Manager

# 安装依赖
bun install

# 开发服务器（HMR）
bun run dev

# 生产构建
bun run build
```

### 加载到 Chrome

1. 执行 `bun run build`
2. 打开 `chrome://extensions/`
3. 开启右上角 **开发者模式**
4. 点击 **加载已解压的扩展程序** → 选择 `dist/` 目录
5. 将扩展固定到工具栏

---

## 版本发布

推送版本标签即可触发自动发布：

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 自动构建扩展并发布 `.zip` 到 [Releases](https://github.com/algerkong/Alger-Chrome-LocalStorage-Manager/releases)。

---

## 快捷键

| 操作 | 快捷键 |
|------|--------|
| 撤销 | `Ctrl/Cmd + Z` |
| 重做 | `Ctrl/Cmd + Shift + Z` |
| 关闭侧边面板 | `Escape` |
| 行内编辑 | `双击` 值单元格 |
| 保存行内编辑 | `Enter` |
| 取消行内编辑 | `Escape` |

---

## 许可证

[GPL-3.0](LICENSE)

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/algerkong">algerkong</a></sub>
</div>
