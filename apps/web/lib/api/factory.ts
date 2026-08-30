const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// --- JSON Client ---

export function createJsonClient(baseUrl: string = API_URL) {
  return {
    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
      const url = new URL(path, baseUrl);
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      }
      const res = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
      return res.json() as Promise<T>;
    },

    async post<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
      return res.json() as Promise<T>;
    },

    async postStream(path: string, body: unknown): Promise<ReadableStreamDefaultReader<Uint8Array>> {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
      return res.body!.getReader();
    },

    async put<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
      return res.json() as Promise<T>;
    },

    async delete<T>(path: string): Promise<T> {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
      return res.json() as Promise<T>;
    },
  };
}

// --- Binary Client ---

export function createBinaryClient(baseUrl: string = API_URL) {
  return {
    async upload(path: string, file: File, metadata?: Record<string, string>): Promise<Response> {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) {
        Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));
      }
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload ${path} failed: ${res.status}`);
      return res;
    },

    async download(path: string): Promise<Blob> {
      const res = await fetch(`${baseUrl}${path}`);
      if (!res.ok) throw new Error(`Download ${path} failed: ${res.status}`);
      return res.blob();
    },
  };
}

// --- Async Upload Client ---
// POSTでファイル送信 → jobId即座に返却 → ポーリングで完了待ち
// Gateway proxyの120秒タイムアウトを回避するため、同期uploadを非同期ジョブに分割

export interface AsyncUploadOptions {
  pollIntervalMs?: number;
  onProgress?: (completed: number, total: number) => void;
}

export function createAsyncUploadClient(baseUrl: string = API_URL) {
  const jsonClient = createJsonClient(baseUrl);

  return {
    async upload<T>(
      path: string,
      file: File,
      metadata?: Record<string, string>,
      options?: AsyncUploadOptions,
    ): Promise<T> {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) {
        Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));
      }

      const uploadRes = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error(`Upload ${path} failed: ${uploadRes.status}`);
      const { jobId } = (await uploadRes.json()) as { jobId: string };

      const pollInterval = options?.pollIntervalMs ?? 2000;
      const jobsPath = path.replace('/upload', `/jobs/${jobId}`);

      while (true) {
        await new Promise((r) => setTimeout(r, pollInterval));
        const job = await jsonClient.get<{
          id: string;
          status: string;
          totalChunks: number;
          completedChunks: number;
          document: T | null;
          error: string | null;
        }>(jobsPath);

        options?.onProgress?.(job.completedChunks, job.totalChunks);

        if (job.status === 'completed') return job.document!;
        if (job.status === 'failed') throw new Error(job.error ?? 'Upload processing failed');
      }
    },
  };
}
