import type { PersonaRole } from "@/store/ui-store";

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
    name: "访客模式",
    label: "Guest",
    email: "not signed in",
    initials: "G",
    description: "可浏览公开内容，登录后解锁评论、订阅和个人中心。",
    canEnterAdmin: false,
  },
  member: {
    id: "member",
    name: "普通用户",
    label: "Member",
    email: "reader@crescentlab.dev",
    initials: "ME",
    description: "可阅读、评论、订阅、维护个人资料，但不能进入后台控制台。",
    canEnterAdmin: false,
  },
  admin: {
    id: "admin",
    name: "管理员",
    label: "Admin",
    email: "admin@crescentlab.dev",
    initials: "AD",
    description: "拥有后台入口，可管理内容、用户、存储、插件、主题和系统设置。",
    canEnterAdmin: true,
  },
};
