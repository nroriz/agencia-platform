export type UserRole = "admin" | "client";

export type CarouselStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"
  | "downloaded"
  | "failed";

export type PublishStatus = "queued" | "publishing" | "published" | "failed";

export type MetricWindow = "24h" | "48h" | "7d";

export type CarouselFormat =
  | "educativo"
  | "polemico"
  | "storytelling"
  | "checklist"
  | "comparativo"
  | "trend_alert";

export type SlideType =
  | "capa_imagem"
  | "texto_gigante"
  | "dado_imagem"
  | "dado_texto"
  | "conteudo_imagem"
  | "lista"
  | "pergunta"
  | "citacao"
  | "cta_imagem"
  | "transicao"
  | "comparativo";

export interface Tenant {
  id: string;
  nome: string;
  nicho: string;
  handle: string;
  persona: string;
  posicionamento: string | null;
  publico: string;
  diferencial: string | null;
  plano: string;
  ativo: boolean;
  frequencia_semanal: number;
  created_at: string;
}

export interface TenantVisual {
  id: string;
  tenant_id: string;
  cor_fundo: string;
  cor_acento: string;
  cor_texto: string;
  fonte_headline: string;
  fonte_headline_peso: number;
  fonte_numero: string;
  fonte_corpo: string;
  fonte_label: string;
  logo_url: string | null;
  avatar_url: string | null;
  estilo_imagem: string;
  header_esquerda_a: string | null;
  header_esquerda_b: string | null;
  header_direita: string | null;
  tag_marca: string | null;
}

export interface TenantTerritorio {
  id: string;
  tenant_id: string;
  codigo: string;
  nome: string;
  peso: number;
}

export interface TenantVoz {
  id: string;
  tenant_id: string;
  tom: string;
  palavras_proibidas: string[];
  expressoes_tipicas: string[];
  anti_exemplos: Array<{ errado: string; certo: string }>;
  regras_extras: string[];
  voice_bank_text: string | null;
}

export interface TenantHorario {
  id: string;
  tenant_id: string;
  dia: string;
  hora: string;
}

export interface TenantIntegracoes {
  id: string;
  tenant_id: string;
  meta_graph_token: string | null;
  instagram_page_id: string | null;
  aprovacao_canal: string;
  aprovacao_chat_id: string | null;
}

export interface Ideia {
  id: string;
  tenant_id: string;
  tema: string;
  origem: string;
  prioridade: number;
  usado: boolean;
  usado_em: string | null;
  created_at: string;
}

export interface TenantMedia {
  id: string;
  tenant_id: string;
  filename: string;
  storage_path: string;
  public_url: string;
  categoria: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  ai_description: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  nome: string;
  tipo: string;
  subtipo: string | null;
  escopo: string;
  nicho: string | null;
  tenant_id: string | null;
  html_path: string | null;
  preview_url: string | null;
  variaveis: unknown;
  formatos: string[];
  ativo: boolean;
  created_at: string;
}

export interface TenantReferencia {
  id: string;
  tenant_id: string;
  image_url: string;
  analise_json: unknown;
  created_at: string;
}

export interface Carousel {
  id: string;
  tenant_id: string;
  tema: string;
  tema_refinado: string | null;
  territorio: string | null;
  formato: string | null;
  hook_linha1: string | null;
  hook_linha2: string | null;
  tipo_capa: string | null;
  slides_json: unknown;
  caption: string | null;
  hashtags: string[] | null;
  status: CarouselStatus;
  agendado_para: string | null;
  publicado_em: string | null;
  meta_post_id: string | null;
  edit_instrucoes: string | null;
  created_at: string;
}

export interface CarouselSlide {
  id: string;
  carousel_id: string;
  slide_number: number;
  tipo: SlideType;
  data_json: unknown;
  imagem_url: string | null;
  png_url: string | null;
}

export interface CarouselMetric {
  id: string;
  carousel_id: string;
  janela: MetricWindow;
  reach: number;
  impressions: number;
  saves: number;
  shares: number;
  comments: number;
  likes: number;
  profile_visits: number;
  follows: number;
  save_rate: number | null;
  share_rate: number | null;
  engagement_rate: number | null;
  collected_at: string;
}

export interface DataIntelligence {
  id: string;
  tenant_id: string;
  periodo: string;
  report_json: unknown;
  created_at: string;
}

export interface PublishQueue {
  id: string;
  carousel_id: string;
  tenant_id: string;
  scheduled_for: string;
  status: PublishStatus;
  published_at: string | null;
  meta_post_id: string | null;
  error_message: string | null;
}

export interface User {
  id: string;
  auth_id: string | null;
  email: string;
  nome: string;
  role: UserRole;
  tenant_id: string | null;
  created_at: string;
}

// --- Brand DNA (Etapa 1) ---

export interface BrandDNAFontRole {
  family: string;
  weight: number;
}

export interface BrandDNAData {
  paleta: {
    fundo: string;
    acento: string;
    texto: string;
    texto_dim: string;
    offwhite: string;
    card: string;
    border: string;
    footer: string;
    alerta: string;
    corpo: string;
  };
  tipografia: {
    headline: BrandDNAFontRole;
    sub_headline: BrandDNAFontRole;
    corpo: BrandDNAFontRole;
    numero: BrandDNAFontRole;
    label: BrandDNAFontRole;
    citacao: BrandDNAFontRole;
    alerta: BrandDNAFontRole;
  };
  editorial_rules: {
    tom: string;
    palavras_proibidas: string[];
    expressoes_tipicas: string[];
    densidade: "alta" | "media" | "baixa";
    tipos_slide_preferidos: string[];
    tipos_slide_evitar: string[];
    max_slides_com_foto: number;
  };
  photo_style: {
    anchor_prompt: string;
    lighting: "cinematic-dark" | "bright-studio" | "warm-natural" | "soft-diffused" | "high-contrast";
    dominance: number;
  };
  decorative: {
    grain: boolean;
    shapes: boolean;
    gradient_style: "to-top" | "to-bottom" | "radial" | "none";
  };
  branding: {
    handle: string;
    slogan: string;
    logo_url?: string;
    logo_opacity: number;
  };
}

export interface TenantBrandDNA {
  id: string;
  tenant_id: string;
  dna: BrandDNAData;
  archetype: string;
  source: string;
  confidence: number;
  created_at: string;
  updated_at: string;
}
