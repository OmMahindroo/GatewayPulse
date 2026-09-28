'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { AuthSession } from '@/lib/auth';

interface NavbarProps {
  currentUser: AuthSession | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenReport: () => void;
  onOpenAdmin: () => void;
}

export function Navbar({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onLogout,
  onOpenReport,
  onOpenAdmin,
}: NavbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="border-b border-neutral-300 bg-[#FAF9F5]/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Editorial Masthead Brand + Top Anchor Links */}
        <div className="flex items-center gap-6 shrink-0">
          <a href="#" className="flex items-baseline gap-3 shrink-0 group">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              GatewayPulse
            </span>
            <span className="hidden sm:inline-block h-3.5 w-px bg-neutral-300 self-center" />
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Public Support Registry
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-neutral-600 pl-2">
            <a
              href="#scorecard"
              className="hover:text-neutral-950 transition-colors underline-offset-4 hover:underline"
            >
              Scorecard
            </a>
            <a
              href="#public-board"
              className="hover:text-neutral-950 transition-colors underline-offset-4 hover:underline"
            >
              Case Ledger
            </a>
            <a
              href="#why-fair"
              className="hover:text-neutral-950 transition-colors underline-offset-4 hover:underline"
            >
              Why This Stays Fair
            </a>
          </nav>
        </div>

        {/* Desktop / Tablet Search */}
        <div className="flex-1 max-w-xs hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search provider, category, or ticket ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900 text-neutral-900 placeholder:text-neutral-400 transition-colors"
            />
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="p-1.5 text-neutral-600 hover:text-neutral-950 md:hidden border border-neutral-300 bg-white"
            title="Search"
          >
            {mobileSearchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
          </button>

          {/* Admin Portal Link */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-2.5 py-1.5 border border-neutral-300 bg-white text-[11px] font-mono uppercase tracking-wider text-neutral-700 hover:border-neutral-900 hover:text-neutral-950 transition-colors"
            title="GatewayPulse Admin Dashboard"
          >
            Admin
          </button>

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-2 px-2.5 py-1.5 border border-neutral-300 bg-white text-xs max-w-[160px]">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    currentUser.role === 'PG_SUPPORT' || currentUser.role === 'ADMIN'
                      ? 'bg-emerald-600'
                      : 'bg-neutral-900'
                  }`}
                />
                <span className="font-mono text-[11px] text-neutral-900 truncate">
                  {currentUser.companyName || currentUser.name || currentUser.email}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-950 transition-colors"
                title="Sign Out"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:border-neutral-900 transition-colors"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onOpenReport}
            className="px-3.5 py-1.5 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 border border-neutral-950 transition-colors shrink-0"
          >
            Report Issue
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Expandable */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-neutral-300 px-4 py-2.5 bg-[#FAF9F5]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              placeholder="Search provider, category, or ticket ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 bg-white focus:outline-none focus:border-neutral-900 text-neutral-900"
            />
          </div>
        </div>
      )}
    </header>
  );
}
