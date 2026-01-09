/**
 * 预设简历模板定义
 */

import { LayoutLimits, DEFAULT_LAYOUT_LIMITS, PageSize, PAGE_SIZES } from '../types';

// 模板分类
export type TemplateCategory = 'simple' | 'professional' | 'creative' | 'modern';

// 模板数据结构
export interface ResumeTemplate {
    id: string;
    name: string;
    nameZh: string;
    category: TemplateCategory;
    description: string;
    descriptionZh: string;
    thumbnail: string;  // 缩略图路径或 data URL
    htmlTemplate: string;
    layoutLimits: LayoutLimits;
    pageSize: PageSize;
    tags: string[];
}

// 简约黑白模板
export const minimalTemplate: ResumeTemplate = {
    id: 'minimal-bw',
    name: 'Minimal Black & White',
    nameZh: '简约黑白',
    category: 'simple',
    description: 'Clean and professional, perfect for finance and legal industries',
    descriptionZh: '简洁专业，适合金融、法律等传统行业',
    thumbnail: '',
    tags: ['简约', '传统', '正式'],
    layoutLimits: DEFAULT_LAYOUT_LIMITS,
    pageSize: PAGE_SIZES.A4,
    htmlTemplate: `
<div class="w-[210mm] min-h-[297mm] bg-white p-10 font-sans text-gray-900">
  <!-- 头部 -->
  <header class="border-b-2 border-gray-900 pb-6 mb-8">
    <h1 class="text-4xl font-bold tracking-tight mb-2">{{fullName}}</h1>
    <p class="text-xl text-gray-600 mb-4">{{title}}</p>
    <div class="flex gap-6 text-sm text-gray-600">
      <span class="flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        {{email}}
      </span>
      <span class="flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        {{phone}}
      </span>
      <span class="flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        {{location}}
      </span>
    </div>
  </header>

  <!-- 简介 -->
  <section class="mb-8">
    <h2 class="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-4">个人简介</h2>
    <p class="text-gray-700 leading-relaxed">{{summary}}</p>
  </section>

  <!-- 工作经历 -->
  <section class="mb-8">
    <h2 class="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-4">工作经历</h2>
    <!-- START_EXPERIENCE_LOOP -->
    <div class="mb-6">
      <div class="flex justify-between items-baseline mb-1">
        <h3 class="font-bold text-gray-900">{{exp_role}}</h3>
        <span class="text-sm text-gray-500">{{exp_duration}}</span>
      </div>
      <p class="text-gray-600 italic mb-2">{{exp_company}}</p>
      <div class="text-sm text-gray-700 leading-relaxed">{{exp_description}}</div>
    </div>
    <!-- END_EXPERIENCE_LOOP -->
  </section>

  <!-- 教育背景 -->
  <section class="mb-8">
    <h2 class="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-4">教育背景</h2>
    <!-- START_EDUCATION_LOOP -->
    <div class="mb-3">
      <div class="flex justify-between items-baseline">
        <h3 class="font-bold">{{edu_school}}</h3>
        <span class="text-sm text-gray-500">{{edu_year}}</span>
      </div>
      <p class="text-gray-600">{{edu_degree}}</p>
    </div>
    <!-- END_EDUCATION_LOOP -->
  </section>

  <!-- 技能 -->
  <section>
    <h2 class="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-4">专业技能</h2>
    <div class="flex flex-wrap gap-2">{{skill_tags}}</div>
  </section>
</div>
  `.trim()
};

