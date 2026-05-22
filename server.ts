import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running on Vercel" });
});

// Helper to retrieve Gemini API Client ONLY if a user-supplied custom key is provided.
// No fallback to process.env.GEMINI_API_KEY is allowed.
function getAiClient(customKey?: string): GoogleGenAI | null {
  if (customKey && customKey.trim() !== "" && customKey !== "MY_GEMINI_API_KEY") {
    return new GoogleGenAI({
      apiKey: customKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return null;
}

// Universal text content dispatcher.
// Maps selectedAIModel to its respective API and custom key.
// Blocks early and returns clear errors if keys are empty.
async function callUniversalAIModel(params: {
  selectedAIModel: string;
  systemInstruction: string;
  prompt: string;
  headers: any;
  responseFormatJson?: boolean;
}): Promise<{ text: string }> {
  const modelId = params.selectedAIModel || "gemini-3.5-flash";
  const systemInstruction = params.systemInstruction;
  const prompt = params.prompt;
  const reqHeaders = params.headers;
  const responseFormatJson = !!params.responseFormatJson;

  let provider = "Gemini";
  let apiKey = "";

  // Map model identifier to provider name and get key from headers
  if (modelId.toLowerCase().includes("gemini")) {
    provider = "Gemini";
    apiKey = (reqHeaders["x-gemini-api-key"] as string) || "";
  } else if (modelId.toLowerCase().includes("claude") || modelId === "Claude-3.5") {
    provider = "Claude";
    apiKey = (reqHeaders["x-claude-api-key"] as string) || "";
  } else if (modelId.toLowerCase().includes("gpt") || modelId.toLowerCase().includes("chatgpt") || modelId === "ChatGPT") {
    provider = "OpenAI";
    apiKey = (reqHeaders["x-openai-api-key"] as string) || "";
  } else if (modelId.toLowerCase().includes("deepseek") && modelId !== "deepseek-r1" && modelId !== "deepseek-v3") {
    provider = "DeepSeek";
    apiKey = (reqHeaders["x-deepseek-api-key"] as string) || "";
  } else if (modelId.toLowerCase().includes("moonshot") || modelId === "Kimi") {
    provider = "Kimi";
    apiKey = (reqHeaders["x-kimi-api-key"] as string) || "";
  } else if (modelId.toLowerCase().includes("qwen") || modelId.toLowerCase().includes("llama") || modelId === "deepseek-r1" || modelId === "deepseek-v3" || modelId === "Bailian") {
    provider = "Bailian";
    apiKey = (reqHeaders["x-bailian-api-key"] as string) || "";
  } else if (modelId.toLowerCase().includes("doubao") || modelId === "Volcengine") {
    provider = "Volcengine";
    apiKey = (reqHeaders["x-volcengine-api-key"] as string) || "";
  }

  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(`您尚未在『设置』中提供 ${provider} 的专属 API 密钥！本系统不支持免 Key 共享，请先在右上角配置您的专属 Key 并点击“保存并在本地应用”！`);
  }

  // 1. Gemini
  if (provider === "Gemini") {
    const ai = getAiClient(apiKey);
    if (!ai) {
      throw new Error("内置 GoogleGenAI 客户端初始化失败，无法继续运作。");
    }
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: responseFormatJson ? "application/json" : undefined,
      },
    });
    return { text: response.text || "" };
  }

  // 2. DeepSeek (Strictly complies with developers specification: https://api-docs.deepseek.com/zh-cn/)
  if (provider === "DeepSeek") {
    const actualModel = modelId === "DeepSeek-R1" ? "deepseek-reasoner" : (modelId === "DeepSeek-V3" || modelId === "DeepSeek-V4" ? "deepseek-chat" : modelId);
    const requestHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.trim()}`
    };

    let messages = [];
    if (actualModel === "deepseek-reasoner") {
      // deepseek-reasoner currently does not support separate system prompts, merge them info human role cleanly
      messages = [
        {
          "role": "user",
          "content": `${systemInstruction}\n\n[新媒体写作指令及素材]\n${prompt}`
        }
      ];
    } else {
      messages = [
        { "role": "system", "content": systemInstruction },
        { "role": "user", "content": prompt }
      ];
    }

    const payload: any = {
      model: actualModel,
      messages,
      temperature: actualModel === "deepseek-reasoner" ? undefined : 0.7,
      stream: false
    };

    if (responseFormatJson && actualModel !== "deepseek-reasoner") {
      payload.response_format = { "type": "json_object" };
    }

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const respText = await res.text();
      throw new Error(`DeepSeek 接口出错: 代码 ${res.status}。详细信息: ${respText}`);
    }

    const data: any = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return { text: data.choices[0].message.content || "" };
    }
    throw new Error(`DeepSeek 接口未返回有效的 choices 文本。`);
  }

  // 3. OpenAI
  if (provider === "OpenAI") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: modelId === "ChatGPT" ? "gpt-4o" : modelId,
        messages: [
          { "role": "system", "content": systemInstruction },
          { "role": "user", "content": prompt }
        ],
        response_format: responseFormatJson ? { "type": "json_object" } : undefined,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const respText = await res.text();
      throw new Error(`OpenAI 接口报错: 代码 ${res.status}。详情: ${respText}`);
    }

    const data: any = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return { text: data.choices[0].message.content || "" };
    }
    throw new Error(`OpenAI 未返回有效正文。`);
  }

  // 4. Claude (Anthropic)
  if (provider === "Claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: modelId === "Claude-3.5" ? "claude-3-5-sonnet-latest" : modelId,
        system: systemInstruction,
        messages: [
          { "role": "user", "content": prompt }
        ],
        max_tokens: 4000
      })
    });

    if (!res.ok) {
      const respText = await res.text();
      throw new Error(`Claude 接口报错: 代码 ${res.status}。详情: ${respText}`);
    }

    const data: any = await res.json();
    if (data.content && data.content[0] && data.content[0].text) {
      return { text: data.content[0].text };
    }
    throw new Error(`Claude 未返回有效文字。`);
  }

  // 5. Kimi (Moonshot)
  if (provider === "Kimi") {
    const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: modelId === "Kimi" ? "moonshot-v1-8k" : modelId,
        messages: [
          { "role": "system", "content": systemInstruction },
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!res.ok) {
      const respText = await res.text();
      throw new Error(`Kimi 接口报错: 代码 ${res.status}。详情: ${respText}`);
    }

    const data: any = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return { text: data.choices[0].message.content || "" };
    }
    throw new Error(`Kimi 接口未返回文本选择。`);
  }

  // 6. Bailian (Ali Qwen)
  if (provider === "Bailian") {
    const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: modelId === "Bailian" ? "qwen-max" : modelId,
        messages: [
          { "role": "system", "content": systemInstruction },
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!res.ok) {
      const respText = await res.text();
      throw new Error(`Qwen 通义千问接口报错: 代码 ${res.status}。详情: ${respText}`);
    }

    const data: any = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return { text: data.choices[0].message.content || "" };
    }
    throw new Error(`通义千问没有返回任何数据内容。`);
  }

  // 7. Volcengine (Doubao)
  if (provider === "Volcengine") {
    const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: modelId === "Volcengine" ? "doubao-pro-4k" : modelId,
        messages: [
          { "role": "system", "content": systemInstruction },
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!res.ok) {
      const respText = await res.text();
      throw new Error(`Volc Ark (字节豆包) 接口报错: 代码 ${res.status}。详情: ${respText}`);
    }

    const data: any = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return { text: data.choices[0].message.content || "" };
    }
    throw new Error(`豆包模型输出为空。`);
  }

  throw new Error(`不支持该提供商通路: ${provider}`);
}

// -------------------------------------------------------------
// Core API Enpoints
// -------------------------------------------------------------

// 1. Trending News Endpoint (获取最新实事新闻)
app.post("/api/news/trending", async (req, res) => {
  const customKey = req.headers["x-gemini-api-key"] as string | undefined;
  if (!customKey || customKey.trim() === "" || customKey === "MY_GEMINI_API_KEY") {
    return res.status(400).json({ error: "您未在中提供 Google Gemini API 密钥，拒绝拉取新闻大模型检索！请先在页面右上角添加 Key。" });
  }

  const ai = getAiClient(customKey);
  if (!ai) {
    return res.status(400).json({ error: "Gemini 客户端包初始化失败，请检查您的 Key 是否有误。" });
  }

  try {
    const prompt = `列出当前最新、最热的6个微信朋友圈与社交媒体爆款趋势话题。需要涵盖科技前沿、大厂动向、财经创见或现代生活。
