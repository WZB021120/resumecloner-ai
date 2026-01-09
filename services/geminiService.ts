import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResumeData, LayoutLimits, VisionResult, DEFAULT_LAYOUT_LIMITS, PAGE_SIZES } from "../types";

// --- Configuration ---
// API 密钥从环境变量读取，确保安全性
const GLM_API_KEY = process.env.GLM_API_KEY || '';
const GLM_API_URL = "https://apis.iflow.cn/v1/chat/completions";

// 初始化 Gemini 客户端 (用于视觉/布局克隆)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// API 密钥检查函数
const validateApiKeys = () => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('警告: GEMINI_API_KEY 未设置，视觉克隆功能将无法使用');
    }
    if (!GLM_API_KEY) {
        console.warn('警告: GLM_API_KEY 未设置，内容优化功能将无法使用');
    }
};

// Retry helper
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0) {
            console.warn(`Operation failed, retrying... (${retries} left).`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}

const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
};

/**
 * Stage 1: The Architect (qwen3-vl-plus via iFlow)
 * 使用 iFlow 平台的 qwen3-vl-plus 进行视觉克隆
 * 返回 HTML 模板和动态布局限制
 */
export const generateTemplateFromImage = async (base64Image: string): Promise<VisionResult> => {
    if (!GLM_API_KEY) {
        throw new Error('GLM_API_KEY 未配置，无法进行视觉克隆');
    }

    const prompt = `你是一位像素级精准的前端开发专家，专精于 Tailwind CSS 和响应式布局。
你的任务是将这张简历图片**精确克隆**成 HTML/CSS 代码，必须严格分离布局与内容。

## 核心原则 ##

### 1. 布局还原要求（最重要）
- **页面结构**: 必须生成完整的 A4 页面容器 (210mm x 297mm)
- **栅格系统**: 识别是单栏、双栏还是混合布局，使用 flex 或 grid 精确还原
- **间距精确**: 仔细观察各元素间的 margin/padding，使用具体数值如 mb-4, py-6, gap-8
- **字体层级**: 标题用 text-2xl/text-xl，正文用 text-sm/text-base，保持层级一致

### 2. 视觉样式还原
- **颜色采样**: 使用精确的 HEX 颜色值，如 text-[#2D3748], bg-[#4A5568]
- **字体**: 检测是衬线体还是无衬线体，使用 font-serif 或 font-sans
- **图标**: 为联系方式生成内联 SVG 图标（电话、邮箱、位置、LinkedIn）
- **边框/阴影**: 如果有卡片效果，使用 shadow-md, rounded-lg 等

### 3. 动态占位符（必须使用）
绝对不能输出图片中的真实个人信息，必须使用以下变量：

**头部信息:**
- {{fullName}} - 姓名
- {{title}} - 职位头衔  
- {{email}}, {{phone}}, {{location}} - 联系方式
- {{summary}} - 个人简介（如果有）
- <img src="{{photo_src}}" class="..."> - 头像（如果有）

**技能标签:**
- {{skill_tags}} - 放在技能区域的容器内

### 4. 循环结构（严格遵守此格式）

**工作经历循环:**
<!-- START_EXPERIENCE_LOOP -->
<div class="mb-6">
  <div class="flex justify-between items-start">
    <div>
      <h3 class="font-bold text-[#2D3748]">{{exp_role}}</h3>
      <p class="text-[#4A5568]">{{exp_company}}</p>
    </div>
    <span class="text-sm text-[#718096]">{{exp_duration}}</span>
  </div>
  <div class="mt-2 text-sm text-[#4A5568]">
    {{exp_description}}
  </div>
</div>
<!-- END_EXPERIENCE_LOOP -->

**教育背景循环:**
<!-- START_EDUCATION_LOOP -->
<div class="mb-3">
  <h4 class="font-semibold">{{edu_school}}</h4>
  <p class="text-sm">{{edu_degree}}</p>
  <p class="text-sm text-gray-500">{{edu_year}}</p>
</div>
<!-- END_EDUCATION_LOOP -->

### 5. 输出格式
- 直接输出 HTML 代码，不要用代码块包裹
- 从 <div class="w-[210mm] min-h-[297mm] ..."> 开始的完整结构
- 确保所有标签正确闭合
- 保留静态文字如 "工作经历"、"教育背景"、"技能" 等标签`;

    try {
        console.log('开始视觉架构师处理，使用 iFlow qwen3-vl-plus 模型');

        const response = await fetch(GLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "qwen3-vl-plus",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            },
                            {
                                type: "text",
                                text: prompt
                            }
                        ]
                    }
                ],
                temperature: 0.2,
                max_tokens: 8192
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('iFlow API Error:', response.status, errorData);
            throw new Error(`iFlow API 错误: ${response.statusText}`);
        }

        const data = await response.json();
        let html = data.choices?.[0]?.message?.content || "";

        // 清理代码块标记
        html = html.replace(/```html/g, "").replace(/```/g, "").trim();

        // 移除可能的思考过程标记
        html = html.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        console.log('视觉架构师处理成功，HTML 长度:', html.length);

        if (!html || html.length < 100) {
            throw new Error('生成的模板内容不完整');
        }

        // 分析布局并返回动态限制
        const layoutLimits = analyzeLayoutLimits(html);

        return {
            htmlTemplate: html,
            layoutLimits: layoutLimits,
            pageSize: PAGE_SIZES.A4
        };
    } catch (error: any) {
        console.error("视觉架构师错误:", error);
        throw new Error(`视觉克隆失败: ${error?.message || '请检查 GLM_API_KEY 是否正确配置'}`);
    }
};

