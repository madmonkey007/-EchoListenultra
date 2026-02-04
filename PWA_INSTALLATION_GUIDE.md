# EchoListen PWA 安装使用指南

## 📱 什么是 PWA？

PWA（Progressive Web App）是一种结合了网页和原生应用优点的新型应用模式。EchoListen 作为 PWA，可以：
- ✅ 像原生应用一样安装到设备
- ✅ 在桌面创建快捷方式
- ✅ 离线使用（支持 IndexedDB 本地存储）
- ✅ 自动更新
- ✅ 跨平台（Windows、Mac、Android、iOS）

---

## 🖥️ 在 Windows 上安装（Chrome 或 Edge）

### 方法 A：地址栏快捷按钮（最快）⭐推荐

1. 在 Chrome 或 Edge 浏览器中打开 EchoListen 应用
2. 观察地址栏右侧，找到一个类似 **"屏幕内加个箭头"** 或 **"三个方块加个加号"** 的图标
3. 点击该图标
4. 选择 **"安装"** 或 **"安装应用"**

**安装后的效果：**
- ✅ 应用拥有独立的窗口（没有浏览器地址栏和标签页）
- ✅ 在桌面和开始菜单生成快捷方式
- ✅ 可以像原生应用一样从任务栏启动

### 方法 B：浏览器菜单

1. 点击浏览器右上角的 **⋮** (三个点) 菜单
2. 找到：
   - **Chrome**: "保存并共享" → "安装此站点作为应用"
   - **Edge**: "应用" → "安装此站点作为应用"
3. 确认安装

### 方法 C：设置菜单

1. 打开浏览器设置
2. 找到"应用"或"安装的站点"
3. 点击"安装应用"

---

## 📱 在 Android 上安装（Chrome）

PWA 在 Android 上的体验非常接近原生应用！

### 安装步骤：

1. 在手机 Chrome 浏览器中访问 EchoListen 应用网址
2. 点击右上角的 **⋮** (三个点) 菜单
3. 点击 **"安装应用"** (Install app) 或 **"添加到主屏幕"** (Add to Home screen)
4. 在弹出的对话框中确认安装

**安装后的效果：**
- ✅ 应用图标出现在手机桌面上
- ✅ 全屏启动，有启动画面（Splash Screen）
- ✅ 支持离线运行（音频和词汇数据存储在本地）
- ✅ 可以接收通知（如需要）

---

## 🍎 在 iOS 上安装（Safari）

### 安装步骤：

1. 在 iPhone/iPad 的 Safari 浏览器中访问 EchoListen
2. 点击底部的 **"分享"** 按钮（方框加向上箭头）
3. 向下滚动，找到并点击 **"添加到主屏幕"**
4. 点击右上角的 **"添加"**

**安装后的效果：**
- ✅ 应用图标在主屏幕上
- ✅ 全屏运行（无浏览器界面）
- ⚠️ 注意：iOS 对 PWA 的 Service Worker 支持有限，某些功能可能受限

---

## 🚀 开发与构建

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建生产版本

```bash
# 构建应用
npm run build

# 构建产物在 dist/ 目录
```

### 部署到服务器

1. 将 `dist` 目录中的所有文件上传到你的 Web 服务器
2. 确保 HTTPS 已启用（PWA 要求必须使用 HTTPS）
3. 确保 Service Worker 文件 (`sw.js`) 在根目录
4. 配置服务器 MIME 类型：
   - `.webmanifest` → `application/manifest+json`
   - `Service-Worker-Allowed` → `/`

---

## 🎯 PWA 核心特性

### 1. 离线支持

EchoListen 使用 Service Worker 实现智能缓存：

- **静态资源**: 使用 Cache First 策略（优先从缓存读取）
- **API 请求**: 使用 Network Only 策略（不缓存，确保数据最新）
- **自动更新**: 检测到新版本时会提示用户更新

### 2. 本地存储

- **IndexedDB**: 存储音频文件、用户数据
- **LocalStorage**: 存储设置、会话信息
- **Chrome Storage**: 如作为扩展使用时的数据同步

### 3. 应用快捷方式

PWA 支持定义应用快捷方式，可以快速访问：
- 添加音频会话
- 打开词汇本
- 查看设置

### 4. 桌面集成

- 独立窗口运行
- 任务栏图标
- 开始菜单/启动器集成
- 自定义主题色

---

## 🔧 PWA 配置说明

### Manifest 配置

`manifest.json` 文件定义了 PWA 的核心配置：

```json
{
  "name": "EchoListen - AI音频学习助手",
  "short_name": "EchoListen",
  "display": "standalone",  // 独立窗口运行
  "background_color": "#181C21",
  "theme_color": "#0B4F6C",
  "orientation": "portrait-primary",
  "start_url": "./",
  "icons": [...],  // 多尺寸图标
  "shortcuts": [...]  // 应用快捷方式
}
```

### Service Worker 配置

`sw.js` 实现了：
- 静态资源缓存
- 智能缓存策略
- 自动更新检测
- 版本管理

---

## 🐛 故障排除

### Q: 浏览器没有显示"安装"按钮？

**A:** 确保：
- 使用 HTTPS 或 localhost（PWA 要求）
- 使用支持的浏览器（Chrome、Edge、Safari）
- Manifest 文件正确配置且可访问
- Service Worker 已注册

### Q: 安装后应用无法启动？

**A:** 检查：
- `start_url` 路径是否正确
- Service Worker 是否正常工作
- 浏览器控制台是否有错误

### Q: 离线时应用无法使用？

**A:** 确保：
- Service Worker 已激活
- 静态资源已缓存
- 使用 Cache First 策略

### Q: 应用未自动更新？

**A:** 检查：
- Service Worker 的 `updatefound` 事件
- 是否有新版本检测提示
- 可以手动刷新更新

---

## 📊 PWA 优势总结

| 特性 | PWA | 原生应用 | 传统网站 |
|------|-----|---------|---------|
| 安装体验 | ✅ 一键安装 | ❌ 应用商店 | ✅ 无需安装 |
| 更新机制 | ✅ 自动更新 | ⚠️ 需审核 | ✅ 即时生效 |
| 离线支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| 跨平台 | ✅ 完美 | ❌ 需分别开发 | ✅ 完美 |
| 开发成本 | ✅ 低 | ❌ 高 | ✅ 低 |
| 性能 | ✅ 接近原生 | ✅ 原生 | ⚠️ 依赖网络 |
| 分发方式 | ✅ Web | ❌ 应用商店 | ✅ Web |

---

## 🎉 开始使用

现在就安装 EchoListen PWA，享受流畅的音频学习体验吧！

**开发模式：**
```bash
npm run dev
# 访问 http://localhost:3000
```

**生产部署：**
```bash
npm run build
# 部署 dist/ 目录到 Web 服务器
```

**安装应用：**
按照上述步骤，在浏览器中点击"安装"即可！

---

**享受你的 PWA 之旅！** 🎧📚✨