请严格采用纯JSON数组格式返回，不要写 markdown 标记，不要解释。格式结构如下：
[
  {
    "title": "爆款标题/话题事件",
    "hotVal": "热度指数，例如 9.8万",
    "source": "来源，如微博、快科技、澎湃、36氪",
    "summary": "一到两句话深度对事件背景和传播核心槽点进行总结",
    "category": "分类标签，如“科技”、“商业”、“情感”、“社会”"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const parsed = JSON.parse(text.trim());
    return res.json({ success: true, data: parsed, isMock: false });
  } catch (err: any) {
    console.error("News Search Error:", err);
    return res.status(400).json({ error: `拉取实时爆点错误: ${err.message || err}` });
  }
});

// 2. AI Topic List Generator (延伸设计选题大纲)
app.post("/api/topic/generate", async (req, res) => {
  const { topicInput, selectedAIModel = "gemini-3.5-flash" } = req.body;
  if (!topicInput) {
    return res.status(400).json({ error: "请输入需要延伸构思的话题核心词或句子" });
  }

  const systemPrompt = `你是一个深谙微信爆款文章涨粉秘诀的公众号总编辑。
请针对用户提供的原始方向，延伸构思出5个极为抓人眼球、洞察人心、符合痛点逻辑和价值观碰撞的爆款公众号选题角度。
请严格输出纯 JSON 数组，无需 markdown 格式包裹，不要带任何前言废话。数据结构如下：
[
  {
    "angle": "选题爆款大标题（如：那些25岁提早退休的年轻人，背后都经历过这三次危机）",
    "audience": "目标核心读者（如：职场中产、向往自由的年轻人）",
    "hook": "引人入胜开篇第一句话/痛点金句",
    "rationale": "为什么这个选题极具爆款潜质逻辑分析",
    "outline": ["子标题排版1", "子标题排版2", "子标题排版3", "文末升华金句构想"]
  }
]`;

  try {
    const result = await callUniversalAIModel({
      selectedAIModel,
      systemInstruction: systemPrompt,
      prompt: `原始选题契机是: "${topicInput}"。请严格按预设 JSON 格式生成爆款矩阵。`,
      headers: req.headers,
      responseFormatJson: true
    });

    const cleaned = result.text.trim();
    return res.json({ success: true, data: JSON.parse(cleaned), isMock: false });
  } catch (err: any) {
    console.error("AI Topic Gen Error:", err);
    return res.status(400).json({ error: err.message || err });
  }
});

