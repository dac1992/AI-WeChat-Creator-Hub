import { FormattingTemplate } from "./types";

export const WECHAT_TEMPLATES: FormattingTemplate[] = [
  {
    id: "classic-green",
    name: "优雅古典绿",
    desc: "适合文学、散文、情感美文、中医养生与文化普及类目。静谧沉稳。",
    primaryColor: "#2F5233", // deep botanical green
    secondaryColor: "#D1E2D3", // pale mint
    backgroundColor: "#F4F7F4", // soft background
    fontFamily: "system-ui, -apple-system, sans-serif",
    customHeadingStyle: "color: #2F5233; font-weight: 800; border-left: 6px solid #2F5233; padding-left: 12px; margin-top: 24px; margin-bottom: 16px; font-size: 1.25rem; line-height: 1.6;",
    customQuoteStyle: "background-color: #F4F7F4; border-left: 4px solid #2F5233; padding: 14px 20px; color: #4A5568; margin: 18px 0; font-style: italic; border-radius: 2px;",
    customTextStyle: "color: #2D3748; font-size: 16px; line-height: 1.8; letter-spacing: 0.08em; text-align: justify; margin-bottom: 16px;",
    customStrongStyle: "color: #2F5233; font-weight: bold;"
  },
  {
    id: "minimalist-gray",
    name: "极简高端灰",
    desc: "适合科技创新、建筑设计、极客趋势、精英观点。极致理智，干练清冷。",
    primaryColor: "#1A202C", // charcoal slate
    secondaryColor: "#E2E8F0", // cool gray
    backgroundColor: "#F8FAFC", // slate gray light
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, monospace",
    customHeadingStyle: "color: #1A202C; font-weight: 700; border-bottom: 2px solid #1A202C; padding-bottom: 6px; margin-top: 26px; margin-bottom: 16px; font-size: 1.3rem; letter-spacing: 0.1em;",
    customQuoteStyle: "background-color: #F8FAFC; border-left: 4px solid #718096; padding: 16px; color: #4A5568; margin: 20px 0; font-size: 15px; border-radius: 4px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);",
    customTextStyle: "color: #334155; font-size: 15px; line-height: 1.75; letter-spacing: 0.05em; margin-bottom: 14px;",
    customStrongStyle: "color: #0F172A; font-weight: 800; border-bottom: 1px dashed #64748B;"
  },
  {
    id: "energetic-orange",
    name: "活力暖阳橙",
    desc: "适合职场进阶、商业观察、效率工具、青年社交、干货合集。醒目向上。",
    primaryColor: "#DD6B20", // energetic orange
    secondaryColor: "#FEEBC8", // soft cream orange
    backgroundColor: "#FFFAF0", // sunset ivory
    fontFamily: "system-ui, -apple-system, sans-serif",
    customHeadingStyle: "color: #FFFFFF; font-weight: 700; background-color: #DD6B20; padding: 8px 14px; border-radius: 4px; display: inline-block; margin-top: 24px; margin-bottom: 16px; font-size: 1.15rem;",
    customQuoteStyle: "background-color: #FFFDF9; border: 1px dashed #DD6B20; border-radius: 6px; padding: 16px; color: #4A5568; margin: 18px 0; border-left: 6px solid #DD6B20;",
    customTextStyle: "color: #4A5568; font-size: 16px; line-height: 1.8; letter-spacing: 0.04em; margin-bottom: 16px;",
    customStrongStyle: "color: #DD6B20; font-weight: bold; background-color: #FFF0E6; padding: 1px 4px; border-radius: 3px;"
  },
  {
    id: "cyber-blue",
    name: "科技极客蓝",
    desc: "适合前沿AI研究、编程实战、Web3变局、超级应用。赛博硬朗，科技未来。",
    primaryColor: "#2B6CB0", // tech blue
    secondaryColor: "#EBF8FF", // cool blue ice
    backgroundColor: "#F7FAFC",
    fontFamily: "system-ui, -apple-system, sans-serif",
    customHeadingStyle: "color: #2B6CB0; font-weight: 800; font-style: normal; text-transform: uppercase; border-bottom: 3px double #2B6CB0; padding-bottom: 5px; margin-top: 24px; margin-bottom: 16px; font-size: 1.25rem;",
    customQuoteStyle: "background-color: #EBF8FF; border-radius: 4px; padding: 16px; color: #2D3748; margin: 18px 0; border-left: 4px solid #3182CE; font-family: monospace; font-size: 14px;",
    customTextStyle: "color: #2D3748; font-size: 15.5px; line-height: 1.8; letter-spacing: 0.05em; margin-bottom: 14px;",
    customStrongStyle: "color: #2B6CB0; font-weight: bold;"
  },
  {
    id: "festive-red",
    name: "喜庆华夏红",
    desc: "适合新年祝福、企业喜报、大宗庆典、通知公告。尊贵喜庆，极具亲和力。",
    primaryColor: "#C53030", // oriental red
    secondaryColor: "#FED7D7", // pale scarlet
    backgroundColor: "#FFF5F5",
    fontFamily: "system-ui, -apple-system, serif",
    customHeadingStyle: "color: #C53030; font-weight: 800; text-align: center; border-left: 4px solid #C53030; border-right: 4px solid #C53030; padding: 4px 10px; margin-top: 24px; margin-bottom: 16px; font-size: 1.25rem;",
    customQuoteStyle: "background-color: #FFF5F5; border: 1.5px dashed #C53030; padding: 16px; color: #4A5568; margin: 18px 0; border-radius: 8px; text-align: center;",
    customTextStyle: "color: #2D3748; font-size: 16px; line-height: 1.85; letter-spacing: 0.06em; margin-bottom: 16px;",
    customStrongStyle: "color: #C53030; font-weight: 900;"
  }
];

export const MOCK_CTA_LIST = [
  {
    id: "cta-1",
    name: "标准求三连",
    text: "💡 **写在最后：** 如果你觉得这篇文章能带给你一丁点启发，欢迎**点赞**、**在看**，并分享给身处这轮风潮中的朋友。多一个维度的理性观察，生活就会少一分情绪反噬。关注我们，带你持续探寻认知深处的商业真相。"
  },
  {
    id: "cta-2",
    name: "反思深度粉",
    text: "💬 **深度互动：** 你对今天讨论的这个核心风口持什么态度？你觉得它是改变世界的革命，还是一场收智商税的套利？欢迎在**评论区**写下你的热辣观点，置顶留言将获得资深编辑的一对一深度诊断分析！"
  },
  {
    id: "cta-3",
    name: "成长不迷路",
    text: "🔥 **干货放送：** 拥抱人工智能，拒绝成为技术的盲从者。点击主页**关注我们**并发送暗号「**认知升级**」，即可免费获取我们内部主笔耗时三个月整理的《普通人AI时代破局手册》PDF完整秘笈，数量有限，手慢无！"
  }
];
