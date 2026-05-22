import React, { useState, useEffect } from "react";
import { ArticleDraft } from "../types";
import { FolderHeart, Plus, Save, Trash2, Calendar, FileText, Check, Database, AlertTriangle } from "lucide-react";

interface DraftsDrawerProps {
  currentDraft: ArticleDraft;
  onLoadDraft: (draft: ArticleDraft) => void;
  onSaveCurrent: () => void;
}

export default function DraftsDrawer({ currentDraft, onLoadDraft, onSaveCurrent }: DraftsDrawerProps) {
  const [draftsList, setDraftsList] = useState<ArticleDraft[]>([]);
  const [saveNotify, setSaveNotify] = useState(false);
  const [storageSize, setStorageSize] = useState<string>("0 KB");

  useEffect(() => {
    loadAllDrafts();
    calculateStorageSize();
  }, [currentDraft]);

  const calculateStorageSize = () => {
    try {
      let lsTotal = 0;
      for (let x in localStorage) {
        if (!localStorage.hasOwnProperty(x)) continue;
        // String length * 2 bytes per char
        lsTotal += (localStorage[x].length + x.length) * 2;
      }
      
      if (lsTotal < 1024) {
        setStorageSize(lsTotal + " B");
      } else if (lsTotal < 1024 * 1024) {
        setStorageSize((lsTotal / 1024).toFixed(2) + " KB");
      } else {
        setStorageSize((lsTotal / (1024 * 1024)).toFixed(2) + " MB");
      }
    } catch(e) {
      setStorageSize("未知");
    }
  };

  const loadAllDrafts = () => {
    try {
      const stored = localStorage.getItem("wechat_ai_drafts");
      if (stored) {
        setDraftsList(JSON.parse(stored));
      } else {
        setDraftsList([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = () => {
    onSaveCurrent();
    setSaveNotify(true);
    setTimeout(() => {
      setSaveNotify(false);
      loadAllDrafts();
      calculateStorageSize();
    }, 1200);
  };

  const handleClearAllStorage = () => {
    if (!confirm("⚠️ 危险操作！\n这将清空所有的存盘草稿、已绑定的媒体源配置以及存储的全部缓存记录。此操作不可恢复！是否确认清空？")) return;
    try {
      const keysToKeep = ["wechat_ai_api_key_gemini"]; // if there's anything to keep, maybe API keys? But actually, the prompt implies "定期清除".
      // Let's just remove drafts to be safe, or just clear all localstorage
      localStorage.removeItem("wechat_ai_drafts");
      localStorage.removeItem("wechat_active_draft_id");
      localStorage.removeItem("wechat_news_groups");
      localStorage.removeItem("wechat_news_all_sources");
      
      const newEmptyDraft: ArticleDraft = {
        id: "draft_" + Date.now(),
        title: "未命名自媒体新稿",
        content: "",
        author: "公众号",
        createdTime: new Date().toISOString().split("T")[0],
        lastUpdated: new Date().toLocaleTimeString(),
        selectedTemplateId: "classic-green",
        model: "Gemini",
        imageModel: "gpt-image",
        style: "专业",
        wordCount: "1500",
        ctaText: ""
      };
      
      onLoadDraft(newEmptyDraft);
      setDraftsList([]);
      calculateStorageSize();
      alert("本地数据已成功清空！");
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除这篇历史存档吗？此操作不可逆。")) return;
    try {
      const stored = localStorage.getItem("wechat_ai_drafts");
      if (stored) {
        const list: ArticleDraft[] = JSON.parse(stored);
        const filtered = list.filter(d => d.id !== id);
        localStorage.setItem("wechat_ai_drafts", JSON.stringify(filtered));
        loadAllDrafts();
        calculateStorageSize();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNew = () => {
    const newEmptyDraft: ArticleDraft = {
      id: "draft_" + Date.now(),
      title: "未命名自媒体新稿",
      content: "",
      author: "公众号智笔阁",
      createdTime: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toLocaleTimeString(),
      selectedTemplateId: "classic-green",
      model: "Gemini",
      imageModel: "gpt-image",
      style: "专业",
      wordCount: "1500",
      ctaText: "💡 **写在最后：** 如果你觉得这篇文章能带给你一丁点启发，欢迎**点赞**、**在看**，并分享给身处这轮风潮中的朋友。多一个维度的理性观察，生活就会少一分情绪反噬。关注我们，带你持续探寻认知深处的商业真相。"
    };
    onLoadDraft(newEmptyDraft);
  };

  return (
    <div id="drafts-drawer-container" className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs text-left space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
          <FolderHeart className="w-4 h-4 text-rose-500" />
          草稿箱 / 数据中心
        </span>
        <button
          onClick={handleCreateNew}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-all flex items-center gap-0.5 text-[11px] font-bold cursor-pointer border border-slate-200"
        >
          <Plus className="w-3.5 h-3.5" /> 新建空白稿
        </button>
      </div>

      {/* Save Trigger */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-left">
        <span className="text-[10px] uppercase font-black tracking-widest text-[#A0AEC0] block mb-1">
          当前文章暂存
        </span>
        <div className="flex items-center justify-between gap-2.5">
          <p className="text-[11px] text-slate-500 leading-normal truncate max-w-[150px]">
            {currentDraft.title || "（未命名新稿）"}
          </p>
          <button
            onClick={handleSave}
            className="px-2.5 py-1.5 text-[11px] font-extrabold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            {saveNotify ? (
              <>
                <Check className="w-3.5 h-3.5" /> 已发存档
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> 存为新版本
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drafts Archive List */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">
          存盘历史 ({draftsList.length})
        </span>
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
          {draftsList.length > 0 ? (
            draftsList.map((item) => {
              const worksOnCurrent = item.id === currentDraft.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onLoadDraft(item)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                    worksOnCurrent
                      ? "border-rose-500 bg-rose-50/25 ring-1 ring-rose-300"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${worksOnCurrent ? 'text-rose-500' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className={`text-[11px] font-semibold truncate leading-snug ${worksOnCurrent ? 'text-rose-700' : 'text-slate-800'}`}>
                        {item.title}
                      </p>
                      <span className="text-[9px] text-[#A0AEC0] flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> {item.createdTime} - {item.lastUpdated}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteDraft(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-all shrink-0 cursor-pointer"
                    title="删除草稿"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-slate-400 text-[10px] border border-dashed border-slate-200 rounded-lg">
              暂无已存盘记录。点击保存草稿进行归档。
            </div>
          )}
        </div>
      </div>

      {/* Local Storage Indicator */}
      <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <Database className="w-3 h-3 text-slate-400" />
          <span>本地数据占用: <span className="font-bold text-slate-500">{storageSize}</span></span>
        </div>
        <button
          onClick={handleClearAllStorage}
          className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" /> 清理缓存
        </button>
      </div>
    </div>
  );
}
