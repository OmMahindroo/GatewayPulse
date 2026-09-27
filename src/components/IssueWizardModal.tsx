'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Layers,
  FileText,
  Upload,
  AlertCircle,
  ShieldAlert,
  Check,
  ChevronDown,
  Lock,
  Calendar,
  Phone,
  Mail,
  Hash,
  Clock,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { AuthSession } from '@/lib/auth';

interface IssueWizardModalProps {
  isOpen: boolean;
  currentUser: AuthSession | null;
  initialGatewaySlug?: string | null;
  onClose: () => void;
  onSuccess: (updatedUser?: AuthSession) => void;
  onRequireAuth?: () => void;
}

const CHANNEL_TRIED_OPTIONS = [
  'Email',
  'Phone - IVR',
  'In-app Chat',
  'LinkedIn-Social',
  'More than One',
  'Not Yet',
];

const DURATION_OPTIONS = [
  '<24 hours',
  '1-3 days',
  '4-7 days',
  '8-15 days',
  '15+ days',
];

const DEFAULT_TEMPLATES_BY_SLUG: Record<string, Array<{ id: string; title: string; content: string }>> = {
  'account-kyc': [
    {
      id: 'kyc-1',
      title: 'Merchant account activation pending past SLA after full KYC submission',
      content:
        'All required business registration, GST, and cancelled cheque documents were uploaded on the onboarding portal. Account status remains stuck in Under Review with no response from onboarding support.',
    },
    {
      id: 'kyc-2',
      title: 'Live payment acceptance disabled due to unannounced re-KYC verification',
      content:
        'Our active merchant account had live collections paused without prior warning for routine KYC re-verification. Requested documents were submitted immediately but activation has not been restored.',
    },
  ],
  'tx-failures': [
    {
      id: 'tx-1',
      title: 'UPI intent flow timing out across major UPI apps',
      content:
        'Customers attempting checkout via UPI intent experience timeouts and payment drops, resulting in failed transaction status after 180 seconds.',
    },
    {
      id: 'tx-2',
      title: 'Card processing endpoint returning intermittent 502 Bad Gateway',
      content:
        'Direct card authorization requests are failing with 502 Bad Gateway responses on checkout requests, causing a sharp drop in payment success rate.',
    },
  ],
  'api-integration': [
    {
      id: 'api-1',
      title: 'Payment captured but webhook callback dropped / not delivered',
      content:
        'Customer payment was successfully debited, but our server endpoint did not receive the webhook callback. Orders remain unfulfilled until manual reconciliation.',
    },
    {
      id: 'api-2',
      title: 'Cryptographic signature verification failure on webhook payload',
      content:
        'Webhook requests received from gateway IP range are failing signature verification against the configured webhook secret.',
    },
  ],
  settlements: [
    {
      id: 'set-1',
      title: 'T+2 settlement delayed past 48 hours without dashboard update',
      content:
        'Settlement for batch processing from 2 days ago is still listed as Processing on the merchant dashboard. No UTR generated, and standard customer support ticket has not received an update.',
    },
    {
      id: 'set-2',
      title: 'Settlement marked as Processed but bank account has not received funds',
      content:
        'The dashboard indicates batch funds were sent, but the beneficiary bank reports no inward IMPS/NEFT transfer with the specified UTR. Please confirm bank clearing status.',
    },
  ],
  chargebacks: [
    {
      id: 'cb-1',
      title: 'Customer refund stuck in Pending state beyond 7 business days',
      content:
        'Initiated a full refund via the merchant dashboard over 7 business days ago. Refund ARN has not been generated and customer has escalated the delay.',
    },
    {
      id: 'cb-2',
      title: 'Premature chargeback deduction before evidence submission deadline',
      content:
        'A customer chargeback was initiated on transaction ARN, but the gateway auto-debited the dispute amount before the stated representment window expired.',
    },
  ],
  'risk-holds': [
    {
      id: 'risk-1',
      title: 'Unannounced settlement hold initiated by risk review team',
      content:
        'All merchant payouts were placed on risk hold requesting invoice and delivery proofs. Proofs were submitted 5 days ago with no update on fund release.',
    },
    {
      id: 'risk-2',
      title: 'Account frozen without specific transaction reference or remediation steps',
      content:
        'Our merchant dashboard shows settlements and collections paused under risk review, but no specific flagged transaction IDs or document requests have been shared.',
    },
  ],
  'pricing-billing': [
    {
      id: 'prc-1',
      title: 'Higher MDR deducted on settlement batch than agreed commercial rate',
      content:
        'Recent settlement batches show MDR deductions higher than the approved commercial pricing schedule agreed during onboarding.',
    },
  ],
  'support-escalation': [
    {
      id: 'sup-1',
      title: 'Support ticket unanswered after multiple follow-ups',
      content:
        'Raised an urgent support ticket regarding our merchant account, but received only automated acknowledgements with no human resolution for several days.',
    },
  ],
  others: [
    {
      id: 'oth-1',
      title: 'Unresolved operational issue with payment gateway account',
      content:
        'Experiencing an operational block on our merchant dashboard that remains unresolved despite standard support follow-ups.',
    },
  ],
};

