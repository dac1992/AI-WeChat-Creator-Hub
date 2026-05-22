import React, { useState } from "react";
import { ArticleDraft, ReviewFinding, ReviewResult } from "../types";
import { ShieldCheck, AlertTriangle, Sparkles, Wand2, ArrowRight, Loader2, Gauge } from "lucide-react";
import { apiFetch } from "../lib/api";

interface ReviewIntelligenceProps {
  draft: ArticleDraft;
  selectedAIModel: string;
  onUpdateDraftPatch: (patch: Partial<ArticleDraft>) => void;
}

export default function ReviewIntelligence({ draft, selectedAIModel, onUpdateDraftPatch }: ReviewIntelligenceProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const [quotaWarning, setQuotaWarning] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const runAICheck = async () => {
    if (!draft.content) return;
    setLoading(true);
    setResult(null);
    setErrorMessage("");
    try {
      const resp = await apiFetch("/api/article/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.content, selectedAIModel }),
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        setErrorMessage(errJson.error || "大模型进行微信AI味体检评审请求被拒绝。");
        return;
      }
      const data = await resp.json();
      if (data.success) {
        setResult(data.data);
        if (data.quotaExceeded) {
          setQuotaWarning(data.quotaReason || "检测到 API 请求限流，系统已为您无缝切换至高匹配度自媒体纠错知识图谱！");
        } else {
          setQuotaWarning("");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "请求体检服务超时或发生网络通讯错误。");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReplacement = (original: string, alternate: string, idx: number) => {
    setApplyingIdx(idx);
    setTimeout(() => {
      const updatedStr = draft.content.replace(original, alternate);
      onUpdateDraftPatch({ content: updatedStr });
      
      // Update local findings state to reflect fixed status
      if (result) {
        const nextFindings = result.findings.filter((_, fIdx) => fIdx !== idx);
        const nextScore = Math.max(0, result.aiScore - 15);
        setResult({
          ...result,
          aiScore: nextScore,
          findings: nextFindings,
        });
      }
      setApplyingIdx(null);
    }, 400);
  };

  return (
    <div id="review-intelligence-wrapper" className="flex flex-col gap-4 w-full">
      {quotaWarning && (
        <div id="review-quota-warning-banner" className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2.5 shadow-xs animate-fade-in text-left">
          <span className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 font-bold shrink-0">⚠️ 引擎运行提示</span>
          <span className="leading-relaxed font-semibold">{quotaWarning}</span>
        </div>
      )}

      <div id="review-intelligence-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Score Gauge / Status */}
      <div className="lg:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs text-left flex flex-col justify-between h-[450px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">评审智能体介入区</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">微信官方“去AI味”深度体检</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            微信读者对经典的AI腔调（连接句过多、大词堆砌、无病呻吟）极具免疫力和反感。审查智能体将深度扫描敏感词汇，重新注入充满生活烟火气的活体人格。
          </p>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs mb-4 leading-relaxed font-bold animate-fade-in text-left">
              ❌ {errorMessage}
            </div>
          )}

          {/* Meter Graph Visualization */}
          {result ? (
            <div className="flex flex-col items-center py-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400">当前文章 AI 水平得分</span>
              <div className="relative flex items-center justify-center mt-2">
                <span className={`text-4xl font-extrabold font-mono ${
                  result.aiScore > 50 ? "text-rose-500 animate-pulse" : "text-emerald-600"
                }`}>
                  {result.aiScore}
                </span>
                <span className="text-slate-400 text-xs ml-1 font-mono">/ 100 分</span>
              </div>
              
              {/* Score Level badge */}
              <div className="mt-3">
                {result.aiScore > 50 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> AI腔调偏重 (建议降噪)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> 纯天然极具人情味
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              尚未体检。点击下方按钮开始深度检测。
            </div>
          )}
        </div>

        <button
          onClick={runAICheck}
          disabled={loading || !draft.content}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              正在检查微信AI味因子...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              立即进行文字脱糖体检
            </>
          )}
        </button>
      </div>

      {/* Right: Detailed report and replacements checklist */}
      <div className="lg:col-span-8 bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs flex flex-col h-[450px]">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4">
          📑 体检报告详情与一键人类化建议
        </h4>

        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
              <p className="text-xs">
                AI 审查官正在逐句研磨对比自媒体常用大词，寻找“无可厚非”、“数字大浪潮中”等经典重灾区句式...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4 text-left">
              {/* Verdict banner */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-lg text-[12px] text-indigo-950 leading-relaxed">
                <span className="font-bold text-indigo-900 block mb-1">📝 智能体诊断总评：</span>
                {result.verdict}
              </div>

              {/* Findings list */}
              {result.findings.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-[#A0AEC0] block">发现的AI空洞句子（点击一键修改）</span>
                  {result.findings.map((item, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl border border-slate-150 bg-white hover:border-violet-350 transition-all flex flex-col gap-2 relative group"
                    >
                      {/* Original Sentence red line */}
                      <div className="text-[12px] bg-rose-50/30 border-l-4 border-rose-500 p-2 text-rose-950">
                        <span className="font-bold text-[10px] text-rose-500 block uppercase mb-0.5">【原文里的AI腔】</span>
                        “{item.original}”
                      </div>

                      <div className="text-[11px] text-slate-500 italic max-w-[90%]">
                        💡 {item.clicheDesc}
                      </div>

                      {/* Alternate with Trigger button */}
                      <div className="mt-2 flex items-start justify-between gap-4 bg-emerald-50/30 border-l-4 border-emerald-500 p-2 text-emerald-950 rounded-r-lg">
                        <div className="flex-1 text-[12px]">
                          <span className="font-bold text-[10px] text-emerald-600 block uppercase mb-0.5">【人类大白话替换方案】</span>
                          “{item.improved}”
                        </div>
                        <button
                          onClick={() => handleApplyReplacement(item.original, item.improved, index)}
                          disabled={applyingIdx !== null}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {applyingIdx === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3" />
                          )}
                          一键替换
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center gap-1.5">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 stroke-1" />
                  <p className="text-xs font-bold text-emerald-700">太棒了！本篇文章没有检测到明显的套路AI味！</p>
                  <p className="text-[11px] max-w-sm">
                    读者阅读时会享受到顺畅自然的呼吸感，可以放心去进行下方的配图与格式导出。
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-450 text-center gap-2">
              <ShieldCheck className="w-12 h-12 stroke-1 text-slate-350" />
              <p className="text-xs">智能纠错库随时待命。</p>
              <p className="text-[11px] max-w-xs text-slate-400">
                本系统会将文章正文提交给 AI 审查智能体，深度匹配上千个AI经典雷区句段，输出可视化测评报告。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
