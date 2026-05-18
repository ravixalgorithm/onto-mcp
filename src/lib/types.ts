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

export interface ApiErrorBody {
  status: 'error';
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
