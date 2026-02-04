# Chrome Extension Icons

本目录需要包含以下尺寸的 PNG 图标文件：

- icon-16.png (16x16 像素)
- icon-32.png (32x32 像素)
- icon-48.png (48x48 像素)
- icon-128.png (128x128 像素)

## 如何生成图标：

### 方法 1：使用在线工具
1. 访问 https://www.favicon-generator.org/ 或类似的在线工具
2. 上传 icon.svg 文件
3. 生成所需尺寸的 PNG 文件
4. 下载并保存到本目录

### 方法 2：使用 ImageMagick (命令行)
```bash
# 安装 ImageMagick 后运行
magick convert -background none icon.svg -resize 16x16 icon-16.png
magick convert -background none icon.svg -resize 32x32 icon-32.png
magick convert -background none icon.svg -resize 48x48 icon-48.png
magick convert -background none icon.svg -resize 128x128 icon-128.png
```

### 方法 3：使用在线 SVG 转 PNG 工具
- https://cloudconvert.com/svg-to-png
- https://convertio.co/zh/svg-png/

## 临时解决方案
在开发阶段，你可以使用任何 128x128 的 PNG 图片作为临时图标，复制并重命名为所需尺寸。
