import { QuestionResponse, CategoryScore, ComponentScore, AssessmentResults, SelfAssessment, ExtraversionIntroversionScore } from '../types/Assessment';
import { Question } from '../lib/supabase';
import { getPersonalityDetails } from '../data/personalityDetails';

export function calculateResults(responses: QuestionResponse[], selfAssessment: SelfAssessment, questions: Question[]): AssessmentResults {
  // STEP 1: Calculate component averages first (per POWER3® spec)
  const componentTotals: Record<string, { sum: number; count: number; domain: string; tag: string }> = {};

  responses.forEach(response => {
    const question = questions.find(q => q.id === response.questionId);
    if (question && question.domain !== 'E/I') { // Handle E/I separately
      const componentKey = `${question.domain}_${question.component}`;
      if (!componentTotals[componentKey]) {
        componentTotals[componentKey] = {
          sum: 0,
          count: 0,
          domain: question.domain,
          tag: question.tag
        };
      }
      componentTotals[componentKey].sum += response.score;
      componentTotals[componentKey].count += 1;
    }
  });

  // STEP 2: Calculate component scores (average score per component)
  const componentScores: ComponentScore[] = Object.entries(componentTotals).map(([key, data]) => {
    const component = key.split('_').slice(1).join('_'); // Remove domain prefix
    return {
      component,
      domain: data.domain,
      average: data.count > 0 ? (data.sum / data.count) : 0,
      tag: data.tag
    };
  });

  // STEP 3: Aggregate component scores to domain scores
  const domainScores: Record<string, { sum: number; count: number }> = {
    Vision: { sum: 0, count: 0 },
    People: { sum: 0, count: 0 },
    Execution: { sum: 0, count: 0 }
  };

  // Aggregate component averages to domain averages
  componentScores.forEach(compScore => {
    if (domainScores[compScore.domain]) {
      domainScores[compScore.domain].sum += compScore.average;
      domainScores[compScore.domain].count += 1;
    }
  });

  // STEP 4: Create domain category scores
  const categoryScores: CategoryScore[] = Object.entries(domainScores)
    .map(([category, data]) => ({
      category,
      average: data.count > 0 ? (data.sum / data.count) : 0,
      rank: 0
    }));

  // STEP 5: Sort by average and assign ranks (highest to lowest)
  categoryScores.sort((a, b) => b.average - a.average);
  categoryScores.forEach((score, index) => {
    score.rank = index + 1;
  });

  // STEP 6: Generate primary personality type (VPE format)
  const primaryPersonalityType = generatePersonalityType(categoryScores);

  // STEP 7: Calculate E/I scores and interpretation
  const eiScore = calculateExtraversionIntroversionScore(responses, questions);

  // STEP 8: Generate final personality type with E/I overlay
  const finalPersonalityType = `${primaryPersonalityType}${eiScore.orientationCode}`;

  // Calculate dominant traits (top scoring components)
  const dominantTraits = getDominantTraits(componentScores);

  return {
    personalityType: finalPersonalityType,
    categoryScores,
    componentScores,
    selfAssessment: {
      ...selfAssessment,
      extraversion: eiScore.extraversionAverage * (100 / 7) // Convert 1-7 scale to percentage for display
    },
    dominantTraits,
    eiScore
  };
}

function generatePersonalityType(categoryScores: CategoryScore[]): string {
  const sortedCategories = categoryScores
    .sort((a, b) => a.rank - b.rank)
    .map(score => score.category);

  const typeMap: Record<string, string> = {
    Vision: 'V',
    People: 'P',
    Execution: 'E'
  };

  return sortedCategories.map(category => typeMap[category]).join('');
}

function getDominantTraits(componentScores: ComponentScore[]): string[] {
  // Get top 5 highest scoring components across all domains
  const sortedComponents = componentScores
    .sort((a, b) => b.average - a.average)
    .slice(0, 5)
    .map(comp => comp.tag);

  return sortedComponents;
}

