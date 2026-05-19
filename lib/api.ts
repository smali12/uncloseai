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

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

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

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

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

  // Auth
  async signUp(email: string, password: string) {
    return this.request<{ message: string; user: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async signIn(email: string, password: string) {
    const data = await this.request<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.access_token, data.refresh_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_id", data.user);
    }
    return data;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) throw new Error("No refresh token");
    const data = await this.request<{
      access_token: string;
      refresh_token: string;
    }>(`/auth/refresh?refresh_token=${this.refreshToken}`, {
      method: "POST",
    });
    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async signOut() {
    try {
      await this.request("/auth/signout", { method: "POST" });
    } finally {
      this.clearTokens();
    }
  }

  // Conversations
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

  // Files
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

  /**
   * @deprecated Prefer using `attachment.fetch_url` returned by the backend.
   */
  getFileUrl(filename: string, type: "uploads" | "sandbox" = "uploads"): string {
    return `${BASE_URL}/files/${type}/${filename}`;
  }

  async getConversationFiles(
    conversationId: string
  ): Promise<FileAttachment[]> {
    return this.request<FileAttachment[]>(
      `/files/conversation/${conversationId}`
    );
  }


  // Sandbox
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
  ) {
    return this.request<{ success: boolean; output: string; error: string | null }>(
      "/sandbox/install",
      {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId,
          type,
          packages,
          timeout,
        }),
      }
    );
  }

  getSandboxArtifactUrl(conversationId: string, path: string): string {
    return `${BASE_URL}/sandbox/artifacts/${conversationId}/${path}`;
  }
}

export const api = new ApiClient();
