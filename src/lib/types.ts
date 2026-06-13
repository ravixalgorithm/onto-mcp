/* Response shapes from the Onto Read API. These mirror onto-api/app/v1/*.
 * If the API shape changes, update here. */

export interface ReadResponse {
  status: 'success';
  url: string;
  markdown: string;
  metadata: {
    title: string;
    description: string;
    language?: string;
  };
  stats: {
    raw_html_size_kb: number;
    markdown_size_kb: number;
    reduction_percent: number;
    extraction_time_ms: number;
  };
  cache: {
    hit: boolean;
    ttl_seconds: number;
  };
}

export interface Recommendation {
  title?: string;
  description?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  [key: string]: unknown;
}

export interface ScoreResponse {
  status: 'success';
  url: string;
  aio_score: number;
  grade: string;
  hallucination_risk: 'low' | 'medium' | 'high';
  insights: Record<string, boolean>;
  penalties: string[];
  benefits: string[];
  recommendations: Recommendation[];
  stats: {
    raw_size: string;
    efficiency: string;
    extraction_time_ms: number;
  };
  bot_preview?: unknown;
}

export interface ReadAndScoreResponse {
  status: 'success';
  url: string;
  markdown: string;
  metadata: {
    title: string;
    description: string;
    language?: string;
  };
  aio_score: number;
  grade: string;
  hallucination_risk: 'low' | 'medium' | 'high';
  insights: Record<string, boolean>;
  penalties: string[];
  benefits: string[];
  recommendations: Recommendation[];
  stats: {
    raw_html_size_kb: number;
    markdown_size_kb: number;
    reduction_percent: number;
    extraction_time_ms: number;
  };
  cache: {
    hit: boolean;
    ttl_seconds: number;
  };
}

export interface BatchResult {
  url: string;
  ok: boolean;
  error?: { code: string; message: string };
  title?: string;
  aio_score?: number;
  grade?: string;
  hallucination_risk?: 'low' | 'medium' | 'high';
  reduction_percent?: number;
  markdown?: string;
  structured?: {
    jsonLd: unknown[];
    openGraph: Record<string, string>;
    meta: Record<string, string>;
  };
  counts?: { json_ld: number; open_graph: number; meta: number };
}

export interface BatchResponse {
  status: 'success';
  mode: 'read' | 'read-and-score' | 'extract';
  source: 'urls' | 'site';
  requested: number;
  succeeded: number;
  results: BatchResult[];
  cache: { hit: boolean; ttl_seconds: number };
}

export interface MapResponse {
  status: 'success';
  url: string;
  source: 'sitemap' | 'links';
  count: number;
  urls: string[];
  cache: { hit: boolean; ttl_seconds: number };
}

export interface ExtractResponse {
  status: 'success';
  url: string;
  title: string;
  aio_score: number;
  grade: string;
  hallucination_risk: 'low' | 'medium' | 'high';
  structured: {
    jsonLd: unknown[];
    openGraph: Record<string, string>;
    meta: Record<string, string>;
  };
  counts: { json_ld: number; open_graph: number; meta: number };
  cache: { hit: boolean; ttl_seconds: number };
}

export interface ApiErrorBody {
  status: 'error';
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
