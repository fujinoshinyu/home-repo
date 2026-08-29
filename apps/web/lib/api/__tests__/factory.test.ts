import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJsonClient, createBinaryClient } from '../factory';

describe('createJsonClient', () => {
  let client: ReturnType<typeof createJsonClient>;

  beforeEach(() => {
    client = createJsonClient('http://localhost:3000');
    vi.restoreAllMocks();
  });

  it('should make GET request and return JSON', async () => {
    const mockData = { documents: [], total: 0 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const result = await client.get('/documents');

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/documents' }),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
    expect(result).toEqual(mockData);
  });

  it('should make POST request with body', async () => {
    const mockResponse = { answer: 'test', sources: [] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await client.post('/rag/query', { question: 'test' });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/rag/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ question: 'test' }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(client.get('/error')).rejects.toThrow('GET /error failed: 500');
  });
});

describe('createBinaryClient', () => {
  let client: ReturnType<typeof createBinaryClient>;

  beforeEach(() => {
    client = createBinaryClient('http://localhost:3000');
    vi.restoreAllMocks();
  });

  it('should upload file via FormData', async () => {
    const mockFile = new File(['content'], 'test.md', { type: 'text/markdown' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', filename: 'test.md' }),
    }));

    await client.upload('/documents/upload', mockFile);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/documents/upload',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should download file as Blob', async () => {
    const mockBlob = new Blob(['file content']);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    }));

    const result = await client.download('/documents/1');

    expect(result).toBe(mockBlob);
  });
});
