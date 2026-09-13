'use client';

import './globals.css';
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Layers,
  Filter,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { DashboardScorecard } from '@/components/DashboardScorecard';
import { IssueCard } from '@/components/IssueCard';
import { AuthModal } from '@/components/AuthModal';
import { IssueWizardModal } from '@/components/IssueWizardModal';
import { IssueDetailModal } from '@/components/IssueDetailModal';
import { AuthSession } from '@/lib/auth';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [gateways, setGateways] = useState<any[]>([]);
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
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50">
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenReport={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setIsWizardOpen(true);
          }
        }}
      />

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 flex-1">
        {/* Page Header */}
        <div className="border-b border-neutral-200 pb-4 sm:pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                Payment Gateway Incident & Resolution Registry
              </h1>
              <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                Public incident registry and SLA monitor for merchant payment infrastructure. Track settlement delays, webhook drops, and verified gateway resolutions.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  fetchGateways();
                  fetchIssues();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    setIsAuthOpen(true);
                  } else {
                    setIsWizardOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Incident</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gateway Performance Scorecard */}
        <DashboardScorecard
          gateways={gateways}
          selectedGateway={selectedGateway}
          onSelectGateway={(slug) => setSelectedGateway(slug)}
        />

        {/* Feed & Filters Section */}
        <div className="space-y-4 pt-2">
          {/* Filter Bar */}
          <div className="p-3 sm:p-3.5 rounded-md border border-neutral-200 bg-white shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-neutral-500" />
                <span>Incident Filters</span>
              </div>

              {(selectedGateway || selectedCategory || selectedSla || selectedStatus || searchQuery) && (
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
                  <option value="">All Gateways</option>
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
                  <option value="">All Categories</option>
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
                  <option value="OPEN">Open Incidents</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="PROPOSED_RESOLUTION">Resolution Proposed</option>
                  <option value="RESOLVED">Resolved / Closed</option>
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

          {/* Incidents Feed List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
              <span>Showing {issues.length} incidents</span>
              <span>Sorted by latest activity</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-500 bg-white border border-neutral-200 rounded-md">
                Loading incidents...
              </div>
            ) : issues.length === 0 ? (
              <div className="p-12 text-center bg-white border border-neutral-200 rounded-md space-y-2">
                <p className="text-xs font-medium text-neutral-700">No incidents match the selected filters.</p>
                <p className="text-[11px] text-neutral-500">
                  Try adjusting the gateway, category, or SLA status criteria.
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
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 mt-12 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-neutral-700">
            GatewayPulse: Payment Gateway Incident & SLA Registry
          </p>
          <p className="text-[11px] text-neutral-400">
            An open platform for merchant accountability, SLA tracking, and verified gateway issue resolution.
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
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          fetchGateways();
          fetchIssues();
        }}
        onRequireAuth={() => {
          setIsWizardOpen(false);
          setIsAuthOpen(true);
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
    </div>
  );
}
