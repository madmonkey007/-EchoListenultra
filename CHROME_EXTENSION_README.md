# EchoListen Chrome 扩展安装指南

## 📦 项目简介

EchoListen 是一个基于 AI 的音频语言学习 Chrome 浏览器扩展应用。主要功能包括：
- 🎵 音频播放与分段
- 🤖 AI 驱动的音频转录（支持 Gemini API）
- 📚 词汇学习系统（艾宾浩斯遗忘曲线）
- 🔄 间隔重复复习
- 💾 本地数据持久化

## 🚀 快速开始

### 1. 开发模式运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 2. 构建 Chrome 扩展

```bash
# 构建生产版本
npm run build
```

构建完成后，`dist` 目录包含所有扩展文件。

## 📤 安装到 Chrome 浏览器

### 方法 1：开发者模式安装（推荐用于开发）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 文件夹
6. 扩展安装完成！

### 方法 2：打包扩展（用于分发）

1. 在 `chrome://extensions/` 页面
2. 点击"打包扩展程序"
3. 选择 `dist` 文件夹
4. 生成 `.crx` 和 `.pem` 文件

## ⚙️ 配置说明

### API 密钥配置

在首次使用前，需要配置 Gemini API 密钥：

1. 点击扩展图标打开应用
2. 进入"设置"页面
3. 在 "API Key" 输入框中填入你的 Gemini API Key
4. 选择模型（推荐：`gemini-2.5-flash-preview`）
5. 保存配置

**获取 Gemini API Key：**
- 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
- 创建新的 API 密钥
- 复制并粘贴到应用设置中

### Deepgram 配置（可选）

如果使用 Deepgram 语音识别：
1. 在设置页面选择 Deepgram 作为提供商
2. 输入 Deepgram API Key
3. 选择语言（默认：英语）

## 📂 项目结构

```
echolisten/
├── dist/                  # 构建输出（Chrome 扩展文件）
│   ├── index.html        # 扩展弹窗页面
│   ├── popup.js          # 应用逻辑
│   ├── popup.css         # 样式文件
│   ├── icons/            # 扩展图标
│   └── manifest.json     # 扩展清单文件
├── src/                  # 源代码
│   ├── views/           # 页面组件
│   ├── components/      # UI 组件
│   └── types.ts         # TypeScript 类型定义
├── public/              # 静态资源
├── icons/               # 图标源文件
├── scripts/             # 构建脚本
├── manifest.json        # 扩展清单（源文件）
├── vite.config.ts       # Vite 配置
├── tailwind.config.js   # Tailwind CSS 配置
└── package.json         # 项目依赖
```

## 🔧 开发指南

### 修改后重新构建

每次修改代码后，需要重新构建并重新加载扩展：

```bash
# 重新构建
npm run build

# 在 chrome://extensions/ 页面
# 点击扩展卡片上的"重新加载"按钮
```

### 开发流程

1. **开发模式**：使用 `npm run dev` 在浏览器中快速预览
2. **测试扩展**：构建后在 Chrome 中加载 `dist` 目录
3. **调试**：在扩展弹窗中右键 → "检查"打开开发者工具

## 🐛 常见问题

### Q: 扩展无法加载？
A: 确保：
- `dist` 目录包含 `manifest.json`
- 所有图标文件都在 `dist/icons/` 目录中
- 检查 Chrome 版本是否支持 Manifest V3

### Q: API 调用失败？
A: 检查：
- API Key 是否正确配置
- 网络连接是否正常
- API 配额是否用完

### Q: 音频无法播放？
A: Chrome 扩展的音频播放需要用户交互触发，确保先点击页面。

### Q: 数据未保存？
A: 扩展使用 Chrome Storage API，数据会自动同步到你的 Google 账户。

## 📝 许可证

本项目基于原 EchoListen 项目改造，遵循相同的开源许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请在 GitHub 仓库中提交 Issue。

---

**享受你的音频学习之旅！** 🎧📚
