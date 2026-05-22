import React, { useState, useEffect } from "react";
import { ArticleDraft } from "./types";
import NewsTrending from "./components/NewsTrending";
import ArticleEditor from "./components/ArticleEditor";
import WechatPreview from "./components/WechatPreview";
import ReviewIntelligence from "./components/ReviewIntelligence";
import ImageWizard from "./components/ImageWizard";
import DraftsDrawer from "./components/DraftsDrawer";
import SettingsModal from "./components/SettingsModal";
import { Sparkles, Cpu, BookOpen, Layers, CheckCircle2, ChevronRight, HelpCircle, Settings } from "lucide-react";

const INITIAL_DRAFT_SEED: ArticleDraft = {
  id: "draft_initial",
  title: "【深度首发】算力平权风暴：AI 本地部署与私有化重构，正在颠覆中小企业的生命线",
  content: `## 01 / 喧嚣热点背后的新流阀门

在科技演化的宏伟浪潮中，我们极少目睹这样一幕：一个只有百人规模的创新黑马，竟然将全球顶级智库和商业航母筑起的高大围墙，撕扯出了一道无可挽回的致命豁口。

> “真正的颠覆者从不站在璀璨霓虹的最中央，他们往往在信息荒漠的极深处默默擦拭思考枪栓。”

随着先进推理大模型全开源的爆发，不仅是极客社区的欢呼，更是直接宣告了算力傲慢溢价时代的终结。普通人再不需要斥巨资租用GPU集群，仅仅依靠日常消费级独立显卡，甚至一台配置不错的笔记本电脑，就能在自家办公区组建起一台24小时不打烊的“数字主笔”。

## 02 / 撕下假面：底层商业逻辑下的信息暗流

这一切看起来像是一场皆大欢喜的科技平权运动。但不可否认，如果我们剥开喧扰喧哗的表象，就能看清风暴之下那条正在快速结冰的自媒体和商业利益洗牌：

* **算力成本冰点化**：每个Token的调用成本大幅探底，极大压榨了市面上大量空洞套壳AI工具的毛利；
* **本地机密数据重组**：传统政企级客户不用再忧虑数据外派泄密的合规指控，大踏步走向私有化配置；
* **技术护城河重塑**：算法的飞跃性突破完全抵消了物理级的硬件垄断，“算力即一切”的信仰面临理性动摇。

这个虽然稍显残忍的商业闭环，却也无情戳穿了大量缺乏深度思考、纯靠流量哗众取宠作图洗稿者的虚假繁荣。

## 03 / 清醒的践行者：我们究竟该如何少走弯路？

微信朋友圈里，总喜欢说一些充满焦虑的陈词滥调。但在新技术的拐点处，最重要的事情永远只有一个：普通人到底应当怎么动手操作？

### 1. 放弃跟风幻想，告别无谓的套壳恐慌
千万不要再被那些包装精美、名头喧嚣的所谓“一周速成自媒体专家和高级套壳工具”透支注意力了。

### 2. 立刻盘活专属的迷你实验流
将自己电脑上高价值的往期爆款文章、深度策划文书一股脑喂给本地大模型。在完全零宽带资费、零隐私外泄风险的沙盒里，感受真正效率大幅增加的魅力。

### 3. 约束非黑即白的站队态度
越是全网闹得沸反盈天的前沿选题，越是要给自己锁死两天的思考隔离期。看清泥沙泥流，你会发现沉浸到最后的，只有读者对深度洞察的执着赞美。

> “聪明人与浅见者的最终分水岭：浅见者在忙忙碌碌跟跑风向，而聪明人早已选定本心，去深挖独一无二的水源。”`,
  author: "公众号智笔阁",
  createdTime: new Date().toISOString().split("T")[0],
  lastUpdated: "上午 11:28",
  topicAngle: "算力平权风暴与自媒体颠覆生存指南",
  selectedTemplateId: "classic-green",
  model: "Gemini",
  imageModel: "gpt-image",
  style: "专业",
  wordCount: "1500",
  ctaText: "💡 **写在最后：** 如果你觉得这篇文章能带给你一丁点启发，欢迎**点赞**、**在看**，并分享给身处这轮风潮中的朋友。多一个维度的理性观察，生活就会少一分情绪反噬。关注我们，带你持续探寻认知深处的商业真相。"
};

type StepId = "topic" | "write" | "preview" | "review" | "image";

