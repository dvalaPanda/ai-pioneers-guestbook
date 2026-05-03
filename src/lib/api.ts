import type { ApiState, Note, PickedLocation } from "../types";

class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, payload: unknown, message: string) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!res.ok) {
    const msg =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, payload, msg);
  }
  return payload as T;
}

export async function fetchState(): Promise<ApiState> {
  const res = await fetch("/api/state", { headers: { Accept: "application/json" } });
  return parse<ApiState>(res);
}

export interface CreateVisitorBody extends PickedLocation {
  turnstileToken: string;
}

export interface CreateVisitorResult {
  id: string;
  createdAt: number;
}

export async function createVisitor(body: CreateVisitorBody): Promise<CreateVisitorResult> {
  const res = await fetch("/api/visitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<CreateVisitorResult>(res);
}

export interface CreateNoteBody {
  visitorId: string | null;
  rating: number;
  body: string | null;
  displayName: string;
  emoji: string;
  turnstileToken: string;
}

export async function createNote(body: CreateNoteBody): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<Note>(res);
}

export { ApiError };