// 3. AI Article Content One-Click Generator (写文章 - 一键生成)
app.post("/api/article/generate", async (req, res) => {
  const { topicAngle, style = "专业", wordCount = "1500", selectedAIModel = "gemini-3.5-flash" } = req.body;
  if (!topicAngle) {
    return res.status(400).json({ error: "选题及角度不可为空" });
  }

  const wordLimit = parseInt(wordCount) || 1500;
  const systemPrompt = `你是一个拥有百万真实粉丝的微信头部自媒体主笔，深谙微信公众号排版美化与情节起伏。
需要针对用户给定的选题角度，一键打造一整篇爆款推文，包含：一个爆款大标题，以及正文。
要求曲调节奏非常符合："${style}"（专业：论据严实、逻辑推理缜密；幽默：语风风趣搞笑、段子金句不断；严肃：引人自省、句句带刺充满洞察）。
目标字数限制：${wordLimit} 字。

请严格遵守公众号移动端舒适排版法则：
1. 大标题点击欲饱满（多运用悬念设疑、对比突出、痛点击穿等手法）。
2. 开篇使用具有冲击力的 Hook 抓住读者，避免无病呻吟的抒情和宏大空话开头。
3. 必须使用 01/ 02/ 03/ 多级段落标题拆解全篇，增强阅读呼吸感。
4. 段落紧凑，短段落为主，重要警醒金句自成一段，善用引用语法（>）使其高亮。
5. 论述过程结合案例或日常痛点，不讲干巴巴的大道理。
6. 文章收尾升华，提供真诚的情绪资产与收藏价值，引导分享朋友圈。

请直接以纯 JSON 格式返回，不要有 Markdown 字符等包裹，我们前端会自动完美解析：
{
  "title": "爆款大标题（格式要震撼，突出痛点）",
  "content": "使用 Markdown 编写的文章正文部分。包含小标题、精心排版分段过的段落、金句卡片引用块。请确保每一段都富有新媒体质感。"
}
任何情况下，不要输出解释性废话。`;

  try {
    const result = await callUniversalAIModel({
      selectedAIModel,
      systemInstruction: systemPrompt,
      prompt: `选题角度: "${topicAngle}"。希望字数: ${wordLimit}字，要求的文笔风格是: "${style}"。请输出爆款深度推文。`,
      headers: req.headers,
      responseFormatJson: true
    });

    const parsed = JSON.parse(result.text.trim());
    return res.json({ success: true, data: parsed, isMock: false });
  } catch (err: any) {
    console.error("AI Article Gen Error:", err);
    return res.status(400).json({ error: err.message || err });
  }
});

// 4. AI Writer Helper Actions (文章辅助修饰：改写、续写、润色)
app.post("/api/article/edit-helper", async (req, res) => {
  const { textToEdit, action = "润色", customInstruction = "", style = "专业", selectedAIModel = "gemini-3.5-flash" } = req.body;
  if (!textToEdit) {
    return res.status(400).json({ error: "请输入需要进行文字加工的文章片段" });
  }

  const systemPrompt = `你是一个终极微信公众号文字雕琢师，能将最晦涩难读或寡淡无趣的表达，瞬间包装成百万大号主笔的质感。
用户给你一段文字，要求执行以下具体操作之一：
[改写]：提炼文章底色，用更新颖、情绪跌宕起伏的自媒体金句去重述，要保留核心观点。
[续写]：顺应上文语气逻辑，自然产出两至三段逻辑紧凑、金句横飞的深度文字，自然引出深层洞察。
[润色]：剪掉废话连接词，修剪臃肿冗长定语，整体笔触偏向 "${style}"，增减少许让读者产生收藏冲动的烟火气神来之笔。
当前选定的加工操作是：[${action}]。
用户特别添加了要求或指示："${customInstruction || "无"}"。
请直接、仅返回处理美化后的新内容文字（可包含必要空格换行），不要有任何前言后语。`;

  try {
    const result = await callUniversalAIModel({
      selectedAIModel,
      systemInstruction: systemPrompt,
      prompt: `以下是需要加工优化的文字：\n\n"${textToEdit}"`,
      headers: req.headers
    });

    return res.json({ success: true, text: result.text.trim(), isMock: false });
  } catch (err: any) {
    console.error("AI edit-helper failure:", err);
    return res.status(400).json({ error: err.message || err });
  }
});

