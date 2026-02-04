const fs = require('fs');
const path = require('path');

// 简单的 PNG 文件头和最小文件
function createSimplePNG(width, height, color) {
  // 这是一个非常简单的单色 PNG
  const pixel = [
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR type
    (width >> 24) & 0xFF, (width >> 16) & 0xFF, (width >> 8) & 0xFF, width & 0xFF, // width
    (height >> 24) & 0xFF, (height >> 16) & 0xFF, (height >> 8) & 0xFF, height & 0xFF, // height
    0x08, // bit depth
    0x02, // color type (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x00, 0x00, 0x00, 0x01, // sRGB length
    0x73, 0x52, 0x47, 0x42, // sRGB type
    0x00, // rendering intent
    0x00, 0x00, 0x00, (width * height * 3 + 6), // IDAT length
    0x49, 0x44, 0x54, 0x41, // IDAT type
    0x78, 0x9C, // zlib header
    0x01, // compression flags
  ];

  const data = [];
  for (let i = 0; i < width * height; i++) {
    data.push(color[0], color[1], color[2]);
  }

  return Buffer.concat([
    Buffer.from(pixel),
    Buffer.from(data),
    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]) // IEND
  ]);
}

const iconsDir = path.join(__dirname, '../icons');

// PWA 所需的所有图标尺寸
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const color = [11, 79, 108]; // 主题蓝色 (RGB)

console.log('Generating PWA icons...');

sizes.forEach(size => {
  const png = createSimplePNG(size, size, color);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`✓ Generated icon-${size}.png (${size}x${size})`);
});

console.log('\n✅ All icons generated successfully!');
console.log(`📁 Location: ${iconsDir}`);
console.log(`📊 Total: ${sizes.length} icon sizes`);
