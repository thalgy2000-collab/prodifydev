export type CsdCategory = 'certainty' | 'assumption' | 'doubt';
export type CsdImpactLevel = 'low' | 'medium' | 'high';
export type CsdStatus = 'open' | 'in_validation' | 'resolved';

export interface CsdItem {
  id: string;
  product_id: string;
  user_id: string;
  category: CsdCategory;
  statement: string;
  hypothesis_id: string | null;
  impact_level: CsdImpactLevel;
  status: CsdStatus;
  validation_method: string | null;
  notes: string | null;
  position: number;
  created_at: string;
}