// 专业双栏模板
export const professionalTemplate: ResumeTemplate = {
    id: 'professional-two-col',
    name: 'Professional Two Column',
    nameZh: '专业双栏',
    category: 'professional',
    description: 'Classic two-column layout for IT and consulting professionals',
    descriptionZh: '经典双栏布局，适合IT、咨询等专业人士',
    thumbnail: '',
    tags: ['双栏', '专业', '通用'],
    layoutLimits: DEFAULT_LAYOUT_LIMITS,
    pageSize: PAGE_SIZES.A4,
    htmlTemplate: `
<div class="w-[210mm] min-h-[297mm] bg-white flex font-sans">
  <!-- 左侧边栏 -->
  <aside class="w-1/3 bg-slate-800 text-white p-8">
    <!-- 头像区域 -->
    <div class="text-center mb-8">
      <div class="w-32 h-32 mx-auto rounded-full bg-slate-600 flex items-center justify-center mb-4 overflow-hidden">
        <img src="{{photo_src}}" class="w-full h-full object-cover" onerror="this.style.display='none'" />
      </div>
      <h1 class="text-2xl font-bold">{{fullName}}</h1>
      <p class="text-slate-300 mt-1">{{title}}</p>
    </div>

    <!-- 联系方式 -->
    <div class="mb-8">
      <h2 class="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-600 pb-2 mb-4">联系方式</h2>
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <span>{{email}}</span>
        </div>
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          <span>{{phone}}</span>
        </div>
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
          <span>{{location}}</span>
        </div>
      </div>
    </div>

    <!-- 技能 -->
    <div class="mb-8">
      <h2 class="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-600 pb-2 mb-4">专业技能</h2>
      <div class="flex flex-wrap gap-2">{{skill_tags}}</div>
    </div>

    <!-- 教育 -->
    <div>
      <h2 class="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-600 pb-2 mb-4">教育背景</h2>
      <!-- START_EDUCATION_LOOP -->
      <div class="mb-4">
        <h3 class="font-semibold text-white">{{edu_school}}</h3>
        <p class="text-sm text-slate-300">{{edu_degree}}</p>
        <p class="text-xs text-slate-400">{{edu_year}}</p>
      </div>
      <!-- END_EDUCATION_LOOP -->
    </div>
  </aside>

  <!-- 右侧主内容 -->
  <main class="w-2/3 p-8">
    <!-- 简介 -->
    <section class="mb-8">
      <h2 class="text-xl font-bold text-slate-800 border-b-2 border-blue-500 pb-2 mb-4">个人简介</h2>
      <p class="text-gray-600 leading-relaxed">{{summary}}</p>
    </section>

    <!-- 工作经历 -->
    <section>
      <h2 class="text-xl font-bold text-slate-800 border-b-2 border-blue-500 pb-2 mb-4">工作经历</h2>
      <!-- START_EXPERIENCE_LOOP -->
      <div class="mb-6">
        <div class="flex justify-between items-start mb-1">
          <div>
            <h3 class="font-bold text-slate-800">{{exp_role}}</h3>
            <p class="text-blue-600">{{exp_company}}</p>
          </div>
          <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{{exp_duration}}</span>
        </div>
        <div class="text-sm text-gray-600 leading-relaxed mt-2">{{exp_description}}</div>
      </div>
      <!-- END_EXPERIENCE_LOOP -->
    </section>
  </main>
</div>
  `.trim()
};

// 创意配色模板
export const creativeTemplate: ResumeTemplate = {
    id: 'creative-colorful',
    name: 'Creative Colorful',
    nameZh: '创意配色',
    category: 'creative',
    description: 'Vibrant and eye-catching design for creative professionals',
    descriptionZh: '活力配色，适合设计师、市场营销等创意岗位',
    thumbnail: '',
    tags: ['创意', '活力', '设计'],
    layoutLimits: DEFAULT_LAYOUT_LIMITS,
    pageSize: PAGE_SIZES.A4,
    htmlTemplate: `
<div class="w-[210mm] min-h-[297mm] bg-gradient-to-br from-violet-50 to-pink-50 p-8 font-sans">
  <!-- 头部 -->
  <header class="bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
    <h1 class="text-4xl font-bold mb-2">{{fullName}}</h1>
    <p class="text-xl text-violet-100 mb-4">{{title}}</p>
    <div class="flex flex-wrap gap-4 text-sm">
      <span class="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
        {{email}}
      </span>
      <span class="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
        {{phone}}
      </span>
      <span class="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
        {{location}}
      </span>
    </div>
  </header>

  <!-- 简介 -->
  <section class="bg-white rounded-xl p-6 shadow-md mb-6">
    <h2 class="text-lg font-bold text-violet-600 mb-3 flex items-center gap-2">
      <span class="w-2 h-2 bg-violet-600 rounded-full"></span>
      个人简介
    </h2>
    <p class="text-gray-600 leading-relaxed">{{summary}}</p>
  </section>

  <!-- 工作经历 -->
  <section class="bg-white rounded-xl p-6 shadow-md mb-6">
    <h2 class="text-lg font-bold text-pink-500 mb-4 flex items-center gap-2">
      <span class="w-2 h-2 bg-pink-500 rounded-full"></span>
      工作经历
    </h2>
    <!-- START_EXPERIENCE_LOOP -->
    <div class="mb-5 pl-4 border-l-2 border-pink-200">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-gray-800">{{exp_role}}</h3>
          <p class="text-pink-500">{{exp_company}}</p>
        </div>
        <span class="text-xs text-gray-500 bg-pink-50 px-3 py-1 rounded-full">{{exp_duration}}</span>
      </div>
      <div class="text-sm text-gray-600 mt-2">{{exp_description}}</div>
    </div>
    <!-- END_EXPERIENCE_LOOP -->
  </section>

  <div class="grid grid-cols-2 gap-6">
    <!-- 教育 -->
    <section class="bg-white rounded-xl p-6 shadow-md">
      <h2 class="text-lg font-bold text-violet-600 mb-3 flex items-center gap-2">
        <span class="w-2 h-2 bg-violet-600 rounded-full"></span>
        教育背景
      </h2>
      <!-- START_EDUCATION_LOOP -->
      <div class="mb-3">
        <h3 class="font-semibold text-gray-800">{{edu_school}}</h3>
        <p class="text-sm text-gray-500">{{edu_degree}} · {{edu_year}}</p>
      </div>
      <!-- END_EDUCATION_LOOP -->
    </section>

    <!-- 技能 -->
    <section class="bg-white rounded-xl p-6 shadow-md">
      <h2 class="text-lg font-bold text-pink-500 mb-3 flex items-center gap-2">
        <span class="w-2 h-2 bg-pink-500 rounded-full"></span>
        专业技能
      </h2>
      <div class="flex flex-wrap gap-2">{{skill_tags}}</div>
    </section>
  </div>
</div>
  `.trim()
};

