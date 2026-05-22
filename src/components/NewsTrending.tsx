import React, { useState, useEffect } from "react";
import { NewsItem, TopicAngle } from "../types";
import { Sparkles, TrendingUp, RefreshCw, Send, CheckCircle, HelpCircle, Loader2 } from "lucide-react";
import { apiFetch } from "../lib/api";

interface NewsTrendingProps {
  selectedAIModel: string;
  selectedAIModelName?: string;
  onSelectTopic: (angle: string, outline: string[]) => void;
  activeAngle: string;
}

export default function NewsTrending({ selectedAIModel, selectedAIModelName, onSelectTopic, activeAngle }: NewsTrendingProps) {
  const [trends, setTrends] = useState<NewsItem[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [aiTopics, setAiTopics] = useState<TopicAngle[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [errorText, setErrorText] = useState("");
  const [quotaWarning, setQuotaWarning] = useState("");

  // Auto load trending news on mount
  useEffect(() => {
    fetchTrendingNews();
  }, []);

  const fetchTrendingNews = async () => {
    setLoadingTrends(true);
    setErrorText("");
    try {
      const resp = await apiFetch("/api/news/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory }),
      });
      const data = await resp.json();
      if (data.success) {
        setTrends(data.data);
        if (data.quotaExceeded) {
          setQuotaWarning(data.quotaReason || "内置 API 服务发生限流，系统已全自动切换到高价值爆款库！您可以配置独立 Key 使用高级模型。");
        } else {
          setQuotaWarning("");
        }
      } else {
        setErrorText("获取趋势新闻失败，请重试。");
      }
    } catch (err) {
      setErrorText("连接服务超时，已自动加载精选热门自媒体话题。");
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleSuggestTopics = async () => {
    if (!topicInput.trim()) return;
    setLoadingTopics(true);
    try {
      const resp = await apiFetch("/api/topic/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicInput, selectedAIModel }),
      });
      const data = await resp.json();
      if (data.success) {
        setAiTopics(data.data);
        if (data.quotaExceeded) {
          setQuotaWarning(data.quotaReason || "内置 AI 服务限流：已自动切换到高契合度本地大纲算法，为您深度生成最佳大纲选题！");
        } else {
          setQuotaWarning("");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleUseTrendAsTopic = (title: string) => {
    setTopicInput(title);
  };

  return (
    <div id="news-trending-wrapper" className="flex flex-col gap-4 w-full">
      {quotaWarning && (
        <div id="quota-warning-banner" className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2.5 shadow-xs animate-fade-in text-left">
          <span className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 font-bold shrink-0">⚠️ 引擎运行提示</span>
          <span className="leading-relaxed font-medium">{quotaWarning}</span>
        </div>
      )}

      <div id="news-trending-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Trending News Portal */}
      <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden flex flex-col h-[650px]">
        <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <h3 className="font-semibold text-slate-800 text-sm">全网实时新闻/爆款线索</h3>
          </div>
          <button
            onClick={fetchTrendingNews}
            disabled={loadingTrends}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTrends ? "animate-spin text-rose-500" : ""}`} />
            {loadingTrends ? "抓取中..." : "刷新抓取"}
          </button>
        </div>

        {/* Categories togglers */}
        <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
          {["all", "科技", "科学", "生活", "财经"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                // Slight delay simulation to look actual
                setTimeout(() => fetchTrendingNews(), 100);
              }}
              className={`px-2.5 py-1 text-xs rounded-full cursor-pointer whitespace-nowrap transition-all ${
                (selectedCategory === cat)
                  ? "bg-rose-500 text-white font-medium"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat === "all" ? "🔥 全部聚合" : cat}
            </button>
          ))}
        </div>

        {/* Trending list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {loadingTrends ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-xs">正在实时访问 X、微博和新闻门户抓取热度数据...</p>
            </div>
          ) : trends.length > 0 ? (
            trends.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 hover:border-rose-100 hover:bg-rose-50/25 transition-all group relative cursor-pointer"
                onClick={() => handleUseTrendAsTopic(item.title)}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-550/10 text-rose-600">
                    TOP {idx + 1}
                  </span>
                  <span className="text-[12px] font-mono text-slate-500 flex items-center gap-1">
                    👥 {item.hotVal}
                  </span>
                </div>
                <h4 className="font-medium text-slate-800 text-[13px] group-hover:text-rose-600 line-clamp-2 transition-all">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>来自：{item.source}</span>
                  <span className="px-1.5 py-0.2 bg-slate-100 rounded group-hover:bg-rose-100 group-hover:text-rose-600 transition-all">
                    一键选题 →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">暂无新闻趋势，点击刷新重试。</div>
          )}
        </div>
      </div>

      {/* Right: AI Plan Topics Column */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Core Topic Input */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-bold text-slate-400 tracking-wider">选题智选大纲生成圈</span>
          </div>
          <h3 className="font-semibold text-slate-800 text-sm mb-1">写你想写的，让 AI 规划黄金爆款角度</h3>
          <p className="text-xs text-slate-500 mb-4">输入感兴趣的方向，或者点击左侧的即时热搜，我们将定制5个具有极高转发可能性的公众号细分方案。</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="例如：程序员提效、夏日中医防暑、AI工具本地部署..."
              className="flex-1 px-4 py-2.5 bg-slate-550/5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              onClick={handleSuggestTopics}
              disabled={loadingTopics || !topicInput.trim()}
              className="px-4 py-2.5 bg-violet-650 hover:bg-violet-700 text-white font-medium text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              {loadingTopics ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  拆解中...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  智能拆解选题
                </>
              )}
            </button>
          </div>
        </div>

        {/* Topic suggestions output */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs flex-1 overflow-y-auto max-h-[460px] space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 pb-2 border-b border-slate-100">
            📊 AI 生成的爆款细分选题大纲 
            {aiTopics.length > 0 && <span className="text-[10px] lowercase text-[#A0AEC0] font-normal">（点击一个选题即可一键加载到文章创作步骤）</span>}
          </h4>

          {loadingTopics ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              <p className="text-xs">
                正在使用 <span className="font-mono text-violet-600">{selectedAIModelName || selectedAIModel}</span> 引擎为您深度构建爆款逻辑与目录大纲...
              </p>
            </div>
          ) : aiTopics.length > 0 ? (
            <div className="space-y-4">
              {aiTopics.map((topic, index) => {
                const isCurrentActive = activeAngle === topic.angle;
                return (
                  <div
                    key={index}
                    onClick={() => onSelectTopic(topic.angle, topic.outline)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative group text-left ${
                      isCurrentActive
                        ? "border-violet-600 bg-violet-50/30 ring-1 ring-violet-500/20"
                        : "border-slate-150 bg-white hover:border-violet-300 hover:bg-slate-50/20"
                    }`}
                  >
                    {isCurrentActive && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-medium text-violet-600">
                        <CheckCircle className="w-3.5 h-3.5" /> 已选中
                      </span>
                    )}
                    <h5 className="font-bold text-slate-800 text-[13px] pr-12 group-hover:text-violet-600 transition-all">
                      {topic.angle}
                    </h5>
                    
                    {/* Hook & Audience labels */}
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[10px]">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        🎯 受众：{topic.audience}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-medium rounded border border-amber-100">
                        🔥 爆款逻辑：{topic.rationale}
                      </span>
                    </div>

                    <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p className="text-[11px] font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                        ✨ 推荐开篇 Hook：
                      </p>
                      <p className="text-[11px] text-slate-500 italic">
                        {topic.hook}
                      </p>
                    </div>

                    {/* Short visual outline items */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5">【大纲推荐结构】</span>
                      <div className="flex flex-wrap gap-1.5">
                        {topic.outline.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] text-slate-500 px-2 py-0.5 bg-white border border-slate-100 rounded font-mono"
                          >
                            <span className="text-violet-600 font-bold mr-1">{idx + 1}</span> {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <div className="p-3 bg-violet-50 rounded-full text-violet-600">
                <HelpCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-center max-w-sm">
                还没有生成的选题角度。在上方输入话题大方向，或者点击左侧“🔥全部聚合”刷新，选择最火的新闻开启创作吧！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
