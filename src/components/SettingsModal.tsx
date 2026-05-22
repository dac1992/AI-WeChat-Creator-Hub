import React, { useState, useEffect } from "react";
import { X, ExternalLink, Eye, EyeOff, Save, AlertCircle, Sparkles, CheckCircle2, RefreshCw } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated: () => void;
}

const API_PROVIDERS = [
  {
    id: "Gemini",
    name: "Google Gemini 核心引擎",
    desc: "负责选题设计、公众号一键写稿、去AI味诊断、以及Imagen插画生成。极力推荐配置，完全解决频繁触发 429 quota 报错。",
    link: "https://aistudio.google.com/",
    placeholder: "AI Studio 免费或付费 Key (以 AIzaSy... 开头)",
    iconColor: "text-blue-600 bg-blue-50",
    badge: "推荐"
  },
  {
    id: "Claude-3.5",
    name: "Anthropic Claude 引擎",
    desc: "微信公众号深度长文主笔，遣词造句极富深度与修辞张力。",
    link: "https://console.anthropic.com/",
    placeholder: "sk-ant-... 格式的 API 密钥",
    iconColor: "text-amber-700 bg-amber-50"
  },
  {
    id: "ChatGPT",
    name: "OpenAI GPT 核心引擎",
    desc: "常用于微信爆款起标题、热点解读，通用能力顶级。也是 DALL-E 3 画作生图的基础密钥。",
    link: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-... 格式的 API 密钥",
    iconColor: "text-emerald-700 bg-emerald-50"
  },
  {
    id: "DeepSeek",
    name: "DeepSeek 官方推理与极速引擎",
    desc: "负责高硬度逻辑推理、干货拆解、知识图谱匹配，性价比之王。",
    link: "https://platform.deepseek.com/",
    placeholder: "sk-... 格式的 DeepSeek 官方密钥",
    iconColor: "text-indigo-600 bg-indigo-50",
    badge: "最火"
  },
  {
    id: "Kimi",
    name: "Moonshot AI (Kimi) 助手",
    desc: "擅长超长上下文整理、搜集长篇素材，主笔语气平实自然。",
    link: "https://platform.moonshot.cn/",
    placeholder: "kimi api key...",
    iconColor: "text-cyan-600 bg-cyan-50"
  },
  {
    id: "Bailian",
    name: "阿里通义千问 (百炼旗舰)",
    desc: "国风创作优秀，擅长中国古典叙事、商业评论与幽默语气控场。",
    link: "https://bailian.console.aliyun.com/",
    placeholder: "阿里云百炼大模型平台的 API Key",
    iconColor: "text-orange-600 bg-orange-50"
  },
  {
    id: "Volcengine",
    name: "字节跳动火山引擎 (豆包/文生图)",
    desc: "擅长国情民俗、接地气的微信推文笔法，同时提供人物配画拟真支持。",
    link: "https://www.volcengine.com/",
    placeholder: "火山引擎大模型服务的密钥",
    iconColor: "text-sky-600 bg-sky-50"
  },
  {
    id: "Stability",
    name: "Stability AI (Stable Diffusion XL)",
    desc: "业界公认的杰出生图大图模型。负责赛博朋克、潮流、插画、以及3D质地的高清配图。",
    link: "https://platform.stability.ai/",
    placeholder: "sk-... 格式的 Stability API 秘钥",
    iconColor: "text-purple-600 bg-purple-50"
  }
];

const DEFAULT_MODELS = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (全新主推 - 默认)", provider: "Gemini" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (深度长文旗舰)", provider: "Gemini" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (秒级智能写稿)", provider: "Gemini" },
  { id: "gemini-2.0-flash-thinking-exp-01-21", name: "Gemini 2.0 Thinking (脑暴思考)", provider: "Gemini" },
  { id: "Claude-3.5", name: "Claude 3.5 Sonnet (经典文笔主笔)", provider: "Claude-3.5" },
  { id: "ChatGPT", name: "ChatGPT (GPT-4o 顶流通用)", provider: "ChatGPT" },
  { id: "DeepSeek-R1", name: "DeepSeek R1 (逻辑推理)", provider: "DeepSeek" },
  { id: "DeepSeek-V3", name: "DeepSeek V3 (极速智写)", provider: "DeepSeek" },
  { id: "Kimi", name: "Kimi 智能主笔 (长素材吸纳)", provider: "Kimi" },
  { id: "Bailian", name: "通义千问 Max (国风古典叙事)", provider: "Bailian" },
  { id: "Volcengine", name: "火山引擎豆包 (Pro级亲切表达)", provider: "Volcengine" }
];

