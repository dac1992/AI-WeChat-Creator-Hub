import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Cpu, Check } from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider?: string;
  [key: string]: any;
}

interface ModelSelectorProps {
  availableModels: Model[];
  selectedAIModel: string;
  setSelectedAIModel: (val: string) => void;
}

export default function ModelSelector({ availableModels, selectedAIModel, setSelectedAIModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.addEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const groups = availableModels.reduce((acc, m) => {
    let group = m.provider || "其他引擎";
    if (group === "Claude-3.5") group = "Claude";
    if (group === "Bailian") group = "通义千问";
    if (group === "Volcengine") group = "火山豆包";
    if (group === "Kimi") group = "Moonshot Kimi";
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(m);
    return acc;
  }, {} as Record<string, Model[]>);

  // Initialize closed state on first open
  useEffect(() => {
    if (isOpen) {
      const initialCollapsed: Record<string, boolean> = {};
      Object.entries(groups).forEach(([groupName, models]) => {
        // Only keep the group with the selected model open
        const hasSelected = models.some(m => m.id === selectedAIModel);
        initialCollapsed[groupName] = !hasSelected;
      });
      setCollapsedGroups(initialCollapsed);
    }
  }, [isOpen, selectedAIModel, availableModels]);

  const toggleGroup = (e: React.MouseEvent, groupName: string) => {
    e.stopPropagation();
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const selectedModelObj = availableModels.find(m => m.id === selectedAIModel);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold focus:outline-hidden cursor-pointer w-[240px] flex items-center justify-between"
      >
        <span className="truncate pr-2">
          {availableModels.length === 0 
            ? "请先配置 API Key 拉取模型" 
            : (selectedModelObj ? selectedModelObj.name : "选择引擎...")}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && availableModels.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-[320px] max-h-[400px] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1">
          {Object.entries(groups).map(([group, models]) => (
            <div key={group} className="mb-1">
              <div 
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-50 cursor-pointer rounded text-slate-800"
                onClick={(e) => toggleGroup(e, group)}
              >
                {collapsedGroups[group] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="font-bold text-[11px]">{group} 引擎 ({models.length})</span>
              </div>
              
              {!collapsedGroups[group] && (
                <div className="pl-4">
                  {models.map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedAIModel(m.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md text-[11px] transition-colors ${
                        selectedAIModel === m.id
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {selectedAIModel === m.id ? (
                        <Check className="w-3 h-3 text-blue-600 shrink-0" />
                      ) : (
                        <div className="w-3 h-3 shrink-0" />
                      )}
                      <span className="truncate">{m.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
