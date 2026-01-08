import React, { CSSProperties } from 'react';
import { ArrowClockwise, Eye, Users, Target, Printer } from '@phosphor-icons/react';
import { AssessmentResults } from '../types/Assessment';
import { getPersonalityDetails } from '../data/personalityDetails';
import { getPersonalityDescription } from '../utils/calculations';

interface ResultsPageProps {
  results: AssessmentResults;
  onRetake: () => void;
  userName?: string;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ results, onRetake, userName }) => {
  const personalityInfo = getPersonalityDescription(results.personalityType);
  const detailedInfo = getPersonalityDetails(results.personalityType);

  // Helper functions updated to use the new palette
  const getCategoryIcon = (category: string, className = "w-6 h-6") => {
    switch (category) {
      case 'Vision': return <Eye size={24} className={`${className}`} style={{ color: '#241f3f' }} />;
      case 'People': return <Users size={24} className={`${className}`} style={{ color: '#46ac50' }} />;
      case 'Execution': return <Target size={24} className={`${className}`} style={{ color: '#e43159' }} />;
      default: return null;
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'Vision': return { background: 'linear-gradient(to right, #241f3f, #1a1530)' };
      case 'People': return { background: 'linear-gradient(to right, #46ac50, #3a8f42)' };
      case 'Execution': return { background: 'linear-gradient(to right, #e43159, #c7284a)' };
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'Vision': return { backgroundColor: '#241f3f20' };
      case 'People': return { backgroundColor: '#46ac5020' };
      case 'Execution': return { backgroundColor: '#e4315920' };
      default: return 'bg-slate-100';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'Vision': return 'ხედვა';
      case 'People': return 'ადამიანები';
      case 'Execution': return 'აღსრულება';
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-teal-50 to-green-50 py-4 md:py-8 px-4 printable-content">
      <div className="max-w-5xl mx-auto">
        {/* Print-only header */}
        <div className="hidden print:block text-center mb-8 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {userName ? `Power3 შედეგი - ${userName}` : 'POWER3 Leadership Assessment Report'}
          </h1>
          <p className="text-sm text-gray-600 mt-2">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="https://i.ibb.co/bc9xNqL/pwr3-logo-tr.png" alt="POWER3 Logo" className="w-20 h-20 object-contain rounded-full" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            {userName ? `Power3 შედეგი - ${userName}` : 'თქვენი Power3 შედეგი'}
          </h1>
          <div className="text-2xl font-bold text-slate-800 mb-4">{detailedInfo.code}</div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-700 mb-2">{personalityInfo.title}</h2>
        </div>

        {/* Main Results Grid - Moved to top */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Assessment Results Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 printable-card">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">ტესტის შედეგი</h3>
            <div className="space-y-6">
              {(() => {
                // Calculate total score across all categories to make percentages add up to 100%
                const totalScore = results.categoryScores.reduce((sum, score) => sum + score.average, 0);
                const categoryOrder = ['Vision', 'People', 'Execution'];
                const sortedScores = [...results.categoryScores].sort((a, b) => {
                  return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
                });
                return sortedScores.map((score) => {
                  const percentage = totalScore > 0 ? (score.average / totalScore) * 100 : 0;
                  return (
                    <div key={score.category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg" style={(getCategoryBg(score.category) as CSSProperties)}>
                            {getCategoryIcon(score.category)}
                          </div>
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-slate-800">{getCategoryName(score.category)}</h4>
                            <p className="text-sm text-slate-600">#{score.rank} პრიორიტეტი</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-slate-800">{Math.round(percentage)}%</div>
                          <div className="text-sm text-slate-600">{score.average.toFixed(1)}/7</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div className="h-3 rounded-full" style={{ ...(getCategoryGradient(score.category) as CSSProperties), width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          {/* Self-Assessment Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 printable-card">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">თვითშეფასება</h3>
            <div className="space-y-6">
              {[{ key: 'vision' as const, category: 'Vision' }, { key: 'people' as const, category: 'People' }, { key: 'execution' as const, category: 'Execution' }].map(({ key, category }) => {
                const selfPercent = results.selfAssessment[key];
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={(getCategoryBg(category) as CSSProperties)}>
                          {getCategoryIcon(category)}
                        </div>
                        <div>
                          <h4 className="text-sm md:text-base font-semibold text-slate-800">{getCategoryName(category)}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg md:text-xl font-bold text-slate-800">{Math.round(selfPercent)}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${selfPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Detailed Personality Description */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 mb-8 printable-card">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800">{detailedInfo.title}</h3>
              <div className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{detailedInfo.code}</div>
            </div>
            {/* Personality Framework Info */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h5 className="text-sm font-semibold text-purple-800 mb-1">დომინანტური</h5>
                <p className="text-sm text-purple-700">{detailedInfo.dominantOrientation}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="text-sm font-semibold text-blue-800 mb-1">დამხმარე</h5>
                <p className="text-sm text-blue-700">{detailedInfo.supportingOrientation}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h5 className="text-sm font-semibold text-red-800 mb-1">ბრმა წერტილი</h5>
                <p className="text-sm text-red-700">{detailedInfo.blindSpot}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-100/50 rounded-xl p-4 md:p-6 mb-6">
            <p className="text-base md:text-lg text-slate-700 leading-relaxed">{detailedInfo.description}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#46ac5030' }}>
              <h4 className="text-base md:text-lg font-semibold mb-3" style={{ color: '#46ac50' }}>ძლიერი მხარეები</h4>
              <ul className="space-y-2">
                {detailedInfo.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start">
                    <span className="mr-2 mt-1" style={{ color: '#46ac50' }}>•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-100/70 rounded-lg p-4">
              <h4 className="text-base md:text-lg font-semibold text-amber-800 mb-3">განვითარების სფეროები</h4>
              <ul className="space-y-2">
                {detailedInfo.developmentAreas.map((a, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start">
                    <span className="text-amber-600 mr-2 mt-1">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Pitfalls Section */}
          <div className="bg-red-50/70 rounded-lg p-4 mb-6">
            <h4 className="text-base md:text-lg font-semibold text-red-800 mb-3">ჩრდილოვანი წერტილები</h4>
            <ul className="space-y-2">
              {detailedInfo.pitfalls.map((p, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start">
                  <span className="text-red-600 mr-2 mt-1">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>



        {/* Actions */}
        <div className="text-center pb-8 no-print">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button
              onClick={onRetake}
              className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-full text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg w-full sm:w-auto max-w-xs"
              style={{ background: `#241f3f` }}
            >
              <ArrowClockwise size={20} className="mr-2 w-5 h-5" />
              ტესტის თავიდან გავლა
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-full text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg w-full sm:w-auto max-w-xs"
              style={{ background: `#46ac50` }}
            >
              <Printer size={20} className="mr-2 w-5 h-5" />
              ბეჭდვა / PDF შენახვა
            </button>
          </div>
          <div className="text-sm text-slate-500">
            შედეგები მიახლოებითია და განკუთვნილია განვითარების მიზნებისთვის<br />
            <span className="text-xs text-slate-400">PDF-ის შესაქმნელად გამოიყენეთ ბეჭდვის ღილაკი და აირჩიეთ "Save as PDF"</span>
          </div>
        </div>
      </div>
    </div>
  );
};