/**
 * 分析 HTML 模板，推断各区域的字数限制
 * 根据模板结构动态计算合适的字数限制
 */
const analyzeLayoutLimits = (html: string): LayoutLimits => {
    const limits = { ...DEFAULT_LAYOUT_LIMITS };

    // 检测是否为双栏布局（通常字数需要更少）
    const isTwoColumn = html.includes('grid-cols-2') ||
        html.includes('flex') && html.includes('w-1/3') ||
        html.includes('w-2/5') || html.includes('w-3/5');

    if (isTwoColumn) {
        // 双栏布局，减少字数限制
        limits.summary = 150;
        limits.expDescription = 50;
        limits.skillCount = 6;
    }

    // 检测是否有头像（有头像则姓名区域更小）
    const hasPhoto = html.includes('{{photo_src}}') || html.includes('photo');
    if (hasPhoto) {
        limits.fullName = 12;
        limits.title = 20;
    }

    // 检测工作经历区域大小
    const expSectionMatch = html.match(/START_EXPERIENCE_LOOP[\s\S]*?END_EXPERIENCE_LOOP/);
    if (expSectionMatch) {
        const expSection = expSectionMatch[0];
        // 如果工作经历区域使用较小字体，可以容纳更多内容
        if (expSection.includes('text-xs')) {
            limits.expDescription = 80;
        } else if (expSection.includes('text-sm')) {
            limits.expDescription = 60;
        }
    }

    // 检测技能区域
    const skillSection = html.match(/skill/i);
    if (skillSection) {
        // 如果技能使用标签样式
        if (html.includes('rounded-full') || html.includes('badge')) {
            limits.skillName = 10;
            limits.skillCount = 10;
        }
    }

    return limits;
};

/**
 * Stage 1.5: OCR (qwen3-vl-plus via iFlow)
 * 使用 iFlow 平台的 qwen3-vl-plus 从图片中提取文字
 * VL = Vision Language，专门支持图片识别
 * 支持多语言，保持原文不翻译
 */
