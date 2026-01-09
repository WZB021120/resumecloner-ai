import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

const translations = {
  en: {
    step1Title: "Step 1: Visual Style",
    step1Desc: "Upload a resume image/PDF whose DESIGN you want to clone.",
    dragDrop: "Click or drag file here",
    formats: "Supports PDF, JPG, PNG, WebP",
    uploadAlert: "Please upload an image (JPG, PNG, WebP) or PDF file.",
    pdfProcessing: "Rendering PDF page...",
    
    step2Title: "Step 2: Strategy & Matching",
    step2Desc: "We will tailor your experience to fit the Job Description (JD) perfectly.",
    labelResume: "Your Personal Details",
    labelJd: "2. Target Job Description (JD)",
    dragDropContent: "Upload Details (PDF/Docx/Txt/Doc)",
    dragDropJd: "Upload JD (Screenshot/PDF)",
    orPaste: "OR Paste Text",
    placeholderResume: "Paste your full career history, all projects, skills, and education here...",
    placeholderJd: "Paste the Job Description here (e.g., 'Senior React Engineer needed, must know Tailwind...'). We will optimize your resume keywords to match this.",
    chars: "chars",
    contentAlert: "Please provide both your Resume and the Target JD.",
    startBtn: "Generate Tailored Resume",
    back: "Back",
    backToEdit: "Edit Content",
    extractingText: "Reading Document...",

    processingTitle: "AI Strategy Session",
    visionAgent: "Design Architect",
    visionDesc: "Cloning visual structure",
    architectAgent: "Architect Agent",
    architectDesc: "Generating Tailwind code",
    writerAgent: "Career Strategist",
    writerDesc: "Matching your skills to the JD & rewriting bullets",
    statusInit: "Initializing...",
    statusVision: "Design Architect: Cloning layout...",
    statusWriter: "Career Strategist: Analyzing Job Fit...",
    statusComplete: "Complete",
    statusError: "Error",

    visionSteps: [
      "Analyzing layout grid...",
      "Identifying typography...",
      "Extracting color palette...",
      "Measuring whitespace...",
      "Constructing DOM tree...",
      "Applying styles...",
      "Final polish..."
    ],
    writerSteps: [
      "Analyzing Job Description keywords...",
      "Scanning candidate background...",
      "Filtering irrelevant experience...",
      "Rewriting bullet points for impact...",
      "Injecting ATS keywords...",
      "Optimizing summary...",
      "Finalizing content..."
    ],

    startOver: "New Project",
    editorTitle: "Resume Editor",
    printPdf: "Export PDF",
    exportHtml: "Export HTML",
    personalInfo: "Personal Info",
    fullName: "Full Name",
    title: "Target Title",
    email: "Email",
    phone: "Phone",
    location: "Location",
    summary: "Strategic Summary",
    experience: "Tailored Experience",
    company: "Company",
    role: "Role",
    duration: "Duration",
    aiDisclaimer: "AI-generated content tailored to JD. Review for accuracy.",
    
    poweredBy: "Powered by Gemini 3 Pro & GLM-4.6",
    noImage: "No image found",
    processError: "An error occurred. Please try again.",
  },
  zh: {
    step1Title: "第一步：视觉风格",
    step1Desc: "上传您喜欢的简历样式图（我们只取其“皮”）。",
    dragDrop: "点击或拖拽文件至此",
    formats: "支持 PDF, JPG, PNG, WebP",
    uploadAlert: "请上传图片 (JPG, PNG, WebP) 或 PDF 文件。",
    pdfProcessing: "正在解析文件...",

    step2Title: "第二步：人岗匹配策略",
    step2Desc: "基于目标岗位 JD，智能重写您的经历，实现精准匹配。",
    labelResume: "您的个人详细信息",
    labelJd: "2. 目标岗位描述 (JD)",
    dragDropContent: "上传个人信息 (PDF/Docx/Doc/图)",
    dragDropJd: "上传职位描述 (截图/PDF)",
    orPaste: "或 直接粘贴文本",
    placeholderResume: "在此粘贴您的完整工作经历、项目经验、技能栈...",
    placeholderJd: "在此粘贴目标岗位的JD（例如：高级前端工程师，要求精通React...）。AI将自动提取关键词并优化您的简历描述。",
    chars: "字符",
    contentAlert: "请同时提供您的简历内容和目标岗位JD。",
    startBtn: "生成人岗匹配简历",
    back: "上一步",
    backToEdit: "调整输入内容",
    extractingText: "正在读取文档...",

    processingTitle: "AI 深度构建中",
    visionAgent: "视觉架构师",
    visionDesc: "复刻目标简历的视觉骨架",
    architectAgent: "代码生成器",
    architectDesc: "生成 Tailwind 代码",
    writerAgent: "首席招聘官 Agent",
    writerDesc: "分析JD并重构您的履历亮点",
    statusInit: "正在初始化...",
    statusVision: "视觉架构师：正在提取设计基因...",
    statusWriter: "招聘官 Agent：正在进行人岗匹配分析...",
    statusComplete: "完成",
    statusError: "错误",

    visionSteps: [
      "分析像素级布局...",
      "识别字体与排版...",
      "提取色彩美学...",
      "计算留白比例...",
      "构建页面骨架...",
      "应用样式代码...",
      "最终视觉优化..."
    ],
    writerSteps: [
      "提取 JD 核心关键词...",
      "扫描候选人全量经历...",
      "筛选高匹配度项目...",
      "STAR法则重写工作描述...",
      "植入 ATS 筛选关键词...",
      "优化个人优势总结...",
      "生成最终履历..."
    ],

    startOver: "重新制作",
    editorTitle: "简历编辑器",
    printPdf: "导出 PDF",
    exportHtml: "下载源码",
    personalInfo: "基本信息",
    fullName: "姓名",
    title: "拟投递岗位",
    email: "邮箱",
    phone: "电话",
    location: "所在城市",
    summary: "针对性优势总结",
    experience: "定制化工作经历",
    company: "公司名称",
    role: "担任职位",
    duration: "任职时间",
    aiDisclaimer: "内容已根据 JD 自动优化，请务必校对真实性。",

    poweredBy: "由 Gemini 3 Pro & GLM-4.6 驱动",
    noImage: "未找到图片",
    processError: "处理过程中发生错误，请重试。",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default language set to 'zh' (Chinese)
  const [language, setLanguage] = useState<Language>('zh');

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};