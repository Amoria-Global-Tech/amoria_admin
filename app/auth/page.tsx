"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/app/api/conn"; // Assuming you have your API instance here

interface EmailFormData {
  email: string;
}

interface OTPFormData {
  otp: string;
}

interface PasswordFormData {
  password: string;
}

type AuthStep = 'email' | 'otp' | 'password';

// Function to generate 6-digit OTP on frontend
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function AdminAuthPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<AuthStep>('email');
  const [emailData, setEmailData] = useState<EmailFormData>({ email: "" });
  const [otpData, setOTPData] = useState<OTPFormData>({ otp: "" });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({ password: "" });
  const [generatedOTP, setGeneratedOTP] = useState<string>("");
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to check if user exists and has password
  const checkUserStatus = async (email: string) => {
    try {
      const response = await api.get(`/auth/check-email/${encodeURIComponent(email)}`);
      return response.data.data; // Return the full response data structure
    } catch (error: any) {
      // If user doesn't exist, API might return 404
      if (error.response?.status === 404) {
        return { success: false, exists: false };
      }
      throw error;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailData({ email: e.target.value });
    setError(null);
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOTPData({ otp: value });
      setError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ password: e.target.value });
    setError(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Generate OTP on frontend
    const otp = generateOTP();
    setGeneratedOTP(otp);

    try {
      // Check if email exists
      const userStatus = await checkUserStatus(emailData.email);
      
      if (!userStatus.exists || userStatus.userType !== 'admin') {
        setError('Email not found. Please check and try again.');
        setIsSubmitting(false);
        return;
      }

      // If user exists, send OTP using your current send OTP endpoint
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: emailData.email,
          otp: otp // Send generated OTP to backend for email sending
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMaskedEmail(result.maskedEmail || emailData.email);
        // Save email to localStorage
        localStorage.setItem('userEmail', emailData.email);
        localStorage.setItem('authOTP', otp); // Store OTP for verification
        localStorage.setItem('otpTimestamp', Date.now().toString()); // Store timestamp
        setCurrentStep('otp');
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Network error. Please check your connection and try again.');
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
    if (otpAge > 2 * 60 * 1000) {
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

    // OTP verified, proceed to password step
    setCurrentStep('password');
    setIsSubmitting(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        email: emailData.email,
        password: passwordData.password
      });

      if (response.data.user) {
        const { accessToken, refreshToken } = response.data;

        // Store tokens in localStorage
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Store tokens in cookies for middleware
        Cookies.set('authToken', accessToken, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        Cookies.set('refreshToken', refreshToken, {
          expires: 30, // 30 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        // Clear temporary OTP data
        localStorage.removeItem('userEmail');
        localStorage.removeItem('authOTP');
        localStorage.removeItem('otpTimestamp');

        // Redirect to admin dashboard
        router.push('/');
      } else {
        setError(response.data.message || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
          email: emailData.email,
          otp: newOTP
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

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setOTPData({ otp: "" });
    setPasswordData({ password: "" });
    setGeneratedOTP("");
    setMaskedEmail("");
    setError(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authOTP');
    localStorage.removeItem('otpTimestamp');
  };

  const handleBackToOTP = () => {
    setCurrentStep('otp');
    setPasswordData({ password: "" });
    setError(null);
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
              {currentStep === 'email' ? 'Admin Login' : 
               currentStep === 'otp' ? 'Verify Your Identity' : 'Enter Password'}
            </h1>
            <p className="text-white/70">
              {currentStep === 'email' 
                ? 'Enter your email address to continue' 
                : currentStep === 'otp'
                ? `We've sent a verification code to ${maskedEmail}`
                : 'Enter your password to complete login'
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

          {/* Email Step */}
          {currentStep === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-white/80 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={emailData.email}
                  onChange={handleEmailChange}
                  required
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !emailData.email.trim()}
                className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                    Checking...
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
                      Verify Code
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
                  onClick={handleBackToEmail}
                  disabled={isSubmitting}
                  className="text-white/50 hover:text-white/70 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <i className="bi bi-arrow-left"></i>
                  Back to email
                </button>
              </div>
            </div>
          )}

          {/* Password Step */}
          {currentStep === 'password' && (
            <div className="space-y-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-white/80 text-sm font-semibold mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={passwordData.password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !passwordData.password.trim()}
                  className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right text-lg"></i>
                      Login to Admin
                    </>
                  )}
                </button>
              </form>

              {/* Password Actions */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleBackToOTP}
                  disabled={isSubmitting}
                  className="text-white/50 hover:text-white/70 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <i className="bi bi-arrow-left"></i>
                  Back to OTP verification
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              Secure admin login powered by Amoria
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}