// 现代清新模板
export const modernTemplate: ResumeTemplate = {
    id: 'modern-fresh',
    name: 'Modern Fresh',
    nameZh: '现代清新',
    category: 'modern',
    description: 'Clean and modern design for tech and startup professionals',
    descriptionZh: '清新现代风格，适合互联网、初创公司',
    thumbnail: '',
    tags: ['现代', '清新', '科技'],
    layoutLimits: DEFAULT_LAYOUT_LIMITS,
    pageSize: PAGE_SIZES.A4,
    htmlTemplate: `
<div class="w-[210mm] min-h-[297mm] bg-white p-10 font-sans">
  <!-- 头部 -->
  <header class="mb-10">
    <div class="flex items-center gap-6 mb-6">
      <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
        <img src="{{photo_src}}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='{{fullName}}'.charAt(0)" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{fullName}}</h1>
        <p class="text-lg text-emerald-600 font-medium">{{title}}</p>
      </div>
    </div>
    <div class="flex gap-6 text-sm text-gray-600">
      <span class="flex items-center gap-2 hover:text-emerald-600 transition-colors">
        <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </div>
        {{email}}
      </span>
      <span class="flex items-center gap-2">
        <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        </div>
        {{phone}}
      </span>
      <span class="flex items-center gap-2">
        <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
        </div>
        {{location}}
      </span>
    </div>
  </header>

  <!-- 简介 -->
  <section class="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl">
    <p class="text-gray-700 leading-relaxed">{{summary}}</p>
  </section>

  <!-- 工作经历 -->
  <section class="mb-8">
    <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
      <span class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      </span>
      工作经历
    </h2>
    <!-- START_EXPERIENCE_LOOP -->
    <div class="mb-6 ml-5 pl-8 border-l-2 border-emerald-200 relative">
      <div class="absolute -left-[9px] top-0 w-4 h-4 bg-emerald-500 rounded-full"></div>
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="font-bold text-gray-800">{{exp_role}}</h3>
          <p class="text-emerald-600">{{exp_company}}</p>
        </div>
        <span class="text-sm text-gray-500">{{exp_duration}}</span>
      </div>
      <div class="text-sm text-gray-600">{{exp_description}}</div>
    </div>
    <!-- END_EXPERIENCE_LOOP -->
  </section>

  <div class="grid grid-cols-2 gap-8">
    <!-- 教育 -->
    <section>
      <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
        <span class="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
        </span>
        教育背景
      </h2>
      <!-- START_EDUCATION_LOOP -->
      <div class="mb-4 p-4 bg-gray-50 rounded-xl">
        <h3 class="font-bold text-gray-800">{{edu_school}}</h3>
        <p class="text-sm text-gray-600">{{edu_degree}}</p>
        <p class="text-xs text-gray-400">{{edu_year}}</p>
      </div>
      <!-- END_EDUCATION_LOOP -->
    </section>

    <!-- 技能 -->
    <section>
      <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
        <span class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        </span>
        专业技能
      </h2>
      <div class="flex flex-wrap gap-2">{{skill_tags}}</div>
    </section>
  </div>
</div>
  `.trim()
};

// 导出所有模板
export const allTemplates: ResumeTemplate[] = [
    minimalTemplate,
    professionalTemplate,
    creativeTemplate,
    modernTemplate
];

// 根据 ID 获取模板
export const getTemplateById = (id: string): ResumeTemplate | undefined => {
    return allTemplates.find(t => t.id === id);
};