// 5. Generate 3 Alternative Viral Titles (策划 3 个备选震撼标题)
app.post("/api/article/viral-titles", async (req, res) => {
  const { currentTitle, contentSummary = "", selectedAIModel = "gemini-3.5-flash" } = req.body;
  if (!currentTitle && !contentSummary) {
    return res.status(400).json({ error: "未传入文章现有标题或内容摘要，无法策划。" });
  }

  const systemPrompt = `你是一个专门负责给大号取百万爆款标题的标题党奇才。
擅长痛点直扣、数字对比、反大众认识、信息缺口等自媒体起名大招。
请为正在执笔的文章构思3部极为震撼的标题。
暂定大意/摘要： "${currentTitle || contentSummary}"。
你需要输出：
1. 痛点反差体（高反直觉、极致对比）
2. 悬念猎奇体（撕开信息黑洞、强制驱使点击）
3. 警醒干货体（高价值指引、不看必后悔腔调）

请严格返回一个纯 JSON 格式的数组，不带任何 Markdown 标记：
[
  { "tag": "痛点反差", "title": "标题字样..." },
  { "tag": "悬念猎奇", "title": "标题字样..." },
  { "tag": "警醒干货", "title": "标题字样..." }
]`;

  try {
    const result = await callUniversalAIModel({
      selectedAIModel,
      systemInstruction: systemPrompt,
      prompt: `帮我策划3个朋友圈高转发标题。现有参考: "${currentTitle}" / 摘要: "${contentSummary}"`,
      headers: req.headers,
      responseFormatJson: true
    });

    return res.json({ success: true, data: JSON.parse(result.text.trim()), isMock: false });
  } catch (err: any) {
    console.error("AI Headline Failure:", err);
    return res.status(400).json({ error: err.message || err });
  }
});

// 6. AI Agent Review System (微信官方全方位去 AI 味深度评审检测)
app.post("/api/article/review", async (req, res) => {
  const { content, selectedAIModel = "gemini-3.5-flash" } = req.body;
  if (!content) {
    return res.status(400).json({ error: "未检测到正文，请先输入有温度的段落。" });
  }

  const systemPrompt = `你是一个冷酷、严厉的自媒体评审体验官，拥有极致的文字审美和“AI调降噪”本能。
需要对用户提交的一篇文章进行深度的“AI腔调/AI味”大普查：
AI腔调的经典表现为：
1. 作文式总承：“总而言之”、“毋庸置疑”、“不可否认”、“正如我们所见”。
2. 套公式升华：“不仅代表着...更促使着这颗时代的微型个体与技术狂澜紧随其后...”。
3. 堆大词画空饼：过度渲染“重组生产力”、“革新范式”、“重塑闭环”。

你需要交付以下结构化体检报告：
- 一个评分 (0-100)，0分代表全是大白话；100分代表满篇全是AI假大空废话排比（微信公众号强烈建议脱水降低至30分以内）。
- 一个精当刻薄、直击核心的诊断总结（verdict）。
- 原文里抓取 3 句最典型、最冷血、最突崛的“老腔调句子”，配合大白话极具真性情的“人类灵魂去AI味重构建议方案”。

请严格返回一个纯 JSON 结构体，绝对不要 markdown 包裹：
{
  "aiScore": 80,
  "verdict": "总评诊断：指出AI腔调主要聚集在开头或小节承接处...",
  "findings": [
    {
      "original": "抓出的带AI味句子",
      "clicheDesc": "问题批判：剖白为什么这里充满假大空的流水线包装味...",
      "improved": "纯人类真性情真诚对话式改写..."
    }
  ]
}`;

  try {
    const result = await callUniversalAIModel({
      selectedAIModel,
      systemInstruction: systemPrompt,
      prompt: `深度评估我的文章：\n\n${content.substring(0, 4000)}`,
      headers: req.headers,
      responseFormatJson: true
    });

    return res.json({ success: true, data: JSON.parse(result.text.trim()), isMock: false });
  } catch (err: any) {
    console.error("AI Review Failure:", err);
    return res.status(400).json({ error: err.message || err });
  }
});

