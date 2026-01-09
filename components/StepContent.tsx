import React, { useState, useRef } from 'react';
import { FileText, Briefcase, UploadCloud, ChevronLeft, Loader2, Sparkles, FileUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { extractTextFromImage } from '../services/geminiService';

// 从 window 获取 CDN 加载的库
const getMammoth = (): any => {
  return (window as any).mammoth;
};

const getPdfjs = (): any => {
  return (window as any).pdfjsLib || (window as any)['pdfjs-dist/build/pdf'];
};

const StepContent: React.FC<{
  onBack: () => void;
  onContentSubmit: () => void;
  resumeText: string;
  jdText: string;
  setResumeText: (text: string) => void;
  setJdText: (text: string) => void;
  processingState: { resume: boolean; jd: boolean };
  setProcessingState: React.Dispatch<React.SetStateAction<{ resume: boolean; jd: boolean }>>;
}> = ({ onBack, onContentSubmit, resumeText, jdText, setResumeText, setJdText, processingState, setProcessingState }) => {
  const { t } = useLanguage();
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [jdFileName, setJdFileName] = useState<string>('');

  const onDrop = (e: React.DragEvent, target: 'resume' | 'jd') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file, target);
    }
  };

  const normalizeText = (text: string): string => {
    if (!text) return '';
    let normalized = text.normalize('NFC');
    normalized = normalized
      .replace(/[\u2018\u2019\u201B\u2032\u2035]/g, "'")
      .replace(/[\u201C\u201D\u201E\u2033\u2036]/g, '"')
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
      .replace(/[\u00A0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F]/g, ' ')
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n');
    return normalized.trim();
  };

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdfjsLib = getPdfjs();
    if (!pdfjsLib) {
      throw new Error('PDF.js 库未加载');
    }
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const text = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text.push(pageText);
    }
    return normalizeText(text.join('\n\n'));
  };

  // 使用 mammoth 解析 docx/doc 文件
  const extractTextFromWord = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const mammoth = getMammoth();
    if (!mammoth) {
      console.error('Mammoth.js 库未加载');
      throw new Error('Word 解析库未加载，请刷新页面重试');
    }
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      if (result && result.value) {
        return normalizeText(result.value);
      }
      throw new Error('无法提取文本内容');
    } catch (error) {
      console.error('Mammoth 解析错误:', error);
      throw error;
    }
  };

  const handleFile = async (file: File, target: 'resume' | 'jd') => {
    setProcessingState(prev => ({ ...prev, [target]: true }));
    if (target === 'resume') setResumeFileName(file.name);
    else setJdFileName(file.name);

    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    try {
      let extractedText = '';

      // PDF 处理
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          extractedText = await extractTextFromPdf(arrayBuffer);
          if (!extractedText) throw new Error("无法提取PDF内容");
        } catch (e) {
          console.error('PDF解析错误', e);
          alert("PDF 解析失败，文件可能受密码保护或已损坏。");
          setProcessingState(prev => ({ ...prev, [target]: false }));
          return;
        }
      }
      // DOCX 处理
      else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          extractedText = await extractTextFromWord(arrayBuffer);
          if (!extractedText) {
            throw new Error("无法从 docx 提取文本");
          }
        } catch (e: any) {
          console.error('DOCX解析错误:', e);
          alert(e.message || ".docx 文件读取失败，请尝试另存为 PDF。");
          setProcessingState(prev => ({ ...prev, [target]: false }));
          return;
        }
      }
      // DOC 处理 (旧版 Word 格式)
      else if (fileName.endsWith('.doc') || fileType === 'application/msword') {
        // 策略1: 尝试后端解析
        try {
          const form = new FormData();
          form.append('file', file);
          const resp = await fetch('/api/extract-text', { method: 'POST', body: form });
          if (resp.ok) {
            const data = await resp.json();
            extractedText = normalizeText(data?.text || '');
          }
        } catch (e) {
          console.error('后端DOC解析错误:', e);
        }

        // 策略2: 尝试 mammoth (有些 .doc 实际上是 .docx 格式)
        if (!extractedText) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            extractedText = await extractTextFromWord(arrayBuffer);
          } catch (e) {
            console.error('Mammoth DOC解析错误:', e);
          }
        }

        if (!extractedText) {
          alert("旧版 Word (.doc) 解析失败。\n\n建议：\n1. 用 Word 打开后另存为 .docx 格式\n2. 或导出为 PDF\n3. 或直接复制文本粘贴");
          setProcessingState(prev => ({ ...prev, [target]: false }));
          return;
        }
      }
      // 文本文件处理
      else if (fileType === 'text/plain' || fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        try {
          extractedText = normalizeText(await file.text());
        } catch (e) {
          alert("文本文件读取失败。");
          setProcessingState(prev => ({ ...prev, [target]: false }));
          return;
        }
      }
      // 图片处理 (OCR)
      else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|webp)$/)) {
        try {
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = async (e) => {
              try {
                const result = e.target?.result as string;
                const base64 = result.split(',')[1];
                extractedText = await extractTextFromImage(base64, file.type || 'image/jpeg');
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            reader.onerror = () => reject(new Error("图片读取失败"));
            reader.readAsDataURL(file);
          });
        } catch (e) {
          alert("图片文字识别失败，请确保图片包含清晰的文字内容。");
          setProcessingState(prev => ({ ...prev, [target]: false }));
          return;
        }
      } else {
        alert("不支持的文件格式，请使用 PDF、Word、图片或纯文本文件。");
        setProcessingState(prev => ({ ...prev, [target]: false }));
        return;
      }

      if (extractedText) {
        if (target === 'resume') {
          setResumeText(prev => prev + (prev ? '\n\n' : '') + extractedText);
        } else {
          setJdText(prev => prev + (prev ? '\n\n' : '') + extractedText);
        }
      }
    } catch (error) {
      console.error('处理文件时发生错误:', error);
      alert(`发生错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setProcessingState(prev => ({ ...prev, [target]: false }));
    }
  };

  const isReady = resumeText.length >= 20 && jdText.length >= 20;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{t.back}</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">第二步</span>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
            {t.step2Title}
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto">
            {t.step2Desc}
          </p>
        </div>

        {/* 双栏输入区 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：简历信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t.labelResume}</h3>
                <p className="text-xs text-gray-400">您的完整工作经历和技能</p>
              </div>
            </div>

            {/* 上传区域 */}
            <div
              className={`
                relative rounded-2xl border-2 border-dashed p-6 transition-all duration-300 cursor-pointer
                ${processingState.resume
                  ? 'border-indigo-300 bg-indigo-50/50'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                }
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, 'resume')}
              onClick={() => !processingState.resume && resumeFileInputRef.current?.click()}
            >
              {processingState.resume ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="text-sm font-medium text-indigo-600">{t.extractingText}</span>
                </div>
              ) : resumeFileName ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">{resumeFileName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="p-3 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                    <FileUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">{t.dragDropContent}</span>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>PDF</span>
                    <span>•</span>
                    <span>DOCX</span>
                    <span>•</span>
                    <span>图片</span>
                  </div>
                </div>
              )}
              <input
                ref={resumeFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'resume')}
              />
            </div>

            {/* 文本输入框 */}
            <div className="relative">
              <div className="absolute top-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100">
                {resumeText.length} {t.chars}
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={t.placeholderResume}
                className="w-full h-72 p-5 pt-12 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all text-gray-700 leading-relaxed"
              />
            </div>
          </div>

          {/* 右侧：JD信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t.labelJd}</h3>
                <p className="text-xs text-gray-400">目标岗位的职位描述</p>
              </div>
            </div>

            {/* 上传区域 */}
            <div
              className={`
                relative rounded-2xl border-2 border-dashed p-6 transition-all duration-300 cursor-pointer
                ${processingState.jd
                  ? 'border-purple-300 bg-purple-50/50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                }
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, 'jd')}
              onClick={() => !processingState.jd && jdFileInputRef.current?.click()}
            >
              {processingState.jd ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-sm font-medium text-purple-600">{t.extractingText}</span>
                </div>
              ) : jdFileName ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">{jdFileName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                    <FileUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">{t.dragDropJd}</span>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>PDF</span>
                    <span>•</span>
                    <span>DOC/DOCX</span>
                    <span>•</span>
                    <span>图片</span>
                  </div>
                </div>
              )}
              <input
                ref={jdFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'jd')}
              />
            </div>

            {/* 文本输入框 */}
            <div className="relative">
              <div className="absolute top-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100">
                {jdText.length} {t.chars}
              </div>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder={t.placeholderJd}
                className="w-full h-72 p-5 pt-12 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 transition-all text-gray-700 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={() => {
              if (!isReady) {
                alert(t.contentAlert);
                return;
              }
              onContentSubmit();
            }}
            disabled={!isReady}
            className={`
              relative px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 overflow-hidden
              ${isReady
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 bg-[length:200%_100%] animate-gradient'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              {t.startBtn}
            </span>
          </button>

          {!isReady && (
            <p className="text-sm text-gray-400">
              请在两侧输入框中各输入至少 20 个字符
            </p>
          )}
        </div>
      </div>

      {/* 添加渐变动画样式 */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default StepContent;