export function IssueWizardModal({
  isOpen,
  currentUser,
  initialGatewaySlug,
  onClose,
  onSuccess,
}: IssueWizardModalProps) {
  const [gateways, setGateways] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [customPgName, setCustomPgName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [inputMode, setInputMode] = useState<'TEMPLATE' | 'CUSTOM'>('TEMPLATE');
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // New structured fields per specification
  const [pgTicketId, setPgTicketId] = useState('');
  const [dateRaised, setDateRaised] = useState('');
  const [channelTried, setChannelTried] = useState('Email');
  const [issueDuration, setIssueDuration] = useState('1-3 days');
  const [email, setEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');

  // One-step OTP verification on submit
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<
    Array<{ fileName: string; fileUrl: string; fileType: string; fileSize?: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
    if (currentUser?.mobileNumber) {
      setContactMobile(currentUser.mobileNumber);
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setOtpStep(false);
      setOtpCode('');
      setOtpInfoMessage(null);
      setDevOtpHint(null);
      setError(null);
      return;
    }

    fetch('/api/gateways')
      .then((res) => res.json())
      .then((data) => {
        if (data.gateways) {
          // Sort alphabetically for the dropdown, keeping "Report a PG (Other / Not Listed)" at the bottom
          const sortedForDropdown = [...data.gateways].sort((a, b) => {
            if (a.slug === 'other-pg') return 1;
            if (b.slug === 'other-pg') return -1;
            return a.name.localeCompare(b.name);
          });
          setGateways(sortedForDropdown);

          if (initialGatewaySlug) {
            const matched = sortedForDropdown.find((g) => g.slug === initialGatewaySlug);
            if (matched) {
              setSelectedGatewayId(matched.id);
              return;
            }
          }
          if (sortedForDropdown.length > 0 && !selectedGatewayId) {
            setSelectedGatewayId(sortedForDropdown[0].id);
          }
        }
      });

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
          if (data.categories.length > 0 && !selectedCategoryId) {
            const firstCat = data.categories[0];
            setSelectedCategoryId(firstCat.id);

            const tmpls =
              firstCat.templates && firstCat.templates.length > 0
                ? firstCat.templates
                : DEFAULT_TEMPLATES_BY_SLUG[firstCat.slug] || [];

            if (tmpls.length > 0) {
              const firstTmpl = tmpls[0];
              setSelectedTemplate(firstTmpl);
              setTitle(firstTmpl.title);
              setDescription(firstTmpl.content);
            }
          }
        }
      });
  }, [isOpen, initialGatewaySlug]);

  if (!isOpen) return null;

  const selectedGatewayObj = gateways.find((g) => g.id === selectedGatewayId);
  const isOtherPgSelected = selectedGatewayObj?.slug === 'other-pg';

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const dbTemplates = currentCategory?.templates || [];
  const fallbackTemplates = currentCategory?.slug ? DEFAULT_TEMPLATES_BY_SLUG[currentCategory.slug] || [] : [];
  const availableTemplates = dbTemplates.length > 0 ? dbTemplates : fallbackTemplates;

  const handleTemplateSelect = (tmpl: any) => {
    setSelectedTemplate(tmpl);
    setTitle(tmpl.title);
    setDescription(tmpl.content);
  };

  const handleCategorySelect = (cat: any) => {
    setSelectedCategoryId(cat.id);
    const tmpls =
      cat.templates && cat.templates.length > 0
        ? cat.templates
        : DEFAULT_TEMPLATES_BY_SLUG[cat.slug] || [];

    if (inputMode === 'TEMPLATE' && tmpls.length > 0) {
      const first = tmpls[0];
      setSelectedTemplate(first);
      setTitle(first.title);
      setDescription(first.content);
    } else if (inputMode === 'TEMPLATE') {
      setSelectedTemplate(null);
      setTitle('');
      setDescription('');
    }
  };

  const handleSwitchToTemplate = () => {
    setInputMode('TEMPLATE');
    if (availableTemplates.length > 0) {
      const target = selectedTemplate || availableTemplates[0];
      setSelectedTemplate(target);
      setTitle(target.title);
      setDescription(target.content);
    }
  };

  const handleSwitchToCustom = () => {
    setInputMode('CUSTOM');
    setSelectedTemplate(null);
  };

  const handleMockAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachments((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileType: file.type || 'image/png',
          fileSize: file.size || 0,
          fileUrl: dataUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const submitIssueWithMerchantId = async (merchantId: string, updatedSession?: AuthSession) => {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        gatewayId: selectedGatewayId,
        categoryId: selectedCategoryId,
        merchantId,
        attachments,
        pgTicketId: pgTicketId.trim() || null,
        dateRaised: dateRaised || null,
        channelTried,
        issueDuration,
        contactMobile: contactMobile.trim() || null,
        customPgName: isOtherPgSelected ? customPgName.trim() : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit issue.');
    }

    onSuccess(updatedSession);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedGatewayId || !selectedCategoryId) {
      setError('Please select a Payment Provider and Problem Category.');
      return;
    }

    if (isOtherPgSelected && !customPgName.trim()) {
      setError('Please enter the name of the Payment Provider you are reporting.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please provide a complete issue summary and description.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid Email ID for one-step verification.');
      return;
    }

    if (!contactMobile.trim()) {
      setError('Please provide your Mobile No (never shown publicly).');
      return;
    }

    setLoading(true);

    try {
      // Case 1: User is already verified with this exact email
      if (currentUser && currentUser.email.toLowerCase() === cleanEmail) {
        await submitIssueWithMerchantId(currentUser.userId);
        return;
      }

      // Case 2: Need 1-step Email OTP verification on submit
      if (!otpStep) {
        const otpRes = await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const otpData = await otpRes.json();
        if (!otpRes.ok) {
          throw new Error(otpData.error || 'Failed to send verification OTP.');
        }

        setOtpStep(true);
        setOtpInfoMessage(
          otpData.message || `A 6-digit verification code has been sent to ${cleanEmail}.`
        );
        if (otpData.devCode) {
          setDevOtpHint(otpData.devCode);
        }
        setLoading(false);
        return;
      }

      // Case 3: User is in otpStep and submitted the 6-digit OTP code
      if (!otpCode.trim()) {
        throw new Error('Please enter the 6-digit verification code sent to your email.');
      }

      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          code: otpCode.trim(),
          mobileNumber: contactMobile.trim(),
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.user) {
        throw new Error(verifyData.error || 'Invalid or expired OTP code.');
      }

      await submitIssueWithMerchantId(verifyData.user.userId, verifyData.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-md border border-neutral-300 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header - Fixed at Top */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3.5 bg-neutral-50 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Report Issue</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Structured facts only, no names of individual people, and public the moment you verify
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Step 1: Select Payment Provider */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  1. Select Payment Provider
                </span>
                {selectedGatewayObj && !isOtherPgSelected && (
                  <span className="text-[11px] text-neutral-500 font-mono font-normal">
                    {selectedGatewayObj.domain}
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedGatewayId}
                  onChange={(e) => setSelectedGatewayId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 font-medium cursor-pointer appearance-none pr-10 shadow-sm transition-colors hover:border-neutral-400"
                >
                  <option value="" disabled>
                    -- Select Payment Provider --
                  </option>
                  {gateways.map((gw) => (
                    <option key={gw.id} value={gw.id}>
                      {gw.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {isOtherPgSelected && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Specify Payment Provider Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter the name of the payment provider..."
                    value={customPgName}
                    onChange={(e) => setCustomPgName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                  />
                </div>
              )}
            </div>

            {/* Step 2: Select Problem Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neutral-500" />
                2. Select Problem Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-2.5 text-left rounded-md border text-xs transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'border-neutral-900 bg-neutral-100 text-neutral-900 font-semibold'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{cat.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Case Timeline & Support Escalation Metadata */}
            <div className="p-3.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-3.5">
              <p className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                3. Escalation Context & Timeline
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PG own ticket ID (Optional) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-neutral-400" />
                    PG own ticket ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TKT-992841 or Case ID"
                    value={pgTicketId}
                    onChange={(e) => setPgTicketId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 font-mono"
                  />
                </div>

                {/* Date Raised */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    Date Raised (With PG)
                  </label>
                  <input
                    type="date"
                    value={dateRaised}
                    onChange={(e) => setDateRaised(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 font-mono"
                  />
                </div>
              </div>

              {/* Channel Tried */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-neutral-400" />
                  Channel Tried
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNEL_TRIED_OPTIONS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannelTried(ch)}
                      className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                        channelTried === ch
                          ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* How long has this been happening? */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  How long has this been happening?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setIssueDuration(dur)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                        issueDuration === dur
                          ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Issue Description */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  4. Issue Details
                </label>
                <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-md border border-neutral-200 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleSwitchToTemplate}
                    className={`px-2.5 py-1 rounded-sm transition-colors ${
                      inputMode === 'TEMPLATE'
                        ? 'bg-white text-neutral-900 font-medium shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Pre-Written Templates
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToCustom}
                    className={`px-2.5 py-1 rounded-sm transition-colors ${
                      inputMode === 'CUSTOM'
                        ? 'bg-white text-neutral-900 font-medium shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Custom Message
                  </button>
                </div>
              </div>

              {inputMode === 'TEMPLATE' && (
                <div className="space-y-2 mb-3">
                  <p className="text-[11px] font-medium text-neutral-600">
                    Select a standardized description template (click to populate):
                  </p>
                  {availableTemplates.length === 0 ? (
                    <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 text-xs text-neutral-600">
                      No pre-written templates available for this category. You can type your issue below.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {availableTemplates.map((tmpl: any) => {
                        const isSelected =
                          selectedTemplate?.id === tmpl.id || selectedTemplate?.title === tmpl.title;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => handleTemplateSelect(tmpl)}
                            className={`w-full p-2.5 text-left rounded-md border text-xs transition-colors flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-100/90 text-neutral-900 ring-1 ring-neutral-900 font-medium'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-neutral-900">{tmpl.title}</p>
                              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                                {tmpl.content}
                              </p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Issue Summary / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., T+2 settlement delayed past 48 hours without dashboard update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Structured Facts & Problem Description (No names of individual people)
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what happened, when it happened, batch/reference numbers, and current status..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Attach Visual Proof */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                5. Attach Visual Proof (Optional)
              </label>

              <div className="p-2.5 mb-2 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Privacy & Redaction Notice:</span> Ensure customer card numbers, CVVs, API keys, and names of individual employees are blurred before attaching screenshots.
                </div>
              </div>

              <div className="border border-dashed border-neutral-300 rounded-md p-3 text-center bg-neutral-50">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  id="file-upload"
                  onChange={handleMockAttachment}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload ticket screenshot or error log (PNG, JPG, PDF)
                </label>

                {attachments.length > 0 && (
                  <div className="mt-3 text-left space-y-2">
                    <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                      Attached Files ({attachments.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map((att, idx) => {
                        const isImg =
                          att.fileType?.startsWith('image/') ||
                          /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.fileName || '') ||
                          (typeof att.fileUrl === 'string' && att.fileUrl.startsWith('data:image/'));

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2 bg-white border border-neutral-200 rounded-md shadow-sm"
                          >
                            {isImg ? (
                              <img
                                src={att.fileUrl}
                                alt={att.fileName}
                                className="w-11 h-11 object-cover rounded border border-neutral-200 bg-neutral-100 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded border border-neutral-200 bg-neutral-100 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-neutral-500" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p
                                className="font-mono text-xs text-neutral-900 truncate font-medium"
                                title={att.fileName}
                              >
                                {att.fileName}
                              </p>
                              <p className="text-[10px] text-neutral-500 font-mono">
                                {att.fileSize && att.fileSize > 0
                                  ? `${(att.fileSize / 1024).toFixed(0)} KB`
                                  : isImg
                                  ? 'Image preview'
                                  : 'Document'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                              className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove attachment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 6: Private Merchant Contact & One-Step OTP Verification */}
            <div className="p-4 rounded-md bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  6. Merchant Verification Details (Never Shown Publicly)
                </span>
                {currentUser && currentUser.email.toLowerCase() === email.trim().toLowerCase() && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Email Verified
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    Email ID <span className="text-[10px] text-neutral-500 font-normal">(Never shown Publicly)</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={otpStep}
                    placeholder="Payment Provider registered email preferred"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 disabled:bg-neutral-100"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Payment Provider registered email preferred
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    Mobile No <span className="text-[10px] text-neutral-500 font-normal">(Never shown Publicly)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., +91 98765 43210"
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 font-mono"
                  />
                </div>
              </div>

              {/* Inline OTP Verification Step when triggered on Submit */}
              {otpStep && (
                <div className="p-3.5 rounded-md bg-emerald-50/70 border border-emerald-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-emerald-950">
                      One-Step Email Verification Required to Publish
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep(false);
                        setOtpCode('');
                      }}
                      className="text-[11px] text-emerald-800 underline hover:text-emerald-950"
                    >
                      Change Email
                    </button>
                  </div>
                  {otpInfoMessage && (
                    <p className="text-[11px] text-emerald-800">{otpInfoMessage}</p>
                  )}
                  {devOtpHint && (
                    <p className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-emerald-200 text-emerald-900">
                      Instant Verification Code: <strong>{devOtpHint}</strong>
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-48 px-3 py-2 text-xs font-mono tracking-widest bg-white border border-emerald-400 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-900 text-neutral-900"
                    />
                    <span className="text-[11px] text-emerald-800">
                      Valid for 10 minutes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pinned Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 shrink-0 gap-3">
            <p className="text-[11px] text-neutral-600 leading-snug max-w-md">
              We publish your ticket immediately - subject to a one-step email verification to keep the platform credible and spam-free.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm text-center"
              >
                {loading
                  ? 'Processing...'
                  : otpStep
                  ? 'Verify & Publish Issue'
                  : 'Publish Issue'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
