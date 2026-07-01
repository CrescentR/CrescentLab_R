import type { AdminUser, ArticleSummary } from "@/types/content";

export const articleSummaries: ArticleSummary[] = [
  {
    id: "architecting-the-moonlit-lab",
    title: "Architecting the Moonlit Lab",
    excerpt: "A focused look at glassmorphic CMS workflows, editorial metadata, and high-fidelity typography.",
    category: "Design Systems",
    status: "draft",
    updatedAt: "just now",
    readTime: "6 min",
  },
  {
    id: "storage-policy-playbook",
    title: "Storage Policy Playbook",
    excerpt: "How local storage, object storage, and OneDrive policies can share a single authoring surface.",
    category: "Infrastructure",
    status: "published",
    updatedAt: "2h ago",
    readTime: "8 min",
  },
  {
    id: "quiet-admin-tools",
    title: "Quiet Admin Tools",
    excerpt: "Design notes for dense operational screens that stay legible during repeated daily use.",
    category: "Product",
    status: "scheduled",
    updatedAt: "tomorrow",
    readTime: "4 min",
  },
];

export const adminUsers: AdminUser[] = [
  {
    id: "admin",
    name: "Admin User",
    email: "admin@crescentlab.io",
    role: "super admin",
    status: "active",
    lastLogin: "Just now",
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    email: "schen@crescentlab.io",
    role: "editor",
    status: "active",
    lastLogin: "2h ago",
  },
  {
    id: "alex",
    name: "Alex Mercer",
    email: "alex.m@external.io",
    role: "author",
    status: "offline",
    lastLogin: "3d ago",
  },
];
