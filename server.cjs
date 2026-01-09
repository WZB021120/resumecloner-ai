const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const iconv = require('iconv-lite');
const WordExtractor = require('word-extractor');

const app = express();

app.use(cors({
  origin: [/http:\/\/localhost:\d+$/],
  methods: ['POST'],
}));

const upload = multer({ storage: multer.memoryStorage() });

// 创建 word-extractor 实例
const extractor = new WordExtractor();

app.post('/api/extract-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const buffer = req.file.buffer;
    const originalName = (req.file.originalname || '').toLowerCase();

    if (!originalName.endsWith('.doc')) {
      return res.status(400).json({ error: 'Only .doc is supported by this endpoint' });
    }

    // 首先检查文件头，判断文件类型
    const asText = buffer.toString('utf8');

    // 策略1: RTF 格式
    if (asText.startsWith('{\\rtf')) {
      console.log('检测到 RTF 格式');
      const text = asText
        .replace(/\\par[d]?/g, '\n')
        .replace(/\{.*?\}/gs, '')
        .replace(/\\[a-z]+[0-9-]*/g, '')
        .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
          try { return Buffer.from(hex, 'hex').toString('utf8'); } catch { return ''; }
        })
        .trim();
      return res.json({ text: normalizeText(text) });
    }

    // 策略2: Word 2003 XML 格式
    if (asText.trim().startsWith('<?xml')) {
      console.log('检测到 XML 格式');
      const text = asText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return res.json({ text: normalizeText(text) });
    }

    // 策略3: 使用 word-extractor 解析二进制 .doc 文件 (OLE 复合文档)
    try {
      console.log('尝试使用 word-extractor 解析二进制 DOC...');

      // 需要先将 buffer 写入临时文件，因为 word-extractor 需要文件路径
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `temp_${Date.now()}.doc`);
      fs.writeFileSync(tempFile, buffer);

      try {
        const extracted = await extractor.extract(tempFile);
        const text = extracted.getBody();

        // 清理临时文件
        fs.unlinkSync(tempFile);

        if (text && text.trim().length > 10) {
          console.log('word-extractor 解析成功');
          return res.json({ text: normalizeText(text) });
        }
      } catch (extractError) {
        console.error('word-extractor 解析错误:', extractError.message);
        // 清理临时文件
        try { fs.unlinkSync(tempFile); } catch { }
      }
    } catch (e) {
      console.error('word-extractor 处理错误:', e);
    }

    // 策略4: 尝试各种编码解码（适用于某些简单格式）
    // 尝试 GBK 编码 (中文文档常用)
    try {
      const gbkText = iconv.decode(buffer, 'GBK');
      // 检查是否包含足够的有效中文字符
      const chineseChars = (gbkText.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (chineseChars > 20) {
        console.log('GBK 编码解析成功');
        return res.json({ text: normalizeText(gbkText) });
      }
    } catch (e) {
      console.error('GBK decode error:', e);
    }

    // 尝试 GB18030 编码
    try {
      const gb18030Text = iconv.decode(buffer, 'GB18030');
      const chineseChars = (gb18030Text.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (chineseChars > 20) {
        console.log('GB18030 编码解析成功');
        return res.json({ text: normalizeText(gb18030Text) });
      }
    } catch (e) {
      console.error('GB18030 decode error:', e);
    }

    // 策略5: 最后尝试直接提取可见字符
    try {
      // 提取所有可打印的 ASCII 和常见中文字符
      let extractedText = '';
      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];
        // ASCII 可打印字符 (32-126) 或换行符
        if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
          extractedText += String.fromCharCode(char);
        }
      }
      // 清理并检查结果
      extractedText = extractedText
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (extractedText.length > 100) {
        console.log('ASCII 提取成功');
        return res.json({ text: normalizeText(extractedText) });
      }
    } catch (e) {
      console.error('ASCII extract error:', e);
    }

    // 所有方法都失败
    return res.status(422).json({
      error: '无法解析此 .doc 文件。该文件可能使用了不支持的加密或格式。建议：用 Word 打开后另存为 .docx 或 PDF 格式。'
    });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