export const extractTextFromImage = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<string> => {
    if (!GLM_API_KEY) {
        throw new Error('GLM_API_KEY 未配置，无法进行图片识别');
    }

    try {
        const response = await fetch(GLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "qwen3-vl-plus",  // 使用支持视觉的模型
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            },
                            {
                                type: "text",
                                text: `请识别并提取图片中的所有文字内容。

重要要求：
1. 保持原始语言 - 如果是中文就输出中文，如果是英文就输出英文，绝对不要翻译
2. 保持原始格式 - 尽量保留换行和段落结构
3. 完整提取 - 不要遗漏任何文字，不要总结或缩写
4. 纯文本输出 - 只返回识别到的文字内容，不要添加任何解释或说明

请直接输出识别到的文字：`
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('GLM OCR API Error:', response.status, errorData);
            throw new Error(`GLM API 错误: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";

        if (!text) {
            throw new Error('未能从图片中识别到文字');
        }

        return text.trim();
    } catch (error: any) {
        console.error("GLM OCR Error:", error);
        throw new Error(error.message || "图片文字识别失败，请重试。");
    }
};

/**
 * Stage 2: The Strategist (GLM-4.6)
 * 人岗匹配 + 内容优化 + 字数控制
 */
export const extractDataFromText = async (resumeText: string, jdText: string): Promise<ResumeData> => {
    const prompt = `
    你是一位资深HR和简历优化专家。
    
    ## 输入
    1. **候选人简历原文**: 候选人的完整工作经历
    2. **目标岗位 JD**: 正在申请的岗位描述
    
    ## 任务
    根据目标岗位要求，重新组织和优化简历内容。
    
    ## 核心策略
    1. **分析 JD**: 提取 JD 中的核心技能要求和关键词
    2. **筛选经历**: 只保留与岗位相关的工作经历（最多保留 3 段）
    3. **优化描述**: 使用 STAR 法则重写工作描述，突出与 JD 匹配的成果
    4. **关键词植入**: 确保 JD 中的关键技术词汇出现在简历中
    
    ## ⚠️ 严格字数限制（非常重要！）
    为了适应简历模板布局，必须严格遵守以下字数限制：
    
    | 字段 | 最大字符数 | 说明 |
    |------|-----------|------|
    | fullName | 15 | 姓名 |
    | title | 25 | 职位头衔，简短精炼 |
    | summary | 200 | 个人简介，2-3句话 |
    | 每条 description | 60 | 工作描述，每条一行 |
    | 每个 skill | 12 | 技能标签 |
    | company | 20 | 公司名称 |
    | role | 20 | 职位名称 |
    | school | 25 | 学校名称 |
    | degree | 20 | 学位/专业 |
    
    ## 必填字段
    以下字段必须有值，如果原文中没有，请根据上下文合理推断：
    - fullName: 必填，如无法提取则用 "候选人"
    - title: 必填，使用 JD 中的岗位名称或类似职位
    - email: 必填，如无则用 "contact@example.com"
    - phone: 必填，如无则用 "请联系HR"
    - location: 必填，如无则用 "待定"
    - summary: 必填，根据经历和 JD 生成
    - experience: 至少 1 条
    - skills: 至少 3 个
    - education: 至少 1 条
    
    ## 输出格式
    返回严格的 JSON 格式（不要有任何其他文字）：
    
    {
      "fullName": "姓名（最多15字）",
      "title": "职位头衔（最多25字）",
      "contact": {
        "email": "邮箱",
        "phone": "电话",
        "location": "地点",
        "linkedin": "LinkedIn（可选）",
        "website": "网站（可选）"
      },
      "photoUrl": "",
      "summary": "个人简介（最多200字）",
      "experience": [
        {
          "company": "公司名（最多20字）",
          "role": "职位（最多20字）",
          "duration": "时间段",
          "description": ["描述1（最多60字）", "描述2（最多60字）", "描述3（最多60字）"]
        }
      ],
      "skills": ["技能1", "技能2", "技能3"],
      "education": [
        {
          "school": "学校（最多25字）",
          "degree": "学位（最多20字）",
          "year": "年份"
        }
      ]
    }
    
    ## 语言
    输出语言与 JD 保持一致（如果 JD 是中文，输出中文）
    
    ---
    [目标岗位 JD]
    ${jdText.substring(0, 4000)}
    
    [候选人简历原文]
    ${resumeText.substring(0, 12000)}
    `;

    try {
        if (!GLM_API_KEY) {
            throw new Error('GLM_API_KEY 未配置，请在 .env.local 中设置');
        }
        const response = await fetch(GLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4.6",
                messages: [
                    { role: "system", content: "你是简历优化专家，只返回有效的 JSON 格式，不要有任何其他文字。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            throw new Error(`GLM API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";

        let jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();

        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonStr) as ResumeData;

        // 验证和截断数据
        return validateAndTruncateData(parsed);

    } catch (error) {
        console.error("GLM Extraction Error:", error);
        throw new Error("简历内容处理失败，请重试。");
    }
};

/**
 * 字符串截断辅助函数
 */
const truncate = (str: string | undefined, maxLen: number): string => {
    if (!str) return '';
    str = str.trim();
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 1) + '…';
};

/**
 * 验证和截断简历数据
 * 确保所有必填字段都有值，且不超过字数限制
 */
const validateAndTruncateData = (data: ResumeData): ResumeData => {
    return {
        fullName: truncate(data.fullName, 15) || '候选人',
        title: truncate(data.title, 25) || '求职者',
        contact: {
            email: truncate(data.contact?.email, 50) || 'contact@example.com',
            phone: truncate(data.contact?.phone, 20) || '请联系HR',
            location: truncate(data.contact?.location, 20) || '待定',
            linkedin: truncate(data.contact?.linkedin, 50) || '',
            website: truncate(data.contact?.website, 50) || '',
        },
        photoUrl: data.photoUrl || '',
        summary: truncate(data.summary, 200) || '资深专业人士，具备丰富的行业经验。',
        experience: (data.experience || []).slice(0, 3).map(exp => ({
            company: truncate(exp.company, 20) || '公司名称',
            role: truncate(exp.role, 20) || '职位名称',
            duration: truncate(exp.duration, 20) || '工作时间',
            description: (exp.description || []).slice(0, 4).map(d => truncate(d, 60))
        })),
        skills: (data.skills || ['技能1', '技能2', '技能3']).slice(0, 8).map(s => truncate(s, 12)),
        education: (data.education || []).slice(0, 2).map(edu => ({
            school: truncate(edu.school, 25) || '学校名称',
            degree: truncate(edu.degree, 20) || '学位/专业',
            year: truncate(edu.year, 15) || '年份'
        }))
    };
};