import React, { useState, useEffect } from "react";
import { ArticleDraft } from "../types";
import { Image, Sparkles, Wand2, Download, Check, Loader2, ArrowRight, ExternalLink, Key, Eye, EyeOff, Save } from "lucide-react";
import { apiFetch } from "../lib/api";

interface ImageWizardProps {
  draft: ArticleDraft;
  onUpdateDraftPatch: (patch: Partial<ArticleDraft>) => void;
  onNavigateToPreview: () => void;
}

const IMAGE_MODELS_POOL = [
  { id: "gpt-image-2", name: "Grsai (gpt-image-2)", desc: "支持全球及国内节点，生成高质量画作。" },
  { id: "gpt-image", name: "GPT-Image (DALL-E 3)", desc: "色彩表现明艳，极为擅长理解复杂的隐喻性人物与科技生活场景。" },
  { id: "volc-image", name: "火山引擎文生图", desc: "国风、国潮写实与商业排版极其精准，画面富有高级国货质感。" },
  { id: "sd-xl", name: "Stable Diffusion XL", desc: "赛博潮流前沿，擅长渲染极富冲击力的三维拟真与平面混合插画。" },
  { id: "gemini-imagen", name: "Gemini-Imagen 3", desc: "画面明亮高级，是极简扁平矢量、现代极简线稿封面首选。" }
];

