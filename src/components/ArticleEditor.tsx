import React, { useState } from "react";
import { ArticleDraft, ThemeStyle, WordCountOption } from "../types";
import { Sparkles, Type, Bold, Heading2, Heading3, Quote, Languages, Eye, ArrowRight, Loader2, RefreshCw, Layers } from "lucide-react";
import { apiFetch } from "../lib/api";

interface ArticleEditorProps {
  draft: ArticleDraft;
  selectedAIModel: string;
  selectedAIModelName?: string;
  onUpdateDraftPatch: (patch: Partial<ArticleDraft>) => void;
  onNavigateToPreview: () => void;
}

export default function ArticleEditor({
  draft,
  selectedAIModel,
  selectedAIModelName,
  onUpdateDraftPatch,
  onNavigateToPreview
}: ArticleEditorProps) {
  const [generating, setGenerating] = useState(false);
  const [optimizerAction, setOptimizerAction] = useState<"润色" | "改写" | "续写">("润色");
  const [optimizerPrompt, setOptimizerPrompt] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [testOutput, setTestOutput] = useState("");
  const [quotaWarning, setQuotaWarning] = useState("");

  const handleUpdateContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateDraftPatch({ content: e.target.value });
  };

  const handleUpdateTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDraftPatch({ title: e.target.value });
  };

  const handleOneClickGenerate = async () => {
    setGenerating(true);
    try {
      const resp = await apiFetch("/api/article/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicAngle: draft.topicAngle || draft.title || "写一篇行业新动向分析",
          style: draft.style,
          wordCount: draft.wordCount,
          selectedAIModel,
        }),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        onUpdateDraftPatch({
          title: data.data.title,
          content: data.data.content,
        });
        if (data.quotaExceeded) {
          setQuotaWarning(data.quotaReason || "已自动切换到高契合度本地大纲算法，为您深度生成最佳大纲选题！");
        } else {
          setQuotaWarning("");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // Run selected text or whole document modifier
  const handleOptimizeText = async () => {
    setOptimizing(true);
    try {
      // Find what text to edit. If user has highlighted or else use complete article.
      const textarea = document.getElementById("main-article-textarea") as HTMLTextAreaElement;
      let targetText = "";
      let startIndex = 0;
      let endIndex = 0;

      if (textarea) {
        startIndex = textarea.selectionStart;
        endIndex = textarea.selectionEnd;
        if (startIndex !== endIndex) {
          targetText = textarea.value.substring(startIndex, endIndex);
        }
      }

      if (!targetText) {
        targetText = draft.content || "请输入一些文本以便进行AI打磨润色。";
      }

      const resp = await apiFetch("/api/article/edit-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textToEdit: targetText,
          action: optimizerAction,
          customInstruction: optimizerPrompt,
          style: draft.style,
        }),
      });

      const data = await resp.json();
      if (data.success && data.text) {
        if (textarea && startIndex !== endIndex) {
          // Replace only the selection
          const prefix = textarea.value.substring(0, startIndex);
          const suffix = textarea.value.substring(endIndex);
          const newContent = prefix + data.text + suffix;
          onUpdateDraftPatch({ content: newContent });
        } else {
          // Replace complete content
          onUpdateDraftPatch({ content: data.text });
        }
        setOptimizerPrompt("");
        if (data.quotaExceeded) {
          setQuotaWarning(data.quotaReason || "已自动将本段落切换至离线极致润色与段落精磨，保质保星！");
        } else {
          setQuotaWarning("");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOptimizing(false);
    }
  };

  // Markdown tool buttons
  const insertMarkdownTag = (tagType: string) => {
    const textarea = document.getElementById("main-article-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    let replacement = "";

    switch (tagType) {
      case "bold":
        replacement = `**${selected || "加粗文本"}**`;
        break;
      case "h2":
        replacement = `\n## ${selected || "新二级标题"}\n`;
        break;
      case "h3":
        replacement = `\n### ${selected || "新三级子标题"}\n`;
        break;
      case "quote":
        replacement = `\n> “${selected || "这里是金句/引用块 内容”"}\n`;
        break;
      case "divider":
        replacement = `\n---\n`;
        break;
      case "bullet":
        replacement = `\n* ${selected || "列表项目"}\n`;
        break;
      default:
        return;
    }

    const value = text.substring(0, start) + replacement + text.substring(end);
    onUpdateDraftPatch({ content: value });
    
    // Reset focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selected || "加粗文本").length);
    }, 50);
  };

  return (
    <div id="article-editor-wrapper" className="flex flex-col gap-4 w-full">
      {quotaWarning && (
        <div id="editor-quota-warning-banner" className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2.5 shadow-xs animate-fade-in text-left">
          <span className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 font-bold shrink-0">⚠️ 引擎运行提示</span>
          <span className="leading-relaxed font-semibold">{quotaWarning}</span>
        </div>
      )}

      <div id="article-editor-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: AI Creation Strategy panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs text-left">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#C53030]" />
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">公众号超级头炮</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">AI 一键极速起稿</h3>
          <p className="text-xs text-slate-500 mb-4">
            设置爆款基调和文章目标词数。我们将综合选题大纲为您瞬间打造一篇结构分明的新媒体文章。
          </p>

          <div className="space-y-4">
            {/* Tone Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">1. 创作风格设定</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                {(["专业", "幽默", "严肃"] as ThemeStyle[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateDraftPatch({ style: st })}
                    className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${
                      draft.style === st
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {st === "专业" ? "🎓 专业" : st === "幽默" ? "😄 幽默" : "🏛️ 严肃"}
                  </button>
                ))}
              </div>
            </div>

            {/* Word Count Option */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">2. 文字容量调控</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                {(["800", "1500", "3000"] as WordCountOption[]).map((wc) => (
                  <button
                    key={wc}
                    onClick={() => onUpdateDraftPatch({ wordCount: wc })}
                    className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${
                      draft.wordCount === wc
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    约 {wc} 字
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Topic info bubble */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
              <span className="text-[10px] font-bold block text-slate-400 uppercase mb-1">当前核心选题</span>
              <p className="font-bold text-slate-700 leading-relaxed max-h-[50px] overflow-y-auto">
                {draft.topicAngle || "暂未关联。可一键生成默认。"}
              </p>
            </div>

            {/* Generate Trigger block */}
            <button
              onClick={handleOneClickGenerate}
              disabled={generating}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  主笔撰稿策划中（可能需要数十秒）...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> 一键生成爆款大作 (Title + Body)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Paragraph Refiner / Optimizer */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs text-left">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-4 h-4 text-violet-600" />
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">AI 细节雕琢智能体</span>
          </div>
          <h4 className="font-bold text-slate-800 text-xs mb-1">选中段落局部高级修饰</h4>
          <p className="text-[11px] text-slate-400 mb-4.5leading-relaxed">
            在右侧编辑器中【选中部分文字】，选择下方动作，即可针对性改写、润色、或追加故事。
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-violet-50/50 rounded-lg border border-violet-100">
              {["改写", "续写", "润色"].map((action) => (
                <button
                  key={action}
                  onClick={() => setOptimizerAction(action as any)}
                  className={`py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                    optimizerAction === action
                      ? "bg-violet-600 text-white"
                      : "text-violet-700 hover:bg-violet-100/45"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={optimizerPrompt}
              onChange={(e) => setOptimizerPrompt(e.target.value)}
              placeholder="自定义要求：例如“引用古文”、“更尖锐一些”、“用周星驰式调侃...”"
              className="w-full px-3 py-2 bg-slate-500/5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400"
            />

            <button
              onClick={handleOptimizeText}
              disabled={optimizing || !draft.content}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-30"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> 雕琢处理中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> 开始细节智改
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Editing Workstation workspace */}
      <div className="lg:col-span-8 bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs text-left">
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">文章大标题</label>
        <input
          type="text"
          value={draft.title}
          onChange={handleUpdateTitle}
          placeholder="【爆款】输入震撼灵魂的文章大标题..."
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-300 focus:outline-hidden font-bold text-slate-800 text-sm rounded-lg mb-4"
        />

        {/* Modular Editor Toolbelt */}
        <div className="flex flex-wrap items-center justify-between border-t border-b border-slate-100 py-2.5 mb-3 gap-2 bg-slate-50/80 px-2 rounded-lg">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => insertMarkdownTag("bold")}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200/50 rounded cursor-pointer transition-all"
              title="加粗"
            >
              <Bold className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-slate-200" />
            <button
              onClick={() => insertMarkdownTag("h2")}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200/50 rounded cursor-pointer transition-all font-mono font-bold flex items-center gap-0.5 text-xs"
              title="二级标题(H2)"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdownTag("h3")}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200/50 rounded cursor-pointer transition-all font-mono font-bold flex items-center gap-0.5 text-xs"
              title="子标题(H3)"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-slate-200" />
            <button
              onClick={() => insertMarkdownTag("quote")}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200/50 rounded cursor-pointer transition-all flex items-center"
              title="引用金句块"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdownTag("bullet")}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200/50 rounded cursor-pointer transition-all text-xs font-bold font-mono"
              title="无序列表"
            >
              • 列表
            </button>
            <button
              onClick={() => insertMarkdownTag("divider")}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200/50 rounded cursor-pointer transition-all text-xs font-bold font-mono"
              title="排版分割线"
            >
              一一 分割线
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onNavigateToPreview}
              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> 手机效果预览 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Main Textarea input panel */}
        <div className="relative">
          <textarea
            id="main-article-textarea"
            value={draft.content}
            onChange={handleUpdateContent}
            placeholder="这里是写正文内容，支持直接输入标准的 Markdown 语法（## 小标题，**加粗文本**，> 这里是名言金句...）。
或者直接点击左侧的【一键生成爆款大作】秒出草稿，然后在此处增删改修。"
            className="w-full h-[450px] p-4 bg-slate-50/20 border border-slate-200 text-slate-800 font-mono text-[13px] leading-relaxed rounded-xl focus:outline-hidden focus:ring-1 focus:ring-rose-400 placeholder-slate-400"
          />
        </div>

        {/* Footer info counts and model metrics */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>
            ✍️ 字数统计: <strong className="text-slate-600">{draft.content?.length || 0}</strong> 字符 (包含空格)
          </span>
          <span className="flex items-center gap-1">
            🤖 当前生成模型：<strong className="text-rose-600 uppercase">{selectedAIModelName || selectedAIModel}</strong>
          </span>
        </div>
      </div>
    </div>
  </div>
  );
}