// 6.5 Retrieve Latest Models Endpoint (获取最新官方模型列表)
app.post("/api/models/list", async (req, res) => {
  const customKey = req.headers["x-gemini-api-key"] as string | undefined;
  const ai = getAiClient(customKey);

  const defaultModels = [
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (全新主推 - 默认)", provider: "Gemini", desc: "最新一代中型主力，卓越的速度和语境表达平衡" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (深度长文旗舰)", provider: "Gemini", desc: "大参数旗舰推理，适用微信深度原创、长文连载分析" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (秒级写稿控场)", provider: "Gemini", desc: "超高速处理性能，大纲构图、标题筛选反应极快" },
    { id: "gemini-2.0-flash-thinking-exp-01-21", name: "Gemini 2.0 Thinking (脑暴思考)", provider: "Gemini", desc: "独特深度思维链反思，做商业硬核大纲的一等好手" },
    { id: "Claude-3.5", name: "Claude 3.5 Sonnet (经典文笔主笔)", provider: "Claude-3.5", desc: "遣词造句极具深度与情绪张力，适合抒情评论或纪实报道" },
    { id: "ChatGPT", name: "ChatGPT (GPT-4o 顶流通用)", provider: "ChatGPT", desc: "顶尖逻辑稳定性，能写出极佳的社交媒体爆款起伏" },
    { id: "DeepSeek-R1", name: "DeepSeek-R1 (满血推理之王)", provider: "DeepSeek", desc: "深度思考强化，极富深度与原创张力，完美脱离AI味" },
    { id: "DeepSeek-V3", name: "DeepSeek-V3 (极速大语言模型)", provider: "DeepSeek", desc: "超低廉极智写作模型，综合编排及事实性极好" },
    { id: "Kimi", name: "Kimi 智能主笔 (月之暗面核心)", provider: "Kimi", desc: "适合一次性搜集长篇素材，主笔语气接地实用" },
    { id: "Bailian", name: "通义千问 Max (百炼旗舰大作)", provider: "Bailian", desc: "阿里明星引擎，成语典故极好，适合商业评论与中式叙事" },
    { id: "Volcengine", name: "火山引擎豆包 (Pro版智能)", provider: "Volcengine", desc: "字节精品引擎，词汇地道、富有烟火气、极易与群众共鸣" }
  ];

  if (!ai) {
    return res.json({ success: true, models: defaultModels, source: "default" });
  }

  try {
    const modelsResponse = await ai.models.list();
    let fetchedArray: any[] = [];
    if (Array.isArray(modelsResponse)) {
      fetchedArray = modelsResponse;
    } else if (modelsResponse && Array.isArray((modelsResponse as any).models)) {
      fetchedArray = (modelsResponse as any).models;
    } else if (modelsResponse && typeof (modelsResponse as any)[Symbol.iterator] === 'function') {
      fetchedArray = Array.from(modelsResponse as any);
    } else if (modelsResponse && typeof (modelsResponse as any)[Symbol.asyncIterator] === 'function') {
      for await (const m of (modelsResponse as any)) {
        fetchedArray.push(m);
      }
    }

    if (fetchedArray && fetchedArray.length > 0) {
      const geminiFetchedList = fetchedArray
        .filter(m => {
          const name = (m.name || m.id || "").toLowerCase();
          return name.includes("gemini") && !name.includes("vision") && !name.includes("embedding") && !name.includes("image");
        })
        .map(m => {
          const rawId = m.name?.startsWith("models/") ? m.name.replace("models/", "") : (m.name || m.id || "");
          const displayName = m.displayName || rawId;
          return {
            id: rawId,
            name: `${displayName} (API 实时机型)`,
            provider: "Gemini",
            desc: `通过您的私有 Key 调取的最新可用机型。输入上限: ${m.inputTokenLimit || "32k"} Tokens`
          };
        });

      if (geminiFetchedList.length > 0) {
        const nonGemini = defaultModels.filter(m => m.provider !== "Gemini");
        return res.json({ success: true, models: [...geminiFetchedList, ...nonGemini], source: "api" });
      }
    }
  } catch (err: any) {
    console.warn("Retrieved dynamically list error (using high quality fallbacks preset):", err.message || err);
  }

  return res.json({ success: true, models: defaultModels, source: "fallback" });
});

