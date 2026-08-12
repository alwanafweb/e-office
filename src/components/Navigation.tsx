import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  FileCheck,
  Receipt,
  Building,
  ShieldCheck,
  Lock,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { COMPANY_PROFILE } from '../data/initialData';
import { CompanyProfile, User } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unpaidCount: number;
  companyProfile?: CompanyProfile;
  currentUser: User | null;
  onOpenAuthModal: (requestedTab?: string) => void;
  onLogout: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  d1Status?: 'connected' | 'loading' | 'offline';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  unpaidCount,
  companyProfile,
  currentUser,
  onOpenAuthModal,
  onLogout,
  theme = 'light',
  onToggleTheme,
  d1Status = 'connected',
}) => {
  const profile = companyProfile || COMPANY_PROFILE;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: TrendingUp, isPublic: false },
    { id: 'verifyDoc', label: 'Cek Keaslian Dokumen', icon: ShieldCheck, isPublic: true },
    { id: 'customers', label: 'Pelanggan CRM', icon: Users, isPublic: false },
    { id: 'sph', label: 'Quotation (SPH)', icon: FileText, isPublic: false },
    { id: 'pks', label: 'PKS Contracts', icon: FileCheck, isPublic: false },
    { id: 'invoices', label: 'Invoice Manager', icon: Receipt, badge: unpaidCount, isPublic: false },
    { id: 'settings', label: 'Profil PT. LDI', icon: Building, isPublic: false },
  ];

  // Filter tabs: Show ONLY public tabs when guest; show all tabs after admin login
  const tabs = currentUser ? allTabs : allTabs.filter((t) => t.isPublic);

  const handleTabClick = (tabId: string, isPublic: boolean) => {
    setIsMobileMenuOpen(false);
    if (isPublic || currentUser) {
      setActiveTab(tabId);
    } else {
      // Prompt user to login for restricted admin tabs
      onOpenAuthModal(tabId);
    }
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-xl print:hidden">
      {/* Top Corporate Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 sm:gap-4">
            {profile.logoUrl ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-700 shadow-md shadow-blue-950/50 overflow-hidden flex-shrink-0">
                <img
                  src={profile.logoUrl}
                  alt={profile.legalName}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-md shadow-blue-900/40 flex-shrink-0">
                L
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-base font-bold leading-none tracking-tight text-white uppercase truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
                  {profile.legalName || 'PT. LINTAS DATA INTERNASIONAL'}
                </h1>
                {d1Status === 'connected' && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Cloudflare D1 Connected
                  </span>
                )}
                {d1Status === 'loading' && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Syncing D1...
                  </span>
                )}
                {d1Status === 'offline' && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-slate-500/20 text-slate-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-500/30">
                    Local Storage Mode
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-blue-300 tracking-wider uppercase font-medium mt-0.5 truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
                Enterprise Business Suite • {profile.website || 'Jagoanserver.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
            {/* Global Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center justify-center cursor-pointer shadow-sm min-w-[38px] min-h-[38px]"
                title={theme === 'dark' ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun key="theme-sun-icon" className="w-4 h-4 text-amber-400 animate-fade-in" />
                ) : (
                  <Moon key="theme-moon-icon" className="w-4 h-4 text-cyan-300 animate-fade-in" />
                )}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/90 pl-2.5 sm:pl-3.5 pr-2 py-1.5 rounded-2xl border border-slate-700 shadow-inner">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block leading-tight">
                    <p className="font-bold text-white text-xs truncate max-w-[120px]">{currentUser.name}</p>
                    <p className="text-[9px] text-cyan-400 font-mono font-semibold uppercase">{currentUser.role}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="bg-slate-700 hover:bg-red-600/80 text-slate-200 hover:text-white p-1.5 rounded-xl transition text-[11px] font-bold flex items-center gap-1"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 text-[11px] px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
                  <Globe className="w-3 h-3 text-emerald-400" /> Public Portal
                </span>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
              aria-label="Toggle Mobile Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-blue-400" />}
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation Row */}
        <nav className="hidden lg:flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 touch-scroll no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isLocked = !tab.isPublic && !currentUser;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.isPublic)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                    : isLocked
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.isPublic ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.isPublic && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                    PUBLIC
                  </span>
                )}

                {isLocked && (
                  <Lock className="w-3 h-3 text-amber-400 opacity-80" />
                )}

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 shadow-2xl animate-fade-in">
          {/* Mobile Theme Switch Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center justify-between w-full p-3 mb-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700/80 cursor-pointer hover:bg-slate-750 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-900">
                  {theme === 'dark' ? (
                    <Sun key="mob-sun-icon" className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon key="mob-moon-icon" className="w-4 h-4 text-cyan-300" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block font-bold text-white">Mode Tampilan Aplikasi</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {theme === 'dark' ? 'Mode Gelap (Dark Mode)' : 'Mode Terang (Light Mode)'}
                  </span>
                </div>
              </div>
              <span className="bg-blue-600/30 text-blue-200 border border-blue-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                {theme === 'dark' ? 'Ganti Terang ☀️' : 'Ganti Gelap 🌙'}
              </span>
            </button>
          )}

          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-2 flex items-center justify-between">
            <span>Menu Navigasi Sistem</span>
            {currentUser && <span className="text-emerald-400 font-mono">User: {currentUser.name}</span>}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isLocked = !tab.isPublic && !currentUser;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id, tab.isPublic)}
                  className={`flex items-center justify-between w-full p-3 rounded-xl text-xs font-bold transition-all text-left min-h-[44px] cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-700' : 'bg-slate-900'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.isPublic ? 'text-emerald-400' : 'text-blue-400'}`} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold">{tab.label}</span>
                      {tab.isPublic ? (
                        <span className="text-[9px] text-emerald-400 font-normal">Akses Publik Tanpa Login</span>
                      ) : isLocked ? (
                        <span className="text-[9px] text-amber-400 font-normal flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Memerlukan Login Admin
                        </span>
                      ) : (
                        <span className="text-[9px] text-cyan-300 font-normal">Modul Sistem Aktif</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

