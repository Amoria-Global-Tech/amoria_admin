"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginFormData {
  username: string;
}

interface OTPFormData {
  otp: string;
}

type AuthStep = 'username' | 'otp';

// Function to generate 6-digit OTP on frontend
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function AuthPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<AuthStep>('username');
  const [loginData, setLoginData] = useState<LoginFormData>({ username: "" });
  const [otpData, setOTPData] = useState<OTPFormData>({ otp: "" });
  const [generatedOTP, setGeneratedOTP] = useState<string>("");
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ username: e.target.value });
    setError(null);
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOTPData({ otp: value });
      setError(null);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Generate OTP on frontend
    const otp = generateOTP();
    setGeneratedOTP(otp);

    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: loginData.username,
          otp: otp // Send generated OTP to backend for email sending
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMaskedEmail(result.maskedEmail);
        setUserEmail(result.email);
        // Save email to localStorage
        localStorage.setItem('userEmail', result.email);
        localStorage.setItem('authOTP', otp); // Store OTP for verification
        localStorage.setItem('otpTimestamp', Date.now().toString()); // Store timestamp
        setCurrentStep('otp');
      } else {
        setError(result.message || 'Username not found. Please check and try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Verify OTP against localStorage
    const storedOTP = localStorage.getItem('authOTP');
    const otpTimestamp = localStorage.getItem('otpTimestamp');
    
    if (!storedOTP || !otpTimestamp) {
      setError('OTP session expired. Please request a new code.');
      setIsSubmitting(false);
      return;
    }

    // Check if OTP has expired (10 minutes)
    const otpAge = Date.now() - parseInt(otpTimestamp);
    if (otpAge > 10 * 60 * 1000) {
      setError('OTP has expired. Please request a new code.');
      localStorage.removeItem('authOTP');
      localStorage.removeItem('otpTimestamp');
      setIsSubmitting(false);
      return;
    }

    // Verify OTP matches
    if (storedOTP !== otpData.otp) {
      setError('Invalid OTP. Please try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: loginData.username,
          otp: otpData.otp,
          email: userEmail
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store authentication data in localStorage
        if (result.authData) {
          localStorage.setItem('authenticated', result.authData.authenticated);
          localStorage.setItem('authToken', result.authData.authToken);
          localStorage.setItem('userInfo', JSON.stringify(result.authData.userInfo));
        }
        
        // Clear temporary OTP data
        localStorage.removeItem('userEmail');
        localStorage.removeItem('authOTP');
        localStorage.removeItem('otpTimestamp');
        
        // Redirect to home page
        router.push('/');
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsSubmitting(true);
    setError(null);

    // Generate new OTP on frontend
    const newOTP = generateOTP();
    setGeneratedOTP(newOTP);

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: loginData.username,
          otp: newOTP,
          email: userEmail
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update localStorage with new OTP
        localStorage.setItem('authOTP', newOTP);
        localStorage.setItem('otpTimestamp', Date.now().toString());
      } else {
        setError(result.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToUsername = () => {
    setCurrentStep('username');
    setOTPData({ otp: "" });
    setGeneratedOTP("");
    setMaskedEmail("");
    setUserEmail("");
    setError(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authOTP');
    localStorage.removeItem('otpTimestamp');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-shield-lock text-white text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentStep === 'username' ? 'Welcome Back' : 'Verify Your Identity'}
            </h1>
            <p className="text-white/70">
              {currentStep === 'username' 
                ? 'Enter your username to continue' 
                : `We've sent a verification code to ${maskedEmail}`
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <i className="bi bi-exclamation-triangle text-red-400"></i>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Username Step */}
          {currentStep === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-white/80 text-sm font-semibold mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={loginData.username}
                  onChange={handleUsernameChange}
                  required
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !loginData.username.trim()}
                className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-right text-lg"></i>
                    Continue
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {currentStep === 'otp' && (
            <div className="space-y-6">
              <form onSubmit={handleOTPSubmit} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-white/80 text-sm font-semibold mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={otpData.otp}
                    onChange={handleOTPChange}
                    required
                    maxLength={6}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-widest placeholder-white/60 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
                    placeholder="000000"
                    disabled={isSubmitting}
                  />
                  <p className="text-white/50 text-xs mt-2 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpData.otp.length !== 6}
                  className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle text-lg"></i>
                      Verify & Login
                    </>
                  )}
                </button>
              </form>

              {/* OTP Actions */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleResendOTP}
                  disabled={isSubmitting}
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  Didn&apos;t receive the code? Resend OTP
                </button>
                
                <button
                  onClick={handleBackToUsername}
                  disabled={isSubmitting}
                  className="text-white/50 hover:text-white/70 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <i className="bi bi-arrow-left"></i>
                  Back to username
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              Secure login powered by OTP verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}