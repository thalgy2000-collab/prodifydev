export const OKR_CATEGORIES = [
  { value: 'professional', label: 'Profissional', color: '235 70% 65%' },
  { value: 'personal', label: 'Pessoal', color: '45 100% 55%' },
  { value: 'health', label: 'Saúde', color: '0 72% 45%' },
  { value: 'social', label: 'Social', color: '330 60% 75%' },
  { value: 'financial', label: 'Financeiro', color: '160 60% 45%' },
] as const;

export type OKRCategory = typeof OKR_CATEGORIES[number]['value'];

export interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

export interface Objective {
  id: string;
  title: string;
  quarter: string;
  category: OKRCategory;
  keyResults: KeyResult[];
  createdAt: string;
}

export type Quarter = {
  label: string;
  value: string;
};

export const getQuarters = (year: number): Quarter[] => [
  { label: `Q1 ${year}`, value: `Q1 ${year}` },
  { label: `Q2 ${year}`, value: `Q2 ${year}` },
  { label: `Q3 ${year}`, value: `Q3 ${year}` },
  { label: `Q4 ${year}`, value: `Q4 ${year}` },
];

export const getCurrentQuarter = (): string => {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
};

export const getQuarterMonths = (quarter: string): string[] => {
  const match = quarter.match(/Q(\d)\s+(\d{4})/);
  if (!match) return [];
  const q = parseInt(match[1]);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const startMonth = (q - 1) * 3;
  return [monthNames[startMonth], monthNames[startMonth + 1], monthNames[startMonth + 2]];
};

export const getCategoryConfig = (category: OKRCategory) => {
  return OKR_CATEGORIES.find(c => c.value === category) || OKR_CATEGORIES[0];
};