export interface NewsItem {
  title: string;
  hotVal: string;
  source: string;
  summary: string;
  category: string;
}

export interface TopicAngle {
  angle: string;
  audience: string;
  hook: string;
  rationale: string;
  outline: string[];
}

export interface ArticleDraft {
  id: string;
  title: string;
  content: string; // Markdown formatted Content
  author: string;
  createdTime: string;
  lastUpdated: string;
  topicAngle?: string;
  selectedTemplateId: string;
  model: string;
  imageModel: string;
  style: string;
  wordCount: string;
  ctaText?: string;
  images?: string[]; // Array of base64 images generated
}

export interface ViralTitle {
  tag: string;
  title: string;
}

export interface ReviewFinding {
  original: string;
  clicheDesc: string;
  improved: string;
}

export interface ReviewResult {
  aiScore: number;
  verdict: string;
  findings: ReviewFinding[];
}

export type ThemeStyle = "专业" | "幽默" | "严肃";
export type WordCountOption = "800" | "1500" | "3000";

export interface FormattingTemplate {
  id: string;
  name: string;
  desc: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  customHeadingStyle: string; // css inline style for h2
  customQuoteStyle: string;   // css inline style for blockquote
  customTextStyle: string;   // css inline style for general text
  customStrongStyle: string;  // css inline style for strong
}
