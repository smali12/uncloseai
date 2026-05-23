const BASE_URL = "https://aibackend-production-5e6b.up.railway.app";

export interface User {
  id: string;
  email: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_archived: boolean;
  is_pinned: boolean;
  folder: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  model: string | null;
  created_at: string;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  fetch_url: string;
  source_type: "user_upload" | "sandbox_output";
}


export interface ToolCall {
  type: "tool_call";
  tool: string;
  args?: Record<string, unknown>;
  result: {
    success: boolean;
    content?: string;
    stdout?: string;
    stderr?: string;
    exit_code?: number;
    error?: string;
    execution_time_ms?: number;
    artifacts?: string[];
  };
}

export interface SandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  error: string | null;
  execution_time_ms: number;
  artifacts: string[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: string;
}

export interface SessionStatus {
  conversation_id: string;
  status: "active" | "expired" | "not_found";
  created_at?: string;
  last_used?: string;
  expires_at?: string;
}

export interface InstallResult {
  success: boolean;
  output: string;
  error: string | null;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  requires_sandbox: boolean;
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_id");
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Attempt to refresh the access token.
   * If a refresh is already in-flight, subsequent calls share the same promise
   * so we don't send multiple refresh requests concurrently.
   */
  private async attemptTokenRefresh(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      if (!this.refreshToken) throw new Error("No refresh token available");
      const data = await this.rawRequest<{
        access_token: string;
        refresh_token: string;
      }>(`/auth/refresh?refresh_token=${this.refreshToken}`, {
        method: "POST",
      });
      this.setTokens(data.access_token, data.refresh_token);
    })();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Low-level fetch wrapper with no auth or retry logic.
   */
  private async rawRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }

    return res.json();
  }

  /**
   * Authenticated request with automatic 401 → token refresh → retry.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const makeRequest = (): Promise<T> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      return fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      }).then(async (res) => {
        if (!res.ok) {
          if (res.status === 401 && this.refreshToken) {
            // Throw a special marker so the catch block knows to retry
            throw new TokenExpiredError();
          }
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || "Request failed");
        }
        return res.json();
      });
    };

    try {
      return await makeRequest();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        // Try to refresh the token once
        try {
          await this.attemptTokenRefresh();
        } catch {
          // Refresh failed — clear tokens and re-throw the original 401
          this.clearTokens();
          throw new Error("Session expired. Please sign in again.");
        }
        // Retry the original request with the new token
        return makeRequest();
      }
      throw error;
    }
  }

  // ── Auth ──

  async signUp(email: string, password: string) {
    return this.rawRequest<{ message: string; user: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async signIn(email: string, password: string) {
    const data = await this.rawRequest<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.access_token, data.refresh_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_id", data.user);
    }
    return data;
  }

  async signOut() {
    try {
      await this.rawRequest("/auth/signout", { method: "POST" });
    } finally {
      this.clearTokens();
    }
  }

  // ── Conversations ──

  async listConversations() {
    return this.request<Conversation[]>("/conversations/");
  }

  async getConversation(id: string) {
    return this.request<{ conversation: Conversation; messages: Message[] }>(
      `/conversations/${id}`
    );
  }

  async createConversation(title: string, model = "hermes") {
    return this.request<Conversation>("/conversations/", {
      method: "POST",
      body: JSON.stringify({ title, model }),
    });
  }

  async renameConversation(id: string, title: string) {
    return this.request<Conversation>(`/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(id: string) {
    return this.request<{ message: string }>(`/conversations/${id}`, {
      method: "DELETE",
    });
  }

  // ── Files ──

  async uploadFile(file: File, conversationId: string): Promise<FileAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversation_id", conversationId);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${BASE_URL}/files/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Upload failed");
    }

    return res.json();
  }

  async getConversationFiles(
    conversationId: string
  ): Promise<FileAttachment[]> {
    return this.request<FileAttachment[]>(
      `/files/conversation/${conversationId}`
    );
  }

  // ── Sandbox / Code Execution ──

  async executeSandbox(
    conversationId: string,
    code: string,
    language: "python" | "javascript" | "bash" | "html" | "react" = "python",
    timeout = 60
  ): Promise<SandboxResult> {
    return this.request<SandboxResult>("/sandbox/execute", {
      method: "POST",
      body: JSON.stringify({
        conversation_id: conversationId,
        code,
        language,
        timeout,
      }),
    });
  }

  async installPackages(
    conversationId: string,
    type: "pip" | "npm",
    packages: string[],
    timeout = 120
  ): Promise<InstallResult> {
    return this.request<InstallResult>("/sandbox/install", {
      method: "POST",
      body: JSON.stringify({
        conversation_id: conversationId,
        type,
        packages,
        timeout,
      }),
    });
  }

  async getSessionStatus(conversationId: string): Promise<SessionStatus> {
    return this.request<SessionStatus>(`/sandbox/session/${conversationId}`);
  }

  async destroySession(conversationId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/sandbox/session/${conversationId}`,
      { method: "DELETE" }
    );
  }

  getSandboxArtifactUrl(conversationId: string, path: string): string {
    return `${BASE_URL}/sandbox/artifacts/${conversationId}/${path}`;
  }

  // ── Tools ──

  async listTools(): Promise<ToolDef[]> {
    return this.request<ToolDef[]>("/tools/");
  }

  async getToolDetail(toolName: string): Promise<ToolDef> {
    return this.request<ToolDef>(`/tools/${toolName}`);
  }

  async getOpenAIToolSpec(): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>("/tools/spec/openai");
  }
}

/**
 * Internal error class used to signal a 401 that should trigger a token
 * refresh and retry.  Not exported — consumers always see a normal Error.
 */
class TokenExpiredError extends Error {
  constructor() {
    super("Token expired");
    this.name = "TokenExpiredError";
  }
}

export const api = new ApiClient();