// 6.6 Retrieve Latest Models BY PROVIDER (各平台独立拉取最新机型)
app.post("/api/models/list-by-provider", async (req, res) => {
  const { provider } = req.body;
  if (!provider) {
    return res.status(400).json({ error: "未指定大模型厂商主体" });
  }

  let apiKey = "";
  if (provider === "Gemini") {
    apiKey = (req.headers["x-gemini-api-key"] as string) || "";
  } else if (provider === "Claude-3.5" || provider === "Claude") {
    apiKey = (req.headers["x-claude-api-key"] as string) || "";
  } else if (provider === "ChatGPT" || provider === "OpenAI") {
    apiKey = (req.headers["x-openai-api-key"] as string) || "";
  } else if (provider === "DeepSeek") {
    apiKey = (req.headers["x-deepseek-api-key"] as string) || "";
  } else if (provider === "Kimi") {
    apiKey = (req.headers["x-kimi-api-key"] as string) || "";
  } else if (provider === "Bailian") {
    apiKey = (req.headers["x-bailian-api-key"] as string) || "";
  } else if (provider === "Volcengine") {
    apiKey = (req.headers["x-volcengine-api-key"] as string) || "";
  }

  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(400).json({ error: `您尚未提供 ${provider} 的专属 API 密钥！本系统不支持免 Key 获取，请先填入并保存后再试。` });
  }

  try {
    if (provider === "Gemini") {
      const ai = getAiClient(apiKey);
      if (!ai) {
        throw new Error("GoogleGenAI 客户端初始化失败");
      }
      const modelsResponse = await ai.models.list();
      let fetchedArray: any[] = [];
      if (Array.isArray(modelsResponse)) {
        fetchedArray = modelsResponse;
      } else if (modelsResponse && Array.isArray((modelsResponse as any).models)) {
        fetchedArray = (modelsResponse as any).models;
      } else if (modelsResponse && typeof (modelsResponse as any)[Symbol.iterator] === 'function') {
        fetchedArray = Array.from(modelsResponse as any);
      } else if (modelsResponse && typeof (modelsResponse as any)[Symbol.asyncIterator] === 'function') {
        for await (const m of (modelsResponse as any)) {
          fetchedArray.push(m);
        }
      }

      const geminiFetchedList = fetchedArray
        .filter(m => {
          const name = (m.name || m.id || "").toLowerCase();
          return name.includes("gemini") && !name.includes("vision") && !name.includes("embedding") && !name.includes("image");
        })
        .map(m => {
          const rawId = m.name?.startsWith("models/") ? m.name.replace("models/", "") : (m.name || m.id || "");
          const displayName = m.displayName || rawId;
          return {
            id: rawId,
            name: `${displayName} (API 实时)`,
            provider: "Gemini",
            desc: `动态更新的极智大模型，推荐使用。Token上限: ${m.inputTokenLimit || "32k"}`
          };
        });

      if (geminiFetchedList.length > 0) {
        return res.json({ success: true, models: geminiFetchedList });
      } else {
        throw new Error("Gemini API 未返回有效的对话类模型");
      }
    }

    if (provider === "ChatGPT") {
      const resp = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`
        }
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OpenAI API 响应错误 code ${resp.status}: ${text}`);
      }
      const data: any = await resp.json();
      if (data.data && Array.isArray(data.data)) {
        const list = data.data
          .filter((m: any) => {
            const name = (m.id || "").toLowerCase();
            return (name.startsWith("gpt-") || name.startsWith("o1-") || name.startsWith("o3-")) && !name.includes("realtime") && !name.includes("audio") && !name.includes("instruct") && !name.includes("vision");
          })
          .map((m: any) => ({
            id: m.id,
            name: `${m.id} (GPT 官方 API)`,
            provider: "ChatGPT",
            desc: "您的 OpenAI 钱包下动态检索到的可用模型"
          }));
        if (list.length > 0) {
          return res.json({ success: true, models: list });
        }
      }
      return res.json({
        success: true,
        models: [
          { id: "gpt-4o", name: "gpt-4o (GPT-4o 顶流通用)", provider: "ChatGPT", desc: "OpenAI 官方通用多模态旗舰机型" },
          { id: "gpt-4o-mini", name: "gpt-4o-mini (GPT-4o 极速轻量)", provider: "ChatGPT", desc: "OpenAI 极快轻量机型选项" },
          { id: "o1-mini", name: "o1-mini (o1 级推理轻化)", provider: "ChatGPT", desc: "OpenAI 高效逻辑推理引擎" },
          { id: "o3-mini", name: "o3-mini (o3 级多维度推理)", provider: "ChatGPT", desc: "OpenAI 最新推理旗舰" }
        ]
      });
    }

    if (provider === "Claude-3.5") {
      try {
        const resp = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01"
          }
        });
        if (resp.ok) {
          const data: any = await resp.json();
          if (data.data && Array.isArray(data.data)) {
            const list = data.data.map((m: any) => ({
              id: m.id,
              name: `${m.display_name || m.id} (Claude 官方)`,
              provider: "Claude-3.5",
              desc: "从 Anthropic 实时拉取的对话推文主笔机型"
            }));
            if (list.length > 0) {
              return res.json({ success: true, models: list });
            }
          }
        }
      } catch (err) {}
      return res.json({
        success: true,
        models: [
          { id: "claude-3-5-sonnet-latest", name: "claude-3-5-sonnet-latest (Claude 3.5 旗舰)", provider: "Claude-3.5", desc: "Anthropic 旗舰主力，写作大词烟火气顶级平衡" },
          { id: "claude-3-5-haiku-latest", name: "claude-3-5-haiku-latest (Claude 3.5 极速)", provider: "Claude-3.5", desc: "Anthropic 高性能轻快流畅主笔" },
          { id: "claude-3-opus-latest", name: "claude-3-opus-latest (Claude 3 至尊)", provider: "Claude-3.5", desc: "Claude 至高逻辑与大格局思考者" }
        ]
      });
    }

    if (provider === "DeepSeek") {
      try {
        const resp = await fetch("https://api.deepseek.com/models", {
          headers: {
            "Authorization": `Bearer ${apiKey.trim()}`
          }
        });
        if (resp.ok) {
          const data: any = await resp.json();
          if (data.data && Array.isArray(data.data)) {
            const list = data.data.map((m: any) => {
              const cleanedId = m.id;
              let dispName = cleanedId === "deepseek-chat" ? "DeepSeek V3 (极速智写)" : cleanedId === "deepseek-reasoner" ? "DeepSeek R1 (逻辑推理)" : cleanedId;
              let finalName = dispName !== cleanedId ? `${dispName} (${cleanedId})` : cleanedId;
              return {
                id: cleanedId,
                name: finalName,
                provider: "DeepSeek",
                desc: `DeepSeek 官方提供的在线机型。`
              };
            });
            if (list.length > 0) {
              return res.json({ success: true, models: list });
            }
          }
        }
      } catch (err) {}
      return res.json({
        success: true,
        models: [
          { id: "DeepSeek-R1", name: "DeepSeek R1 (满血版官方推理)", provider: "DeepSeek", desc: "深度强化推理思考，脱敏去AI味极其优异" },
          { id: "DeepSeek-V3", name: "DeepSeek V3 (极速智写)", provider: "DeepSeek", desc: "极速满血V3，综合编排与事实性极好" }
        ]
      });
    }

    if (provider === "Kimi") {
      try {
        const resp = await fetch("https://api.moonshot.cn/v1/models", {
          headers: {
            "Authorization": `Bearer ${apiKey.trim()}`
          }
        });
        if (resp.ok) {
          const data: any = await resp.json();
          if (data.data && Array.isArray(data.data)) {
            const list = data.data.map((m: any) => ({
              id: m.id,
              name: `${m.id} (Kimi 助手)`,
              provider: "Kimi",
              desc: "月之暗面大语言模型"
            }));
            if (list.length > 0) {
              return res.json({ success: true, models: list });
            }
          }
        }
      } catch (err) {}
      return res.json({
        success: true,
        models: [
          { id: "moonshot-v1-8k", name: "moonshot-v1-8k (标准型)", provider: "Kimi", desc: "8k token 上下文 Kimi 大脑" },
          { id: "moonshot-v1-32k", name: "moonshot-v1-32k (长文本)", provider: "Kimi", desc: "32k 长篇素材搜集主笔" },
          { id: "moonshot-v1-128k", name: "moonshot-v1-128k (至尊型)", provider: "Kimi", desc: "极长专业著作阅读与写作主笔" }
        ]
      });
    }

    if (provider === "Bailian") {
      try {
        const resp = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/models", {
          headers: {
            "Authorization": `Bearer ${apiKey.trim()}`
          }
        });
        if (resp.ok) {
          const data: any = await resp.json();
          if (data.data && Array.isArray(data.data)) {
            const list = data.data
              .filter((m: any) => m.id.includes("qwen") || m.id.includes("llama") || m.id.includes("deepseek"))
              .map((m: any) => {
                let dispName = m.id;
                if (m.id === "qwen-max" || m.id === "qwen-max-latest") dispName = "Qwen Max (百炼旗舰)";
                else if (m.id === "qwen-plus" || m.id === "qwen-plus-latest") dispName = "Qwen Plus (百炼增强)";
                else if (m.id === "qwen-turbo" || m.id === "qwen-turbo-latest") dispName = "Qwen Turbo (极速千问)";
                else if (m.id === "qwen-long") dispName = "Qwen Long (超长文本)";
                else if (m.id === "qwen-omni-turbo") dispName = "Qwen Omni Turbo (多模态极速)";
                else if (m.id === "deepseek-r1") dispName = "DeepSeek R1 (通义百炼部署)";
                else if (m.id === "deepseek-v3") dispName = "DeepSeek V3 (通义百炼极速)";
                
                return {
                  id: m.id,
                  name: dispName !== m.id ? `${dispName} (${m.id})` : `${m.id} (官方大模型)`,
                  provider: "Bailian",
                  desc: "阿里云百炼大模型平台官方可用机型"
                };
              });
            if (list.length > 0) {
              return res.json({ success: true, models: list });
            }
          }
        }
      } catch (err) {}
      return res.json({
        success: true,
        models: [
          { id: "qwen-max", name: "Qwen Max (百炼通义千问旗舰)", provider: "Bailian", desc: "万亿参数超强逻辑，适合中国本土古典文化润色" },
          { id: "qwen-plus", name: "Qwen Plus (通义千问增强)", provider: "Bailian", desc: "极致性价比与多应用场景的平衡" },
          { id: "qwen-turbo", name: "Qwen Turbo (极速千问)", provider: "Bailian", desc: "一闪而至的响应时间" }
        ]
      });
    }

    if (provider === "Volcengine") {
      return res.json({
        success: true,
        models: [
          { id: "doubao-pro-4k", name: "doubao-pro-4k (火山旗舰)", provider: "Volcengine", desc: "字节精品大模型，更亲切且高频交互" },
          { id: "doubao-pro-32k", name: "doubao-pro-32k (火山长文)", provider: "Volcengine", desc: "支持海量新媒体原始线索，去AI味效果好" },
          { id: "doubao-lite-4k", name: "doubao-lite-4k (火山轻量)", provider: "Volcengine", desc: "秒级输出响应，快速迭代灵感选题" }
        ]
      });
    }

    throw new Error(`未支持的厂商: ${provider}`);
  } catch (err: any) {
    console.error(`Dynamic fetch error on ${provider}:`, err);
    return res.status(500).json({ error: `无法获取 ${provider} 系列模型: ${err.message || err}` });
  }
});