export default function SettingsModal({ isOpen, onClose, onKeysUpdated }: SettingsModalProps) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchingProvider, setFetchingProvider] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<string, string>>({});
  const [availableModels, setAvailableModels] = useState<any[]>(DEFAULT_MODELS);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      try {
        const storedKeys = localStorage.getItem("wechat_ai_api_keys");
        if (storedKeys) setKeys(JSON.parse(storedKeys));
        
        const storedModelsText = localStorage.getItem("wechat_ai_latest_models");
        if (storedModelsText) setAvailableModels(JSON.parse(storedModelsText));
      } catch (e) {
        console.error("加载配置失败", e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (id: string, val: string) => {
    setKeys((prev) => ({
      ...prev,
      [id]: val
    }));
  };

  const handleFetchModelsForProvider = async (providerId: string) => {
    const keyVal = (keys[providerId] || "").trim();
    if (!keyVal || keyVal === "MY_GEMINI_API_KEY") {
      setProviderStatus(prev => ({
        ...prev,
        [providerId]: "❌ 请先在下方输入框中填写您为该平台申请的私有 API Key，并予以保存！"
      }));
      return;
    }

    setFetchingProvider(providerId);
    setProviderStatus(prev => ({
      ...prev,
      [providerId]: "正在建立通信，连接服务器检索最新大模型版本..."
    }));

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (providerId === "Gemini") headers["x-gemini-api-key"] = keyVal;
      if (providerId === "ChatGPT") headers["x-openai-api-key"] = keyVal;
      if (providerId === "Claude-3.5") headers["x-claude-api-key"] = keyVal;
      if (providerId === "DeepSeek") headers["x-deepseek-api-key"] = keyVal;
      if (providerId === "Kimi") headers["x-kimi-api-key"] = keyVal;
      if (providerId === "Bailian") headers["x-bailian-api-key"] = keyVal;
      if (providerId === "Volcengine") headers["x-volcengine-api-key"] = keyVal;

      const resp = await fetch("/api/models/list-by-provider", {
        method: "POST",
        headers,
        body: JSON.stringify({ provider: providerId })
      });

      const data = await resp.json();
      if (data.success && Array.isArray(data.models)) {
        // Retrieve current active full list from localStorage, default to DEFAULT_MODELS if empty
        const storedModelsText = localStorage.getItem("wechat_ai_latest_models");
        let activeFullModels = storedModelsText ? JSON.parse(storedModelsText) : [...DEFAULT_MODELS];
        
        // Remove old models of this specific provider from the list
        activeFullModels = activeFullModels.filter((m: any) => m.provider !== providerId && m.provider !== (providerId === "Claude-3.5" ? "Claude" : providerId));
        
        // Append newly fetched models
        activeFullModels = [...activeFullModels, ...data.models];
        
        // Save the updated merged models back to local storage
        localStorage.setItem("wechat_ai_latest_models", JSON.stringify(activeFullModels));
        setAvailableModels(activeFullModels);
        
        // Instantly sync the currently edited keys value to localStorage so user doesn't lose it
        const nextKeys = { ...keys, [providerId]: keyVal };
        localStorage.setItem("wechat_ai_api_keys", JSON.stringify(nextKeys));
        setKeys(nextKeys);

        setProviderStatus(prev => ({
          ...prev,
          [providerId]: `🎉 成功！已成功检索并装载 ${data.models.length} 个最新官方模型，已同步加载到顶端 AI 引擎下拉菜单。`
        }));
        
        // Notify parent App component or other elements
        onKeysUpdated();
      } else {
        const errMsg = data.error || "大模型商未授权、Key 余额不足或额度超限 ";
        setProviderStatus(prev => ({
          ...prev,
          [providerId]: `❌ 拉取失败: ${errMsg}`
        }));
      }
    } catch (err: any) {
      console.error(err);
      setProviderStatus(prev => ({
        ...prev,
        [providerId]: `❌ 接口连接异常: ${err.message || "请求服务器阻塞"}`
      }));
    } finally {
      setFetchingProvider(null);
    }
  };

  const handleSave = () => {
    localStorage.setItem("wechat_ai_api_keys", JSON.stringify(keys));
    setSaveSuccess(true);
    onKeysUpdated();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1500);
  };

  const hasAnyKey = Object.values(keys).some(k => typeof k === "string" && k.trim() !== "");

  return (
    <div id="settings-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div id="settings-modal-card" className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-100 rounded-lg text-rose-700 font-bold text-xs">⚙️ SDK配置</span>
            <h2 className="font-extrabold text-slate-900 text-[14px] tracking-tight">AI 引擎与 API 密钥配置中心</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Guidance Alert Box */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-950 leading-relaxed text-left flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold flex items-center gap-1.5 text-blue-800 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> 多模型动态拉取与配置引擎
              </p>
              <p className="font-bold text-slate-800">
                🚨 请注意：本系统完美支持【各平台独立拉取最新模型】！填入对应厂商的 API Key 并点击其卡片底部的 <strong>拉取最新可用模型</strong> 按钮，系统将立即连接其真实网关拉取最新模型选项！配置完成后点击下方的“保存并在本地应用”以生效。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-[#A0AEC0] tracking-wider text-left">
              各 AI 大模型密钥及独立模型拉取列表 (本地隔离保护)
            </h3>

            {API_PROVIDERS.map((provider) => {
              const isValueVisible = showKeyId === provider.id;
              const value = keys[provider.id] || "";
              
              // Find dynamically loaded models for this specific provider
              const providerModels = availableModels.filter(m => {
                if (provider.id === "Claude-3.5" && m.provider === "Claude") return true;
                return m.provider === provider.id;
              });

              return (
                <div 
                  key={provider.id} 
                  className={`p-4 rounded-xl border transition-all text-left ${
                    value ? "border-indigo-150 bg-indigo-50/5" : "border-slate-150 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${provider.iconColor}`}>
                          {provider.id}
                        </span>
                        <span className="font-bold text-slate-800 text-[12px]">
                          {provider.name}
                        </span>
                        {provider.badge && (
                          <span className="px-1.5 py-0.2 bg-rose-500 text-white font-black text-[9px] rounded-full animate-pulse">
                            {provider.badge}
                          </span>
                        )}
                      </div>

                      {providerModels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                          {(() => {
                            const isExpanded = expandedProviders[provider.id];
                            const visibleModels = isExpanded ? providerModels : providerModels.slice(0, 5);
                            const hasMore = providerModels.length > 5;
                            
                            return (
                              <>
                                {visibleModels.map(m => (
                                  <span key={m.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200" title={m.name}>
                                    {m.name.length > 28 ? m.name.substring(0,25) + "..." : m.name}
                                  </span>
                                ))}
                                {hasMore && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedProviders(p => ({ ...p, [provider.id]: !isExpanded }));
                                    }}
                                    className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                  >
                                    {isExpanded ? "收起" : `展开全部 ${providerModels.length} 项`}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 leading-normal">
                        {provider.desc}
                      </p>
                    </div>

                    <a 
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 font-semibold text-[10px] inline-flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      <span>获取 Key</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Input wrapper */}
                  <div className="relative flex items-center mt-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-slate-450 overflow-hidden">
                    <input 
                      type={isValueVisible ? "text" : "password"}
                      value={value}
                      onChange={(e) => handleInputChange(provider.id, e.target.value)}
                      placeholder={provider.placeholder}
                      className="w-full text-xs font-mono px-3 py-2 bg-transparent text-slate-700 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyId(isValueVisible ? null : provider.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isValueVisible ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Provider dynamic model list loader */}
                  {provider.id !== "Stability" && (
                    <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="text-[10px] text-slate-400">
                        使用该 Key 连通其大模型网关刷新可用型号列表
                      </span>
                      <button
                        type="button"
                        disabled={fetchingProvider !== null}
                        onClick={() => handleFetchModelsForProvider(provider.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 select-none"
                      >
                        <RefreshCw className={`w-3 h-3 ${fetchingProvider === provider.id ? "animate-spin text-rose-700" : ""}`} />
                        <span>{fetchingProvider === provider.id ? "正在拉取列表中..." : "拉取该平台最新模型"}</span>
                      </button>
                    </div>
                  )}

                  {/* Detailed specific status description logs */}
                  {providerStatus[provider.id] && (
                    <div className={`mt-2 p-3 rounded-lg text-[10px] leading-relaxed font-bold border ${
                      providerStatus[provider.id].includes("❌")
                        ? "bg-rose-50 text-rose-800 border-rose-100"
                        : "bg-emerald-50 text-emerald-800 border-emerald-100"
                    }`}>
                      {providerStatus[provider.id]}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            {hasAnyKey ? "🟢 已有部分 API Key 配置就绪" : "💡 配置后 API 将首选自主请求通路"}
          </span>

          <div className="flex-1 flex justify-end items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/10 flex items-center gap-1.5 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>已保存并生效!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存 API 密钥</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
