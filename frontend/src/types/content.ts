export type ArticleStatus = "draft" | "published" | "scheduled";

export type ArticleSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  status: ArticleStatus;
  updatedAt: string;
  readTime: string;
  kicker?: string;
  linkedProject?: string;
  coverImage?: string;
  coverAlt?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "super admin" | "editor" | "author";
  status: "active" | "offline";
  lastLogin: string;
};

export type LabModule = {
  id: string;
  title: string;
  description: string;
  tone: "cyan" | "purple" | "green" | "amber" | "rose" | "neutral";
  status: string;
  adminOnly?: boolean;
};

export type LabActivity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "cyan" | "purple" | "green" | "amber" | "rose" | "neutral";
};

export type ProjectSite = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  status: "building" | "live" | "research";
  tone: "cyan" | "purple" | "green" | "amber" | "rose" | "neutral";
  updatedAt: string;
  href: string;
  sections: string[];
};