// 7. Dynamic Image Generation / Selection (大模型配图生成)
app.post("/api/image/generate", async (req, res) => {
  const { prompt, model = "gemini-imagen", aspectRatio = "1:1" } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "您必须输入生图片指令 Prompt" });
  }

  const customKey = req.headers["x-gemini-api-key"] as string | undefined;
  const customOpenAiKey = req.headers["x-openai-api-key"] as string | undefined;
  const customVolcengineKey = req.headers["x-volcengine-api-key"] as string | undefined;
  const customStabilityKey = req.headers["x-stability-api-key"] as string | undefined;

  // Let's enforce that users must supply their private Keys depending on model selected
  if (model === "gpt-image") {
    if (!customOpenAiKey || customOpenAiKey.trim() === "") {
      return res.status(400).json({ error: "您尚未配置 OpenAI (DALL-E 3) API 密钥，拒绝调用图文配图生图功能！请导入秘钥保存后再生图。" });
    }

    try {
      const gptRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customOpenAiKey.trim()}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `A beautiful WeChat public account article editorial flat simple illustration art: ${prompt}`,
          n: 1,
          size: aspectRatio === "16:9" ? "1792x1024" : "1024x1024"
        })
      });

      if (!gptRes.ok) {
        const errText = await gptRes.text();
        return res.status(400).json({ error: `DALL-E 3 绘图错误: ${errText}` });
      }

      const gptData: any = await gptRes.json();
      if (gptData.data && gptData.data[0] && gptData.data[0].url) {
        return res.json({ success: true, imageUrl: gptData.data[0].url, model: "DALL-E 3 绘图器" });
      }
      return res.status(500).json({ error: "OpenAI 接口未返回有效的链接结构。" });
    } catch (err: any) {
      return res.status(400).json({ error: `DALL-E 3 网络连接失败: ${err.message || err}` });
    }
  }

  if (model === "sd-xl") {
    if (!customStabilityKey || customStabilityKey.trim() === "") {
      return res.status(400).json({ error: "您尚未配置 Stability AI (SDXL) 专有密钥，拒绝生图！请配置保存后重试。" });
    }

    try {
      const sdRes = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customStabilityKey.trim()}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          text_prompts: [
            { text: `WeChat blog post flat modern illustration card design: ${prompt}`, weight: 1.0 }
          ],
          cfg_scale: 7,
          height: 1024,
          width: aspectRatio === "16:9" ? 1792 : 1024,
          samples: 1,
          steps: 25
        })
      });

      if (!sdRes.ok) {
        const errText = await sdRes.text();
        return res.status(400).json({ error: `Stability API 生成有误: ${errText}` });
      }

      const sdData: any = await sdRes.json();
      if (sdData.artifacts && sdData.artifacts[0] && sdData.artifacts[0].base64) {
        const imageUrl = `data:image/png;base64,${sdData.artifacts[0].base64}`;
        return res.json({ success: true, imageUrl, model: "Stable Diffusion XL" });
      }
      return res.status(500).json({ error: "Stability SDK 没有返回有效基。 " });
    } catch (err: any) {
      return res.status(400).json({ error: `SDXL 联通失败: ${err.message || err}` });
    }
  }

  if (model === "volc-image") {
    if (!customVolcengineKey || customVolcengineKey.trim() === "") {
      return res.status(400).json({ error: "您尚未配置 Volcano (火山文生图) 专有密钥授权地址，拒绝生图！" });
    }

    try {
      const volcRes = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customVolcengineKey.trim()}`
        },
        body: JSON.stringify({
          model: "doubao-xl-image",
          prompt,
          size: aspectRatio === "16:9" ? "1792x1024" : "1024x1024"
        })
      });

      if (!volcRes.ok) {
        const errText = await volcRes.text();
        return res.status(400).json({ error: `火山图文引擎出错: ${errText}` });
      }

      const volcData: any = await volcRes.json();
      if (volcData.data && volcData.data[0]) {
        const u = volcData.data[0].url || volcData.data[0].b64_image;
        if (u) {
          return res.json({ success: true, imageUrl: u, model: "火山豆包图像专家" });
        }
      }
      return res.status(500).json({ error: "火山大模型未返回图层地址。" });
    } catch (err: any) {
      return res.status(400).json({ error: `火山引擎访问中断: ${err.message || err}` });
    }
  }

  // default / gemini-imagen
  if (!customKey || customKey.trim() === "" || customKey === "MY_GEMINI_API_KEY") {
    return res.status(400).json({ error: "您尚未在设置中绑定 Google Gemini (Imagen 3) 密钥，系统拒绝调用生图资源通道。" });
  }

  const ai = getAiClient(customKey);
  if (!ai) {
    return res.status(400).json({ error: "Imagen 引擎包生成连接器异常，请检查 Key 的真性。" });
  }

  try {
    const resImg = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: `Create a professional flat vector modern cover illustration for WeChat blog post, minimalist style, beautiful lighting, solid focus on: ${prompt}` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any || "1:1"
        }
      }
    });

    if (resImg && resImg.candidates && resImg.candidates[0].content.parts) {
      for (const part of resImg.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          return res.json({ success: true, imageUrl, model: "Gemini Imagen 3" });
        }
      }
    }
    return res.status(500).json({ error: "Imagen 未能输出合法的图片字节流。 " });
  } catch (err: any) {
    return res.status(400).json({ error: `Imagen 3 引擎呼叫限流或出错: ${err.message || err}` });
  }
});

// Export the app for Vercel Serverless
export default app;

// Start express static listener only if not running in Vercel Serverless environment
async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    // Use string concatenation to hide the import from static analyzers (esbuild / Vercel)
    const vitePkg = "vite";
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`WECHAT CREATOR RUNNING ON HOST 0.0.0.0 PORT ${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}
