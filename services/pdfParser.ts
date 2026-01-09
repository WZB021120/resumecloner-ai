/**
 * PDF 解析服务
 * 用于检测和解析可编辑 PDF 的结构信息
 */

// 声明 CDN 加载的 pdf.js 库
declare const pdfjsLib: any;

export interface PDFAnalysisResult {
    isEditable: boolean;         // 是否为可编辑 PDF（非扫描版）
    hasText: boolean;            // 是否包含文本层
    pageCount: number;           // 页数
    pageSize: {
        width: number;             // 宽度 (pt)
        height: number;            // 高度 (pt)
    };
    extractedStyles: {
        fonts: string[];           // 使用的字体
        colors: string[];          // 使用的颜色（十六进制）
        hasImages: boolean;        // 是否包含图片
    };
    textContent: string;         // 提取的文本内容
}

/**
 * 分析 PDF 文件，检测是否为可编辑格式并提取样式信息
 */
export const analyzePDF = async (file: File): Promise<PDFAnalysisResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;

        // 获取第一页信息
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });

        // 提取文本内容
        const textContent = await page.getTextContent();
        const textItems = textContent.items || [];

        // 检测是否有文本（可编辑 PDF）
        const hasText = textItems.length > 0;
        const isEditable = hasText && textItems.length > 10; // 至少10个文本元素才认为是可编辑的

        // 提取文本
        const extractedText = textItems
            .map((item: any) => item.str || '')
            .join(' ')
            .trim();

        // 提取字体信息
        const fonts: Set<string> = new Set();
        const colors: Set<string> = new Set();

        textItems.forEach((item: any) => {
            if (item.fontName) {
                fonts.add(item.fontName);
            }
        });

        // 检测是否有图片
        const operators = await page.getOperatorList();
        const hasImages = operators.fnArray.some(
            (fn: number) => fn === pdfjsLib.OPS?.paintImageXObject || fn === pdfjsLib.OPS?.paintJpegXObject
        );

        return {
            isEditable,
            hasText,
            pageCount,
            pageSize: {
                width: Math.round(viewport.width),
                height: Math.round(viewport.height)
            },
            extractedStyles: {
                fonts: Array.from(fonts),
                colors: Array.from(colors),
                hasImages
            },
            textContent: extractedText
        };
    } catch (error) {
        console.error('PDF 分析失败:', error);
        throw new Error('PDF 文件分析失败');
    }
};

/**
 * 从可编辑 PDF 提取结构并生成 HTML 模板
 * 注意：这是一个简化版本，完整实现需要更复杂的布局分析
 */
export const extractPDFTemplate = async (file: File): Promise<string> => {
    const analysis = await analyzePDF(file);

    if (!analysis.isEditable) {
        throw new Error('PDF 不是可编辑格式，请上传图片或可编辑 PDF');
    }

    // 计算页面尺寸（pt 转 mm）
    const widthMm = Math.round(analysis.pageSize.width * 0.352778);
    const heightMm = Math.round(analysis.pageSize.height * 0.352778);

    // 生成基础 HTML 模板框架
    // 实际使用时，这里应该根据 PDF 的布局结构生成更精确的 HTML
    const template = `
<div class="w-[${widthMm}mm] min-h-[${heightMm}mm] bg-white p-8 font-sans">
  <!-- 头部 -->
  <header class="text-center mb-8">
    <h1 class="text-3xl font-bold text-[#2D3748] mb-2">{{fullName}}</h1>
    <p class="text-xl text-[#4A5568] mb-4">{{title}}</p>
    <div class="flex justify-center gap-4 text-sm text-[#718096]">
      <span>{{email}}</span>
      <span>{{phone}}</span>
      <span>{{location}}</span>
    </div>
  </header>
  
  <!-- 简介 -->
  <section class="mb-6">
    <h2 class="text-lg font-bold text-[#2D3748] border-b-2 border-[#4A5568] pb-1 mb-3">个人简介</h2>
    <p class="text-sm text-[#4A5568]">{{summary}}</p>
  </section>
  
  <!-- 工作经历 -->
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
  
  <!-- 教育背景 -->
  <section class="mb-6">
    <h2 class="text-lg font-bold text-[#2D3748] border-b-2 border-[#4A5568] pb-1 mb-3">教育背景</h2>
    <!-- START_EDUCATION_LOOP -->
    <div class="mb-2">
      <h3 class="font-semibold text-[#2D3748]">{{edu_school}}</h3>
      <p class="text-sm text-[#4A5568]">{{edu_degree}} | {{edu_year}}</p>
    </div>
    <!-- END_EDUCATION_LOOP -->
  </section>
  
  <!-- 技能 -->
  <section>
    <h2 class="text-lg font-bold text-[#2D3748] border-b-2 border-[#4A5568] pb-1 mb-3">技能</h2>
    <div class="flex flex-wrap gap-2">{{skill_tags}}</div>
  </section>
</div>
  `.trim();

    return template;
};

/**
 * 将 PDF 第一页渲染为图片（用于扫描版 PDF）
 */
export const renderPDFToImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    }

    throw new Error('无法渲染 PDF');
};
