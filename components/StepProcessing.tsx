import React, { useEffect, useState, useRef } from 'react';
import { ScanFace, PenTool, CheckCircle2, XCircle, BrainCircuit, Sparkles, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { AgentStatus } from '../types';

interface StepProcessingProps {
    visionStatus: AgentStatus;
    writerStatus: AgentStatus;
}

const StepProcessing: React.FC<StepProcessingProps> = ({ visionStatus, writerStatus }) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up w-full py-16 px-4">
            {/* 动态背景装饰 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-200/40 to-indigo-200/40 rounded-full blur-3xl animate-pulse animation-delay-1000" />
            </div>

            {/* 主图标区 */}
            <div className="relative w-32 h-32 mb-10">
                {/* 外圈动画 */}
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-[ping_2s_ease-in-out_infinite]" />
                <div className="absolute inset-2 rounded-full border-4 border-purple-100 animate-[ping_2s_ease-in-out_infinite_0.5s]" />

                {/* 中心图标 */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/40 flex items-center justify-center animate-pulse">
                        <BrainCircuit className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* 装饰小点 */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-amber-400 rounded-full animate-bounce shadow-lg" />
                <div className="absolute bottom-2 left-0 w-3 h-3 bg-pink-400 rounded-full animate-bounce animation-delay-500 shadow-lg" />
            </div>

            {/* 标题 */}
            <h2 className="text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                {t.processingTitle}
            </h2>
            <p className="text-gray-400 text-sm mb-12 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Gemini Vision + GLM-4.6 协同工作中
            </p>

            {/* 进度卡片 */}
            <div className="flex flex-col gap-6 w-full max-w-xl">
                <ProgressCard
                    icon={<ScanFace className="w-6 h-6" />}
                    title={t.visionAgent}
                    status={visionStatus}
                    description={t.visionDesc}
                    messages={t.visionSteps}
                    durationMs={45000}
                    gradient="from-indigo-500 to-blue-600"
                    bgGradient="from-indigo-50 to-blue-50"
                />

                <ProgressCard
                    icon={<PenTool className="w-6 h-6" />}
                    title={t.writerAgent}
                    status={writerStatus}
                    description={t.writerDesc}
                    messages={t.writerSteps}
                    durationMs={25000}
                    gradient="from-purple-500 to-pink-600"
                    bgGradient="from-purple-50 to-pink-50"
                />
            </div>
        </div>
    );
};

interface ProgressCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    status: AgentStatus;
    messages: string[];
    durationMs: number;
    gradient: string;
    bgGradient: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
    icon, title, description, status, messages, durationMs, gradient, bgGradient
}) => {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (status === 'working') {
            const startTime = Date.now();

            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                let nextProgress = (elapsed / durationMs) * 100;
                if (nextProgress > 95) nextProgress = 95;

                setProgress(nextProgress);
                const totalMessages = messages.length;
                const msgIdx = Math.floor((nextProgress / 100) * totalMessages);
                setMessageIndex(Math.min(msgIdx, totalMessages - 1));
            }, 100);
        } else if (status === 'success') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setProgress(100);
        } else if (status === 'error') {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [status, durationMs, messages.length]);

    const currentMessage = status === 'success' ? '✓ 完成' : (status === 'error' ? '✗ 失败' : messages[messageIndex]);

    // 根据状态设置样式
    let containerClass = "bg-white/80 backdrop-blur border-gray-100 shadow-sm";
    let iconBgClass = "bg-gray-100 text-gray-400";

    if (status === 'working') {
        containerClass = "bg-white border-indigo-100 shadow-xl ring-1 ring-indigo-100";
        iconBgClass = `bg-gradient-to-br ${gradient} text-white shadow-lg`;
    } else if (status === 'success') {
        containerClass = `bg-gradient-to-r ${bgGradient} border-green-100 shadow-md`;
        iconBgClass = "bg-green-500 text-white shadow-lg";
    } else if (status === 'error') {
        containerClass = "bg-red-50/80 border-red-100";
        iconBgClass = "bg-red-500 text-white";
    }

    return (
        <div className={`relative p-6 rounded-3xl border transition-all duration-500 ${containerClass}`}>
            {/* 闪光效果 */}
            {status === 'working' && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-shimmer" />
                </div>
            )}

            <div className="flex items-start gap-4 mb-5">
                {/* 图标 */}
                <div className={`p-3 rounded-2xl transition-all duration-300 ${iconBgClass}`}>
                    {status === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                        status === 'error' ? <XCircle className="w-6 h-6" /> : icon}
                </div>

                {/* 标题和描述 */}
                <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{title}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{description}</p>
                </div>

                {/* 状态图标 */}
                {status === 'success' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                        <Sparkles className="w-3 h-3" />
                        完成
                    </div>
                )}
            </div>

            {/* 进度条 */}
            <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                {status === 'working' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                )}
                <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${status === 'success' ? 'bg-green-500' :
                            status === 'error' ? 'bg-red-500' :
                                `bg-gradient-to-r ${gradient}`
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* 状态文字 */}
            <div className="flex justify-between items-center text-sm">
                <span className={`font-medium transition-all ${status === 'working' ? 'text-indigo-600' :
                        status === 'success' ? 'text-green-600' :
                            status === 'error' ? 'text-red-600' :
                                'text-gray-400'
                    }`}>
                    {status === 'idle' ? '等待中...' : currentMessage}
                </span>
                <span className="font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
};

export default StepProcessing;