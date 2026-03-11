# Usage Guide / 使用说明

## Basic Operations / 基本操作

### View Data / 查看数据
- Open the extension popup to see all storage data for the current site
- Toggle between **Local** and **Session** storage using the header switch
- Data auto-refreshes when external changes are detected (3s interval)

打开扩展弹出窗口即可查看当前站点的所有存储数据。通过顶部切换按钮在 Local 和 Session 存储之间切换。检测到外部变更时数据会自动刷新（3 秒间隔）。

### Edit Data / 编辑数据
- Click any row to open the **side panel editor**
- Edit values with syntax highlighting (JSON auto-detected)
- Click "Open in new window" for large values in a full-screen editor
- Click **Save** or press Escape to cancel

点击任意行打开**侧边编辑面板**。编辑器支持语法高亮（自动检测 JSON）。大型数据可点击"在新窗口打开"进行全屏编辑。

### Add Data / 新增数据
- Click the **+** button in the toolbar
- Enter key name and value in the dialog
- The value editor supports JSON syntax highlighting

点击工具栏 **+** 按钮，在弹窗中输入键名和值。值编辑器支持 JSON 语法高亮。

### Delete Data / 删除数据
- Hover over a row and click the delete icon
- Confirm deletion in the dialog
- Use **Ctrl+Z** to undo if needed

悬停在行上点击删除图标，在确认对话框中确认。如需撤销可按 **Ctrl+Z**。

## Batch Operations / 批量操作

- Use checkboxes to select multiple items (or "Select All" in the header)
- A batch action bar appears with **Delete Selected** and **Deselect All** options
- Batch deletions can be undone with Ctrl+Z

使用复选框选择多个项目（或使用表头的全选）。批量操作栏会显示**批量删除**和**取消全选**选项。批量删除可通过 Ctrl+Z 撤销。

## Import & Export / 导入导出

### Export / 导出
- Click the download icon in the toolbar
- All data exports as a `.json` file

点击工具栏下载图标，所有数据导出为 `.json` 文件。

### Import / 导入
- Click the upload icon in the toolbar
- Select a `.json` file
- Choose **Merge** (add to existing) or **Replace** (clear and import)

点击工具栏上传图标，选择 `.json` 文件，然后选择**合并**（添加到现有数据）或**替换**（清空后导入）。

## Special Features / 特殊功能

### Smart Type Detection / 智能类型检测
| Type | Detection Rule |
|------|---------------|
| JSON | Valid JSON object or array |
| Timestamp | 10 or 13 digit number in range 2001–2100 |
| Boolean | Exactly `true` or `false` |
| Number | Valid numeric string |
| String | Everything else |

### Undo / Redo / 撤销重做
- **Ctrl+Z** — Undo last action (add, edit, delete, batch delete)
- **Ctrl+Shift+Z** — Redo
- Up to 50 steps of history
- Switching storage type clears the undo history

### Storage Capacity / 存储容量
- Progress bar shows current usage vs 5MB limit
- Color changes: blue (normal) → amber (80%+) → red (95%+)

### Copy Setup Code / 复制设置代码
- Click "**...**" menu → "Copy Setup Code"
- Paste in browser console to replicate all storage data on another site

## Keyboard Shortcuts / 快捷键

| Action / 操作 | Shortcut / 快捷键 |
|--------------|------------------|
| Undo / 撤销 | Ctrl/Cmd + Z |
| Redo / 重做 | Ctrl/Cmd + Shift + Z |
| Close Panel / 关闭面板 | Escape |

## Personalization / 个性化

- **Theme** — Click sun/moon icon to toggle dark/light mode (or follows system)
- **Language** — Click EN/中 button to switch between English and Chinese
- Preferences are saved and synced across popup and detail windows

**主题** — 点击日/月图标切换深色/浅色模式（或跟随系统）。**语言** — 点击 EN/中 按钮切换中英文。偏好设置在弹出窗口和详情窗口之间同步保存。
