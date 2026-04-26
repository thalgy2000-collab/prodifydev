import { TourStep } from '@/components/OnboardingTour';

/**
 * Definições de tour por feature dentro de um produto.
 * Cada array é consumido pelo hook useFeatureTour na respectiva página.
 * Os seletores apontam para data-tour-feature="..." espalhados nos componentes.
 */

export const okrTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="okr-quarter"]', title: 'Filtros de Quarter', description: 'Navegue entre os trimestres do ano (Q1 a Q4).' },
  { type: 'spotlight', selector: '[data-tour-feature="okr-import"]', title: 'Importar via arquivo', description: 'Importe OKRs de PDF, TXT ou DOCX com IA.' },
  { type: 'spotlight', selector: '[data-tour-feature="okr-create"]', title: 'Novo Objetivo', description: 'Crie um novo objetivo para o trimestre.' },
  { type: 'spotlight', selector: '[data-tour-feature="okr-card"]', title: 'Card de Objetivo', description: 'Cada objetivo agrupa Key Results que medem seu progresso.' },
  { type: 'spotlight', selector: '[data-tour-feature="okr-kr-progress"]', title: 'Progresso do KR', description: 'Atualize o valor atual para acompanhar a evolução.' },
  { type: 'spotlight', selector: '[data-tour-feature="okr-overall"]', title: 'Progresso geral', description: 'Acompanhe o progresso consolidado de todos os objetivos.' },
];

export const roadmapTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="roadmap-grid"]', title: 'Grade do Roadmap', description: 'Visualize suas iniciativas ao longo do tempo.' },
  { type: 'spotlight', selector: '[data-tour-feature="roadmap-card"]', title: 'Card de iniciativa', description: 'Cada barra representa uma iniciativa com prazo definido.' },
  { type: 'spotlight', selector: '[data-tour-feature="roadmap-progress"]', title: 'Progresso da iniciativa', description: 'O progresso é calculado automaticamente pelas tarefas vinculadas.' },
  { type: 'spotlight', selector: '[data-tour-feature="roadmap-quarter"]', title: 'Filtro de Quarter', description: 'Filtre as iniciativas por trimestre.' },
];

export const backlogTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="backlog-list"]', title: 'Lista de tarefas', description: 'Gerencie todas as tarefas do produto em um só lugar.' },
  { type: 'spotlight', selector: '[data-tour-feature="backlog-priority"]', title: 'Filtros de prioridade', description: 'Filtre por Alta, Média ou Baixa prioridade.' },
  { type: 'spotlight', selector: '[data-tour-feature="backlog-rice"]', title: 'Repriorizar pelo RICE', description: 'Repriorize automaticamente baseado no score RICE.' },
  { type: 'spotlight', selector: '[data-tour-feature="backlog-card"]', title: 'Card de tarefa', description: 'Clique para editar, vincular à iniciativa e definir % de conclusão.' },
  { type: 'spotlight', selector: '[data-tour-feature="backlog-sprint-section"]', title: 'Sprints recolhíveis', description: 'Clique no cabeçalho da sprint para expandir ou recolher.' },
];

export const riceTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="rice-table"]', title: 'Tabela RICE', description: 'Priorize pelo framework: Alcance × Impacto × Confiança ÷ Esforço.' },
  { type: 'spotlight', selector: '[data-tour-feature="rice-inputs"]', title: 'Critérios RICE', description: 'Preencha Alcance, Impacto, Confiança e Esforço para calcular o score.' },
  { type: 'spotlight', selector: '[data-tour-feature="rice-score"]', title: 'Coluna Score', description: 'Quanto maior o score, maior a prioridade.' },
  { type: 'spotlight', selector: '[data-tour-feature="rice-apply"]', title: 'Repriorizar Backlog', description: 'Aplica as prioridades do RICE diretamente no backlog.' },
  { type: 'spotlight', selector: '[data-tour-feature="rice-delete"]', title: 'Excluir item', description: 'Remove o item da priorização sem excluir a tarefa.' },
];

export const sprintsTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="sprint-active"]', title: 'Sprint ativa', description: 'A sprint ativa contém as tarefas do ciclo atual.' },
  { type: 'spotlight', selector: '[data-tour-feature="sprint-status"]', title: 'Status da sprint', description: 'Sprints são ativadas e encerradas automaticamente pela data configurada.' },
  { type: 'spotlight', selector: '[data-tour-feature="sprint-column"]', title: 'Colunas de tarefas', description: 'Organize por status: A fazer, Em progresso, Feito.' },
  { type: 'spotlight', selector: '[data-tour-feature="sprint-task"]', title: 'Card de tarefa', description: 'Atualize o status arrastando ou clicando na tarefa.' },
  { type: 'spotlight', selector: '[data-tour-feature="sprint-add"]', title: 'Adicionar tarefa', description: 'Adicione tarefas do backlog à sprint atual.' },
];