export default function ImageWizard({ draft, onUpdateDraftPatch, onNavigateToPreview }: ImageWizardProps) {
  const [selectedModel, setSelectedModel] = useState("gemini-imagen");
  const [aspectRatio, setAspectRatio] = useState("16:9"); // Default to WeChat Hero Banner aspect ratio
  
  const imagePrompt = draft.imagePrompt || "";
  
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>("");
  const [isSuccessMsg, setIsSuccessMsg] = useState("");
  const [quotaWarning, setQuotaWarning] = useState("");

  // Local storage synchronized API keys state for graphics LLM
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showImageKey, setShowImageKey] = useState(false);
  const [keySaveMsg, setKeySaveMsg] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wechat_ai_api_keys");
      if (stored) {
        setKeys(JSON.parse(stored));
      }
    } catch (e) {
      console.error("加载全局密钥库失败:", e);
    }
  }, []);

  const handleSaveImageKey = (keyId: string, val: string) => {
    const updated = { ...keys, [keyId]: val };
    setKeys(updated);
    localStorage.setItem("wechat_ai_api_keys", JSON.stringify(updated));
    setKeySaveMsg("🔑 密钥已就地保存并绑定到核心自媒体通道！");
    setTimeout(() => setKeySaveMsg(""), 3500);
  };

  const getActiveKeyConfig = () => {
    switch (selectedModel) {
      case "gpt-image-2":
        return {
          keyId: "Grsai",
          name: "Grsai API Key (gpt-image-2)",
          link: "https://grsai.ai/zh/dashboard/api-keys",
          linkLabel: "点此获取 Grsai 秘钥",
          placeholder: "Bearer sk-... 格式的 Grsai API Key"
        };
      case "gpt-image":
        return {
          keyId: "ChatGPT",
          name: "OpenAI API Key (DALL-E 3)",
          link: "https://platform.openai.com/api-keys",
          linkLabel: "点此获取 DALL-E 3 秘钥",
          placeholder: "sk-proj-... 格式的 OpenAI API Key"
        };
      case "volc-image":
        return {
          keyId: "Volcengine",
          name: "火山引擎 API 密钥",
          link: "https://console.volcengine.com/ark/region:ark+cn-beijing/openEndpoint",
          linkLabel: "点此去火山引擎申请文生图授权",
          placeholder: "火山引擎大模型密钥 API key"
        };
      case "sd-xl":
        return {
          keyId: "Stability",
          name: "Stability AI 密钥 (SDXL)",
          link: "https://platform.stability.ai/",
          linkLabel: "点此获取 SDXL API Key",
          placeholder: "sk-... 格式的 Stability API 秘钥"
        };
      case "gemini-imagen":
      default:
        return {
          keyId: "Gemini",
          name: "Google Gemini 密钥 (Imagen 3)",
          link: "https://aistudio.google.com/",
          linkLabel: "点此前往 Google AI Studio 免费申请 Imagen Key",
          placeholder: "AI Studio 免费或付费 Key (以 AIzaSy... 开头)"
        };
    }
  };

  const keyConfig = getActiveKeyConfig();

  const handleSuggestPrompt = () => {
    // Generate a beautiful, creative prompt based on current article title
    const title = draft.title || "科技与新媒体生活";
    const words = [
      `A high quality minimalist vector layout illustration style, themed around: "${title}", with neon highlights, clean background space, professional pastel theme, digital artwork`,
      `A high tech, clean flat illustration design depicting people interacting with smart devices, cozy lighting, with focus on conceptual growth: "${title}"`,
      `Classical Chinese wash painting modern flat crossover art, conveying the essence of "${title}", zen-like atmosphere, high contrast, elegant colors`
    ];
    const pick = words[Math.floor(Math.random() * words.length)];
    onUpdateDraftPatch({ imagePrompt: pick });
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setGenerating(true);
    setGeneratedUrl("");
    try {
      const resp = await apiFetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          model: selectedModel,
          aspectRatio,
        }),
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        setQuotaWarning(`❌ 配图生成失败: ${errJson.error || "服务器端密钥校验未通过或配额受限"}`);
        return;
      }
      const data = await resp.json();
      if (data.success && data.imageUrl) {
        setGeneratedUrl(data.imageUrl);
        setIsSuccessMsg(`✨ 调取 ${data.model} 完美生成配图！比例: ${aspectRatio}`);
        if (data.quotaExceeded) {
          setQuotaWarning(data.quotaReason || "系统内置配图生成配额满，已自适应启动离线插图加速器为您提供高品质配图素材！");
        } else {
          setQuotaWarning("");
        }
        setTimeout(() => setIsSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setQuotaWarning(`❌ 请求发生系统异常: ${err.message || err}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleInsertImageToArticle = () => {
    if (!generatedUrl) return;
    
    // Append the image tag to the editor content markdown
    const imgMarkdownTag = `\n\n![AI生成的排版配图](${generatedUrl})\n\n`;
    const updatedContent = draft.content + imgMarkdownTag;
    
    // Store in draft images log list as well
    const currentImages = draft.images || [];
    onUpdateDraftPatch({
      content: updatedContent,
      images: [...currentImages, generatedUrl]
    });

    setIsSuccessMsg("🎉 已将插图成功插入到正文最底部！可前往【排版模板】直接预览布局。");
    setTimeout(() => setIsSuccessMsg(""), 5000);
  };

  return (
    <div id="image-wizard-wrapper" className="flex flex-col gap-4 w-full">
      {quotaWarning && (
        <div id="image-quota-warning-banner" className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2.5 shadow-xs animate-fade-in text-left">
          <span className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 font-bold shrink-0">⚠️ 引擎运行提示</span>
          <span className="leading-relaxed font-semibold">{quotaWarning}</span>
        </div>
      )}

      <div id="image-wizard-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left side parameters selection */}
      <div className="lg:col-span-12 xl:col-span-5 bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs text-left flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">配图大模型矩阵</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">插画与海报视觉生成中心</h3>
          <p className="text-xs text-slate-500 mb-2 leading-relaxed">
            为您的微信推送生成独一无二的封面与插图。输入一句话由AI瞬间转换成高分辨率视觉资产。
          </p>

          {/* Model selection list */}
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#A0AEC0] block mb-1">
              1. 基础图像引擎列表
            </span>
            {IMAGE_MODELS_POOL.map((imgm) => (
              <div
                key={imgm.id}
                onClick={() => setSelectedModel(imgm.id)}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedModel === imgm.id ? "border-amber-500 bg-amber-50/25 shadow-2xs" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-[11px] text-slate-800">{imgm.name}</span>
                  {selectedModel === imgm.id && (
                    <span className="text-[9px] bg-amber-500 text-white font-bold px-1 rounded">选中</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">{imgm.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive API Key Box specifically for selected Graphic Model */}
          <div className="p-3 bg-amber-50/10 border border-amber-200/50 rounded-lg space-y-2.5 animate-fade-in text-left">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Keys 调试与绑定
              </span>
              <a 
                href={keyConfig.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-amber-700 hover:text-rose-600 underline font-extrabold flex items-center gap-0.5"
              >
                <span>{keyConfig.linkLabel}</span>
                <ExternalLink className="w-2.5 h-2.5 stroke-2" />
              </a>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              当前配图模型 <strong>{keyConfig.name}</strong> 的物理密钥配置。可直接在下方绑定您的专属 Key，告别共享频控：
            </p>

            <div className="relative flex items-center bg-white border border-slate-200 rounded-lg focus-within:border-amber-500 overflow-hidden shadow-3xs">
              <input
                type={showImageKey ? "text" : "password"}
                value={keys[keyConfig.keyId] || ""}
                onChange={(e) => handleSaveImageKey(keyConfig.keyId, e.target.value)}
                placeholder={keyConfig.placeholder}
                className="w-full text-[11px] font-mono px-3 py-1.5 bg-transparent text-slate-700 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowImageKey(!showImageKey)}
                className="p-1.5 text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
              >
                {showImageKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {keySaveMsg && (
              <p className="text-[9px] text-emerald-600 font-bold animate-bounce flex items-center gap-0.5">
                <Check className="w-3 h-3" /> {keySaveMsg}
              </p>
            )}
          </div>

          {/* Aspect Ratio choice list */}
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-[#A0AEC0] block mb-1.5">
              2. 画布比例设置
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "16:9 公众号封面", id: "16:9" },
                { label: "1:1 方形插画", id: "1:1" },
                { label: "4:3 卡片缩略", id: "4:3" }
              ].map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  className={`py-1.5 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${
                    aspectRatio === ar.id
                      ? "border-amber-500 bg-amber-500 text-white font-extrabold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Creator input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#A0AEC0]">
                3. 设计指令 (PROMPT)
              </span>
              <button
                onClick={handleSuggestPrompt}
                className="text-[10px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Wand2 className="w-3 h-3" /> 智能提炼 Prompt
              </button>
            </div>
            <textarea
              value={imagePrompt}
              onChange={(e) => onUpdateDraftPatch({ imagePrompt: e.target.value })}
              placeholder="例如：微信公众号扁平插画风格，一个坐在电脑前喝咖啡露出微笑的极简线条程序员画像，渐变背景"
              className="w-full h-[75px] p-2 bg-slate-500/5 border border-slate-300 rounded-lg text-xs text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="space-y-3 w-full">
          <button
            onClick={handleGenerateImage}
            disabled={generating || !imagePrompt}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-35"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                正在为您渲染构图（可能需要几十秒）...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 text-white" /> 立即渲染创作插画
              </>
            )}
          </button>
          
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-relaxed text-center">
            💡 <strong>图像生成 API 说明：</strong>配图创作极为消耗服务器共享配额。如遇超时或生成次数耗尽，请点击页面顶部的 <span className="text-rose-600 font-bold">⚙️ 配置 API Key</span>。也可以 <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5 hover:text-indigo-800">直接跳转免费获取您专属的 API Key <ExternalLink className="w-2.5 h-2.5 inline" /></a>
          </div>
        </div>
      </div>

      {/* Right side Image Preview + insertion option */}
      <div className="lg:col-span-7 bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs flex flex-col justify-between h-[550px]">
        <div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4">
            🎨 配图生成看板
          </h4>

          {isSuccessMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-xs flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>{isSuccessMsg}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl relative p-4 mb-4">
          {generating ? (
            <div className="text-center text-slate-400 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs">
                正在召唤 <span className="font-mono text-amber-600 uppercase font-black">{selectedModel}</span> 画师，构思构图、笔触和配色...
              </p>
            </div>
          ) : generatedUrl ? (
            <div className="relative group max-h-full max-w-full flex items-center justify-center">
              <img
                src={generatedUrl}
                alt="AI Prompt generated layout"
                className="max-h-[320px] max-w-full rounded-lg shadow-md object-contain border border-[#E2E8F0]"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-3 right-3 bg-black/75 text-white/90 text-[10px] px-2 py-0.5 rounded font-mono">
                {aspectRatio}
              </span>
            </div>
          ) : (
            <div className="text-center text-slate-400 p-8 space-y-2">
              <Image className="w-12 h-12 stroke-1 text-slate-300 mx-auto" />
              <p className="text-xs">暂无已经生成的媒体素材。</p>
              <p className="text-[10px] text-slate-400">
                在左侧选择模型、输入创意并点击“立即渲染”，您的精美自媒体插图就会诞生在此。
              </p>
            </div>
          )}
        </div>

        {/* Action Insertion */}
        <div className="flex gap-2.5">
          <button
            onClick={handleInsertImageToArticle}
            disabled={!generatedUrl}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:hover:bg-rose-600"
          >
            一键插入富文本正文
          </button>
          <button
            onClick={onNavigateToPreview}
            disabled={!generatedUrl}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30"
          >
            手机大盘预览 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
