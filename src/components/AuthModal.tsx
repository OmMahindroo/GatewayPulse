'use client';

import React, { useState } from 'react';
import { X, Mail, KeyRound, ShieldCheck, Store, ArrowRight } from 'lucide-react';
import { AuthSession } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthSession) => void;
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

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickName: string) => {
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
          onSuccess(data.user);
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
      <div className="w-full max-w-md bg-white rounded-md border border-neutral-300 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 bg-neutral-50 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Platform Authentication</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Passwordless sign-in for merchants and PG representatives</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Business or Company Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="merchant@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  Official PG support staff should use their corporate email (e.g., @razorpay.com or @cashfree.com) for verified representative status.
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
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 placeholder:text-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending passcode...' : 'Continue with Email'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  6-Digit Verification Passcode
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-neutral-500">Destination: {email}</span>
                  <button
                    type="button"
                    onClick={() => setStep('EMAIL')}
                    className="text-[11px] text-neutral-700 underline hover:text-neutral-900"
                  >
                    Change email
                  </button>
                </div>

                {emailSent ? (
                  <div className="mt-2.5 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    <p className="font-semibold">Email Delivered via Resend</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      A 6-digit passcode was sent to your inbox. Check your inbox (and spam/junk folder).
                    </p>
                  </div>
                ) : (
                  <div className="mt-2.5 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] text-amber-800 uppercase tracking-wider">
                        {isSandboxRestriction ? 'Resend Sandbox Notice' : 'Verification Passcode'}
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                        {isSandboxRestriction ? 'Sandbox Restricted' : 'Dev Simulation'}
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      {isSandboxRestriction
                        ? 'Resend free testing tier only delivers live emails to your registered Resend account (mahindrooom@gmail.com). For all other addresses, use the instant passcode generated below:'
                        : infoMessage || 'Your one-time verification passcode has been generated below:'}
                    </p>

                    {devCode && (
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-amber-300 shadow-sm">
                        <span className="font-mono font-bold text-neutral-900 tracking-widest text-base">{devCode}</span>
                        <button
                          type="button"
                          onClick={() => setCode(devCode)}
                          className="text-xs font-semibold text-neutral-900 underline hover:text-black"
                        >
                          Autofill & Continue
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify and Sign In'}
              </button>
            </form>
          )}

          {/* Quick Demo Test Personas */}
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">
              Quick Test Personas (Dev Mode)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('merchant@acmestore.in', 'Acme Retail India')}
                className="flex items-center gap-1.5 p-2 rounded-md border border-neutral-200 bg-neutral-50 text-left hover:bg-neutral-100 transition-colors text-xs text-neutral-800"
              >
                <Store className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                <div className="truncate">
                  <p className="font-medium truncate">Merchant Persona</p>
                  <p className="text-[10px] text-neutral-500 truncate">acmestore.in</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('support.ops@razorpay.com', 'Razorpay Support')}
                className="flex items-center gap-1.5 p-2 rounded-md border border-sky-200 bg-sky-50 text-left hover:bg-sky-100 transition-colors text-xs text-sky-900"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <div className="truncate">
                  <p className="font-medium truncate">Razorpay Support</p>
                  <p className="text-[10px] text-sky-700 truncate">@razorpay.com</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
