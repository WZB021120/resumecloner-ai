import React, { useState } from 'react';
import { Sparkles, Upload, Check, Eye } from 'lucide-react';
import { allTemplates, ResumeTemplate } from '../templates';
import { useLanguage } from '../contexts/LanguageContext';
import { PageSize, LayoutLimits, DEFAULT_LAYOUT_LIMITS, PAGE_SIZES } from '../types';

// 上传结果类型（与 StepUpload 保持一致）
export interface TemplateSelectionResult {
    type: 'preset' | 'custom';
    templateId?: string;
    base64Image?: string;
    htmlTemplate: string;
    pageSize: PageSize;
    layoutLimits: LayoutLimits;
    extractedText?: string;
}

interface TemplateGalleryProps {
    onTemplateSelect: (result: TemplateSelectionResult) => void;
    onUploadClick: () => void;
}

// 模板预览卡片组件
const TemplateCard: React.FC<{
    template: ResumeTemplate;
    isSelected: boolean;
    onSelect: () => void;
    onPreview: () => void;
}> = ({ template, isSelected, onSelect, onPreview }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`
        relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
        ${isSelected
                    ? 'ring-4 ring-indigo-500 shadow-xl scale-[1.02]'
                    : 'hover:shadow-lg hover:scale-[1.01]'
                }
      `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onSelect}
        >
            {/* 模板缩略图预览 */}
            <div className="aspect-[210/297] bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                <div
                    className="w-full h-full transform scale-[0.25] origin-top-left"
                    style={{ width: '400%', height: '400%' }}
                >
                    <div
                        dangerouslySetInnerHTML={{ __html: template.htmlTemplate }}
                        className="pointer-events-none"
                    />
                </div>
            </div>

            {/* 选中标记 */}
            {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                </div>
            )}

            {/* 悬停遮罩 */}
            <div className={`
        absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
        transition-opacity duration-300
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        className="w-full flex items-center justify-center gap-2 bg-white/90 hover:bg-white text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        预览模板
                    </button>
                </div>
            </div>

            {/* 模板名称 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
                <h3 className="text-white font-bold text-lg">{template.nameZh}</h3>
                <p className="text-gray-300 text-sm mt-1">{template.descriptionZh}</p>
                <div className="flex gap-2 mt-2">
                    {template.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 模板预览弹窗
const TemplatePreviewModal: React.FC<{
    template: ResumeTemplate | null;
    onClose: () => void;
    onSelect: () => void;
}> = ({ template, onClose, onSelect }) => {
    if (!template) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* 标题栏 */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{template.nameZh}</h2>
                        <p className="text-sm text-gray-500">{template.descriptionZh}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* 预览区域 */}
                <div className="flex-1 overflow-auto p-4 bg-gray-100">
                    <div className="mx-auto shadow-lg">
                        <div dangerouslySetInnerHTML={{ __html: template.htmlTemplate }} />
                    </div>
                </div>

                {/* 操作栏 */}
                <div className="p-4 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={onSelect}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                        使用此模板
                    </button>
                </div>
            </div>
        </div>
    );
};

// 主组件
const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onTemplateSelect, onUploadClick }) => {
    const { t } = useLanguage();
    const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);

    const handleTemplateSelect = (template: ResumeTemplate) => {
        setSelectedTemplate(template);
    };

    const handleConfirmSelection = () => {
        if (selectedTemplate) {
            onTemplateSelect({
                type: 'preset',
                templateId: selectedTemplate.id,
                htmlTemplate: selectedTemplate.htmlTemplate,
                pageSize: selectedTemplate.pageSize,
                layoutLimits: selectedTemplate.layoutLimits
            });
        }
    };

    const handlePreviewSelect = () => {
        if (previewTemplate) {
            setSelectedTemplate(previewTemplate);
            setPreviewTemplate(null);
            onTemplateSelect({
                type: 'preset',
                templateId: previewTemplate.id,
                htmlTemplate: previewTemplate.htmlTemplate,
                pageSize: previewTemplate.pageSize,
                layoutLimits: previewTemplate.layoutLimits
            });
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 animate-fade-in-up">
            {/* 标题 */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 mb-6">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">第一步</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                    选择简历模板
                </h2>
                <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
                    选择一套精心设计的模板，或上传您自己的简历样式
                </p>
            </div>

            {/* 模板网格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {allTemplates.map(template => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplate?.id === template.id}
                        onSelect={() => handleTemplateSelect(template)}
                        onPreview={() => setPreviewTemplate(template)}
                    />
                ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {selectedTemplate && (
                    <button
                        onClick={handleConfirmSelection}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        <Check className="w-5 h-5" />
                        使用「{selectedTemplate.nameZh}」模板
                    </button>
                )}

                <button
                    onClick={onUploadClick}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-xl font-medium transition-all"
                >
                    <Upload className="w-5 h-5" />
                    上传自定义模板
                </button>
            </div>

            {/* 底部提示 */}
            <p className="text-center mt-8 text-xs text-gray-400">
                💡 提示：选择预设模板可立即开始编辑，上传自定义模板需要 AI 解析（约 15-30 秒）
            </p>

            {/* 预览弹窗 */}
            <TemplatePreviewModal
                template={previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                onSelect={handlePreviewSelect}
            />
        </div>
    );
};

export default TemplateGallery;
