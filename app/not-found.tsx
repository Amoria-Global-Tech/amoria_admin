// app/not-found.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!mounted) return null;

  return (
    <div className="items-center justify-center">
      <div className="w-full text-center">
        
        {/* Animated 404 Display */}
        <div className="relative mb-12">
          {/* Background decorative elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-gradient-to-r from-pink-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          </div>
          
          {/* Main 404 Text */}
          <div className="relative z-10">
            <h1 className="text-[12rem] sm:text-[16rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 leading-none animate-pulse">
              404
            </h1>
            
            {/* Floating elements */}
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-pink-400 rounded-full animate-bounce delay-100"></div>
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-300"></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-500"></div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="bi bi-exclamation-triangle text-white text-3xl"></i>
          </div>

          {/* Main Message */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Oops! Page Not Found
          </h2>
          
          <p className="text-xl text-white/70 mb-6 leading-relaxed">
            The page you&apos;re looking for seems to have wandered off into the digital void. 
            Don&apos;t worry, even the best explorers sometimes take a wrong turn.
          </p>

          {/* Additional Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">What might have happened?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-white/60">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>The page was moved or deleted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>You typed the URL incorrectly</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>The link you clicked is broken</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>You need special permissions</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <i className="bi bi-house text-lg"></i>
              Go Home
            </button>
            
            <button
              onClick={handleGoBack}
              className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3"
            >
              <i className="bi bi-arrow-left text-lg"></i>
              Go Back
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/services')}
            className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300"
          >
            <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <i className="bi bi-gear-wide-connected text-blue-400"></i>
            </div>
            <span className="text-white text-sm font-medium">Services</span>
          </button>

          <button
            onClick={() => router.push('https://amoriaglobal.com/about')}
            className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300"
          >
            <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <i className="bi bi-people text-green-400"></i>
            </div>
            <span className="text-white text-sm font-medium">About</span>
          </button>

          <button
            onClick={() => router.push('https://amoriaglobal.com/contact')}
            className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300"
          >
            <div className="w-10 h-10 bg-pink-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <i className="bi bi-envelope text-pink-400"></i>
            </div>
            <span className="text-white text-sm font-medium">Contact</span>
          </button>

          <button
            onClick={() => router.push('/auth')}
            className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300"
          >
            <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <i className="bi bi-box-arrow-in-right text-yellow-400"></i>
            </div>
            <span className="text-white text-sm font-medium">Login</span>
          </button>
        </div>

        {/* Footer Message */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/50 text-sm">
            Need help? Contact our support team at{' '}
            <a 
              href="mailto:support@amoriaglobal.com" 
              className="text-pink-400 hover:text-pink-300 transition-colors"
            >
              support@amoriaglobal.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}