function normalizeText(text) {
  if (!text) return '';

  // Normalize Unicode characters (NFC form)
  let normalized = text.normalize('NFC');

  // Replace common problematic characters
  normalized = normalized
    // Replace various quote marks with standard ones
    .replace(/[\u2018\u2019\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033\u2036]/g, '"')
    // Replace dashes
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
    // Replace spaces
    .replace(/[\u00A0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F]/g, ' ')
    // Remove zero-width characters
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    // Remove common binary garbage patterns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n');

  return normalized.trim();
}

// 新增: Word 文档模板提取 API
app.post('/api/extract-docx-template', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = req.file.buffer;
    const originalName = (req.file.originalname || '').toLowerCase();

    console.log('提取 Word 模板:', originalName);

    let text = '';

    // 尝试使用各种方法提取文本
    if (originalName.endsWith('.doc')) {
      // 使用 word-extractor 处理 .doc 文件
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `temp_${Date.now()}.doc`);
      fs.writeFileSync(tempFile, buffer);

      try {
        const extracted = await extractor.extract(tempFile);
        text = extracted.getBody() || '';
      } catch (e) {
        console.error('word-extractor 错误:', e.message);
      } finally {
        try { fs.unlinkSync(tempFile); } catch { }
      }
    }

    // 如果文本提取失败，尝试读取为字符串
    if (!text) {
      text = buffer.toString('utf8');
    }

    // 生成基础模板
    const template = generateBasicTemplate();

    return res.json({
      template: template,
      text: normalizeText(text)
    });

  } catch (error) {
    console.error('Word 模板提取失败:', error);
    return res.status(500).json({ error: 'Template extraction failed' });
  }
});

// 生成基础简历模板
function generateBasicTemplate() {
  return `
<div class="w-[210mm] min-h-[297mm] bg-white p-8 font-sans">
  <header class="text-center mb-8">
    <h1 class="text-3xl font-bold text-[#2D3748] mb-2">{{fullName}}</h1>
    <p class="text-xl text-[#4A5568] mb-4">{{title}}</p>
    <div class="flex justify-center gap-4 text-sm text-[#718096]">
      <span>{{email}}</span>
      <span>{{phone}}</span>
      <span>{{location}}</span>
    </div>
  </header>
  
  <section class="mb-6">
    <h2 class="text-lg font-bold text-[#2D3748] border-b-2 border-[#4A5568] pb-1 mb-3">个人简介</h2>
    <p class="text-sm text-[#4A5568]">{{summary}}</p>
  </section>
  
  <section class="mb-6">
    <h2 class="text-lg font-bold text-[#2D3748] border-b-2 border-[#4A5568] pb-1 mb-3">工作经历</h2>
    <!-- START_EXPERIENCE_LOOP -->
    <div class="mb-4">
      <div class="flex justify-between">
        <h3 class="font-semibold text-[#2D3748]">{{exp_role}}</h3>
        <span class="text-sm text-[#718096]">{{exp_duration}}</span>
      </div>
      <p class="text-[#4A5568]">{{exp_company}}</p>
      <div class="text-sm text-[#4A5568] mt-2">{{exp_description}}</div>
    </div>
    <!-- END_EXPERIENCE_LOOP -->
  </section>
  
  <section class="mb-6">
    <h2 class="text-lg font-bold text-[#2D3748] border-b-2 border-[#4A5568] pb-1 mb-3">教育背景</h2>
    <!-- START_EDUCATION_LOOP -->
    <div class="mb-2">
      <h3 class="font-semibold text-[#2D3748]">{{edu_school}}</h3>
      <p class="text-sm text-[#4A5568]">{{edu_degree}} | {{edu_year}}</p>
    </div>
    <!-- END_EDUCATION_LOOP -->
  </section>
  
  <section>
    <h2 class="text-lg font-bold text-[#2D3748] border-b-2 border-[#4A5568] pb-1 mb-3">技能</h2>
    <div class="flex flex-wrap gap-2">{{skill_tags}}</div>
  </section>
</div>
  `.trim();
}

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`DOC extraction server listening on http://localhost:${PORT}`);
  console.log('支持格式: RTF, Word 2003 XML, 二进制 DOC (OLE), DOCX 模板提取');
});
