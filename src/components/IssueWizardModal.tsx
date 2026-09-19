'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Layers, FileText, Upload, AlertCircle, ShieldAlert, Check, ChevronDown } from 'lucide-react';
import { AuthSession } from '@/lib/auth';

interface IssueWizardModalProps {
  isOpen: boolean;
  currentUser: AuthSession | null;
  onClose: () => void;
  onSuccess: () => void;
  onRequireAuth: () => void;
}

const DEFAULT_TEMPLATES_BY_SLUG: Record<string, Array<{ id: string; title: string; content: string }>> = {
  chargebacks: [
    {
      id: 'cb-1',
      title: 'Premature dispute deduction before evidence submission deadline',
      content: 'A customer chargeback was initiated on transaction ARN, but the gateway auto-debited the dispute amount and dispute fee before the stated 7-day representment window expired. Supporting delivery documents were ready for submission.',
    },
    {
      id: 'cb-2',
      title: 'Chargeback evidence document upload portal returning error / upload failure',
      content: 'Attempting to submit proof of delivery and customer tax invoice through the merchant dispute dashboard fails with a network timeout. We are at risk of losing the dispute representment window due to portal downtime.',
    },
    {
      id: 'cb-3',
      title: 'Duplicate chargeback fee debited on single transaction ARN',
      content: 'Our merchant ledger statement shows two separate dispute processing charges debited for the exact same transaction reference. Customer card issuing bank confirmed only a single dispute was raised.',
    },
  ],
  settlements: [
    {
      id: 'set-1',
      title: 'T+2 settlement delayed past 48 hours without dashboard update',
      content: 'Settlement for batch processing from 2 days ago is still listed as "Processing" on the merchant dashboard. No UTR generated, and standard customer support ticket has not received an update.',
    },
    {
      id: 'set-2',
      title: 'Settlement marked as Processed but bank account has not received funds',
      content: 'The dashboard indicates batch funds were sent, but the beneficiary bank reports no inward IMPS/NEFT transfer with the specified UTR. Please confirm bank clearing status.',
    },
    {
      id: 'set-3',
      title: 'Nodal account reconciliation delay during weekend settlement',
      content: 'Weekend settlements for Friday to Sunday transactions have not been initiated on Monday morning. Support desk indicates a nodal bank clearing backlog with no turnaround ETA.',
    },
  ],
  webhooks: [
    {
      id: 'wh-1',
      title: 'Payment captured but payment.captured webhook dropped / 500 error',
      content: 'Customer payment was successfully debited, but our server endpoint did not receive the webhook callback. Orders remain unfulfilled until manual reconciliation.',
    },
    {
      id: 'wh-2',
      title: 'Signature verification failure on webhook payload',
      content: 'Webhook requests received from gateway IP range are failing cryptographic signature verification against the shared webhook secret.',
    },
    {
      id: 'wh-3',
      title: 'Webhook delivery delayed by 30+ minutes causing fulfillment bottlenecks',
      content: 'While transactions show as captured in the gateway dashboard immediately, the webhook payload reaches our server 30 to 60 minutes later, causing delayed order dispatch and customer complaints.',
    },
  ],
  'api-outage': [
    {
      id: 'out-1',
      title: 'Checkout modal latency / Gateway timeout on mobile web',
      content: 'Users attempting checkout via mobile browsers experience 15+ second hangs before payment rail initialization. Success rate dropped by over 25% in the last 4 hours.',
    },
    {
      id: 'out-2',
      title: 'UPI intent flow timing out for PhonePe / GooglePay / Paytm',
      content: 'Intent invoke triggers a white screen on Android devices, resulting in failed transaction status after 300 seconds.',
    },
    {
      id: 'out-3',
      title: 'Card processing API returning 502 Bad Gateway intermittently',
      content: 'Direct server-to-server card authorization endpoints are failing with 502 Bad Gateway responses on approximately 15% of checkout requests.',
    },
  ],
  'risk-holds': [
    {
      id: 'risk-1',
      title: 'Unannounced settlement pause due to routine KYC verification',
      content: 'All merchant payouts were placed on hold without advance notice requesting documents that were already approved at onboarding.',
    },
    {
      id: 'risk-2',
      title: 'Monthly processing volume limit triggered without warning or upgrade path',
      content: 'Account payments were throttled after hitting an uncommunicated monthly threshold. Business registration documents for volume increase submitted 3 days ago without review.',
    },
  ],
};

