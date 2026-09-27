'use client';

import './globals.css';
import React, { useState, useEffect } from 'react';
import {
  Filter,
  Plus,
  RefreshCw,
  Scale,
  MessageSquare,
  FileText,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { DashboardScorecard, GatewayStat } from '@/components/DashboardScorecard';
import { IssueCard } from '@/components/IssueCard';
import { AuthModal } from '@/components/AuthModal';
import { IssueWizardModal } from '@/components/IssueWizardModal';
import { IssueDetailModal } from '@/components/IssueDetailModal';
import { ProviderProfileModal } from '@/components/ProviderProfileModal';
import { AdminDashboardModal } from '@/components/AdminDashboardModal';
import { AuthSession } from '@/lib/auth';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [gateways, setGateways] = useState<GatewayStat[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSla, setSelectedSla] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardGatewaySlug, setWizardGatewaySlug] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeProviderProfile, setActiveProviderProfile] = useState<GatewayStat | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Fetch current user session
  const fetchUserSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch {
      // session absent
    }
  };

  // Fetch gateways & scorecard
  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/gateways');
      const data = await res.json();
      if (data.gateways) {
        setGateways(data.gateways);
        if (activeProviderProfile) {
          const updated = data.gateways.find((g: GatewayStat) => g.id === activeProviderProfile.id);
          if (updated) setActiveProviderProfile(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load gateways:', err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Fetch filtered issues
  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGateway) params.set('gateway', selectedGateway);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedSla) params.set('sla', selectedSla);
      if (selectedStatus) params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/issues?${params.toString()}`);
      const data = await res.json();
      if (data.issues) {
        setIssues(data.issues);
      }
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSession();
    fetchGateways();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [selectedGateway, selectedCategory, selectedSla, selectedStatus, searchQuery]);

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setCurrentUser(null);
  };

  const handleUpvote = async (issueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIssues((prev) =>
          prev.map((item) =>
            item.id === issueId ? { ...item, upvotesCount: data.upvotesCount } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openReportWizard = (gatewaySlug: string | null = null) => {
    setWizardGatewaySlug(gatewaySlug);
    setIsWizardOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50">
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenReport={() => openReportWizard(null)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 sm:space-y-8 flex-1">
        {/* Above-the-Fold Split Hero + "Report Issue" Callout Card */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch border-b border-neutral-200 pb-6 sm:pb-7">
          {/* Left 7 Columns: Mission Statement */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-md">
                <span>GatewayPulse</span>
                <span>•</span>
                <span>Merchant Support Accountability</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight uppercase">
                A PUBLIC BOARD FOR MERCHANT SUPPORT
              </h1>
              <p className="text-sm sm:text-base font-medium text-neutral-800">
                Where support tickets go when the inbox goes quiet.
              </p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Small and mid-size merchants frequently lack a dedicated relationship manager, which can leave their support queries with payment providers unanswered for extended periods. GatewayPulse offers a transparent platform where merchants can track and escalate unresolved issues - creating visibility that benefits everyone: merchants gain clarity, gateways gain actionable feedback, and the broader ecosystem gains a more accountable standard for support.
            </p>
          </div>

          {/* Right 5 Columns: Report Issue Action Card */}
          <div className="lg:col-span-5 p-4 sm:p-5 rounded-md bg-white border border-neutral-300 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 uppercase tracking-wide">
                  Report Issue
                </h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  1-Step Verified Publishing
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Stuck on something a payment provider hasn&apos;t resolved - settlement, KYC, a frozen account, a refund, or just silence? Log it here. Structured facts only, no names of individual people, and it&apos;s public the moment you submit.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => openReportWizard(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Issue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchGateways();
                  fetchIssues();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Board</span>
              </button>
            </div>
          </div>
        </section>

        {/* Gateway Performance Scorecard */}
        <section id="scorecard">
          <DashboardScorecard
            gateways={gateways}
            selectedGateway={selectedGateway}
            onSelectGateway={(slug) => setSelectedGateway(slug)}
            onOpenProviderProfile={(gw) => setActiveProviderProfile(gw)}
          />
        </section>

        {/* Feed & Filters Section */}
        <section id="public-board" className="space-y-4 pt-1">
          {/* Filter Bar */}
          <div className="p-3 sm:p-3.5 rounded-md border border-neutral-200 bg-white shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-neutral-500" />
                <span>Report Issue Filters</span>
              </div>

              {(selectedGateway ||
                selectedCategory ||
                selectedSla ||
                selectedStatus ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGateway(null);
                    setSelectedCategory(null);
                    setSelectedSla(null);
                    setSelectedStatus(null);
                    setSearchQuery('');
                  }}
                  className="text-xs text-neutral-600 underline hover:text-neutral-900"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 text-xs">
              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <select
                  value={selectedGateway || ''}
                  onChange={(e) => setSelectedGateway(e.target.value || null)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">All Payment Providers ({gateways.length})</option>
                  {gateways.map((gw) => (
                    <option key={gw.id} value={gw.slug}>
                      {gw.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">All Problem Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value || null)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Active / Unresolved</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="PROPOSED_RESOLUTION">Official PG Response Proposed</option>
                  <option value="RESOLVED">Merchant-Confirmed Resolved</option>
                </select>
              </div>

              {/* SLA Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1 sm:pl-2 sm:border-l border-neutral-200 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'GREEN' ? null : 'GREEN')}
                  className={`flex-1 sm:flex-initial px-2 py-1 rounded-md text-[11px] sm:text-xs font-mono border transition-colors text-center ${
                    selectedSla === 'GREEN'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold'
                      : 'bg-emerald-50/50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  &lt;2d
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'YELLOW' ? null : 'YELLOW')}
                  className={`flex-1 sm:flex-initial px-2 py-1 rounded-md text-[11px] sm:text-xs font-mono border transition-colors text-center ${
                    selectedSla === 'YELLOW'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold'
                      : 'bg-amber-50/50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  3-4d
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'ORANGE' ? null : 'ORANGE')}
                  className={`flex-1 sm:flex-initial px-2 py-1 rounded-md text-[11px] sm:text-xs font-mono border transition-colors text-center ${
                    selectedSla === 'ORANGE'
                      ? 'bg-orange-100 text-orange-900 border-orange-400 font-semibold'
                      : 'bg-orange-50/50 text-orange-800 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  5-7d
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'RED' ? null : 'RED')}
                  className={`flex-1 sm:flex-initial px-2 py-1 rounded-md text-[11px] sm:text-xs font-mono border transition-colors text-center ${
                    selectedSla === 'RED'
                      ? 'bg-red-100 text-red-900 border-red-400 font-semibold'
                      : 'bg-red-50/50 text-red-800 border-red-200 hover:bg-red-100'
                  }`}
                >
                  &gt;7d
                </button>
              </div>
            </div>
          </div>

          {/* Reported Issues Feed List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
              <span>Showing {issues.length} reported issues</span>
              <span>Sorted by latest activity</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-500 bg-white border border-neutral-200 rounded-md">
                Loading reported issues...
              </div>
            ) : issues.length === 0 ? (
              <div className="p-12 text-center bg-white border border-neutral-200 rounded-md space-y-2">
                <p className="text-xs font-medium text-neutral-700">
                  No reported issues match the selected filters.
                </p>
                <p className="text-[11px] text-neutral-500">
                  Try adjusting the payment provider, category, or status filter criteria.
                </p>
              </div>
            ) : (
              issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => setSelectedIssueId(issue.id)}
                  onUpvote={(e) => handleUpvote(issue.id, e)}
                />
              ))
            )}
          </div>
        </section>

        {/* "Why This Stays Fair" Section (2x2 Grid per exact specification) */}
        <section id="why-fair" className="pt-4 border-t border-neutral-200 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              Why This Stays Fair
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Institutional neutrality principles governing every merchant report and official payment provider response
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Card 1 */}
            <div className="p-4 sm:p-5 rounded-md border border-neutral-200 bg-white shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-700 shrink-0" />
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900">
                  Focus on the issue, not individuals
                </h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Cases focus on the payment issue - what happened, when it happened, the category involved and the current status. We don&apos;t encourage personal attacks, naming individual support employees, or sharing unnecessary personal information.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-4 sm:p-5 rounded-md border border-neutral-200 bg-white shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-700 shrink-0" />
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900">
                  Both sides can be heard
                </h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Merchants can report their experience, and payment providers can respond, clarify or share an update on a case. Provider responses are presented alongside the original report so users can understand the issue from both perspectives.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-4 sm:p-5 rounded-md border border-neutral-200 bg-white shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-neutral-700 shrink-0" />
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900">
                  We don&apos;t decide who is right
                </h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                The platform records reported experiences and updates; it does not act as a judge between merchants and payment providers. Information is presented as submitted or updated by the relevant party, and users should consider the available context before drawing conclusions.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-4 sm:p-5 rounded-md border border-neutral-200 bg-white shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-700 shrink-0" />
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900">
                  The goal is better support
                </h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                The purpose isn&apos;t to shame payment providers. It&apos;s to make payment-support experiences more transparent, encourage clearer escalation and help merchants find a path forward when something goes wrong.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Statement per exact specification */}
      <footer className="border-t border-neutral-200 bg-white py-8 mt-10 text-center text-xs text-neutral-500">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-sm text-neutral-900 tracking-tight">
            Payment Provider Issues. Reported. Tracked. Made Transparent.
          </p>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            A public, anonymous platform for documenting payment support issues faced by merchants. Independent of payment gateways. We document what is reported - we don&apos;t decide who is right.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />

      <IssueWizardModal
        isOpen={isWizardOpen}
        currentUser={currentUser}
        initialGatewaySlug={wizardGatewaySlug}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardGatewaySlug(null);
        }}
        onSuccess={(updatedUser) => {
          if (updatedUser) {
            setCurrentUser(updatedUser);
          }
          fetchGateways();
          fetchIssues();
        }}
      />

      <IssueDetailModal
        issueId={selectedIssueId}
        currentUser={currentUser}
        onClose={() => setSelectedIssueId(null)}
        onRequireAuth={() => setIsAuthOpen(true)}
        onRefreshList={() => {
          fetchGateways();
          fetchIssues();
        }}
      />

      <ProviderProfileModal
        gateway={activeProviderProfile}
        currentUser={currentUser}
        onClose={() => setActiveProviderProfile(null)}
        onReportIssueForGateway={(slug) => openReportWizard(slug)}
        onViewAllReportsForGateway={(slug) => {
          setSelectedGateway(slug);
          const el = document.getElementById('public-board');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectIssue={(issueId) => setSelectedIssueId(issueId)}
        onGatewayUpdated={() => fetchGateways()}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        gateways={gateways}
        onClose={() => setIsAdminOpen(false)}
        onSelectIssue={(issueId) => setSelectedIssueId(issueId)}
        onRefreshData={() => {
          fetchGateways();
          fetchIssues();
        }}
      />
    </div>
  );
}
