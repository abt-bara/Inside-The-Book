import apiConfig from "../../../shared/api-config.json";
import type { Book } from "../types/Book";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  role: string;
  name: string;
  username: string;
  username_status: boolean;
  pwd_status: boolean;
}

export interface HealthResponse {
  status: string;
}

export interface BookUpdateFields {
  title?: string;
  author?: string;
  editor?: string;
  distributor?: string;
  description?: string;
  year?: string;
  new?: boolean;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class UserServices {
  private get bookPath(): string {
    return apiConfig.api.book;
  }

  private async request(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    const response = await fetch(`${apiConfig.apiPrefix}${path}`, init);
    if (!response.ok) {
      const message = await response.text();
      throw new ApiError(
        message || response.statusText || `Request failed (${response.status}).`,
        response.status,
      );
    }
    return response;
  }

  async getBooks(signal?: AbortSignal): Promise<Book[]> {
    const response = await this.request(apiConfig.api.books, { signal });
    return response.json() as Promise<Book[]>;
  }

  async getBook(bookId: number, signal?: AbortSignal): Promise<Book> {
    const path = this.bookPath.replace(
      "{book_id}",
      encodeURIComponent(String(bookId)),
    );
    const response = await this.request(path, { signal });
    return response.json() as Promise<Book>;
  }

  async createBook(formData: FormData): Promise<Book> {
    const response = await this.request(apiConfig.api.books, {
      method: "POST",
      body: formData,
    });
    return response.json() as Promise<Book>;
  }

  async updateBook(
    bookId: number,
    data: BookUpdateFields | FormData,
  ): Promise<Book> {
    const path = this.bookPath.replace(
      "{book_id}",
      encodeURIComponent(String(bookId)),
    );
    const init: RequestInit =
      data instanceof FormData
        ? { method: "PATCH", body: data }
        : {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          };
    const response = await this.request(path, init);
    return response.json() as Promise<Book>;
  }

  async deleteBook(bookId: number): Promise<void> {
    const path = this.bookPath.replace(
      "{book_id}",
      encodeURIComponent(String(bookId)),
    );
    await this.request(path, { method: "DELETE" });
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request(apiConfig.api.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return response.json() as Promise<LoginResponse>;
  }

  async healthCheck(): Promise<HealthResponse> {
    const response = await this.request(apiConfig.api.health);
    return response.json() as Promise<HealthResponse>;
  }
}

const userServices = new UserServices();

export default userServices;
