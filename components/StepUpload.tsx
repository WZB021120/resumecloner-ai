import React, { useRef, useState } from 'react';
import { Upload, FileImage, Loader2, Sparkles, ImageIcon, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PageSize, PAGE_SIZES, LayoutLimits, DEFAULT_LAYOUT_LIMITS } from '../types';

// 声明 CDN 加载的库
declare const pdfjsLib: any;

// 上传结果类型
export interface UploadResult {
  type: 'image' | 'pdf' | 'docx';
  base64Image?: string;        // 图片/扫描PDF时的图片数据
  htmlTemplate?: string;       // PDF/Word直接解析的模板
  pageSize: PageSize;
  layoutLimits: LayoutLimits;
  extractedText?: string;      // 从文档提取的文本
}

interface StepUploadProps {
  onUploadComplete: (result: UploadResult) => void;
}

const StepUpload: React.FC<StepUploadProps> = ({ onUploadComplete }) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成默认简历模板
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

  // 检测图片尺寸并推断页面格式
  const detectPageSize = (width: number, height: number): PageSize => {
    const aspectRatio = width / height;
    if (Math.abs(aspectRatio - 0.707) < 0.05) {
      return { ...PAGE_SIZES.A4 };
    } else if (Math.abs(aspectRatio - 0.773) < 0.05) {
      return { ...PAGE_SIZES.LETTER };
    } else {
      const widthMm = Math.round((width / 96) * 25.4);
      const heightMm = Math.round((height / 96) * 25.4);
      return { width: widthMm, height: heightMm, aspectRatio };
    }
  };

  // 处理 PDF 文件
  const processPDF = async (file: File) => {
    setProcessingMessage('分析 PDF 文件...');
    setUploadProgress(20);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      // 检查是否有文本层
      const textContent = await page.getTextContent();
      const hasText = textContent.items && textContent.items.length > 10;

      setUploadProgress(50);

      if (hasText) {
        // 可编辑 PDF - 提取文本并生成默认模板
        setProcessingMessage('提取 PDF 结构...');
        const extractedText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .trim();

        const viewport = page.getViewport({ scale: 1.0 });
        const widthMm = Math.round(viewport.width * 0.352778);
        const heightMm = Math.round(viewport.height * 0.352778);

        setUploadProgress(100);

        onUploadComplete({
          type: 'pdf',
          htmlTemplate: generateDefaultTemplate(), // 添加默认模板
          pageSize: { width: widthMm, height: heightMm, aspectRatio: widthMm / heightMm },
          layoutLimits: DEFAULT_LAYOUT_LIMITS,
          extractedText
        });
      } else {
        // 扫描版 PDF - 转图片
        setProcessingMessage('转换为图片...');
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
          const pageSize = detectPageSize(viewport.width / 2, viewport.height / 2);

          setUploadProgress(100);

          onUploadComplete({
            type: 'image',
            base64Image: base64,
            pageSize,
            layoutLimits: DEFAULT_LAYOUT_LIMITS
          });
        }
      }
    } catch (error) {
      console.error('PDF 处理失败:', error);
      alert('PDF 解析失败，请尝试上传图片格式');
    }
  };

  // 处理 Word 文档
  const processWord = async (file: File) => {
    setProcessingMessage('解析 Word 文档...');
    setUploadProgress(30);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-docx-template', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(70);

      if (response.ok) {
        const data = await response.json();
        setUploadProgress(100);

        onUploadComplete({
          type: 'docx',
          htmlTemplate: data.template,
          pageSize: PAGE_SIZES.A4,
          layoutLimits: DEFAULT_LAYOUT_LIMITS,
          extractedText: data.text
        });
      } else {
        throw new Error('Word 解析失败');
      }
    } catch (error) {
      console.error('Word 处理失败:', error);
      alert('Word 文档解析失败，请尝试上传图片格式');
    }
  };

  // 处理图片文件
  const processImage = (file: File) => {
    setProcessingMessage('处理图片...');
    setUploadProgress(50);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];

      const img = new Image();
      img.onload = () => {
        const pageSize = detectPageSize(img.width, img.height);
        setUploadProgress(100);

        onUploadComplete({
          type: 'image',
          base64Image: base64,
          pageSize,
          layoutLimits: DEFAULT_LAYOUT_LIMITS
        });
      };
      img.onerror = () => {
        onUploadComplete({
          type: 'image',
          base64Image: base64,
          pageSize: PAGE_SIZES.A4,
          layoutLimits: DEFAULT_LAYOUT_LIMITS
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // 处理文件上传
  const handleFile = async (file: File) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    setIsProcessing(true);
    setUploadProgress(10);

    try {
      if (fileType === 'application/pdf') {
        await processPDF(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword' ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')
      ) {
        await processWord(file);
      } else if (fileType.startsWith('image/')) {
        processImage(file);
      } else {
        alert('不支持的文件格式。请上传 PDF、Word 或图片文件。');
      }
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setUploadProgress(0);
        setProcessingMessage('');
      }, 300);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center animate-fade-in-up px-4">
      {/* 标题区域 */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 mb-6">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">第一步</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
          {t.step1Title}
        </h2>
        <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          {t.step1Desc}
        </p>
      </div>

      {/* 上传区域 */}
      <div
        className={`
          relative rounded-3xl transition-all duration-500 cursor-pointer overflow-hidden
          ${isDragging
            ? 'scale-[1.02] shadow-2xl shadow-indigo-500/20'
            : 'hover:shadow-xl hover:shadow-indigo-500/10'
          }
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {/* 背景渐变 */}
        <div className={`
          absolute inset-0 transition-all duration-500
          ${isDragging
            ? 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100'
            : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50'
          }
        `} />

        {/* 边框效果 */}
        <div className={`
          absolute inset-0 rounded-3xl border-2 border-dashed transition-all duration-300
          ${isDragging
            ? 'border-indigo-400 bg-indigo-500/5'
            : 'border-gray-200 hover:border-indigo-300'
          }
        `} />

        {/* 装饰性图案 */}
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 blur-2xl" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-indigo-400 blur-2xl" />
        </div>

        {/* 内容区域 */}
        <div className="relative z-10 p-12 md:p-16">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-30" />
              </div>

              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-600 mt-3">
                  {processingMessage || t.pdfProcessing}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              <div className={`
                relative p-8 rounded-3xl transition-all duration-300
                ${isDragging
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-110'
                  : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                }
              `}>
                <Upload className={`w-12 h-12 transition-colors ${isDragging ? 'text-white' : 'text-indigo-600'}`} />
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center shadow-lg">
                    <ImageIcon className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-3 font-serif">
                  {t.dragDrop}
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  支持 PDF、Word、JPG、PNG 格式
                </p>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {['PDF', 'DOCX', 'DOC', 'JPG', 'PNG'].map((format) => (
                    <span
                      key={format}
                      className="px-4 py-1.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 transition-all"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* 底部提示 */}
      <p className="mt-8 text-xs text-gray-400 max-w-md mx-auto">
        💡 提示：上传一份您喜欢的简历设计作为模板，支持多种格式智能解析
      </p>
    </div>
  );
};

export default StepUpload;