function calculateExtraversionIntroversionScore(responses: QuestionResponse[], questions: Question[]): ExtraversionIntroversionScore {
  let extraversionSum = 0;
  let introversionSum = 0;
  let extraversionCount = 0;
  let introversionCount = 0;

  responses.forEach(response => {
    const question = questions.find(q => q.id === response.questionId);
    if (question && question.domain === 'E/I') {
      if (question.component === 'Extraversion') {
        extraversionSum += response.score;
        extraversionCount++;
      } else if (question.component === 'Introversion') {
        introversionSum += response.score;
        introversionCount++;
      }
    }
  });

  const extraversionAverage = extraversionCount > 0 ? extraversionSum / extraversionCount : 3.5; // Default to middle
  const introversionAverage = introversionCount > 0 ? introversionSum / introversionCount : 3.5; // Default to middle

  // Calculate difference and interpret - strictly E or I
  const difference = extraversionAverage - introversionAverage;

  let orientation: ExtraversionIntroversionScore['orientation'];
  let orientationCode: ExtraversionIntroversionScore['orientationCode'];

  if (difference > 1.5) {
    // Strongly Extraverted: extraversion at least 1.5 points higher
    orientation = 'Strongly Extraverted';
    orientationCode = 'E';
  } else if (difference < -1.5) {
    // Strongly Introverted: introversion at least 1.5 points higher
    orientation = 'Strongly Introverted';
    orientationCode = 'I';
  } else if (difference >= 0) {
    // Leaning Extraverted: extraversion higher or equal
    orientation = 'Leaning Extraverted';
    orientationCode = 'E';
  } else {
    // Leaning Introverted: introversion higher
    orientation = 'Leaning Introverted';
    orientationCode = 'I';
  }

  return {
    extraversionAverage,
    introversionAverage,
    orientation,
    orientationCode
  };
}

export function validateSelfAssessment(assessment: SelfAssessment): boolean {
  const total = assessment.vision + assessment.people + assessment.execution;
  return Math.abs(total - 100) < 0.1; // Allow for small floating point errors
}

// Helper function to get personality type description
export function getPersonalityDescription(personalityType: string): { title: string; description: string } {
  const details = getPersonalityDetails(personalityType);
  return {
    title: details.title,
    description: details.description
  };
}

// Helper function to get E/I interpretation text
export function getEIInterpretation(eiScore: ExtraversionIntroversionScore): string {
  switch (eiScore.orientation) {
    case 'Leaning Extraverted':
      return 'მცირედ ექსტრავერტული - უპირატესობას ანიჭებთ სოციალურ ურთიერთობებს, მაგრამ ასევე აფასებთ მარტო ყოფნას';
    case 'Leaning Introverted':
      return 'მცირედ ინტროვერტული - უპირატესობას ანიჭებთ წყნარ რეფლექსიას, მაგრამ კომფორტულად ხართ სოციალურ გარემოშიც';
    case 'Strongly Extraverted':
      return 'მკაცრად ექსტრავერტული - ენერგიას იღებთ ადამიანებთან ურთიერთობისგან და აქტიურად ეძებთ სოციალურ შესაძლებლობებს';
    case 'Strongly Introverted':
      return 'მკაცრად ინტროვერტული - ენერგიას იღებთ მარტო რეფლექსიისგან და სჭირდებათ მშვიდი გარემო აღსადგენად';
    default:
      return '';
  }
}

// Function to reconstruct AssessmentResults from stored assessment data
// NOTE: When using this function with database data, always override the calculated
// personalityType with the stored personality_type from the database to ensure consistency
export function calculateAssessmentResults(
  answers: Record<string, number>,
  selfAssessment: Partial<SelfAssessment> = {},
  questions: Question[]
): AssessmentResults {
  // Convert answers to QuestionResponse format
  const responses: QuestionResponse[] = Object.entries(answers).map(([questionId, score]) => ({
    questionId,
    score
  }));

  // Create a default self-assessment if not provided
  const defaultSelfAssessment: SelfAssessment = {
    vision: selfAssessment.vision || 33.33,
    people: selfAssessment.people || 33.33,
    execution: selfAssessment.execution || 33.34,
    extraversion: selfAssessment.extraversion || 50
  };

  // Use the existing calculateResults function
  return calculateResults(responses, defaultSelfAssessment, questions);
}