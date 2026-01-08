import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react';
import { SelfAssessment } from '../types/Assessment';

export const SelfAssessmentPage: React.FC<{
  onNext: (assessment: SelfAssessment) => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const [assessment, setAssessment] = useState<SelfAssessment>({
    vision: 33,
    people: 33,
    execution: 34,
    extraversion: 50,
  });

  const [inputValues, setInputValues] = useState({
    vision: '33',
    people: '33',
    execution: '34',
  });

  const handleInputChange = (category: keyof SelfAssessment, value: string) => {
    setInputValues(prev => ({ ...prev, [category]: value }));
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setAssessment(prev => ({ ...prev, [category]: numValue }));
    }
  };

  const total = assessment.vision + assessment.people + assessment.execution;
  const isValid = Math.abs(total - 100) < 0.1;

  const categories = [
    { key: 'vision' as const, label: 'ხედვა' },
    { key: 'people' as const, label: 'ადამიანები' },
    { key: 'execution' as const, label: 'აღსრულება' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-teal-50 to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Introduction Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-4">
              <img
                src="https://i.ibb.co/bc9xNqL/pwr3-logo-tr.png"
                alt="POWER3 Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
              POWER3® ლიდერობის ტესტი
            </h1>
            <h2 className="text-lg md:text-xl font-semibold text-slate-700 mb-4">
              აღმოაჩინე შენი ლიდერული სტილი
            </h2>
          </div>

          <div className="prose prose-slate max-w-none text-sm md:text-base leading-relaxed space-y-4">
            <p className="text-slate-700">
              POWER3® ლიდერობის თვითშეფასების ტესტია — ეს ინსტრუმენტი დაგეხმარება გააცნობიერო შენი ლიდერობის წამყვანი ორიენტაცია ხედვაზე, ადამიანებზე და აღსრულებაზე კონცენტრაციის თვალსაზრისით.
            </p>

            <p className="text-slate-700">
              ტესტი ეფუძნება გლობალური საკონსულტაციო კომპანიის ACT Global-ის უნიკალურ მოდელს — THE POWER OF THREE® (POWER3®), რომელიც ორგანიზაციული წარმატებისთვის აერთიანებს სამ მთავარ დომეინს: ხედვა, კულტურა (ადამიანები) და აღსრულება. მოდელი დაგეხმარება გააცნობიერო, რა გზით ქმნი ღირებულებას როგორც ლიდერი:
            </p>

            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">ხედვა</h4>
                <p className="text-sm text-purple-700">გაძლევს მიმართულებას, მომავლის ხედვასა და სტრატეგიას, შეეხება იდეასა და ინსპირაციას.</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">კულტურა (ადამიანები)</h4>
                <p className="text-sm text-green-700">ქმნის ორგანიზაციულ კონტექსტს, უზრუნველყოფს გუნდურობას, ქცევის ნორმებისა და თანაშექმნის წესებს;</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">აღსრულება</h4>
                <p className="text-sm text-red-700">უზრუნველყოფს კონკრეტულ შედეგებს, შეეხება პროცესებს, სტრუქტურებს, ოპერაციებს.</p>
              </div>
            </div>

            <p className="text-slate-700">
              ამ სამი კომპონენტის ჰარმონიული განვითარება ქმნის ძლიერი და მდგრადი ლიდერობის საფუძველს.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-blue-800 text-sm">
                <strong>მნიშვნელოვანი:</strong> ტესტში სწორი ან არასწორი პასუხები არ არსებობს — მთავარია გულწრფელობა და თვითრეფლექსიისთვის მზაობა. შეავსე ტესტი მშვიდ გარემოში, ისიამოვნე რეფლექსიური პროცესით და აღმოაჩინე შენი ლიდერობის უნიკალური სტილი.
              </p>
            </div>

            <p className="text-center text-slate-600 font-medium mt-6 mb-8">
              თვითგანვითარების გზაზე დიდ წარმატებას გისურვებთ!
            </p>

            {/* Divider */}
            <div className="border-t border-slate-300 my-8"></div>

            {/* Self Assessment Section */}
            <div className="mt-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">თვითშეფასება</h2>
                <p className="text-base md:text-lg text-slate-600">როგორ ფიქრობთ, რამდენად ძლიერია თქვენი უნარები ამ სამ სფეროში? გაანაწილეთ 100% სამ კატეგორიას შორის.</p>
              </div>

              <div className="space-y-6 md:space-y-8">
                {categories.map(({ key, label }) => {
                  return (
                    <div key={key} className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-lg md:text-xl font-semibold text-slate-800">{label}</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={inputValues[key]}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="w-20 md:w-24 px-3 py-2 text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                          />
                          <span className="text-lg font-bold text-slate-800">%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div className="text-base md:text-lg font-semibold text-slate-800">სულ: <span className={`${isValid ? 'text-emerald-600' : 'text-red-600'}`}>{Math.round(total)}%</span></div>
                  {!isValid && (<div className="text-sm text-red-600 font-medium">სულ უნდა იყოს 100%</div>)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 md:mt-8">
                <button onClick={onBack} className="inline-flex items-center justify-center px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-full hover:bg-slate-300 transition-all duration-300 transform hover:scale-105"><ArrowLeft size={20} className="mr-2 w-5 h-5" />უკან</button>
                <button
                  onClick={() => onNext(assessment)}
                  disabled={!isValid}
                  className={`inline-flex items-center justify-center px-8 py-3 font-semibold rounded-full transition-all duration-300 ${isValid
                    ? 'text-white hover:shadow-xl transform hover:scale-105 shadow-lg'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  style={isValid ? { background: `#241f3f` } : {}}
                >
                  კითხვებზე გადასვლა
                  <ArrowRight size={20} className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};