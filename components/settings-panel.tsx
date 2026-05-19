"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { api } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Palette, Sliders, Shield, ChevronRight } from "lucide-react";

type SettingsTab = "account" | "appearance" | "models" | "privacy";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "models", label: "Models & Defaults", icon: Sliders },
  { id: "privacy", label: "Privacy", icon: Shield },
];

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-card border-border"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-medium text-foreground tracking-tight">
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left nav */}
          <nav className="w-44 shrink-0 border-r border-border py-3 flex flex-col gap-0.5 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors w-full text-left",
                    activeTab === tab.id
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-6 px-6">
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "models" && <ModelsSettings />}
            {activeTab === "privacy" && <PrivacySettings />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function AccountSettings() {
  const { userId, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateEmail = async () => {
    if (!email) return;
    setLoading(true);
    try {
      setMessage({ type: "success", text: "Email would be updated via API" });
      setEmail("");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update email" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setLoading(true);
    try {
      setMessage({ type: "success", text: "Password would be updated via API" });
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setLoading(true);
    try {
      setMessage({ type: "success", text: "Account would be deleted via API" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete account" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          title="Profile"
          description="Your account information and credentials."
        />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              User ID
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={userId || "—"}
                readOnly
                className="bg-muted/40 border-border text-muted-foreground font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="settings-email"
              className="text-xs text-muted-foreground uppercase tracking-wider font-medium"
            >
              Email address
            </Label>
            <Input
              id="settings-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={handleUpdateEmail}
            disabled={!email || loading}
          >
            Update email
          </Button>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <SectionHeader
          title="Change password"
          description="Update your password to keep your account secure."
        />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="current-password"
              className="text-xs text-muted-foreground uppercase tracking-wider font-medium"
            >
              Current password
            </Label>
            <Input
              id="current-password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="new-password"
              className="text-xs text-muted-foreground uppercase tracking-wider font-medium"
            >
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={handleUpdatePassword}
            disabled={!currentPassword || !newPassword || loading}
          >
            Update password
          </Button>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <SectionHeader
          title="Danger zone"
          description="Irreversible actions. Proceed with caution."
        />
        <div className="rounded-md border border-destructive/30 p-4 bg-destructive/5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Delete account
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs shrink-0"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              Delete account
            </Button>
          </div>
          <div className="flex items-start justify-between gap-4 pt-2 border-t border-destructive/20">
            <div>
              <p className="text-sm font-medium text-foreground">
                Sign out
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign out from all devices.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs shrink-0"
              onClick={signOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-3 rounded-md text-sm",
          message.type === "success"
            ? "bg-green-500/10 text-green-700 border border-green-500/20"
            : "bg-red-500/10 text-red-700 border border-red-500/20"
        )}>
          {message.text}
        </div>
      )}
    </div>
  );
}

function AppearanceSettings() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          title="Theme"
          description="Choose how the interface appears to you."
        />
        <div className="grid grid-cols-3 gap-3">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateSetting("theme", t)}
              className={cn(
                "relative rounded-lg border p-3 transition-colors text-left",
                settings.theme === t
                  ? "border-foreground/40 bg-accent"
                  : "border-border hover:border-border/80 hover:bg-accent/30"
              )}
            >
              <div
                className={cn(
                  "h-10 rounded-md mb-2.5 border",
                  t === "light"
                    ? "bg-white border-gray-200"
                    : t === "dark"
                    ? "bg-[#0a0a0a] border-[#1f1f1f]"
                    : "bg-gradient-to-br from-white to-[#0a0a0a] border-gray-400"
                )}
              />
              <p className="text-xs font-medium text-foreground capitalize">
                {t}
              </p>
              {settings.theme === t && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <SectionHeader title="Typography" description="Adjust text display preferences." />
        <div className="divide-y divide-border">
          <SettingRow
            label="Font size"
            description="Controls the base font size across the interface."
          >
            <Select value={settings.fontSize} onValueChange={(value) => updateSetting("fontSize", value as any)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow
            label="Code block theme"
            description="Syntax highlighting style for code."
          >
            <Select value={settings.codeTheme} onValueChange={(value) => updateSetting("codeTheme", value as any)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="github-dark">GitHub Dark</SelectItem>
                <SelectItem value="monokai">Monokai</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function ModelsSettings() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          title="Default model"
          description="The model used when starting a new conversation."
        />
        <div className="space-y-2">
          {[
            {
              value: "hermes",
              label: "Hermes",
              description: "General purpose, fast responses",
            },
            {
              value: "qwen",
              label: "Qwen Coder",
              description: "Optimized for code generation and analysis",
            },
          ].map((model) => (
            <button
              key={model.value}
              onClick={() => updateSetting("defaultModel", model.value as any)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-left",
                settings.defaultModel === model.value
                  ? "border-foreground/30 bg-accent"
                  : "border-border hover:bg-accent/40"
              )}
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {model.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {model.description}
                </p>
              </div>
              {settings.defaultModel === model.value && (
                <div className="w-2 h-2 rounded-full bg-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <SectionHeader title="Generation" description="Control how responses are generated." />
        <div className="divide-y divide-border">
          <SettingRow
            label="Stream responses"
            description="Show text as it is being generated."
          >
            <Switch
              checked={settings.streamResponses}
              onCheckedChange={(value) => updateSetting("streamResponses", value)}
            />
          </SettingRow>
          <SettingRow
            label="Temperature"
            description="Controls randomness. Lower is more deterministic."
          >
            <Input
              value={settings.temperature}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) updateSetting("temperature", val);
              }}
              className="w-20 h-8 text-xs text-center bg-input border-border"
              type="number"
              min="0"
              max="2"
              step="0.1"
            />
          </SettingRow>
          <SettingRow
            label="Max tokens"
            description="Maximum length of generated responses."
          >
            <Input
              value={settings.maxTokens}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) updateSetting("maxTokens", val);
              }}
              className="w-24 h-8 text-xs text-center bg-input border-border"
              type="number"
              min="256"
              max="8192"
              step="256"
            />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function PrivacySettings() {
  const { settings, updateSetting } = useSettings();

  const handleExport = async () => {
    try {
      const data = {
        settings,
        exportedAt: new Date().toISOString(),
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uncloseai-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[v0] Export failed:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          title="Data & history"
          description="Manage how your conversation data is stored and used."
        />
        <div className="divide-y divide-border">
          <SettingRow
            label="Save conversation history"
            description="Store your chats so you can access them later."
          >
            <Switch 
              checked={settings.saveHistory} 
              onCheckedChange={(value) => updateSetting("saveHistory", value)}
            />
          </SettingRow>
          <SettingRow
            label="Usage analytics"
            description="Share anonymous usage data to help improve the product."
          >
            <Switch 
              checked={settings.analytics} 
              onCheckedChange={(value) => updateSetting("analytics", value)}
            />
          </SettingRow>
          <SettingRow
            label="Allow training use"
            description="Let your conversations be used to improve AI models."
          >
            <Switch
              checked={settings.trainingData}
              onCheckedChange={(value) => updateSetting("trainingData", value)}
            />
          </SettingRow>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <SectionHeader
          title="Data export"
          description="Download a copy of your data."
        />
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
          <div>
            <p className="text-sm font-medium text-foreground">
              Export all settings & data
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download your settings and preferences as JSON.
            </p>
          </div>
          <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={handleExport}>
            Export
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