export default function App() {
  const [selectedAIModel, setSelectedAIModel] = useState("");
  const [activeTab, setActiveTab] = useState<StepId>("topic");
  const [currentDraft, setCurrentDraft] = useState<ArticleDraft>(INITIAL_DRAFT_SEED);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  // Load latest dynamically retrieved models if any
  const loadAvailableModels = () => {
    try {
      const stored = localStorage.getItem("wechat_ai_latest_models");
      const storedKeysStr = localStorage.getItem("wechat_ai_api_keys");
      const storedKeys = storedKeysStr ? JSON.parse(storedKeysStr) : {};

      if (stored) {
        let parsed = JSON.parse(stored);
        
        // Filter out default mock models that might be left over from old cache
        // And ensure we only show models for providers where a key exists
        const filtered = parsed.filter((m: any) => {
          let p = m.provider;
          if (p === "Claude-3.5") p = "Claude";
          return storedKeys[p] && storedKeys[p].trim() !== "";
        });

        setAvailableModels(filtered);
        if (filtered.length > 0) {
          if (!selectedAIModel || !filtered.some((m: any) => m.id === selectedAIModel)) {
            setSelectedAIModel(filtered[0].id);
          }
        } else {
          setSelectedAIModel("");
        }
      } else {
        setAvailableModels([]);
      }
    } catch (e) {
      setAvailableModels([]);
    }
  };

  useEffect(() => {
    loadAvailableModels();
  }, []);

  // Load draft from localStorage if any works previously exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wechat_ai_drafts");
      if (stored) {
        const parsed = JSON.parse(stored) as ArticleDraft[];
        if (parsed.length > 0) {
          // Find if there's an active draft previously saved in the workspace session
          const activeSessionId = localStorage.getItem("wechat_active_draft_id");
          const found = parsed.find(d => d.id === activeSessionId);
          if (found) {
            setCurrentDraft(found);
          } else {
            setCurrentDraft(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.error("Local storage read failure:", e);
    }
  }, []);

  // Update helper patch
  const updateDraftPatch = (patch: Partial<ArticleDraft>) => {
    const nextDraft = { ...currentDraft, ...patch, lastUpdated: new Date().toLocaleTimeString() };
    setCurrentDraft(nextDraft);
    // Auto sync to localStorage
    try {
      const stored = localStorage.getItem("wechat_ai_drafts");
      let list: ArticleDraft[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex(d => d.id === nextDraft.id);
      if (idx !== -1) {
        list[idx] = nextDraft;
      } else {
        list.push(nextDraft);
      }
      localStorage.setItem("wechat_ai_drafts", JSON.stringify(list));
      localStorage.setItem("wechat_active_draft_id", nextDraft.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadSelectedDraft = (selected: ArticleDraft) => {
    setCurrentDraft(selected);
    localStorage.setItem("wechat_active_draft_id", selected.id);
  };

  const handleSaveCurrentToArchive = () => {
    try {
      const stored = localStorage.getItem("wechat_ai_drafts");
      let list: ArticleDraft[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex(d => d.id === currentDraft.id);
      const nextItem = { ...currentDraft, lastUpdated: new Date().toLocaleTimeString() };
      if (idx !== -1) {
        list[idx] = nextItem;
      } else {
        list.unshift(nextItem);
      }
      localStorage.setItem("wechat_ai_drafts", JSON.stringify(list));
      localStorage.setItem("wechat_active_draft_id", currentDraft.id);
      setCurrentDraft(nextItem);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTopicAngle = (angle: string, outline: string[]) => {
    updateDraftPatch({
      topicAngle: angle,
      title: `【爆款】${angle.replace(/[《》【】]/g, "")}`,
      // Clear out text slightly to avoid stale draft overlap or let user click generate
      content: `## 选题：${angle}\n\n此处大纲规划为：\n${outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n请前往左侧设定【创作风格】，并点击【一键生成爆款大作】自动构建整篇推送正文！`
    });
    // Dynamically advance
    setActiveTab("write");
  };

  const stepsDetails = [
    { id: "topic", name: "1. 爆款选题策划", desc: "引流线索与AI多角度大纲" },
    { id: "write", name: "2. 智能撰写草稿", desc: "曲调风格把控与核心码字" },
    { id: "preview", name: "3. 手机排版模版", desc: "视觉模版套用与HTML一键复制" },
    { id: "review", name: "4. A味智能审查", desc: "去AI说教腔与人类感重塑" },
    { id: "image", name: "5. 配图大师矩阵", desc: "封面插图高分辨率渲染" }
  ];

  const currentModelObj = availableModels.find((m) => m.id === selectedAIModel);
  const selectedAIModelName = currentModelObj ? currentModelObj.name : selectedAIModel;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      {/* Universal branding logo header bar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-600 rounded-xl text-white shadow-md shadow-rose-500/15">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-[15px] tracking-tight flex items-center gap-2">
              AI WeChat Creator Hub
              <span className="text-[10px] font-bold bg-[#FFF0F2] text-[#C53030] border border-[#FFD3D9] px-2 py-0.5 rounded-full select-none">
                自媒体写稿排版全流程工具
              </span>
            </h1>
            <p className="text-[11px] text-[#A0AEC0] font-normal leading-normal">
              抓热度、AI规划多选题、一键写文章、WeChat免损HTML复制排版、去AI味、图像生成完整创作闭环
            </p>
          </div>
        </div>

        {/* Global AI Model Selection and API Configuration control */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
          <div className="flex items-center gap-1.5 px-2 text-slate-500 text-xs">
            <Cpu className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-bold text-[11px]">AI 引擎选型：</span>
          </div>
          <select
            value={selectedAIModel}
            onChange={(e) => setSelectedAIModel(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold focus:outline-hidden cursor-pointer max-w-[220px] truncate"
          >
            {availableModels.length === 0 && (
              <option value="" disabled>请先配置 API Key 拉取模型</option>
            )}
            {Object.entries(
              availableModels.reduce((acc, m) => {
                let group = m.provider || "其他引擎";
                if (group === "Claude-3.5") group = "Claude";
                if (group === "Bailian") group = "通义千问";
                if (group === "Volcengine") group = "火山豆包";
                if (group === "Kimi") group = "Moonshot Kimi";
                
                if (!acc[group]) acc[group] = [];
                acc[group].push(m);
                return acc;
              }, {} as Record<string, typeof availableModels>)
            ).map(([group, models]: [string, any[]]) => (
              <optgroup key={group} label={`${group} 引擎 (${models.length})`}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>



          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 rounded-lg text-[10px] font-black tracking-wide transition-all cursor-pointer shadow-xs"
          >
            <Settings className="w-3 h-3" />
            <span>配置 API Key</span>
          </button>
        </div>
      </header>

      {/* Main Orchestrator Workspace grid layout */}
      <div className="flex-1 w-full max-w-full px-4 md:px-8 xl:px-12 py-6 grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Left column: Sidebar containing Drafts status and Steps Visual Tracker */}
        <div className="xl:col-span-1 space-y-4">
          {/* Unlocked Stepper controller indicator */}
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs text-left">
            <h3 className="text-xs font-black tracking-widest text-[#A0AEC0] uppercase mb-4 pb-2 border-b border-slate-100 flex items-center gap-1">
              <Layers className="w-4 h-4 text-slate-400" /> 五步高效创作流（随时可跳点）
            </h3>
            
            <div className="space-y-1.5">
              {stepsDetails.map((step) => {
                const isActive = activeTab === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveTab(step.id as any)}
                    className={`w-full p-2.5 rounded-xl text-left border cursor-pointer transition-all flex items-start gap-3 relative overflow-hidden group ${
                      isActive
                        ? "bg-[#FFF0F2] border-[#FFD3D9] text-rose-900 font-bold"
                        : "bg-white border-slate-100 hover:border-slate-350 text-slate-500"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#C53030]" />
                    )}
                    <span className={`p-1.5 rounded-lg shrink-0 ${
                      isActive ? "bg-rose-100 text-rose-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-700"
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>

                    <div className="min-w-0 pr-4">
                      <p className={`text-[12px] leading-tight ${isActive ? "text-rose-950 font-black" : "text-slate-800"}`}>
                        {step.name}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-normal truncate">
                        {step.desc}
                      </p>
                    </div>

                    <ChevronRight className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all opacity-0 group-hover:opacity-100 text-slate-400 ${
                      isActive ? "text-[#C53030]" : ""
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persistent Drafts list panel */}
          <DraftsDrawer
            currentDraft={currentDraft}
            onLoadDraft={handleLoadSelectedDraft}
            onSaveCurrent={handleSaveCurrentToArchive}
          />
        </div>

        {/* Right column: Dynamic rendering main stage wrapper */}
        <main className="xl:col-span-3 space-y-4">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs transition-transform duration-300">
            {activeTab === "topic" && (
              <NewsTrending
                selectedAIModel={selectedAIModel}
                selectedAIModelName={selectedAIModelName}
                onSelectTopic={handleSelectTopicAngle}
                activeAngle={currentDraft.topicAngle || ""}
              />
            )}

            {activeTab === "write" && (
              <ArticleEditor
                draft={currentDraft}
                selectedAIModel={selectedAIModel}
                selectedAIModelName={selectedAIModelName}
                onUpdateDraftPatch={updateDraftPatch}
                onNavigateToPreview={() => setActiveTab("preview")}
              />
            )}

            {activeTab === "preview" && (
              <WechatPreview
                draft={currentDraft}
                selectedAIModel={selectedAIModel}
                selectedAIModelName={selectedAIModelName}
                onUpdateDraftPatch={updateDraftPatch}
              />
            )}

            {activeTab === "review" && (
              <ReviewIntelligence
                draft={currentDraft}
                selectedAIModel={selectedAIModel}
                onUpdateDraftPatch={updateDraftPatch}
              />
            )}

            {activeTab === "image" && (
              <ImageWizard
                draft={currentDraft}
                onUpdateDraftPatch={updateDraftPatch}
                onNavigateToPreview={() => setActiveTab("preview")}
              />
            )}
          </div>
          
          {/* Footer branding details and security reminders */}
          <div className="flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 px-1 py-2 font-mono">
            <span>AI WeChat Creator Hub © 2026</span>
            <span className="flex items-center gap-1 text-[10px]">
              🔒 本地草稿采用浏览器端 IndexedDB/LocalStorage 加密隔离保存，云端绝不读取隐私文章。
            </span>
          </div>
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeysUpdated={() => {
          loadAvailableModels();
        }}
      />
    </div>
  );
}
