import React from 'react';
import { COMPANY_PROFILE } from '../data/initialData';
import { CompanyProfile } from '../types';
import { Globe, Mail, Phone, MapPin } from 'lucide-react';

interface KopSuratHeaderProps {
  compact?: boolean;
  companyProfile?: CompanyProfile;
}

export const KopSuratHeader: React.FC<KopSuratHeaderProps> = ({ compact = false, companyProfile }) => {
  const profile = companyProfile || COMPANY_PROFILE;

  return (
    <div className="w-full bg-white select-none print:bg-transparent">
      {/* Centered Kop Surat Header Container */}
      <div className={`flex flex-col items-center justify-center text-center ${compact ? 'pb-2' : 'pb-3.5'} space-y-2`}>
        {/* Top Centered Logo & Company Title Row */}
        <div className="flex items-center justify-center gap-3 w-full">
          {profile.logoUrl ? (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white flex items-center justify-center p-1 border border-slate-200 shadow-sm flex-shrink-0 overflow-hidden">
              <img
                src={profile.logoUrl}
                alt={profile.legalName || 'Logo Perusahaan'}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-700 flex items-center justify-center shadow-md p-2 border border-blue-300 text-white flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="15" y="15" width="70" height="22" rx="4" className="stroke-cyan-300 fill-blue-950/40" />
                <rect x="15" y="44" width="70" height="22" rx="4" className="stroke-cyan-400 fill-blue-950/40" />
                <rect x="15" y="73" width="70" height="12" rx="3" className="stroke-blue-200 fill-blue-900" />
                <circle cx="30" cy="26" r="3" className="fill-emerald-400 stroke-none" />
                <circle cx="42" cy="26" r="3" className="fill-cyan-300 stroke-none" />
                <line x1="60" y1="26" x2="75" y2="26" className="stroke-cyan-200" />
                <circle cx="30" cy="55" r="3" className="fill-emerald-400 stroke-none" />
                <circle cx="42" cy="55" r="3" className="fill-cyan-300 stroke-none" />
                <line x1="60" y1="55" x2="75" y2="55" className="stroke-cyan-200" />
              </svg>
            </div>
          )}

          <div className="text-center">
            {/* Company Legal Name - Centered */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-blue-950 uppercase leading-none font-sans">
              {profile.legalName || 'PT. LINTAS DATA INTERNASIONAL'}
            </h1>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 tracking-wider uppercase leading-tight mt-1">
              High Performance Cloud, Internet Dedicated & Datacenter Provider
            </p>
          </div>
        </div>

        {/* Centered Address & Contact Details */}
        <div className="text-center text-[10px] sm:text-[11px] text-slate-600 leading-normal max-w-2xl font-sans space-y-1">
          <p className="font-semibold text-slate-800">
            {profile.address}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-700 font-medium pt-0.5">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-600 inline" /> {profile.website}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-blue-600 inline" /> {profile.email}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-600 inline" /> Whatsapp: {profile.whatsapp}
            </span>
          </div>
        </div>
      </div>

      {/* Official Indonesian Kop Surat Double Separator Line */}
      <div className="w-full mt-0.5">
        <div className="h-[3px] bg-blue-950 w-full rounded-full"></div>
        <div className="h-[1px] bg-cyan-500 w-full mt-[2px]"></div>
      </div>
    </div>
  );
};
