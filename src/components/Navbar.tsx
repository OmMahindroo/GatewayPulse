'use client';

import React, { useState } from 'react';
import { Plus, User, LogOut, ShieldCheck, Store, Search, X } from 'lucide-react';
import { AuthSession } from '@/lib/auth';

interface NavbarProps {
  currentUser: AuthSession | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenReport: () => void;
}

export function Navbar({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onLogout,
  onOpenReport,
}: NavbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-6 h-6 bg-neutral-900 rounded-md flex items-center justify-center text-white text-xs font-mono font-bold shrink-0">
            GP
          </div>
          <div>
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-neutral-900 block leading-tight">
              GatewayPulse
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-neutral-500 block -mt-0.5 hidden xs:block">
              PG Incident & SLA Registry
            </span>
          </div>
        </div>

        {/* Desktop / Tablet Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search incidents by gateway, category, or keywords..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 md:hidden border border-neutral-200 hover:bg-neutral-50"
            title="Search"
          >
            {mobileSearchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md border border-neutral-200 bg-neutral-50 text-xs max-w-[110px] sm:max-w-[180px]">
                {currentUser.role === 'PG_SUPPORT' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                ) : (
                  <Store className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                )}
                <span className="font-medium text-neutral-900 truncate text-[11px] sm:text-xs">
                  {currentUser.companyName || currentUser.name || currentUser.email}
                </span>
                {currentUser.role === 'PG_SUPPORT' && (
                  <span className="hidden sm:inline-block text-[10px] bg-sky-100 text-sky-800 px-1 py-0.2 rounded font-medium shrink-0">
                    POC
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md border border-neutral-300 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 border border-neutral-900 shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report</span>
            <span className="hidden sm:inline">Issue</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Expandable */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-neutral-200 px-3 py-2 bg-neutral-50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white text-neutral-900"
            />
          </div>
        </div>
      )}
    </header>
  );
}
