export type ArticleStatus = "draft" | "published" | "scheduled";

export type ArticleSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  status: ArticleStatus;
  updatedAt: string;
  readTime: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "super admin" | "editor" | "author";
  status: "active" | "offline";
  lastLogin: string;
};
