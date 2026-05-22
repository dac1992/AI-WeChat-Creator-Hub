import React, { useState } from "react";
import { ArticleDraft, FormattingTemplate, ViralTitle } from "../types";
import { WECHAT_TEMPLATES, MOCK_CTA_LIST } from "../templatesData";
import { compileMarkdownToWechatHTML } from "../lib/formatter";
import { LayoutTemplate, Sparkles, Copy, FileCode, Check, Send, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { apiFetch } from "../lib/api";

interface WechatPreviewProps {
  draft: ArticleDraft;
  selectedAIModel: string;
  selectedAIModelName?: string;
  onUpdateDraftPatch: (patch: Partial<ArticleDraft>) => void;
}

export default function WechatPreview({ draft, selectedAIModel, selectedAIModelName, onUpdateDraftPatch }: WechatPreviewProps) {
  const [copiedType, setCopiedType] = useState<"md" | "html" | null>(null);
  const [viralTitles, setViralTitles] = useState<ViralTitle[]>([]);
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [activeTab, setActiveTab] = useState<"template" | "titles" | "cta">("template");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const activeTemplate = WECHAT_TEMPLATES.find(t => t.id === draft.selectedTemplateId) || WECHAT_TEMPLATES[0];

  const handleTemplateSelect = (id: string) => {
    onUpdateDraftPatch({ selectedTemplateId: id });
  };

  const currentCompiledHTML = compileMarkdownToWechatHTML(
    draft.content,
    activeTemplate,
    draft.ctaText,
    draft.images || []
  );

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopiedType("md");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleCopyHTML = async () => {
    try {
      // WeChat official editor accepts styled HTML. Copying it with rich content type.
      const blob = new Blob([currentCompiledHTML], { type: "text/html" });
      const textBlob = new Blob([currentCompiledHTML], { type: "text/plain" });
      const clipboardItem = new ClipboardItem({
        "text/html": blob,
        "text/plain": textBlob,
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopiedType("html");
      setTimeout(() => setCopiedType(null), 2000);
      setFeedbackMsg("✨ 复制 HTML 成功！现在可以直接在‘微信公众号后台编辑器’中 [粘贴]，完美保留排版、间距与配色样式。");
      setTimeout(() => setFeedbackMsg(""), 8000);
    } catch (err) {
      // Fallback text copy
      try {
        await navigator.clipboard.writeText(currentCompiledHTML);
        setCopiedType("html");
        setTimeout(() => setCopiedType(null), 2000);
      } catch (ee) {
        console.error(ee);
      }
    }
  };

  const fetchViralTitles = async () => {
    setGeneratingTitles(true);
    setViralTitles([]);
    try {
      const resp = await apiFetch("/api/article/viral-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentTitle: draft.title, contentSummary: draft.content.substring(0, 300), selectedAIModel }),
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        setFeedbackMsg(`❌ 策划标题失败: ${errJson.error || "请求异常"}`);
        setTimeout(() => setFeedbackMsg(""), 6000);
        return;
      }
      const data = await resp.json();
      if (data.success) {
        setViralTitles(data.data);
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg(`❌ 请求发生异常: ${err.message || err}`);
      setTimeout(() => setFeedbackMsg(""), 5000);
    } finally {
      setGeneratingTitles(false);
    }
  };

  const handleApplyTitle = (newTitle: string) => {
    onUpdateDraftPatch({ title: newTitle });
    setFeedbackMsg(`🎨 已完美替换当前爆款大标题：${newTitle}`);
    setTimeout(() => setFeedbackMsg(""), 3000);
  };

  const handleApplyCTA = (text: string) => {
    onUpdateDraftPatch({ ctaText: text });
  };

  return (
    <div id="wechat-preview-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Interactive Controls sidebar */}
      <div className="lg:col-span-5 space-y-4">
        {/* Style selection Tabs */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("template")}
              className={`flex-1 py-1.5 text-slate-700 cursor-pointer font-semibold rounded text-xs transition-all flex items-center justify-center gap-1 ${
                activeTab === "template" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-500" />
              排版模板 ({WECHAT_TEMPLATES.length}套)
            </button>
            <button
              onClick={() => {
                setActiveTab("titles");
                if (viralTitles.length === 0 && !generatingTitles) fetchViralTitles();
              }}
              className={`flex-1 py-1.5 text-slate-700 cursor-pointer font-semibold rounded text-xs transition-all flex items-center justify-center gap-1 ${
                activeTab === "titles" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              爆款标题建议
            </button>
            <button
              onClick={() => setActiveTab("cta")}
              className={`flex-1 py-1.5 text-slate-700 cursor-pointer font-semibold rounded text-xs transition-all flex items-center justify-center gap-1 ${
                activeTab === "cta" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              <Send className="w-3.5 h-3.5 text-rose-500" />
              文末引导区
            </button>
          </div>

          {/* Tab Content 1: Templates List */}
          {activeTab === "template" && (
            <div className="mt-4 space-y-2.5">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">选择微信视觉模版</span>
              {WECHAT_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    tpl.id === draft.selectedTemplateId
                      ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900/5"
                      : "border-slate-200 bg-white hover:bg-slate-50/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[13px] text-slate-800 flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: tpl.primaryColor }} />
                      {tpl.name}
                    </span>
                    {tpl.id === draft.selectedTemplateId && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">应用中</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{tpl.desc}</p>
                  
                  {/* Small preset indicator tags list */}
                  <div className="flex gap-2 text-[10px] font-mono">
                    <span className="px-1.5 py-0.2 rounded border border-slate-200" style={{ color: tpl.primaryColor }}>
                      标题样式
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                      引用金句
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 2: Viral Titles Suggestion lists */}
          {activeTab === "titles" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#A0AEC0]">
                  3个爆款备选标题一键替换
                </span>
                <button
                  onClick={fetchViralTitles}
                  disabled={generatingTitles}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${generatingTitles ? "animate-spin" : ""}`} /> 重新生成
                </button>
              </div>

              {generatingTitles ? (
                <div className="text-center py-12 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-400">正在分析文章内容并调配流量黄金法则...</p>
                </div>
              ) : viralTitles.length > 0 ? (
                <div className="space-y-2.5">
                  {viralTitles.map((vt, index) => (
                    <div
                      key={index}
                      onClick={() => handleApplyTitle(vt.title)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 cursor-pointer transition-all group text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide bg-indigo-100/30 px-1.5 py-0.2 rounded">
                          {vt.tag}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-all">一键套用 →</span>
                      </div>
                      <p className="font-bold text-[12px] text-slate-800 leading-relaxed group-hover:text-indigo-900 transition-all">
                        {vt.title}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  暂无推荐标题，点击“重新生成”呼叫AI爆爆款名称。
                </div>
              )}
            </div>
          )}

          {/* Tab Content 3: Call to actions footer templates */}
          {activeTab === "cta" && (
            <div className="mt-4 space-y-3 text-left">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#A0AEC0] block mb-2">选择文末引导关注语模板</span>
              {MOCK_CTA_LIST.map((cta) => {
                const isSelected = draft.ctaText === cta.text;
                return (
                  <div
                    key={cta.id}
                    onClick={() => handleApplyCTA(cta.text)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/30"
                        : "border-slate-200 bg-white hover:bg-slate-50/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[12px] text-slate-800">{cta.name}</span>
                      {isSelected ? (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-100/30 px-1 rounded">选中</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">点击应用</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{cta.text}</p>
                  </div>
                );
              })}
              <div className="mt-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 leading-loose">
                  🔔 选择后会作为文章尾巴自动附加到正文底部渲染。可以一键随时在预览区查看格式。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Copy / Export controls card */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs text-left">
          <h4 className="font-bold text-slate-800 text-xs mb-1">排版完毕，一键导出到公众号</h4>
          <p className="text-xs text-slate-500 mb-4">
            推荐使用 <strong className="text-emerald-700">“复制富文本(HTML)”</strong> 。复制后，在浏览器中打开微信公众号后台并点击 [粘贴]，文字、副标题框、阴影、背景、字体间距等均会无损保留。
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopyHTML}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copiedType === "html" ? (
                <>
                  <Check className="w-4 h-4" /> Copied Styled HTML!
                </>
              ) : (
                <>
                  <FileCode className="w-4 h-4" /> 复制富文本 (HTML) ★ 推荐粘贴
                </>
              )}
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedType === "md" ? (
                <>
                  <Check className="w-4 h-4" /> Copied Markdown!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> 复制标准 Markdown 源码
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Rich high-fidelity WeChat preview viewport */}
      <div className="lg:col-span-7 flex flex-col items-center">
        {feedbackMsg && (
          <div className="w-full mb-4.5 bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl flex items-start gap-2.5 text-indigo-900 animate-pulse text-[12px] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* WeChat Mobile Preview Device Wrapper */}
        <div className="w-full max-w-[420px] bg-[#F2F2F2] border-8 border-slate-900 rounded-[38px] shadow-lg overflow-hidden flex flex-col relative">
          {/* Mobile indicator layout */}
          <div className="bg-slate-950 text-white text-[11px] py-1.5 px-6 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-slate-400" />
              11:28
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            <span className="text-emerald-500 font-black">5G LTE</span>
          </div>

          {/* WeChat Article Top Header Navigation Bar */}
          <div className="bg-[#EDEDED] border-b border-gray-200/50 py-3.5 px-4 text-center relative flex items-center justify-between">
            <span className="text-slate-400 font-bold text-xs">← 关闭</span>
            <span className="font-bold text-slate-800 text-[13px] tracking-wide line-clamp-1 max-w-[200px]">{draft.title || "阅读文章"}</span>
            <span className="text-slate-500 text-xs">•••</span>
          </div>

          {/* Actual Article Viewport (Scrollable container) */}
          <div className="bg-white p-5 overflow-y-auto h-[620px] scrollbar-hide text-left">
            {/* Publisher metadata Block */}
            <div className="mb-5">
              <h1 className="font-bold text-slate-900 text-[19px] leading-relaxed mb-3">
                {draft.title || "公众号暂定标题"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="font-bold text-indigo-600">{draft.author || "公众号智笔阁"}</span>
                <span>{draft.createdTime || "2026-05-22"}</span>
                <span className="px-1.5 py-0.2 bg-[#F2F2F2] rounded select-none">AI：{selectedAIModelName || selectedAIModel}</span>
              </div>
              <div className="mt-2 text-[11px] text-[#A0AEC0]">
                模板风格：<span className="font-bold text-[#4A5568]" style={{ color: activeTemplate.primaryColor }}>{activeTemplate.name}</span>
              </div>
            </div>

            {/* Generated HTML content in-place insertion with safety precautions */}
            {draft.content ? (
              <div
                className="wechat-rich-body"
                dangerouslySetInnerHTML={{ __html: currentCompiledHTML }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-slate-300 text-center gap-2">
                <LayoutTemplate className="w-12 h-12 stroke-1" />
                <p className="text-xs">编辑器中还没有正文。请先前往【写文章】步骤通过AI一键写稿或手动调整修改。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
