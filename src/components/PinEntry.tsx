import React, { useState } from 'react';
import { Lock, Eye, EyeSlash } from '@phosphor-icons/react';

interface PinEntryProps {
  onPinVerified: () => void;
}

export const PinEntry: React.FC<PinEntryProps> = ({ onPinVerified }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const correctPin = 'ACT2025!';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Add a small delay to prevent brute force attempts
    await new Promise(resolve => setTimeout(resolve, 500));

    if (pin === correctPin) {
      onPinVerified();
    } else {
      setError('არასწორი PIN კოდი. გთხოვთ, სცადეთ ხელახლა.');
      setPin('');
    }
    setIsLoading(false);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-6">
              <img 
                src="https://i.ibb.co/bc9xNqL/pwr3-logo-tr.png" 
                alt="POWER3 Logo" 
                className="w-16 h-16 object-contain rounded-full"
              />
            </div>
            
            {/* Lock icon */}
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-slate-600" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
              წვდომის კოდი
            </h1>
            <p className="text-slate-600 mb-6">
              გთხოვთ შეიყვანოთ წვდომის PIN კოდი
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={handlePinChange}
                placeholder="PIN კოდი"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-lg font-mono tracking-wider text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error 
                    ? 'border-red-300 bg-red-50 focus:border-red-400' 
                    : 'border-gray-300 bg-white focus:border-blue-400'
                }`}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                {showPin ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!pin.trim() || isLoading}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                !pin.trim() || isLoading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 hover:shadow-lg transform hover:scale-[1.02]'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>მოწმდება...</span>
                </div>
              ) : (
                'შესვლა'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <p>POWER<span className="text-green-500">3</span> Leadership Test</p>
            <p className="text-xs mt-1">by ACT Global</p>
          </div>
        </div>
      </div>
    </div>
  );
};