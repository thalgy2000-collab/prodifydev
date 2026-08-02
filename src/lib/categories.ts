export type CategorySlug = 'planejamento' | 'discovery' | 'priorizacao' | 'delivery' | 'analises' | 'membros';

export type CategoryFeature = {
  icon: string;
  title: string;
  desc: string;
  route: string;
};

export type CategoryDef = {
  slug: CategorySlug;
  title: string;
  subtitle: string;
  features: CategoryFeature[];
};

export const CATEGORIES: Record<CategorySlug, CategoryDef> = {
  planejamento: {
    slug: 'planejamento',
    title: 'Planejamento',
    subtitle: 'Ferramentas de planejamento do produto',
    features: [
      { icon: '🎯', title: 'OKRs', desc: 'Gerencie objetivos e key results', route: '/okrs' },
      { icon: '🗺️', title: 'Roadmap', desc: 'Planeje suas iniciativas', route: '/roadmap' },
      { icon: '📅', title: 'Agenda', desc: 'Gerencie seus eventos', route: '/produto-agenda' },
    ],
  },
  discovery: {
    slug: 'discovery',
    title: 'Discovery',
    subtitle: 'Descubra oportunidades e entenda o mercado',
    features: [
      { icon: '🌳', title: 'Árvore de Oportunidades', desc: 'Mapeie oportunidades do produto', route: '/oportunidades' },
      { icon: '⚔️', title: 'Análise de Concorrência', desc: 'Mapeie seus concorrentes', route: '/concorrencia' },
      { icon: '📊', title: 'SWOT', desc: 'Analise forças e fraquezas', route: '/swot' },
    ],
  },
  priorizacao: {
    slug: 'priorizacao',
    title: 'Priorização',
    subtitle: 'Priorize iniciativas com frameworks',
    features: [
      { icon: '📐', title: 'RICE Score', desc: 'Priorize pelo framework RICE', route: '/rice' },
    ],
  },
  delivery: {
    slug: 'delivery',
    title: 'Delivery',
    subtitle: 'Execute e acompanhe entregas',
    features: [
      { icon: '📋', title: 'Backlog', desc: 'Gerencie suas tarefas', route: '/backlog' },
      { icon: '⚡', title: 'Sprints', desc: 'Organize seus ciclos de entrega', route: '/sprints' },
      { icon: '📜', title: 'Histórico', desc: 'Veja sprints anteriores', route: '/historico' },
    ],
  },
  analises: {
    slug: 'analises',
    title: 'Análises',
    subtitle: 'Acompanhe métricas e indicadores',
    features: [
      { icon: '📈', title: 'Análises', desc: 'Acompanhe métricas do produto', route: '/analises' },
    ],
  },
  membros: {
    slug: 'membros',
    title: 'Membros',
    subtitle: 'Gerencie o time do produto',
    features: [
      { icon: '👥', title: 'Membros', desc: 'Gerencie o time do produto', route: '/membros' },
    ],
  },
};

// Map feature route -> category for breadcrumbs
export const ROUTE_TO_CATEGORY: Record<string, CategorySlug> = Object.values(CATEGORIES).reduce(
  (acc, cat) => {
    cat.features.forEach(f => {
      acc[f.route] = cat.slug;
    });
    return acc;
  },
  {} as Record<string, CategorySlug>
);

export const getCategoryByRoute = (route: string): CategoryDef | null => {
  const slug = ROUTE_TO_CATEGORY[route];
  return slug ? CATEGORIES[slug] : null;
};

export const getFeatureByRoute = (route: string): CategoryFeature | null => {
  const cat = getCategoryByRoute(route);
  return cat?.features.find(f => f.route === route) ?? null;
};
