import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Check, ExternalLink, Save } from "lucide-react";

export interface NewsSource {
  id: string;
  name: string;
  url?: string;
  isCustom?: boolean;
}

export interface NewsGroup {
  id: string;
  name: string;
  sources: NewsSource[];
}

export const DEFAULT_PRESET_SOURCES: NewsSource[] = [
  { id: 's1', name: '36氪', url: '36kr.com' },
  { id: 's2', name: '虎嗅', url: 'huxiu.com' },
  { id: 's3', name: '澎湃新闻', url: 'thepaper.cn' },
  { id: 's4', name: 'IT之家', url: 'ithome.com' },
  { id: 's5', name: '微博热搜', url: 'weibo.com' },
  { id: 's6', name: '知乎热榜', url: 'zhihu.com' },
  { id: 's7', name: '少数派', url: 'sspai.com' },
  { id: 's8', name: '第一财经', url: 'yicai.com' },
  { id: 's9', name: '今日头条', url: 'toutiao.com' },
  { id: 's10', name: '钛媒体', url: 'tmtpost.com' },
  { id: 's11', name: '财新网', url: 'caixin.com' },
  { id: 's12', name: '小红书', url: 'xiaohongshu.com' },
];

export const DEFAULT_GROUPS: NewsGroup[] = [
  {
    id: 'g1',
    name: '科技互联网',
    sources: [DEFAULT_PRESET_SOURCES[0], DEFAULT_PRESET_SOURCES[1], DEFAULT_PRESET_SOURCES[3]]
  },
  {
    id: 'g2',
    name: '财经与商业',
    sources: [DEFAULT_PRESET_SOURCES[7], DEFAULT_PRESET_SOURCES[10]]
  },
  {
    id: 'g3',
    name: '社交热榜',
    sources: [DEFAULT_PRESET_SOURCES[4], DEFAULT_PRESET_SOURCES[5]]
  }
];

interface SourceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: NewsGroup[];
  onSave: (groups: NewsGroup[]) => void;
}

