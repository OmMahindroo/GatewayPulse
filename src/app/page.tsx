'use client';

import './globals.css';
import React, { useState, useEffect } from 'react';
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
    setIsAdminOpen(false);
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
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      {/* Editorial Masthead Navigation */}
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
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 flex-1">
        {/* Above-the-Fold Unified Architectural Hero & Report Issue Dispatch Desk */}
        <section className="border border-neutral-300 bg-white grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          {/* Left 7 Columns: Editorial Statement */}
          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                GatewayPulse · Merchant Support Transparency Registry
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-[34px] font-semibold text-neutral-950 tracking-tight leading-[1.15]">
                A PUBLIC BOARD FOR MERCHANT SUPPORT
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-neutral-700">
                Where support tickets go when the inbox goes quiet.
              </p>
            </div>

            <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed max-w-2xl pt-1">
              Small and mid-size merchants frequently lack a dedicated relationship manager, which can leave their support queries with payment providers unanswered for extended periods. GatewayPulse offers a transparent platform where merchants can track and escalate unresolved issues - creating visibility that benefits everyone: merchants gain clarity, gateways gain actionable feedback, and the broader ecosystem gains a more accountable standard for support.
            </p>
          </div>

          {/* Right 5 Columns: Institutional Filing Desk ("Report Issue") */}
          <div className="lg:col-span-5 p-5 sm:p-7 bg-[#FAF9F5]/60 flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-neutral-950 tracking-tight">
                  Report Issue
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-800">
                  ● 1-Step Email Verified
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                Stuck on something a payment provider hasn&apos;t resolved - settlement, KYC, a frozen account, a refund, or just silence? Log it here. Structured facts only, no names of individual people, and it&apos;s public the moment you submit.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => openReportWizard(null)}
                className="px-4 py-2.5 text-xs font-medium text-white bg-neutral-950 border border-neutral-950 hover:bg-neutral-800 transition-colors"
              >
                Report Issue &rarr;
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchGateways();
                  fetchIssues();
                }}
                className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-neutral-600 bg-white border border-neutral-300 hover:border-neutral-900 hover:text-neutral-950 transition-colors"
              >
                Refresh Ledger
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

        {/* Unified Case Ledger & Filter Bar */}
        <section id="public-board" className="border border-neutral-300 bg-white divide-y divide-neutral-200">
          {/* Ledger Header & Filter Controls */}
          <div className="p-4 sm:p-6 bg-[#FAF9F5] space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-semibold text-neutral-950 tracking-tight">
                  Public Case Ledger
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Showing {issues.length} documented merchant support cases · Sorted by latest activity
                </p>
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
                  className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 underline hover:text-neutral-950"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 text-xs">
              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <select
                  value={selectedGateway || ''}
                  onChange={(e) => setSelectedGateway(e.target.value || null)}
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                >
                  <option value="">All Payment Providers</option>
                  {gateways.map((gw) => (
                    <option key={gw.id} value={gw.slug}>
                      {gw.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Active / Unresolved</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="PROPOSED_RESOLUTION">Official PG Response Proposed</option>
                  <option value="RESOLVED">Merchant-Confirmed Resolved</option>
                </select>
              </div>

              {/* Elapsed Time Filter Buttons */}
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'GREEN' ? null : 'GREEN')}
                  className={`flex-1 lg:flex-initial px-2.5 py-2 border transition-colors ${
                    selectedSla === 'GREEN'
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                  }`}
                >
                  &lt;2d
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'YELLOW' ? null : 'YELLOW')}
                  className={`flex-1 lg:flex-initial px-2.5 py-2 border transition-colors ${
                    selectedSla === 'YELLOW'
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                  }`}
                >
                  3-4d
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'ORANGE' ? null : 'ORANGE')}
                  className={`flex-1 lg:flex-initial px-2.5 py-2 border transition-colors ${
                    selectedSla === 'ORANGE'
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                  }`}
                >
                  5-7d
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSla(selectedSla === 'RED' ? null : 'RED')}
                  className={`flex-1 lg:flex-initial px-2.5 py-2 border transition-colors ${
                    selectedSla === 'RED'
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                  }`}
                >
                  &gt;7d
                </button>
              </div>
            </div>
          </div>

          {/* Continuous Case Ledger Rows */}
          {loading ? (
            <div className="p-12 text-center font-mono text-xs text-neutral-500">
              Loading case ledger...
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center space-y-1.5">
              <p className="text-xs font-medium text-neutral-800">
                No reported issues match the active filter criteria.
              </p>
              <p className="text-xs text-neutral-500">
                Adjust the payment provider, category, or elapsed time filters above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => setSelectedIssueId(issue.id)}
                  onUpvote={(e) => handleUpvote(issue.id, e)}
                />
              ))}
            </div>
          )}
        </section>

        {/* "Why This Stays Fair" Architectural 2x2 Hairline Grid */}
        <section id="why-fair" className="border border-neutral-300 bg-white">
          <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 bg-[#FAF9F5]">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Platform Governance &amp; Neutrality Charter
            </p>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-neutral-950 tracking-tight mt-0.5">
              Why This Stays Fair
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-neutral-200 md:divide-y-0">
            {/* Quadrant 01 */}
            <div className="p-5 sm:p-6 md:border-r md:border-b border-neutral-200 space-y-2">
              <span className="font-mono text-[11px] text-neutral-400 block">01</span>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-neutral-950">
                Focus on the issue, not individuals
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                Cases focus on the payment issue - what happened, when it happened, the category involved and the current status. We don&apos;t encourage personal attacks, naming individual support employees, or sharing unnecessary personal information.
              </p>
            </div>

            {/* Quadrant 02 */}
            <div className="p-5 sm:p-6 md:border-b border-neutral-200 space-y-2">
              <span className="font-mono text-[11px] text-neutral-400 block">02</span>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-neutral-950">
                Both sides can be heard
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                Merchants can report their experience, and payment providers can respond, clarify or share an update on a case. Provider responses are presented alongside the original report so users can understand the issue from both perspectives.
              </p>
            </div>

            {/* Quadrant 03 */}
            <div className="p-5 sm:p-6 md:border-r border-neutral-200 space-y-2">
              <span className="font-mono text-[11px] text-neutral-400 block">03</span>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-neutral-950">
                We don&apos;t decide who is right
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                The platform records reported experiences and updates; it does not act as a judge between merchants and payment providers. Information is presented as submitted or updated by the relevant party, and users should consider the available context before drawing conclusions.
              </p>
            </div>

            {/* Quadrant 04 */}
            <div className="p-5 sm:p-6 space-y-2">
              <span className="font-mono text-[11px] text-neutral-400 block">04</span>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-neutral-950">
                The goal is better support
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                The purpose isn&apos;t to shame payment providers. It&apos;s to make payment-support experiences more transparent, encourage clearer escalation and help merchants find a path forward when something goes wrong.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Colophon Footer */}
      <footer className="border-t border-neutral-300 bg-white py-10 mt-12 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-2.5">
          <p className="font-serif text-base sm:text-lg font-semibold text-neutral-950 tracking-tight">
            Payment Provider Issues. Reported. Tracked. Made Transparent.
          </p>
          <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            A public, anonymous platform for documenting payment support issues faced by merchants. Independent of payment gateways. We document what is reported - we don&apos;t decide who is right.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user, openAdminDashboard) => {
          setCurrentUser(user);
          if (openAdminDashboard) {
            setIsAdminOpen(true);
          }
        }}
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
        onRequireAuth={() => setIsAuthOpen(true)}
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
