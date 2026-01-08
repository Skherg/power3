export interface Question {
  id: string;
  domain: 'Vision' | 'People' | 'Execution' | 'E/I';
  component: string;
  text: string;
  tag: string;
}

export interface QuestionResponse {
  questionId: string;
  score: number;
}

export interface CategoryScore {
  category: string;
  average: number;
  rank: number;
}

export interface ComponentScore {
  component: string;
  domain: string;
  average: number;
  tag: string;
}

export interface SelfAssessment {
  vision: number;
  people: number;
  execution: number;
  extraversion: number;
}

export interface ExtraversionIntroversionScore {
  extraversionAverage: number;
  introversionAverage: number;
  orientation: 'Leaning Extraverted' | 'Leaning Introverted' | 'Strongly Extraverted' | 'Strongly Introverted';
  orientationCode: 'E' | 'I';
}

export interface AssessmentResults {
  personalityType: string;
  categoryScores: CategoryScore[];
  componentScores: ComponentScore[];
  selfAssessment: SelfAssessment;
  dominantTraits: string[];
  eiScore: ExtraversionIntroversionScore;
}

export type AssessmentStep = 'welcome' | 'self-assessment' | 'questions' | 'results';