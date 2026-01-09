/**
 * 统一模板提取服务
 * 根据不同文件格式调用相应的解析器
 */

import { PageSize, PAGE_SIZES, LayoutLimits, DEFAULT_LAYOUT_LIMITS, VisionResult } from '../types';
import { analyzePDF, extractPDFTemplate, renderPDFToImage } from './pdfParser';
import { generateTemplateFromImage } from './geminiService';

export type TemplateSourceType = 'image' | 'pdf-editable' | 'pdf-scan' | 'docx';

export interface TemplateExtractionResult {
    sourceType: TemplateSourceType;
    htmlTemplate: string;
    layoutLimits: LayoutLimits;
    pageSize: PageSize;
    extractedText?: string;  // PDF/Word 解析出的文本可用于内容填充
}

/**
 * 从文件提取模板
 * 根据文件类型自动选择最佳解析策略
 */
export const extractTemplateFromFile = async (
    file: File,
    base64Image?: string
): Promise<TemplateExtractionResult> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    console.log('开始模板提取，文件类型:', fileType, '文件名:', fileName);

    // 1. PDF 文件
    if (fileType === 'application/pdf') {
        return await processPDFFile(file);
    }

    // 2. Word 文档
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword' ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')) {
        return await processWordFile(file);
    }

    // 3. 图片文件
    if (fileType.startsWith('image/') || base64Image) {
        return await processImageFile(base64Image || await fileToBase64(file));
    }

    throw new Error(`不支持的文件格式: ${fileType}`);
};

/**
 * 处理 PDF 文件
 */
const processPDFFile = async (file: File): Promise<TemplateExtractionResult> => {
    console.log('分析 PDF 文件...');

    try {
        const analysis = await analyzePDF(file);

        if (analysis.isEditable) {
            // 可编辑 PDF：直接提取结构
            console.log('检测到可编辑 PDF，提取结构...');
            const template = await extractPDFTemplate(file);

            // 计算页面尺寸（pt 转 mm）
            const widthMm = Math.round(analysis.pageSize.width * 0.352778);
            const heightMm = Math.round(analysis.pageSize.height * 0.352778);

            return {
                sourceType: 'pdf-editable',
                htmlTemplate: template,
                layoutLimits: DEFAULT_LAYOUT_LIMITS,
                pageSize: {
                    width: widthMm,
                    height: heightMm,
                    aspectRatio: widthMm / heightMm
                },
                extractedText: analysis.textContent
            };
        } else {
            // 扫描版 PDF：转图片后用 AI 处理
            console.log('检测到扫描版 PDF，转换为图片处理...');
            const base64 = await renderPDFToImage(file);
            const result = await processImageFile(base64);
            return {
                ...result,
                sourceType: 'pdf-scan'
            };
        }
    } catch (error) {
        console.error('PDF 解析失败，尝试转图片处理:', error);
        const base64 = await renderPDFToImage(file);
        return await processImageFile(base64);
    }
};

/**
 * 处理 Word 文档
 */
const processWordFile = async (file: File): Promise<TemplateExtractionResult> => {
    console.log('处理 Word 文档...');

    // 使用后端 API 解析 Word 文档
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/extract-docx-template', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            return {
                sourceType: 'docx',
                htmlTemplate: data.template || generateDefaultTemplate(),
                layoutLimits: DEFAULT_LAYOUT_LIMITS,
                pageSize: PAGE_SIZES.A4,
                extractedText: data.text
            };
        }
    } catch (error) {
        console.error('Word 文档解析失败:', error);
    }

    // 如果后端解析失败，返回默认模板
    return {
        sourceType: 'docx',
        htmlTemplate: generateDefaultTemplate(),
        layoutLimits: DEFAULT_LAYOUT_LIMITS,
        pageSize: PAGE_SIZES.A4
    };
};

/**
 * 处理图片文件
 */
const processImageFile = async (base64Image: string): Promise<TemplateExtractionResult> => {
    console.log('使用 AI 视觉模型处理图片...');

    const result = await generateTemplateFromImage(base64Image);

    return {
        sourceType: 'image',
        htmlTemplate: result.htmlTemplate,
        layoutLimits: result.layoutLimits,
        pageSize: result.pageSize
    };
};

/**
 * 文件转 Base64
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * 生成默认模板（当解析失败时使用）
 */
const generateDefaultTemplate = (): string => {
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
};
