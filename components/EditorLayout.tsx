import React, { useState, useEffect, PropsWithChildren } from 'react';
import { Printer, Edit2, Eye, ChevronLeft, Globe, Download, RotateCcw, User, Briefcase, GraduationCap, Sparkles, Plus, Trash2, Save } from 'lucide-react';
import { ResumeData } from '../types';
import { renderTemplate } from '../utils/templateEngine';
import { useLanguage } from '../contexts/LanguageContext';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
}

const Section: React.FC<PropsWithChildren<SectionProps>> = ({ title, icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      {icon && <span className="text-indigo-500">{icon}</span>}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
    </div>
    {children}
  </div>
);

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const Input: React.FC<InputProps> = ({ label, value, onChange, placeholder }) => (
  <div className="mb-3 group">
    <label className="text-[10px] text-gray-500 block mb-1.5 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors font-medium">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
    />
  </div>
);

interface EditorLayoutProps {
  htmlTemplate: string;
  initialData: ResumeData;
  onReset: () => void;
  onBack: () => void;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ htmlTemplate, initialData, onReset, onBack }) => {
  const { t, language, setLanguage } = useLanguage();
  const [data, setData] = useState<ResumeData>(initialData);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const html = renderTemplate(htmlTemplate, data);
    setRenderedHtml(html);
  }, [htmlTemplate, data]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${data.fullName} - Resume</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { margin: 0; }
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${renderedHtml}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 1000);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadHtml = () => {
    const element = document.createElement("a");
    const file = new Blob([
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.fullName} Resume</title><script src="https://cdn.tailwindcss.com"></script></head><body>${renderedHtml}</body></html>`
    ], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${data.fullName.replace(/\s+/g, '_')}_resume.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // 导出为 Markdown 格式
  const handleDownloadMarkdown = () => {
    const md = `# ${data.fullName}

## ${data.title}

📧 ${data.contact.email} | 📱 ${data.contact.phone} | 📍 ${data.contact.location}
${data.contact.linkedin ? `🔗 ${data.contact.linkedin}` : ''}

---

## 个人简介
${data.summary}

---

## 工作经历
${data.experience.map(exp => `
### ${exp.role} @ ${exp.company}
*${exp.duration}*

${exp.description.map(d => `- ${d}`).join('\n')}
`).join('\n')}

---

## 教育背景
${data.education.map(edu => `
### ${edu.school}
${edu.degree} | ${edu.year}
`).join('\n')}

---

## 技能
${data.skills.join(' • ')}
`;

    const element = document.createElement("a");
    const file = new Blob([md], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${data.fullName.replace(/\s+/g, '_')}_resume.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // 导出为 JSON 格式
  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${data.fullName.replace(/\s+/g, '_')}_resume.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // 导出为纯文本格式
  const handleDownloadText = () => {
    const txt = `${data.fullName}
${data.title}

联系方式：${data.contact.email} | ${data.contact.phone} | ${data.contact.location}

个人简介：
${data.summary}

工作经历：
${data.experience.map(exp => `
${exp.role} - ${exp.company} (${exp.duration})
${exp.description.map(d => `  • ${d}`).join('\n')}
`).join('\n')}

教育背景：
${data.education.map(edu => `${edu.school} - ${edu.degree} (${edu.year})`).join('\n')}

技能：
${data.skills.join(', ')}
`;

    const element = document.createElement("a");
    const file = new Blob([txt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${data.fullName.replace(/\s+/g, '_')}_resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // 导出格式列表
  const [showExportMenu, setShowExportMenu] = useState(false);

  const updateField = (path: string, value: any) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // 深拷贝
      const keys = path.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: [''] }]
    }));
  };

  const removeExperience = (index: number) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', year: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    const newSkill = prompt('请输入新技能:');
    if (newSkill) {
      setData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
    }
  };

  const removeSkill = (index: number) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const sectionTabs = [
    { id: 'personal', label: '基本信息', icon: <User className="w-4 h-4" /> },
    { id: 'experience', label: '工作经历', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'education', label: '教育背景', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'skills', label: '技能标签', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800 overflow-hidden font-sans">
      {/* 顶部导航 */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 rounded-xl hover:bg-indigo-50">
            <ChevronLeft className="w-4 h-4" /> {t.backToEdit}
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <button onClick={onReset} className="text-gray-400 hover:text-red-500 flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <RotateCcw className="w-4 h-4" /> {t.startOver}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isMobile && (
            <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
              <button onClick={() => setActiveTab('editor')} className={`p-2 rounded-lg ${activeTab === 'editor' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveTab('preview')} className={`p-2 rounded-lg ${activeTab === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>
                <Eye className="w-4 h-4" />
              </button>
            </div>
          )}

          <button onClick={toggleLanguage} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors">
            <Globe className="w-5 h-5" />
          </button>

          {/* 导出下拉菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">导出</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <button
                  onClick={() => { handleDownloadHtml(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3"
                >
                  <span className="w-6 text-center">🌐</span> HTML 网页
                </button>
                <button
                  onClick={() => { handleDownloadMarkdown(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3"
                >
                  <span className="w-6 text-center">📝</span> Markdown
                </button>
                <button
                  onClick={() => { handleDownloadJson(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3"
                >
                  <span className="w-6 text-center">📊</span> JSON 数据
                </button>
                <button
                  onClick={() => { handleDownloadText(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3"
                >
                  <span className="w-6 text-center">📄</span> 纯文本
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { handlePrint(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3"
                >
                  <span className="w-6 text-center">📑</span> 打印/PDF
                </button>
              </div>
            )}
          </div>

          <button onClick={handlePrint} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t.printPdf}</span>
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* 左侧编辑面板 */}
        <div className={`w-full lg:w-[420px] border-r border-gray-200 bg-white overflow-hidden flex flex-col ${isMobile && activeTab !== 'editor' ? 'hidden' : 'block'}`}>

          {/* 分类标签页 */}
          <div className="flex border-b border-gray-100 px-4 pt-4 gap-1 overflow-x-auto shrink-0">
            {sectionTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all whitespace-nowrap ${activeSection === tab.id
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* 编辑内容区 */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* 基本信息 */}
            {activeSection === 'personal' && (
              <div className="space-y-1">
                <Input label={t.fullName} value={data.fullName} onChange={(v) => updateField('fullName', v)} />
                <Input label={t.title} value={data.title} onChange={(v) => updateField('title', v)} />
                <Input label="头像URL" value={data.photoUrl || ''} onChange={(v) => updateField('photoUrl', v)} placeholder="https://..." />
                <div className="grid grid-cols-2 gap-3">
                  <Input label={t.email} value={data.contact.email} onChange={(v) => updateField('contact.email', v)} />
                  <Input label={t.phone} value={data.contact.phone} onChange={(v) => updateField('contact.phone', v)} />
                </div>
                <Input label={t.location} value={data.contact.location} onChange={(v) => updateField('contact.location', v)} />

                <div className="mt-6">
                  <label className="text-[10px] text-gray-500 block mb-1.5 uppercase tracking-wide font-medium">{t.summary}</label>
                  <textarea
                    value={data.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* 工作经历 */}
            {activeSection === 'experience' && (
              <div className="space-y-4">
                {data.experience.map((job, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-5 rounded-2xl border border-gray-100 relative group">
                    <button
                      onClick={() => removeExperience(idx)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-semibold text-indigo-500 mb-3">经历 #{idx + 1}</div>
                    <Input label={t.company} value={job.company} onChange={(v) => {
                      const newExp = [...data.experience];
                      newExp[idx].company = v;
                      setData({ ...data, experience: newExp });
                    }} />
                    <Input label={t.role} value={job.role} onChange={(v) => {
                      const newExp = [...data.experience];
                      newExp[idx].role = v;
                      setData({ ...data, experience: newExp });
                    }} />
                    <Input label={t.duration} value={job.duration} onChange={(v) => {
                      const newExp = [...data.experience];
                      newExp[idx].duration = v;
                      setData({ ...data, experience: newExp });
                    }} />
                    <div className="mt-3">
                      <label className="text-[10px] text-gray-500 block mb-1.5 uppercase tracking-wide font-medium">工作描述</label>
                      <textarea
                        value={Array.isArray(job.description) ? job.description.join('\n') : job.description}
                        onChange={(e) => {
                          const newExp = [...data.experience];
                          newExp[idx].description = e.target.value.split('\n').filter(Boolean);
                          setData({ ...data, experience: newExp });
                        }}
                        placeholder="每行一条工作成果..."
                        className="w-full h-24 bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addExperience}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  添加工作经历
                </button>
              </div>
            )}

            {/* 教育背景 */}
            {activeSection === 'education' && (
              <div className="space-y-4">
                {data.education.map((edu, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-purple-50/30 p-5 rounded-2xl border border-gray-100 relative group">
                    <button
                      onClick={() => removeEducation(idx)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-semibold text-purple-500 mb-3">学历 #{idx + 1}</div>
                    <Input label="学校" value={edu.school} onChange={(v) => {
                      const newEdu = [...data.education];
                      newEdu[idx].school = v;
                      setData({ ...data, education: newEdu });
                    }} />
                    <Input label="学位/专业" value={edu.degree} onChange={(v) => {
                      const newEdu = [...data.education];
                      newEdu[idx].degree = v;
                      setData({ ...data, education: newEdu });
                    }} />
                    <Input label="毕业年份" value={edu.year} onChange={(v) => {
                      const newEdu = [...data.education];
                      newEdu[idx].year = v;
                      setData({ ...data, education: newEdu });
                    }} />
                  </div>
                ))}

                <button
                  onClick={addEducation}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-purple-600 hover:border-purple-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  添加教育经历
                </button>
              </div>
            )}

            {/* 技能标签 */}
            {activeSection === 'skills' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, idx) => (
                    <div key={idx} className="group flex items-center gap-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                      {skill}
                      <button
                        onClick={() => removeSkill(idx)}
                        className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addSkill}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  添加技能
                </button>
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[10px] text-gray-400 text-center">{t.aiDisclaimer}</p>
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className={`flex-1 bg-gradient-to-br from-gray-100 to-gray-200 overflow-y-auto flex justify-center p-8 lg:p-12 ${isMobile && activeTab !== 'preview' ? 'hidden' : 'block'}`}>
          <div className="relative">
            {/* 纸张阴影 */}
            <div className="absolute top-4 left-4 w-full h-full bg-gray-900/10 blur-xl rounded-lg pointer-events-none" />

            {/* A4 纸张 */}
            <div
              className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl origin-top transition-transform duration-200 rounded-lg overflow-hidden relative z-10 ring-1 ring-gray-900/5"
              style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}
            >
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;