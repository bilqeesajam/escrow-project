import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "http://localhost:8000";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function backendRequest<T>(path: string, options?: { method?: string; body?: unknown }) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options?.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text ? { detail: text } : null;
  }

  if (!res.ok) {
    throw new Error(data?.error ?? data?.detail ?? "Request failed");
  }

  return data as T;
}
