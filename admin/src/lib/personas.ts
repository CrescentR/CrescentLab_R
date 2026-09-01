import type { PersonaRole } from "@/store/uiStore";

export type Persona = {
  id: PersonaRole;
  name: string;
  label: string;
  email: string;
  initials: string;
  description: string;
  canEnterAdmin: boolean;
};

export const personas: Record<PersonaRole, Persona> = {
  guest: {
    id: "guest",
    name: "访客",
    label: "Guest",
    email: "not signed in",
    initials: "GU",
    description: "浏览公开文章、项目子站和实验记录。登录后可以订阅更新、参与评论并收藏内容。",
    canEnterAdmin: false,
  },
  member: {
    id: "member",
    name: "读者成员",
    label: "Member",
    email: "reader@crescentlab.dev",
    initials: "ME",
    description: "拥有阅读、评论、订阅和个人资料能力，可以把文章、项目与实验动态收进自己的阅读线索。",
    canEnterAdmin: false,
  },
  admin: {
    id: "admin",
    name: "站点管理员",
    label: "Admin",
    email: "admin@crescentlab.dev",
    initials: "AD",
    description: "可以进入后台维护文章、项目子站、媒体、用户、主题、插件和系统设置。",
    canEnterAdmin: true,
  },
};
