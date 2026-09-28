'use client';

import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { AuthSession } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthSession, openAdminDashboard?: boolean) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isSandboxRestriction, setIsSandboxRestriction] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid business email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request verification code.');
      }

      setEmailSent(Boolean(data.emailSent));
      setIsSandboxRestriction(Boolean(data.isSandboxRestriction));
      setInfoMessage(data.message || null);
      setDevCode(data.devCode || null);
      setStep('OTP');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code || code.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      const isAdmin = data.user?.role === 'ADMIN';
      onSuccess(data.user, isAdmin);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (
    quickEmail: string,
    quickName: string,
    openAdminDashboard = false
  ) => {
    setEmail(quickEmail);
    setName(quickName);
    setCode('123456');
    setLoading(true);
    setError(null);

    fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: quickEmail, code: '123456', name: quickName }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          onSuccess(data.user, openAdminDashboard || data.user.role === 'ADMIN');
          onClose();
        } else {
          setError(data.error || 'Login failed.');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="w-full max-w-md bg-white border border-neutral-400 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Editorial Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4 bg-[#FAF9F5] shrink-0">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Identity Verification
            </p>
            <h2 className="font-serif text-lg font-semibold text-neutral-950 mt-0.5">
              Platform Sign In
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Passwordless email verification for merchants, payment providers, and administrators
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-2 border-red-700 text-xs text-red-900">
              {error}
            </div>
          )}

          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Business or Company Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="merchant@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 focus:outline-none focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                />
                <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                  Official PG representatives should sign in with their corporate domain (e.g., @razorpay.com or @cashfree.com) to unlock verified response controls.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Organization / Contact Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Acme Retail or Support Lead"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 focus:outline-none focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                <span>{loading ? 'Sending passcode...' : 'Continue with Email'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  6-Digit Verification Passcode
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tracking-widest border border-neutral-300 focus:outline-none focus:border-neutral-900 text-neutral-900"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-mono text-neutral-500">{email}</span>
                  <button
                    type="button"
                    onClick={() => setStep('EMAIL')}
                    className="text-[11px] font-mono text-neutral-700 underline hover:text-neutral-950"
                  >
                    Change email
                  </button>
                </div>

                {emailSent ? (
                  <div className="mt-3 p-3 bg-[#FAF9F5] border border-neutral-200 text-xs text-neutral-800">
                    <p className="font-semibold">Verification Code Sent</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Check your inbox (and spam folder) for the 6-digit code.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-[#FAF9F5] border border-neutral-300 text-xs text-neutral-800 space-y-2">
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      {isSandboxRestriction
                        ? 'Instant verification passcode generated below:'
                        : infoMessage || 'Your one-time verification passcode:'}
                    </p>

                    {devCode && (
                      <div className="flex items-center justify-between bg-white px-3 py-2 border border-neutral-300">
                        <span className="font-mono font-bold text-neutral-950 tracking-widest text-sm">
                          {devCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCode(devCode)}
                          className="font-mono text-[11px] text-neutral-900 underline"
                        >
                          Autofill
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>
          )}

          {/* Quick Role Sign-In Personas (Merchant / PG Support / Admin Dashboard) */}
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-2.5">
              Role Sign-In &amp; Portal Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('merchant@acmestore.in', 'Acme Retail India', false)}
                className="p-2.5 border border-neutral-300 bg-[#FAF9F5] text-left hover:border-neutral-900 transition-colors text-xs"
              >
                <p className="font-semibold text-neutral-950">Merchant</p>
                <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">
                  acmestore.in
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('support.ops@razorpay.com', 'Razorpay Support', false)}
                className="p-2.5 border border-neutral-300 bg-[#FAF9F5] text-left hover:border-neutral-900 transition-colors text-xs"
              >
                <p className="font-semibold text-neutral-950">PG Official</p>
                <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">
                  @razorpay.com
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@gatewaypulse.in', 'GatewayPulse Admin', true)}
                className="p-2.5 border border-neutral-900 bg-neutral-950 text-white text-left hover:bg-neutral-800 transition-colors text-xs"
              >
                <p className="font-semibold text-white">Admin</p>
                <p className="font-mono text-[10px] text-neutral-400 truncate mt-0.5">
                  Admin Dashboard
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
