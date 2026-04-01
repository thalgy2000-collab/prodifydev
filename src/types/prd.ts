export interface PRD {
  id: string;
  productId: string | null;
  userId: string;
  title: string;
  version: string;
  status: 'draft' | 'in_review' | 'approved';
  problem: string;
  objective: string;
  targetAudience: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  outOfScope: string;
  successMetrics: string[];
  estimatedTimeline: string;
  createdAt: string;
  updatedAt: string;
}