export default function SourceManagerModal({ isOpen, onClose, groups, onSave }: SourceManagerModalProps) {
  const [localGroups, setLocalGroups] = useState<NewsGroup[]>(groups);
  const [globalSources, setGlobalSources] = useState<NewsSource[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalGroups(groups);
      setActiveGroupId(groups.length > 0 ? groups[0].id : null);
      
      const saved = localStorage.getItem("wechat_news_all_sources");
      if (saved) {
        try {
          setGlobalSources(JSON.parse(saved));
        } catch(e) {
          setGlobalSources(DEFAULT_PRESET_SOURCES);
        }
      } else {
        setGlobalSources(DEFAULT_PRESET_SOURCES);
      }
    }
  }, [isOpen, groups]);

  if (!isOpen) return null;

  const activeGroup = localGroups.find(g => g.id === activeGroupId) || localGroups[0];

  const handleAddGroup = () => {
    const newGroup: NewsGroup = {
      id: `g_${Date.now()}`,
      name: '新建新闻分组',
      sources: []
    };
    setLocalGroups([...localGroups, newGroup]);
    setActiveGroupId(newGroup.id);
    setEditingGroupId(newGroup.id);
  };

  const handleDeleteGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localGroups.filter(g => g.id !== id);
    setLocalGroups(updated);
    if (activeGroupId === id) {
      setActiveGroupId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleUpdateGroupName = (id: string, name: string) => {
    setLocalGroups(localGroups.map(g => g.id === id ? { ...g, name } : g));
  };

  const handleToggleSourceInGroup = (source: NewsSource) => {
    if (!activeGroup) return;
    
    // Prevent toggle if currently editing that source
    if (editingSourceId === source.id) return;
    
    const isSelected = activeGroup.sources.some(s => s.id === source.id);
    let updatedSources = [];
    if (isSelected) {
      updatedSources = activeGroup.sources.filter(s => s.id !== source.id);
    } else {
      updatedSources = [...activeGroup.sources, source];
    }
    
    setLocalGroups(localGroups.map(g => g.id === activeGroup.id ? { ...g, sources: updatedSources } : g));
  };

  const handleSaveSource = (sourceId: string | null) => {
    if (!newSourceName.trim()) return;
    
    let updatedGlobal = [...globalSources];
    let finalSource: NewsSource;

    if (sourceId) {
      // Edit existing
      updatedGlobal = updatedGlobal.map(s => {
        if (s.id === sourceId) {
          finalSource = { ...s, name: newSourceName.trim(), url: newSourceUrl.trim() };
          return finalSource;
        }
        return s;
      });
      // Also update in all localGroups
      setLocalGroups(localGroups.map(g => ({
        ...g,
        sources: g.sources.map(s => s.id === sourceId ? { ...s, name: newSourceName.trim(), url: newSourceUrl.trim() } : s)
      })));
    } else {
      // Add new
      finalSource = {
        id: `s_custom_${Date.now()}`,
        name: newSourceName.trim(),
        url: newSourceUrl.trim(),
        isCustom: true
      };
      updatedGlobal = [...updatedGlobal, finalSource];
    }
    
    setGlobalSources(updatedGlobal);
    localStorage.setItem("wechat_news_all_sources", JSON.stringify(updatedGlobal));
    
    setEditingSourceId(null);
    setIsAddingSource(false);
    setNewSourceName("");
    setNewSourceUrl("");
  };

  const handleDeleteSource = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedGlobal = globalSources.filter(s => s.id !== sourceId);
    setGlobalSources(updatedGlobal);
    localStorage.setItem("wechat_news_all_sources", JSON.stringify(updatedGlobal));
    
    // Remove from all groups
    setLocalGroups(localGroups.map(g => ({
      ...g,
      sources: g.sources.filter(s => s.id !== sourceId)
    })));
  };

  const startEditSource = (source: NewsSource, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSourceId(source.id);
    setNewSourceName(source.name);
    setNewSourceUrl(source.url || "");
    setIsAddingSource(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">自定义新闻来源聚合</h2>
            <p className="text-xs text-slate-500 mt-1">编辑新闻分组并在每个组下勾选要抓取的新闻源站点</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden min-h-[400px]">
          {/* Left: Groups List */}
          <div className="w-1/3 border-r border-slate-100 bg-slate-50 overflow-y-auto p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">我的分组</span>
              <button 
                onClick={handleAddGroup}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> 新分组
              </button>
            </div>
            
            {localGroups.map(group => (
              <div 
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group/item ${
                  activeGroupId === group.id 
                    ? "bg-white border-blue-500 shadow-sm ring-1 ring-blue-500 flex-wrap" 
                    : "bg-white/60 border-slate-200 hover:border-blue-300 hover:bg-white"
                }`}
              >
                {editingGroupId === group.id ? (
                  <input 
                    autoFocus
                    className="flex-1 text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-hidden focus:ring-0 p-0"
                    value={group.name}
                    onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                    onBlur={() => setEditingGroupId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingGroupId(null);
                    }}
                  />
                ) : (
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className={`text-sm font-semibold truncate ${activeGroupId === group.id ? 'text-blue-700' : 'text-slate-700'}`}>
                      {group.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {group.sources.length} 个来源
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="重命名"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteGroup(group.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {localGroups.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                暂无分组，点击右上角添加。
              </div>
            )}
          </div>
          
          {/* Right: Sources Selector */}
          <div className="w-2/3 bg-white flex flex-col">
            {activeGroup ? (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">为「{activeGroup.name}」配置来源</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">选择该分组刷新时拉取的新闻网站</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAddingSource(true);
                      setEditingSourceId(null);
                      setNewSourceName("");
                      setNewSourceUrl("");
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> 添加新闻库来源
                  </button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase">全网热门媒体库 ({globalSources.length})</h4>
                    
                    {isAddingSource && (
                      <div className="p-3 border border-blue-200 bg-blue-50/50 rounded-xl mb-3">
                        <div className="flex flex-col gap-2">
                          <input 
                            placeholder="来源名称 (如：酷安)"
                            autoFocus
                            value={newSourceName}
                            onChange={(e) => setNewSourceName(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                          <input 
                            placeholder="网站链接 (如：coolapk.com)"
                            value={newSourceUrl}
                            onChange={(e) => setNewSourceUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSource(null); }}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex gap-2 justify-end mt-1">
                            <button onClick={() => setIsAddingSource(false)} className="px-3 py-1 bg-white border border-slate-200 text-xs rounded hover:bg-slate-50">取消</button>
                            <button onClick={() => handleSaveSource(null)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"><Save className="w-3 h-3" /> 保存</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {globalSources.map(source => {
                        const isSelected = activeGroup.sources.some(s => s.id === source.id);
                        const isEditingThis = editingSourceId === source.id;
                        
                        if (isEditingThis) {
                          return (
                            <div key={source.id} className="p-3 border border-blue-300 bg-blue-50 rounded-xl">
                              <div className="flex flex-col gap-2">
                                <input 
                                  placeholder="名称"
                                  autoFocus
                                  value={newSourceName}
                                  onChange={(e) => setNewSourceName(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-hidden"
                                />
                                <input 
                                  placeholder="链接"
                                  value={newSourceUrl}
                                  onChange={(e) => setNewSourceUrl(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSource(source.id); }}
                                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-hidden"
                                />
                                <div className="flex gap-2 justify-end mt-1">
                                  <button onClick={(e) => { e.stopPropagation(); setEditingSourceId(null); }} className="px-2 py-1 bg-white border border-slate-200 text-xs rounded hover:bg-slate-50">取消</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleSaveSource(source.id); }} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">保存</button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={source.id}
                            onClick={() => handleToggleSourceInGroup(source)}
                            className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col group ${
                              isSelected 
                                ? "border-blue-500 bg-blue-50/50 shadow-sm" 
                                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className={`text-sm font-medium pr-2 truncate ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                                {source.name}
                              </div>
                              <div className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center ${
                                isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                            
                            <div className="text-[10px] text-slate-400 truncate mb-2 mt-auto">
                              {source.url ? source.url : "未设置链接"}
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => startEditSource(source, e)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                                  title="编辑来源"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {source.isCustom && (
                                  <button
                                    onClick={(e) => handleDeleteSource(source.id, e)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded"
                                    title="删除来源"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              
                              {source.url && (
                                <a
                                  href={source.url.startsWith('http') ? source.url : `https://${source.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="访问网站"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                请先在左侧选择或创建一个分组
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => onSave(localGroups)}
            className="px-6 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            保存并应用配置
          </button>
        </div>
      </div>
    </div>
  );
}
