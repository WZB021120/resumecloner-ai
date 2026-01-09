import { ResumeData } from "../types";

/**
 * 简历模板引擎
 * 将 Gemini 生成的 HTML 模板与提取的 JSON 数据合并
 */
export const renderTemplate = (htmlTemplate: string, data: ResumeData): string => {
  if (!htmlTemplate || !data) {
    console.error('模板引擎: 缺少模板或数据');
    return '<div class="p-8 text-center text-gray-500">简历预览加载中...</div>';
  }

  let html = htmlTemplate;

  // 1. 简单字段替换
  const simpleReplacements: Record<string, string> = {
    '{{fullName}}': escapeHtml(data.fullName || '您的姓名'),
    '{{title}}': escapeHtml(data.title || '职位头衔'),
    '{{email}}': escapeHtml(data.contact?.email || ''),
    '{{phone}}': escapeHtml(data.contact?.phone || ''),
    '{{location}}': escapeHtml(data.contact?.location || ''),
    '{{summary}}': escapeHtml(data.summary || ''),
    '{{linkedin}}': escapeHtml(data.contact?.linkedin || ''),
    '{{website}}': escapeHtml(data.contact?.website || ''),
    '{{photo_src}}': data.photoUrl || 'https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=e5e7eb',
  };

  // 执行简单替换
  Object.entries(simpleReplacements).forEach(([placeholder, value]) => {
    html = html.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
  });

  // 2. 处理工作经历循环
  html = processExperienceLoop(html, data.experience || []);

  // 3. 处理教育背景循环
  html = processEducationLoop(html, data.education || []);

  // 4. 处理技能标签
  html = processSkillTags(html, data.skills || []);

  // 5. 清理未使用的占位符
  html = cleanupUnusedPlaceholders(html);

  return html;
};

/**
 * 处理工作经历循环
 */
const processExperienceLoop = (html: string, experiences: ResumeData['experience']): string => {
  // 支持多种注释格式
  const patterns = [
    /<!--\s*START_EXPERIENCE_LOOP\s*-->([\s\S]*?)<!--\s*END_EXPERIENCE_LOOP\s*-->/gi,
    /<!--\s*EXPERIENCE_LOOP_START\s*-->([\s\S]*?)<!--\s*EXPERIENCE_LOOP_END\s*-->/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[0]) {
      const fullMatch = match[0];
      const templateMatch = fullMatch.match(/-->([\s\S]*?)<!--/);

      if (templateMatch && templateMatch[1]) {
        const template = templateMatch[1];

        const renderedExperiences = experiences.map(job => {
          let block = template;

          // 替换工作经历字段
          block = block.replace(/{{exp_company}}/g, escapeHtml(job.company || ''));
          block = block.replace(/{{exp_role}}/g, escapeHtml(job.role || ''));
          block = block.replace(/{{exp_duration}}/g, escapeHtml(job.duration || ''));

          // 处理工作描述
          const descriptions = Array.isArray(job.description) ? job.description : [job.description || ''];
          const descHtml = descriptions.length > 0
            ? `<ul class="list-disc pl-5 space-y-1 text-sm text-gray-600">${descriptions.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
            : '';
          block = block.replace(/{{exp_description}}/g, descHtml);

          return block;
        }).join('');

        html = html.replace(pattern, renderedExperiences);
      }
    }
  }

  // 如果没有找到循环标记，尝试直接替换单个经历占位符
  if (experiences.length > 0 && html.includes('{{exp_')) {
    const job = experiences[0];
    html = html.replace(/{{exp_company}}/g, escapeHtml(job.company || ''));
    html = html.replace(/{{exp_role}}/g, escapeHtml(job.role || ''));
    html = html.replace(/{{exp_duration}}/g, escapeHtml(job.duration || ''));

    const descriptions = Array.isArray(job.description) ? job.description : [job.description || ''];
    const descHtml = `<ul class="list-disc pl-5 space-y-1">${descriptions.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`;
    html = html.replace(/{{exp_description}}/g, descHtml);
  }

  return html;
};

/**
 * 处理教育背景循环
 */
const processEducationLoop = (html: string, educations: ResumeData['education']): string => {
  const patterns = [
    /<!--\s*START_EDUCATION_LOOP\s*-->([\s\S]*?)<!--\s*END_EDUCATION_LOOP\s*-->/gi,
    /<!--\s*EDUCATION_LOOP_START\s*-->([\s\S]*?)<!--\s*EDUCATION_LOOP_END\s*-->/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[0]) {
      const fullMatch = match[0];
      const templateMatch = fullMatch.match(/-->([\s\S]*?)<!--/);

      if (templateMatch && templateMatch[1]) {
        const template = templateMatch[1];

        const renderedEducation = educations.map(edu => {
          let block = template;
          block = block.replace(/{{edu_school}}/g, escapeHtml(edu.school || ''));
          block = block.replace(/{{edu_degree}}/g, escapeHtml(edu.degree || ''));
          block = block.replace(/{{edu_year}}/g, escapeHtml(edu.year || ''));
          return block;
        }).join('');

        html = html.replace(pattern, renderedEducation);
      }
    }
  }

  // 如果没有找到循环标记，尝试直接替换
  if (educations.length > 0 && html.includes('{{edu_')) {
    const edu = educations[0];
    html = html.replace(/{{edu_school}}/g, escapeHtml(edu.school || ''));
    html = html.replace(/{{edu_degree}}/g, escapeHtml(edu.degree || ''));
    html = html.replace(/{{edu_year}}/g, escapeHtml(edu.year || ''));
  }

  return html;
};

/**
 * 处理技能标签
 */
const processSkillTags = (html: string, skills: string[]): string => {
  if (html.includes('{{skill_tags}}')) {
    const skillBadges = skills.map(skill =>
      `<span class="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full mr-2 mb-2">${escapeHtml(skill)}</span>`
    ).join('');
    html = html.replace(/{{skill_tags}}/g, skillBadges);
  }

  // 也支持 {{skills}} 格式
  if (html.includes('{{skills}}')) {
    const skillBadges = skills.map(skill =>
      `<span class="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full mr-2 mb-2">${escapeHtml(skill)}</span>`
    ).join('');
    html = html.replace(/{{skills}}/g, skillBadges);
  }

  return html;
};

/**
 * 清理未使用的占位符
 */
const cleanupUnusedPlaceholders = (html: string): string => {
  // 移除所有剩余的 {{xxx}} 占位符
  html = html.replace(/{{[\w_]+}}/g, '');

  // 移除剩余的循环注释
  html = html.replace(/<!--\s*(START|END)_(EXPERIENCE|EDUCATION)_LOOP\s*-->/gi, '');
  html = html.replace(/<!--\s*(EXPERIENCE|EDUCATION)_LOOP_(START|END)\s*-->/gi, '');

  return html;
};

/**
 * HTML 转义
 */
const escapeHtml = (text: string): string => {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
};

/**
 * 正则表达式转义
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};