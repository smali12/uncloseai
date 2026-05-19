"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";
export type CodeTheme = "default" | "github-dark" | "monokai";

export interface Settings {
  theme: Theme;
  fontSize: FontSize;
  codeTheme: CodeTheme;
  defaultModel: "hermes" | "qwen";
  streamResponses: boolean;
  temperature: number;
  maxTokens: number;
  saveHistory: boolean;
  analytics: boolean;
  trainingData: boolean;
}

export const defaultSettings: Settings = {
  theme: "dark",
  fontSize: "medium",
  codeTheme: "default",
  defaultModel: "hermes",
  streamResponses: true,
  temperature: 0.7,
  maxTokens: 2048,
  saveHistory: true,
  analytics: false,
  trainingData: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error("[v0] Failed to parse settings:", error);
      }
    }
    setIsHydrated(true);
  }, []);

  // Apply theme to HTML element
  useEffect(() => {
    if (!isHydrated) return;
    
    const html = document.documentElement;
    if (settings.theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.toggle("dark", isDark);
    } else {
      html.classList.toggle("dark", settings.theme === "dark");
    }
  }, [settings.theme, isHydrated]);

  // Apply font size to HTML element
  useEffect(() => {
    if (!isHydrated) return;
    
    const html = document.documentElement;
    html.classList.remove("text-sm", "text-base", "text-lg");
    
    if (settings.fontSize === "small") {
      html.classList.add("text-sm");
    } else if (settings.fontSize === "large") {
      html.classList.add("text-lg");
    }
  }, [settings.fontSize, isHydrated]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const updated = { ...prev, [key]: value };
        localStorage.setItem("settings", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.setItem("settings", JSON.stringify(defaultSettings));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
