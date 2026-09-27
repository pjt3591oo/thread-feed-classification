export type Post = {
  shortcode: string;
  text?: string;
  rawText?: string;
  permalink: string;
  username: string;
  politics: "political" | "nonPolitical" | "uncertain";
  aiAuthorship: "suspectedAi" | "noClearEvidence" | "uncertain";
};