export function IssueWizardModal({
  isOpen,
  currentUser,
  onClose,
  onSuccess,
  onRequireAuth,
}: IssueWizardModalProps) {
  const [gateways, setGateways] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [inputMode, setInputMode] = useState<'TEMPLATE' | 'CUSTOM'>('TEMPLATE');
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<
    Array<{ fileName: string; fileUrl: string; fileType: string; fileSize?: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/gateways')
      .then((res) => res.json())
      .then((data) => {
        if (data.gateways) {
          setGateways(data.gateways);
          if (data.gateways.length > 0 && !selectedGatewayId) {
            setSelectedGatewayId(data.gateways[0].id);
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
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please provide a complete title and problem description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          gatewayId: selectedGatewayId,
          categoryId: selectedCategoryId,
          merchantId: currentUser.userId,
          attachments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit issue.');
      }

      onSuccess();
      onClose();
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
            <h2 className="text-base font-semibold text-neutral-900">File Payment Gateway Issue</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Structured reporting wizard with SLA tracking and verified gateway escalation
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
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

          {/* Step 1: Select Gateway */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                1. Select Affected Payment Gateway
              </span>
              {selectedGatewayId && (
                <span className="text-[11px] text-neutral-500 font-mono font-normal">
                  {gateways.find((g) => g.id === selectedGatewayId)?.domain}
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
                <option value="" disabled>-- Select Payment Gateway --</option>
                {gateways.map((gw) => (
                  <option key={gw.id} value={gw.id}>
                    {gw.name} ({gw.domain})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            {gateways.find((g) => g.id === selectedGatewayId)?.description && (
              <p className="text-[11px] text-neutral-500 mt-1.5">
                {gateways.find((g) => g.id === selectedGatewayId)?.description}
              </p>
            )}
          </div>

          {/* Step 2: Select Issue Domain */}
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
                  <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Input Mode */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                3. Issue Description
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
                    No pre-written templates available for this category. You can switch to Custom Message below.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {availableTemplates.map((tmpl: any) => {
                      const isSelected = selectedTemplate?.id === tmpl.id || selectedTemplate?.title === tmpl.title;
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
                            <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">{tmpl.content}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Editable Fields */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Issue Summary / Title</label>
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
                  Technical Details & Problem Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide specific details such as batch IDs, webhook response status codes, or error codes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Visual Proof & Attachment */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-neutral-500" />
              4. Attach Visual Proof (Optional)
            </label>

            {/* Security Warning Notice */}
            <div className="p-3 mb-2 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Sensitive Data Notice:</span> Ensure all customer credit card numbers (PANs), CVVs, passwords, and private API keys are redacted or blurred before attaching screenshots.
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
                            <p className="font-mono text-xs text-neutral-900 truncate font-medium" title={att.fileName}>
                              {att.fileName}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              {att.fileSize && att.fileSize > 0 ? `${(att.fileSize / 1024).toFixed(0)} KB` : isImg ? 'Image preview' : 'Document'}
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
          </div>

          {/* Pinned Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3 border-t border-neutral-200 bg-neutral-50 shrink-0 gap-2.5">
            <p className="text-[10px] sm:text-[11px] text-neutral-500 text-center sm:text-left">
              Submissions are screened for vulgarity and logged on the public SLA timer.
            </p>
            <div className="flex items-center gap-2">
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
                {loading ? 'Submitting...' : 'Publish Issue'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
