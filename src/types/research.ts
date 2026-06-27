export type ResearchStatus = 'draft' | 'active' | 'completed';

export interface QuantitativeResearch {
  id: string;
  product_id: string;
  user_id: string;
  title: string;
  objective?: string | null;
  tool?: string | null; // Google Forms, Typeform, etc.
  link?: string | null;
  total_responses?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: ResearchStatus;
  key_findings?: string[] | null;
  metrics?: any | null; // JSON
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type QualitativeMethod = 'Entrevista Individual' | 'Grupo Focal' | 'Pesquisa Contextual' | 'Diário de Uso';

export interface QualitativeResearch {
  id: string;
  product_id: string;
  user_id: string;
  title: string;
  interviewee_name: string;
  interviewee_role?: string | null;
  interviewee_company?: string | null;
  interview_date?: string | null;
  duration_minutes?: number | null;
  method?: QualitativeMethod | null;
  pains?: string[] | null;
  desires?: string[] | null;
  quotes?: string[] | null;
  insights?: string[] | null;
  recording_link?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type DataAnalysisType = 'Analytics Geral' | 'Benchmark' | 'Análise de Coorte' | 'Análise de Funil' | 'Heatmap' | 'Teste A/B';

export interface DataAnalysis {
  id: string;
  product_id: string;
  user_id: string;
  title: string;
  data_source?: string | null;
  analysis_type?: DataAnalysisType | null;
  period_start?: string | null;
  period_end?: string | null;
  metrics?: any | null; // JSON or array of tags
  findings?: string[] | null;
  conclusions?: string | null;
  report_link?: string | null;
  created_at: string;
  updated_at: string;
}

export type DeskResearchCategory = 'Artigo' | 'Relatório' | 'Case Study' | 'Benchmark' | 'Tendência de Mercado' | 'Livro';

export interface DeskResearch {
  id: string;
  product_id: string;
  user_id: string;
  title: string;
  source_author?: string | null;
  category?: DeskResearchCategory | null;
  url?: string | null;
  publication_date?: string | null;
  insights?: string[] | null;
  relevance?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}
