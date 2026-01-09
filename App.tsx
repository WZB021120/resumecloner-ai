import React, { useState } from 'react';
import { ProcessingState, GeneratedResult, PageSize, PAGE_SIZES, LayoutLimits, DEFAULT_LAYOUT_LIMITS } from './types';
import StepUpload, { UploadResult } from './components/StepUpload';
import TemplateGallery, { TemplateSelectionResult } from './components/TemplateGallery';
import StepContent from './components/StepContent';
import StepProcessing from './components/StepProcessing';
import EditorLayout from './components/EditorLayout';
import { generateTemplateFromImage, extractDataFromText } from './services/geminiService';
import { useLanguage } from './contexts/LanguageContext';
import { Globe, Sparkles } from 'lucide-react';

const App: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    const [state, setState] = useState<ProcessingState>({
        step: 'upload-style',
        isAnalyzing: false,
        agentStatus: { vision: 'idle', writer: 'idle' }
    });

    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZES.A4);
    const [preExtractedTemplate, setPreExtractedTemplate] = useState<string | null>(null);
    const [layoutLimits, setLayoutLimits] = useState<LayoutLimits>(DEFAULT_LAYOUT_LIMITS);

    // Lifted state for Step 2 Content to preserve it when going Back
    const [resumeText, setResumeText] = useState('');
    const [jdText, setJdText] = useState('');
    const [processingState, setProcessingState] = useState({ resume: false, jd: false });

    // 新增状态：控制是否显示上传组件
    const [showUpload, setShowUpload] = useState(false);

    const [result, setResult] = useState<GeneratedResult | null>(null);

    // 处理模板选择或上传完成
    const handleTemplateSelection = (selectionResult: TemplateSelectionResult | UploadResult) => {
        setPageSize(selectionResult.pageSize);
        setLayoutLimits(selectionResult.layoutLimits);

        if (selectionResult.type === 'image') {
            // 图片上传
            setUploadedImage(selectionResult.base64Image || null);
            setPreExtractedTemplate(null);
        } else {
            // 预设模板、PDF、Word
            setUploadedImage(null);
            setPreExtractedTemplate(selectionResult.htmlTemplate || null);
            if (selectionResult.extractedText) {
                setResumeText(selectionResult.extractedText);
            }
        }

        setState({ ...state, step: 'input-content' });
    };

    const handleContentSubmit = async () => {
        // Reset statuses to working
        setState({
            step: 'processing',
            isAnalyzing: true,
            agentStatus: { vision: 'working', writer: 'working' }
        });

        try {
            // 1. 视觉架构师处理
            // 捕获当前状态值避免闭包问题
            const savedLayoutLimits = layoutLimits;
            const savedPageSize = pageSize;

            let templatePromise: Promise<{ htmlTemplate: string; limits: LayoutLimits; size: PageSize }>;

            if (preExtractedTemplate) {
                // 已有预提取的模板（PDF/Word）
                setState(prev => ({
                    ...prev,
                    agentStatus: { ...prev.agentStatus, vision: 'success' }
                }));
                templatePromise = Promise.resolve({
                    htmlTemplate: preExtractedTemplate,
                    limits: savedLayoutLimits,
                    size: savedPageSize
                });
            } else if (uploadedImage) {
                // 需要 AI 处理图片
                templatePromise = generateTemplateFromImage(uploadedImage)
                    .then(visionResult => {
                        setState(prev => ({
                            ...prev,
                            agentStatus: { ...prev.agentStatus, vision: 'success' }
                        }));
                        return {
                            htmlTemplate: visionResult.htmlTemplate,
                            limits: visionResult.layoutLimits,
                            size: visionResult.pageSize
                        };
                    })
                    .catch(err => {
                        setState(prev => ({
                            ...prev,
                            agentStatus: { ...prev.agentStatus, vision: 'error' }
                        }));
                        throw err;
                    });
            } else {
                throw new Error('没有可处理的模板或图片');
            }

            // 2. Start Writer/Strategist Task (GLM-4.6)
            const dataPromise = extractDataFromText(resumeText, jdText)
                .then(res => {
                    setState(prev => ({
                        ...prev,
                        agentStatus: { ...prev.agentStatus, writer: 'success' }
                    }));
                    return res;
                })
                .catch(err => {
                    setState(prev => ({
                        ...prev,
                        agentStatus: { ...prev.agentStatus, writer: 'error' }
                    }));
                    throw err;
                });

            // Wait for both
            const [visionResult, jsonData] = await Promise.all([templatePromise, dataPromise]);

            // Small delay to let user see the green checks
            await new Promise(r => setTimeout(r, 800));

            // 从 VisionResult 中提取数据
            const { htmlTemplate, limits, size } = visionResult;
            setResult({ htmlTemplate, jsonData, layoutLimits: limits, pageSize: size });
            setState(prev => ({
                ...prev,
                step: 'editor',
                isAnalyzing: false
            }));

        } catch (error) {
            console.error(error);
            // Show error for 2 seconds before resetting
            setTimeout(() => {
                alert(t.processError);
                setState(prev => ({
                    ...prev,
                    step: 'input-content', // Go back to input content on error
                    isAnalyzing: false,
                    agentStatus: { vision: 'idle', writer: 'idle' }
                }));
            }, 1000);
        }
    };

    const handleReset = () => {
        // Complete reset
        setUploadedImage(null);
        setPreExtractedTemplate(null);
        setResult(null);
        setResumeText('');
        setJdText('');
        setLayoutLimits(DEFAULT_LAYOUT_LIMITS);
        setShowUpload(false);
        setState({
            step: 'upload-style',
            isAnalyzing: false,
            agentStatus: { vision: 'idle', writer: 'idle' }
        });
    };

    const handleBack = () => {
        if (state.step === 'input-content') {
            // Go back to Upload Style
            setState(prev => ({ ...prev, step: 'upload-style' }));
            setUploadedImage(null);
            setPreExtractedTemplate(null);
            setShowUpload(false);
        } else if (state.step === 'editor') {
            // Go back to Input Content
            setState(prev => ({ ...prev, step: 'input-content' }));
            // Preserve result, resumeText, and jdText
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    // Render Logic
    if (state.step === 'editor' && result) {
        return (
            <EditorLayout
                htmlTemplate={result.htmlTemplate}
                initialData={result.jsonData}
                onReset={handleReset}
                onBack={handleBack}
            />
        );
    }

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-[#f8fafc]">

            {/* Light Theme Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/60 rounded-full blur-[100px] animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/60 rounded-full blur-[100px] animate-float animation-delay-2000"></div>
            </div>

            {/* Language Toggle */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-gray-200 hover:border-indigo-300 transition-all text-sm font-medium text-gray-600 hover:text-indigo-600 shadow-sm"
                >
                    <Globe className="w-4 h-4" />
                    {language === 'en' ? '中文' : 'English'}
                </button>
            </div>

            <div className="w-full max-w-5xl z-10 relative">
                {/* Header Branding */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-4">
                        <Sparkles className="w-3 h-3" />
                        AI Job Match & Design
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight mb-2">
                        ResumeCloner
                    </h1>
                    <p className="text-gray-500 font-light text-lg tracking-wide">
                        {language === 'en' ? 'Strategic Resume Tailoring & Cloning' : '高端简历 · 视觉复刻 + 智能岗匹'}
                    </p>
                </div>

                {state.step === 'upload-style' && (
                    showUpload ? (
                        <div className="animate-fade-in-up">
                            <button
                                onClick={() => setShowUpload(false)}
                                className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors px-4"
                            >
                                ← 返回模板选择
                            </button>
                            <StepUpload onUploadComplete={handleTemplateSelection} />
                        </div>
                    ) : (
                        <TemplateGallery
                            onTemplateSelect={handleTemplateSelection}
                            onUploadClick={() => setShowUpload(true)}
                        />
                    )
                )}

                {state.step === 'input-content' && (
                    <StepContent
                        resumeText={resumeText}
                        setResumeText={setResumeText}
                        jdText={jdText}
                        setJdText={setJdText}
                        onContentSubmit={handleContentSubmit}
                        onBack={handleBack}
                        processingState={processingState}
                        setProcessingState={setProcessingState}
                    />
                )}

                {state.step === 'processing' && (
                    <StepProcessing
                        visionStatus={state.agentStatus.vision}
                        writerStatus={state.agentStatus.writer}
                    />
                )}
            </div>

            {state.step !== 'editor' && (
                <div className="absolute bottom-6 text-gray-400 text-[10px] font-mono tracking-widest uppercase">
                    Powered by Gemini 3 Pro + GLM-4.6 Intelligence
                </div>
            )}
        </div>
    );
};

export default App;