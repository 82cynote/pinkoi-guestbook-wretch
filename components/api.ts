import { jsonp } from './jsonp';

export type ApiMessage = {
  id: string;
  author: string;
  content: string;
  timestamp: number;
};

type ListResponse = { ok: true; data: ApiMessage[] } | { ok: false; error: string };

type AddResponse =
  | { ok: true; id: string; timestamp: number }
  | { ok: false; error: string };

const LOCAL_KEY = 'guestbook_messages_local_v1';

function getApiBase(): string | null {
  const raw = import.meta.env.VITE_GUESTBOOK_API_URL;
  return raw && raw.trim() ? raw.trim() : null;
}

function buildUrl(base: string, params: Record<string, string | number | undefined>) {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return;
    u.searchParams.set(k, String(v));
  });
  return u.toString();
}

function getClientId(): string {
  const key = 'guestbook_client_id_v1';
  const existed = localStorage.getItem(key);
  if (existed) return existed;
  const created = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key, created);
  return created;
}

function loadLocal(): ApiMessage[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .map((m) => ({
        id: String(m?.id || ''),
        author: String(m?.author || ''),
        content: String(m?.content || ''),
        timestamp: Number(m?.timestamp || 0),
      }))
      .filter((m) => m.id && m.author && m.content && Number.isFinite(m.timestamp));
  } catch {
    return [];
  }
}

function saveLocal(data: ApiMessage[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data.slice(-500)));
}

export async function listMessages(limit = 200): Promise<ApiMessage[]> {
  const base = getApiBase();
  if (!base) {
    const local = loadLocal();
    return local
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit);
  }

  const url = buildUrl(base, {
    action: 'list',
    limit,
  });

  const res = await jsonp<ListResponse>(url);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export async function addMessage(author: string, content: string): Promise<{ id: string; timestamp: number }> {
  const base = getApiBase();
  if (!base) {
    const ts = Date.now();
    const id = `${ts}_${Math.floor(Math.random() * 1e6)}`;
    const next = [...loadLocal(), { id, author, content, timestamp: ts }];
    saveLocal(next);
    return { id, timestamp: ts };
  }

  const url = buildUrl(base, {
    action: 'add',
    author,
    content,
    clientId: getClientId(),
  });

  const res = await jsonp<AddResponse>(url);
  if (!res.ok) throw new Error(res.error);
  return { id: res.id, timestamp: res.timestamp };
}
