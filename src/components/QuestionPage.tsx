import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { Question, QuestionResponse } from '../types/Assessment';

const likertLabels = [
  'სრულიად არ ვეთანხმები',
  'არ ვეთანხმები',
  'ნაწილობრივ არ ვეთანხმები',
  'ნეიტრალური',
  'ნაწილობრივ ვეთანხმები',
  'ვეთანხმები',
  'სრულიად ვეთანხმები'
];

interface QuestionPageProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  responses: QuestionResponse[];
  onAnswer: (questionId: string, score: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
}

export const QuestionPage: React.FC<QuestionPageProps> = ({
  question,
  currentIndex,
  totalQuestions,
  responses,
  onAnswer,
  onNext,
  onPrevious,
  onFinish
}) => {
  const currentResponse = responses.find(r => r.questionId === question.id);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  // Update selectedScore when question changes or when there's an existing response
  React.useEffect(() => {
    setSelectedScore(currentResponse?.score || null);
  }, [question.id, currentResponse?.score]);

  const handleScoreSelect = (score: number) => {
    setSelectedScore(score);
    onAnswer(question.id, score);
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              კითხვა {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Question Content */}
          <div className="p-4 md:p-8">
            <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed font-medium">
                {question.text}
              </p>
            </div>

            {/* Likert Scale */}
            <div className="space-y-4">
              <p className="text-base md:text-lg font-semibold text-gray-700 text-center mb-4 md:mb-6">
                რამდენად ეთანხმებით ამ განცხადებას?
              </p>

              {/* Scale with inline labels */}
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Left label - only show on larger screens */}
                <div className="hidden sm:flex flex-col items-center min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-purple-600 text-center leading-tight">
                    სრულიად არ ვეთანხმები
                  </span>
                </div>

                {/* Circular Scale */}
                <div className="flex justify-center items-center space-x-1 sm:space-x-2 md:space-x-3 flex-1">
                  {likertLabels.map((label, index) => {
                    const score = index + 1;
                    const isSelected = selectedScore === score;

                    // Color progression from purple (disagree) to green (agree) - 7 colors
                    const getCircleColor = (index: number) => {
                      const colors = [
                        '#241f3f', // custom purple (strongly disagree)
                        '#3d2f5f', // lighter purple
                        '#5a4a7f', // even lighter purple
                        '#6B7280', // gray-500 (neutral)
                        '#5a9e5f', // lighter green
                        '#4fa654', // medium green
                        '#46ac50'  // custom green (strongly agree)
                      ];
                      return colors[index];
                    };

                    // Size progression - extremes are larger, center is smaller
                    const getCircleSize = (index: number) => {
                      const sizes = [
                        'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16', // 1 - largest (strongly disagree)
                        'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14', // 2
                        'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',   // 3
                        'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10',     // 4 - smallest (neutral)
                        'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',   // 5
                        'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14', // 6
                        'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16'  // 7 - largest (strongly agree)
                      ];
                      return sizes[index];
                    };

                    return (
                      <button
                        key={score}
                        onClick={() => handleScoreSelect(score)}
                        className={`relative transition-all duration-300 transform hover:scale-110 ${isSelected
                          ? 'scale-110'
                          : 'hover:scale-105'
                          }`}
                        title={label}
                      >
                        {/* Outer circle (border) */}
                        <div
                          className={`${getCircleSize(index)} rounded-full border-2 transition-all duration-300 ${isSelected
                            ? 'shadow-lg'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                          style={{
                            borderColor: isSelected ? getCircleColor(index) : undefined
                          }}
                        >
                          {/* Inner filled circle */}
                          <div
                            className={`w-full h-full rounded-full transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'
                              }`}
                            style={{
                              backgroundColor: isSelected ? getCircleColor(index) : 'transparent'
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right label - only show on larger screens */}
                <div className="hidden sm:flex flex-col items-center min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-teal-600 text-center leading-tight">
                    სრულიად ვეთანხმები
                  </span>
                </div>
              </div>

              {/* Mobile labels - show below bubbles on small screens */}
              <div className="flex justify-between items-center sm:hidden mt-4 px-2">
                <span className="text-xs font-medium text-purple-600 text-center">
                  სრულიად არ ვეთანხმები
                </span>
                <span className="text-xs font-medium text-teal-600 text-center">
                  სრულიად ვეთანხმები
                </span>
              </div>

              {/* Selected answer label - always reserve space to prevent jumping */}
              <div className="text-center mt-6 h-6">
                {selectedScore ? (
                  <p className="text-sm text-gray-600">
                    თქვენი არჩევანი: <span className="font-semibold">{likertLabels[selectedScore - 1]}</span>
                  </p>
                ) : (
                  <p className="text-sm text-transparent">
                    &nbsp;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-4 md:px-8 py-4 md:py-6 bg-gray-50">
            {/* Mobile layout - Next/Finish button first */}
            <div className="flex flex-col gap-4 sm:hidden">
              {currentIndex === totalQuestions - 1 ? (
                <button
                  onClick={onFinish}
                  disabled={selectedScore === null}
                  className={`inline-flex items-center justify-center px-8 py-3 font-semibold rounded-full transition-all duration-300 w-full ${selectedScore !== null
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  შედეგების ნახვა
                  <ArrowRight size={20} className="ml-2 w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onNext}
                  disabled={selectedScore === null}
                  className={`inline-flex items-center justify-center px-8 py-3 font-semibold rounded-full transition-all duration-300 w-full ${selectedScore !== null
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  შემდეგი
                  <ArrowRight size={20} className="ml-2 w-5 h-5" />
                </button>
              )}

              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className={`inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full transition-all duration-300 w-full ${currentIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transform hover:scale-105'
                  }`}
              >
                <ArrowLeft size={20} className="mr-2 w-5 h-5" />
                უკან
              </button>
            </div>

            {/* Desktop layout - Back button first */}
            <div className="hidden sm:flex justify-between items-center">
              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className={`inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full transition-all duration-300 ${currentIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transform hover:scale-105'
                  }`}
              >
                <ArrowLeft size={20} className="mr-2 w-5 h-5" />
                უკან
              </button>

              {currentIndex === totalQuestions - 1 ? (
                <button
                  onClick={onFinish}
                  disabled={selectedScore === null}
                  className={`inline-flex items-center justify-center px-8 py-3 font-semibold rounded-full transition-all duration-300 ${selectedScore !== null
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  შედეგების ნახვა
                  <ArrowRight size={20} className="ml-2 w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onNext}
                  disabled={selectedScore === null}
                  className={`inline-flex items-center justify-center px-8 py-3 font-semibold rounded-full transition-all duration-300 ${selectedScore !== null
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  შემდეგი
                  <ArrowRight size={20} className="ml-2 w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};