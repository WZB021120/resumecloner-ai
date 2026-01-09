export interface ResumeData {
  fullName: string;
  title: string;
  photoUrl?: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string[];
  }>;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    year: string;
  }>;
}

/**
 * 布局字数限制配置
 * 由视觉架构师根据模板动态生成
 */
export interface LayoutLimits {
  fullName: number;        // 姓名最大字符数
  title: number;           // 职位头衔最大字符数
  summary: number;         // 个人简介最大字符数
  expCompany: number;      // 公司名最大字符数
  expRole: number;         // 职位名最大字符数
  expDescription: number;  // 每条工作描述最大字符数
  expCount: number;        // 最大工作经历条数
  skillName: number;       // 每个技能最大字符数
  skillCount: number;      // 最大技能数量
  eduSchool: number;       // 学校名最大字符数
  eduDegree: number;       // 学位最大字符数
  eduCount: number;        // 最大教育经历条数
}

/**
 * 默认布局限制（当视觉架构师未能提取时使用）
 */
export const DEFAULT_LAYOUT_LIMITS: LayoutLimits = {
  fullName: 15,
  title: 25,
  summary: 200,
  expCompany: 20,
  expRole: 20,
  expDescription: 60,
  expCount: 3,
  skillName: 12,
  skillCount: 8,
  eduSchool: 25,
  eduDegree: 20,
  eduCount: 2,
};

export type AgentStatus = 'idle' | 'working' | 'success' | 'error';

export interface ProcessingState {
  step: 'upload-style' | 'input-content' | 'processing' | 'editor';
  isAnalyzing: boolean;
  agentStatus: {
    vision: AgentStatus;
    writer: AgentStatus;
  };
}

/**
 * 页面尺寸信息
 * 从输入图片检测，用于保持输出尺寸一致
 */
export interface PageSize {
  width: number;   // 宽度 (mm)
  height: number;  // 高度 (mm)
  aspectRatio: number; // 宽高比
}

/**
 * 常见页面尺寸预设
 */
export const PAGE_SIZES = {
  A4: { width: 210, height: 297, aspectRatio: 210 / 297 },
  LETTER: { width: 216, height: 279, aspectRatio: 216 / 279 },
  CUSTOM: { width: 210, height: 297, aspectRatio: 210 / 297 }, // 默认
};

/**
 * 视觉架构师返回结果
 */
export interface VisionResult {
  htmlTemplate: string;
  layoutLimits: LayoutLimits;
  pageSize: PageSize;
}

export interface GeneratedResult {
  htmlTemplate: string;
  jsonData: ResumeData;
  layoutLimits: LayoutLimits;
  pageSize: PageSize;
}