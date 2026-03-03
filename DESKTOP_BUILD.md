# 🖥️ 桌面版本构建指南

## 当前状态

- ✅ **网页版本**：可以在浏览器中运行，支持 `open_url` 打开网页
- ⏳ **桌面版本**：需要本地构建，支持 `open_app`、`open_file`、`run_command` 等本地操作

## 桌面版本功能

| 功能 | 说明 |
|------|------|
| `open_app` | 打开本地应用（微信、百度网盘、VSCode等） |
| `open_file` | 打开本地文件或文件夹 |
| `run_command` | 执行系统命令 |
| `get_system_info` | 获取系统信息 |

## 构建步骤

### 1. 安装 Rust

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows: 下载并运行 https://win.rustup.rs/
```

### 2. 安装 Tauri CLI

```bash
pnpm add -D @tauri-apps/cli
```

### 3. 开发模式

```bash
pnpm tauri dev
```

### 4. 构建生产版本

```bash
pnpm tauri build
```

构建产物在 `src-tauri/target/release/bundle/` 目录。

## 支持的应用

| 关键词 | 应用 | Windows 路径 |
|--------|------|--------------|
| `wechat` / `微信` | 微信 | `C:\Program Files\Tencent\WeChat\WeChat.exe` |
| `baidunetdisk` / `百度网盘` | 百度网盘 | `C:\Program Files\baidu\BaiduNetdisk\BaiduNetdisk.exe` |
| `vscode` / `code` | VS Code | `code` |
| `chrome` | Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| `qq` | QQ | `C:\Program Files\Tencent\QQ\Bin\QQScLauncher.exe` |
| `notepad` | 记事本 | `notepad.exe` |
| `calc` | 计算器 | `calc.exe` |

## 示例用法

在桌面版本中，你可以说：

- "打开微信"
- "打开百度网盘"
- "打开 D:\文档\报告.pdf"
- "打开记事本"
- "查看系统信息"

模型会真正执行这些操作！

## 技术架构

```
用户输入 → LLM 推理 → 工具选择 → Tauri 执行
                                    ↓
                              本地系统操作
```
