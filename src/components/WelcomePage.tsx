import React, { useEffect } from 'react';
import { Eye, Users, Target, ArrowRight } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';

interface WelcomePageProps {
  onStart: () => void;
  testType?: 'r' | 'nr' | null;
}

// Color Palette Definition for clarity
const palette = {
  vision: '#241f3f',      // purple
  culture: '#46ac50',     // green
  execution: '#e43159',   // pink
  darkText: '#1e293b',    // slate-800
  lightText: '#475569',   // slate-600
  subtleText: '#64748b',  // slate-500
};

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart, testType }) => {
  // Simple background query to keep Supabase active
  useEffect(() => {
    supabase.from('settings').select('count', { count: 'exact', head: true }).then(() => {
      // Silent query - users never see this
    });
  }, []);

  return (
    // A more subtle background gradient that hints at the new palette
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 md:mb-12">
          {/* Main icon with a gradient derived from your brand colors */}
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src="https://i.ibb.co/bc9xNqL/pwr3-logo-tr.png"
              alt="POWER3 Logo"
              className="w-20 h-20 object-contain rounded-full"
            />
          </div>
          {/* Using slate for text for better harmony, and your brand green for the highlight */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 px-4">
            POWER<span className="text-green-500">3</span> Leadership Test
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-2">by ACT Global</p>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto px-4">
            აღმოაჩინეთ თქვენი ლიდერობის სტილი ხედვის, ადამიანებისა და აღსრულების მიმართ თქვენი მიდგომის დეტალური შეფასებით
          </p>
        </div>

        {/* Feature cards with the new, harmonious color palette */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12 px-4">
          {/* Vision Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#241f3f20' }}>
              <Eye size={32} style={{ color: '#241f3f' }} />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-3">ხედვა</h3>
            <p className="text-sm md:text-base text-slate-600">
              დიდი სურათის ხედვა, სტრატეგიული ფიქრი და ინოვაციური მიდგომები
            </p>
          </div>

          {/* Culture Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#46ac5020' }}>
              <Users size={32} style={{ color: '#46ac50' }} />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-3">ადამიანები</h3>
            <p className="text-sm md:text-base text-slate-600">
              ურთიერთობები, ემოციური ინტელექტი, მოტივაცია და გუნდის განვითარება
            </p>
          </div>

          {/* Execution Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#e4315920' }}>
              <Target size={32} style={{ color: '#e43159' }} />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-3">აღსრულება</h3>
            <p className="text-sm md:text-base text-slate-600">
              შედეგებზე ორიენტაცია, დაგეგმვა და ეფექტური აღსრულება
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-2">რას მოიცავს ტესტი?</h3>
            <ul className="text-sm md:text-base text-slate-600 space-y-2 text-left px-4">
              <li><span style={{ color: '#e43159' }} className="mr-2">•</span>თვითშეფასება სამ ძირითად დომენში</li>
              <li><span style={{ color: '#46ac50' }} className="mr-2">•</span>60 კითხვა</li>
              <li><span style={{ color: '#241f3f' }} className="mr-2">•</span>პირადი ლიდერობის ტიპისა და დეტალური რეკომენდაციების მიღება</li>
            </ul>
          </div>



          {/* Main CTA button */}
          <button
            onClick={onStart}
            className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-white font-semibold rounded-full text-base md:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg w-full sm:w-auto max-w-xs mx-auto"
            style={{ background: `#241f3f` }}
          >
            ტესტის მოთხოვნა
            <ArrowRight size={20} className="ml-2" />
          </button>
          <p className="text-sm text-slate-500 mt-4">დაახლოებით 10-15 წუთი</p>
        </div>
      </div>
    </div>
  );
};