export const releasesTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="release-list"]', title: 'Lista de releases', description: 'Planeje e gerencie os lançamentos do produto.' },
  { type: 'spotlight', selector: '[data-tour-feature="release-card"]', title: 'Card de release', description: 'Cada release agrupa iniciativas e tem uma data alvo.' },
  { type: 'spotlight', selector: '[data-tour-feature="release-items"]', title: 'Itens do release', description: 'Vincule iniciativas do roadmap ao release.' },
  { type: 'spotlight', selector: '[data-tour-feature="release-create"]', title: 'Nova Release', description: 'Crie um novo marco de lançamento.' },
];

export const prdTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="prd-doc"]', title: 'Documento PRD', description: 'Documente o problema, objetivo e requisitos do produto.' },
  { type: 'spotlight', selector: '[data-tour-feature="prd-sections"]', title: 'Seções do PRD', description: 'Preencha cada seção para ter uma especificação completa.' },
  { type: 'spotlight', selector: '[data-tour-feature="prd-edit"]', title: 'Edição', description: 'Clique para editar qualquer seção do documento.' },
  { type: 'spotlight', selector: '[data-tour-feature="prd-export"]', title: 'Exportar', description: 'Exporte o PRD para compartilhar com o time.' },
];

export const opportunityTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="opp-tree"]', title: 'Árvore de oportunidades', description: 'Mapeie oportunidades conectadas aos seus objetivos.' },
  { type: 'spotlight', selector: '[data-tour-feature="opp-root"]', title: 'Nó raiz', description: 'O nó principal representa o problema central do produto.' },
  { type: 'spotlight', selector: '[data-tour-feature="opp-add"]', title: 'Subnós', description: 'Clique em "+" para adicionar oportunidades derivadas.' },
  { type: 'spotlight', selector: '[data-tour-feature="opp-node"]', title: 'Detalhes do nó', description: 'Clique em um nó para ver e editar seus detalhes.' },
];

export const swotTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '#swot-strength', title: 'Forças', description: 'Liste os pontos fortes internos do produto.' },
  { type: 'spotlight', selector: '#swot-weakness', title: 'Fraquezas', description: 'Identifique os pontos a melhorar internamente.' },
  { type: 'spotlight', selector: '#swot-opportunity', title: 'Oportunidades', description: 'Avalie os fatores externos favoráveis.' },
  { type: 'spotlight', selector: '#swot-threat', title: 'Ameaças', description: 'Identifique os fatores externos desfavoráveis.' },
];

export const competitionTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '#competition-map-tab', title: 'Mapa de Alternativas', description: 'Visualize seus concorrentes agrupados por tipo.' },
  { type: 'spotlight', selector: '#competitor-card', title: 'Card de Concorrente', description: 'Veja pontos fortes, fracos e nível de ameaça.' },
  { type: 'spotlight', selector: '#competition-table-tab', title: 'Tabela Comparativa', description: 'Compare concorrentes por critérios e scores.' },
  { type: 'spotlight', selector: '#competition-table', title: 'Scores por Critério', description: 'Avalie cada concorrente de 0 a 10 por critério.' },
  { type: 'spotlight', selector: '#add-competitor-btn', title: 'Adicionar Concorrente', description: 'Cadastre um novo concorrente no mapa.' },
];

export const analyticsTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="analytics-charts"]', title: 'Gráficos de performance', description: 'Acompanhe métricas e evolução do produto.' },
  { type: 'spotlight', selector: '[data-tour-feature="analytics-period"]', title: 'Filtros de período', description: 'Filtre os dados por período de tempo.' },
  { type: 'spotlight', selector: '[data-tour-feature="analytics-summary"]', title: 'Cards de resumo', description: 'Veja os principais indicadores em destaque.' },
];

export const historyTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="history-list"]', title: 'Sprints concluídas', description: 'Veja o histórico de todas as sprints encerradas.' },
  { type: 'spotlight', selector: '[data-tour-feature="history-card"]', title: 'Sprint histórica', description: 'Analise o que foi entregue em cada ciclo.' },
  { type: 'spotlight', selector: '[data-tour-feature="history-metrics"]', title: 'Métricas da sprint', description: 'Veja taxa de conclusão e tarefas entregues.' },
];

export const membersTourSteps: TourStep[] = [
  { type: 'spotlight', selector: '[data-tour-feature="members-list"]', title: 'Lista de membros', description: 'Gerencie quem tem acesso ao produto.' },
  { type: 'spotlight', selector: '[data-tour-feature="members-role"]', title: 'Papel (role)', description: 'Cada membro tem um papel: Admin, Editor ou Visualizador.' },
  { type: 'spotlight', selector: '[data-tour-feature="members-invite"]', title: 'Convidar', description: 'Convide pessoas por e-mail para colaborar.' },
];
