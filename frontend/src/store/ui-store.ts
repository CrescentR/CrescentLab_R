import { create } from "zustand";

export type ThemeMode = "dark" | "light";
export type PersonaRole = "guest" | "member" | "admin";

type UiState = {
  sidebarCollapsed: boolean;
  theme: ThemeMode;
  activePersona: PersonaRole;
  loginPanelOpen: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  setTheme: (value: ThemeMode) => void;
  toggleTheme: () => void;
  setActivePersona: (value: PersonaRole) => void;
  setLoginPanelOpen: (value: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  theme: "dark",
  activePersona: "guest",
  loginPanelOpen: false,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setTheme: (value) => set({ theme: value }),
  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setActivePersona: (value) => set({ activePersona: value, loginPanelOpen: false }),
  setLoginPanelOpen: (value) => set({ loginPanelOpen: value }),
}));
