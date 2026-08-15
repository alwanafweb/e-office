import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { CompanyProfile, Customer, Invoice, PKS, SPH } from '../types';
import { KopSuratHeader } from './KopSuratHeader';
import { QRCodeBadge } from './QRCodeBadge';
import { formatDateIndonesian, formatIDR, terbilangRupiah } from '../utils/formatters';
import { COMPANY_PROFILE } from '../data/initialData';

export const VerifiedDigitalSignBadge: React.FC<{
  companyLegalName?: string;
  signerName?: string;
  className?: string;
}> = ({ companyLegalName, signerName, className = '' }) => {
  const company = companyLegalName || 'PT. Lintas Data Internasional';
  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-500/40 rounded-full px-2.5 py-0.5 text-emerald-800 shadow-2xs font-sans ${className}`}
      style={{
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
        color: '#065f46',
      }}
      title={`Dokumen Sah & Ditandatangani Digital oleh ${company}`}
    >
      <span
        className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-2xs"
        style={{ backgroundColor: '#059669', color: '#ffffff' }}
      >
        <Lock className="w-2.5 h-2.5 text-white" />
      </span>
      <span className="text-[9.5px] font-bold tracking-tight text-emerald-900 leading-none whitespace-nowrap">
        Verified by <strong className="font-black text-emerald-950">{company}</strong> Digital Sign
      </span>
    </div>
  );
};

export const getContactPersonName = (
  docRep?: string,
  customerId?: string,
  customerName?: string,
  customers?: Customer[]
): string => {
  if (docRep && docRep.trim() !== '' && docRep !== 'Contact Person') {
    return docRep;
  }
  if (customers && customers.length > 0) {
    const found = customers.find(
      (c) => (customerId && c.id === customerId) || c.companyName === customerName
    );
    if (found) {
      if (found.contactPerson && found.contactPerson.trim() !== '') return found.contactPerson;
      if (found.picName && found.picName.trim() !== '') return found.picName;
    }
  }
  return docRep || 'Contact Person';
};

export interface PDFTemplateProps {
  type: 'SPH' | 'PKS' | 'Invoice';
  data: SPH | PKS | Invoice;
  companyProfile?: CompanyProfile;
  customers?: Customer[];
  headerMode?: 'official' | 'clean';
  showStamp?: boolean;
  showSignatures?: boolean;
  id?: string;
  className?: string;
}

/**
 * Unified PDFTemplate Component
 * Handles all document types (SPH, PKS, Invoice) ensuring 1:1 visual parity
 * between the interactive screen preview and the exported PDF document.
 */
export const PDFTemplate: React.FC<PDFTemplateProps> = ({
  type,
  data,
  companyProfile,
  customers,
  headerMode = 'official',
  showStamp = true,
  showSignatures = true,
  id,
  className = '',
}) => {
  const profile = companyProfile || COMPANY_PROFILE;

  return (
    <div
      id={id}
      className={`bg-white text-slate-900 mx-auto max-w-[210mm] min-h-[297mm] print:min-h-0 p-4 sm:p-8 print:p-0 shadow-lg border border-slate-200 rounded-lg print:shadow-none print:border-none print:rounded-none print:m-0 relative text-xs leading-relaxed font-sans min-w-[280px] ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. Official Kop Surat Header / Clean Header */}
      {headerMode === 'official' ? (
        <KopSuratHeader companyProfile={profile} />
      ) : (
        <div
          className="border-b border-slate-300 pb-2 mb-6 flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-wider uppercase"
          style={{ borderBottom: '1px solid #cbd5e1' }}
        >
          <span>{profile.legalName || 'PT. LINTAS DATA INTERNASIONAL'}</span>
          <span>Dokumen Format Polos (Clean)</span>
        </div>
      )}

      {/* 2. Document-Specific Body */}
      {type === 'SPH' && (
        <SphTemplateView
          sph={data as SPH}
          showStamp={showStamp}
          showSignatures={showSignatures}
          companyProfile={profile}
          customers={customers}
        />
      )}

      {type === 'PKS' && (
        <PksTemplateView
          pks={data as PKS}
          showStamp={showStamp}
          showSignatures={showSignatures}
          companyProfile={profile}
          customers={customers}
        />
      )}

      {type === 'Invoice' && (
        <InvoiceTemplateView
          invoice={data as Invoice}
          showStamp={showStamp}
          showSignatures={showSignatures}
          companyProfile={profile}
          customers={customers}
        />
      )}
    </div>
  );
};

/* =========================================================================
   SPH VIEW TEMPLATE
   ========================================================================= */
const SphTemplateView: React.FC<{
  sph: SPH;
  showStamp: boolean;
  showSignatures: boolean;
  companyProfile: CompanyProfile;
  customers?: Customer[];
}> = ({ sph, showStamp, showSignatures, companyProfile: profile, customers }) => {
  const signatureImage = sph.signedByLDI || profile.defaultSignatureBase64;
  const validity = sph.validityDays || 14;

  return (
    <div className="mt-3 print:mt-1 space-y-5">
      {/* Title & Document Meta */}
      <div
        className="flex justify-between items-start border-b border-slate-200 pb-4"
        style={{ borderBottom: '1px solid #cbd5e1' }}
      >
        <div>
          <h2 className="text-base font-bold text-blue-950 uppercase tracking-tight font-sans">
            SURAT PENAWARAN HARGA (SPH)
          </h2>
          <p className="font-mono text-slate-700 font-semibold text-xs mt-0.5">
            Nomor: {sph.sphNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-600">Tangerang Kabupaten, {formatDateIndonesian(sph.date)}</p>
          <p className="text-slate-500 text-[11px]">
            Masa Berlaku: {validity} Hari Kalender
          </p>
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1">
        <p className="font-bold text-slate-900">Kepada Yth:</p>
        <p className="font-bold text-blue-900 text-sm">{sph.customerName}</p>
        <p className="text-slate-700">{sph.customerAddress}</p>
        <p className="text-slate-600">
          Up: Bapak/Ibu {getContactPersonName(sph.customerRepresentative, sph.customerId, sph.customerName, customers)} | Telp: {sph.customerPhone || '-'} | Email: {sph.customerEmail || '-'}
        </p>
      </div>

      {/* Opening Statement */}
      <div>
        <p className="mb-2">Dengan hormat,</p>
        <p className="text-slate-700">
          Sehubungan dengan kebutuhan infrastruktur teknologi informasi perusahaan Anda, kami{' '}
          <strong>{profile.legalName || 'PT. LINTAS DATA INTERNASIONAL'}</strong> ({profile.website || 'e-office.ldi.co.id'}) dengan bangga menyampaikan rincian penawaran layanan terbaik sebagai berikut:
        </p>
      </div>

      {/* Section I: Services & Price Table */}
      <div>
        <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wide text-blue-950">
          I. RINCIAN BIAYA LAYANAN
        </h3>
        <table className="w-full border-collapse border border-slate-300 text-left text-xs">
          <thead>
            <tr className="bg-blue-950 text-white font-bold" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th className="p-2 border border-slate-300 w-8 text-center text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>No</th>
              <th className="p-2 border border-slate-300 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Deskripsi Layanan</th>
              <th className="p-2 border border-slate-300 text-center w-16 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Vol</th>
              <th className="p-2 border border-slate-300 text-right w-28 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Harga Satuan</th>
              <th className="p-2 border border-slate-300 text-right w-28 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {sph.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                <td className="p-2 border border-slate-300">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  {item.description && (
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.description}</p>
                  )}
                </td>
                <td className="p-2 border border-slate-300 text-center font-medium">
                  {item.qty} {item.unit}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono">
                  {formatIDR(item.price)}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                  {formatIDR(item.qty * item.price - (item.discount || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                Subtotal
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(sph.subtotal)}
              </td>
            </tr>
            {sph.discountTotal > 0 && (
              <tr>
                <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right text-emerald-700">
                  Diskon Khusus
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-700">
                  - {formatIDR(sph.discountTotal)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                {sph.taxPercent > 0 ? `PPN (${sph.taxPercent}%)` : 'PPN (Non-PPN / 0%)'}
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(sph.taxAmount)}
              </td>
            </tr>
            <tr className="bg-blue-50 font-black text-blue-950">
              <td colSpan={4} className="p-2.5 border border-slate-300 text-right text-sm">
                TOTAL PENAWARAN {sph.taxPercent > 0 ? '(INC. PPN)' : '(NON-PPN)'}
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono text-sm text-blue-900 font-bold">
                {formatIDR(sph.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Section II: Technical Specifications */}
      {sph.technicalSpecs && sph.technicalSpecs.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wide text-blue-950">
            II. SPESIFIKASI TEKNIS & QUALITY OF SERVICE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
            {sph.technicalSpecs.map((spec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-600 mt-1 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-slate-800">{spec.title}: </span>
                  <span className="text-slate-600">{spec.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section III: Terms and Conditions */}
      {sph.termsAndConditions && sph.termsAndConditions.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wide text-blue-950">
            {sph.technicalSpecs && sph.technicalSpecs.length > 0 ? 'III. SYARAT DAN KETENTUAN' : 'II. SYARAT DAN KETENTUAN'}
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
            {sph.termsAndConditions.map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Verification QR Badge & Official Signature Section */}
      <div className="pt-6 border-t border-slate-200 flex items-end justify-between gap-6">
        <QRCodeBadge
          docNumber={sph.sphNumber}
          docType="SPH"
          issueDate={formatDateIndonesian(sph.date)}
          companyWebsite={profile.website}
        />

        {showSignatures && (
          <div className="text-center relative min-w-[200px]">
            <p className="text-slate-600 mb-1">Hormat Kami,</p>
            <p className="font-bold text-blue-950">{profile.legalName || profile.name}</p>

            <div className="relative my-2 h-20 flex items-center justify-center">
              {/* Digital Stamp */}
              {showStamp && (
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 z-0">
                  {profile.defaultStampBase64 ? (
                    <img
                      src={profile.defaultStampBase64}
                      alt="Cap Perusahaan"
                      className="max-h-16 max-w-[80px] object-contain rotate-[-8deg]"
                    />
                  ) : (
                    <div className="border-2 border-red-600 rounded-full w-20 h-20 flex items-center justify-center rotate-[-12deg] bg-white/30">
                      <div className="border border-red-600 rounded-full w-16 h-16 flex flex-col items-center justify-center text-[7px] font-black text-red-600 uppercase text-center leading-tight">
                        <span>{profile.shortName || 'PT LDI'}</span>
                        <span className="text-[6px] text-red-500">OFFICIAL STAMP</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Digital Signature */}
              {signatureImage ? (
                <div className="flex flex-col items-center z-10 relative">
                  <img
                    src={signatureImage}
                    alt="Tanda Tangan Digital Direksi"
                    className="max-h-16 object-contain"
                  />
                  <VerifiedDigitalSignBadge
                    companyLegalName={profile.legalName || profile.name}
                    signerName={profile.directorName}
                    className="mt-0.5"
                  />
                </div>
              ) : (
                <div className="w-36 h-14 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
              )}
            </div>

            <p className="font-bold text-slate-900 underline">{profile.directorName}</p>
            <p className="text-slate-600 text-[11px]">{profile.directorPosition}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   PKS VIEW TEMPLATE
   ========================================================================= */
const PksTemplateView: React.FC<{
  pks: PKS;
  showStamp: boolean;
  showSignatures: boolean;
  companyProfile: CompanyProfile;
  customers?: Customer[];
}> = ({ pks, showStamp, showSignatures, companyProfile: profile, customers }) => {
  const party1Sig = pks.party1SignatureData || profile.defaultSignatureBase64;

  return (
    <div className="mt-3 print:mt-1 space-y-5">
      {/* Title Header */}
      <div
        className="text-center space-y-1 border-b border-slate-200 pb-4"
        style={{ borderBottom: '1px solid #cbd5e1' }}
      >
        <h2 className="text-base font-black text-blue-950 uppercase tracking-tight">
          PERJANJIAN KERJA SAMA (PKS)
        </h2>
        <p className="text-xs font-bold text-cyan-800 uppercase">
          LAYANAN INFRASTRUKTUR TEKNOLOGI INFORMASI & INTERNET DEDICATED
        </p>
        <p className="font-mono text-slate-700 font-bold text-xs">
          Nomor: {pks.pksNumber}
        </p>
      </div>

      <p className="text-justify leading-relaxed">
        Pada hari ini, tanggal <b>{formatDateIndonesian(pks.startDate)}</b>, kami yang bertanda tangan di bawah ini:
      </p>

      {/* Two Parties Box */}
      <div className="space-y-3">
        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
          <p className="font-bold text-blue-950">I. {profile.legalName || profile.name}</p>
          <p className="text-slate-700">
            Alamat: {profile.address}
          </p>
          <p className="text-slate-700">
            Diwakili oleh <b>{profile.directorName}</b> selaku <b>{profile.directorPosition}</b>, bertindak untuk dan atas nama {profile.legalName || profile.name}, selanjutnya disebut sebagai <b>PIHAK PERTAMA</b>.
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
          <p className="font-bold text-blue-950">II. {pks.customerName}</p>
          <p className="text-slate-700">
            Alamat: {pks.customerAddress}
          </p>
          <p className="text-slate-700">
            Diwakili oleh <b>{getContactPersonName(pks.customerRepresentative, pks.customerId, pks.customerName, customers)}</b> selaku <b>{pks.customerRepPosition || 'Pimpinan Perusahaan'}</b>, bertindak untuk dan atas nama {pks.customerName}, selanjutnya disebut sebagai <b>PIHAK KEDUA</b>.
          </p>
        </div>
      </div>

      <p className="text-justify">
        PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut <b>PARA PIHAK</b> sepakat untuk mengikatkan diri dalam Perjanjian Kerja Sama dengan klausul pasal-pasal sebagai berikut:
      </p>

      {/* Clauses */}
      <div className="space-y-4">
        {pks.clauses && pks.clauses.length > 0 ? (
          pks.clauses.map((clause) => (
            <div key={clause.article} className="space-y-1">
              <h4 className="font-bold text-blue-950 uppercase text-[11px] text-center border-b border-slate-200 pb-0.5">
                PASAL {clause.article}: {clause.title}
              </h4>
              <p className="text-justify text-slate-800 leading-relaxed pl-2">{clause.content}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic text-center">Ketentuan pasal dan klausul perjanjian kerja sama tercantum dalam lampiran terpisah.</p>
        )}
      </div>

      {/* Dual Signatures & Verification */}
      <div className="pt-8 border-t border-slate-200 space-y-4">
        <p className="text-center font-bold text-slate-800">
          Demikian Perjanjian ini dibuat dan ditandatangani oleh Para Pihak dengan penuh kesadaran dan tanpa paksaan.
        </p>

        {showSignatures && (
          <div className="grid grid-cols-2 gap-8 text-center pt-2">
            {/* Party 1 */}
            <div className="space-y-2">
              <p className="font-bold text-blue-950">PIHAK PERTAMA</p>
              <p className="text-slate-600 text-[11px]">{profile.legalName || profile.name}</p>
              <div className="h-20 flex items-center justify-center relative">
                {showStamp && (
                  <div className="absolute -left-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 z-0">
                    {profile.defaultStampBase64 ? (
                      <img
                        src={profile.defaultStampBase64}
                        alt="Cap Perusahaan"
                        className="max-h-16 max-w-[75px] object-contain rotate-[-8deg]"
                      />
                    ) : (
                      <div className="border-2 border-red-600 rounded-full w-18 h-18 flex items-center justify-center rotate-[-10deg] bg-white/30">
                        <span className="text-[7px] font-black text-red-600 text-center">{profile.shortName || 'PT LDI'}</span>
                      </div>
                    )}
                  </div>
                )}
                {party1Sig ? (
                  <div className="flex flex-col items-center z-10 relative">
                    <img src={party1Sig} alt="TTD Pihak 1" className="max-h-16 object-contain" />
                    <VerifiedDigitalSignBadge
                      companyLegalName={profile.legalName || profile.name}
                      signerName={pks.party1SignerName || profile.directorName}
                      className="mt-0.5"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-14 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
                )}
              </div>
              <p className="font-bold text-slate-900 underline">{pks.party1SignerName || profile.directorName}</p>
              <p className="text-slate-500 text-[10px]">{pks.party1SignerPosition || profile.directorPosition}</p>
            </div>

            {/* Party 2 */}
            <div className="space-y-2">
              <p className="font-bold text-blue-950">PIHAK KEDUA</p>
              <p className="text-slate-600 text-[11px]">{pks.customerName}</p>
              <div className="h-20 flex items-center justify-center">
                {pks.party2SignatureData ? (
                  <img src={pks.party2SignatureData} alt="TTD Pihak 2" className="max-h-16 object-contain" />
                ) : (
                  <div className="w-36 h-14 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
                )}
              </div>
              <p className="font-bold text-slate-900 underline">{pks.party2SignerName}</p>
              <p className="text-slate-500 text-[10px]">{pks.party2SignerPosition}</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <QRCodeBadge
            docNumber={pks.pksNumber}
            docType="PKS"
            issueDate={formatDateIndonesian(pks.startDate)}
            companyWebsite={profile.website}
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   INVOICE VIEW TEMPLATE
   ========================================================================= */
const InvoiceTemplateView: React.FC<{
  invoice: Invoice;
  showStamp: boolean;
  showSignatures: boolean;
  companyProfile: CompanyProfile;
  customers?: Customer[];
}> = ({ invoice, showStamp, showSignatures, companyProfile: profile, customers }) => {
  const signatureImage = invoice.signatureData || profile.defaultSignatureBase64;

  const paidAmount = typeof invoice.paidAmount === 'number'
    ? invoice.paidAmount
    : invoice.status === 'Lunas'
    ? invoice.grandTotal
    : (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);

  const remainingAmount = Math.max(0, invoice.grandTotal - paidAmount);
  const percentPaid = invoice.grandTotal > 0 ? Math.min(100, Math.round((paidAmount / invoice.grandTotal) * 100)) : 0;
  const hasPartialPayment = invoice.status === 'Dibayar Sebagian' || (paidAmount > 0 && paidAmount < invoice.grandTotal);

  // Bank Info fallback from profile
  const bankInfo = invoice.bankInfo?.accountNumber
    ? invoice.bankInfo
    : (profile.bankDetails && profile.bankDetails.length > 0)
    ? {
        bankName: profile.bankDetails[0].bankName,
        accountNumber: profile.bankDetails[0].accountNumber,
        accountHolder: profile.bankDetails[0].accountHolder,
        branch: profile.bankDetails[0].branch,
        notes: profile.bankDetails[0].notes,
      }
    : COMPANY_PROFILE.bankDetails[0];

  return (
    <div className="mt-3 print:mt-1 space-y-5">
      {/* Title & Status Header */}
      <div
        className="flex justify-between items-start border-b border-slate-200 pb-4"
        style={{ borderBottom: '1px solid #cbd5e1' }}
      >
        <div>
          <h2 className="text-lg font-black text-blue-950 uppercase tracking-tight">
            INVOICE / FAKTUR PENAGIHAN
          </h2>
          <p className="font-mono text-slate-800 font-bold text-sm mt-0.5">
            No: {invoice.invoiceNumber}
          </p>
          {invoice.sphReference && (
            <p className="text-slate-500 text-[11px]">Ref SPH: {invoice.sphReference}</p>
          )}
        </div>

        <div className="text-right space-y-1">
          <div
            className={`inline-block px-3 py-1.5 rounded font-black text-xs uppercase tracking-wider ${
              invoice.status === 'Lunas'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : invoice.status === 'Dibayar Sebagian'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            STATUS: {invoice.status === 'Lunas' ? 'LUNAS' : invoice.status === 'Dibayar Sebagian' ? `BELUM BAYAR (Dibayar Sebagian ${percentPaid}%)` : 'BELUM BAYAR'}
          </div>
          <p className="text-slate-600 font-medium text-xs">Tanggal Diterbitkan: {formatDateIndonesian(invoice.issueDate)}</p>
          <p className="text-rose-700 font-bold text-xs">Jatuh Tempo: {formatDateIndonesian(invoice.dueDate)}</p>
        </div>
      </div>

      {/* Customer Info & Official Bank Account Side-by-Side Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
            DITAGIHKAN KEPADA:
          </p>
          <p className="font-bold text-blue-950 text-sm">{invoice.customerName}</p>
          <p className="text-slate-700 mt-0.5">{invoice.customerAddress || 'Indonesia'}</p>
          <p className="text-slate-600 text-[11px] mt-1">
            Up: Bapak/Ibu {getContactPersonName(invoice.customerRepresentative, invoice.customerId, invoice.customerName, customers)} | Telp: {invoice.customerPhone || '-'} | Email: {invoice.customerEmail || '-'}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
            REKENING PEMBAYARAN RESMI PT. LDI:
          </p>
          <p className="font-bold text-blue-950">{bankInfo.bankName}</p>
          <p className="font-mono text-base font-bold text-slate-900 my-0.5">
            {bankInfo.accountNumber}
          </p>
          <p className="text-slate-700 font-medium text-[11px]">
            a.n. {bankInfo.accountHolder || profile.legalName || 'PT LINTAS DATA INTERNASIONAL'}
          </p>
          {bankInfo.branch && (
            <p className="text-slate-500 text-[10px] mt-0.5">
              Cabang: {bankInfo.branch}
            </p>
          )}
          {bankInfo.notes && (
            <p className="text-slate-600 italic text-[10px] mt-1 border-t border-slate-200 pt-1">
              * {bankInfo.notes}
            </p>
          )}
        </div>
      </div>

      {/* Invoice Items Table */}
      <div>
        <table className="w-full border-collapse border border-slate-300 text-left text-xs">
          <thead>
            <tr className="bg-blue-950 text-white font-bold" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th className="p-2.5 border border-slate-300 w-8 text-center text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>No</th>
              <th className="p-2.5 border border-slate-300 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Deskripsi Item Penagihan</th>
              <th className="p-2.5 border border-slate-300 text-center w-20 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Volume</th>
              <th className="p-2.5 border border-slate-300 text-right w-28 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Harga Satuan</th>
              <th className="p-2.5 border border-slate-300 text-right w-32 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-slate-200">
                  <td className="p-2.5 border border-slate-300 text-center">{idx + 1}</td>
                  <td className="p-2.5 border border-slate-300">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    {item.description && (
                      <p className="text-[11px] text-slate-600">{item.description}</p>
                    )}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-center font-medium">
                    {item.qty} {item.unit}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right font-mono">
                    {formatIDR(item.price)}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right font-mono font-bold">
                    {formatIDR(item.qty * item.price - (item.discount || 0))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">Tidak ada rincian item penagihan</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                Subtotal
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(invoice.subtotal)}
              </td>
            </tr>
            {invoice.discountTotal > 0 && (
              <tr>
                <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right text-emerald-700">
                  Diskon
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-700">
                  - {formatIDR(invoice.discountTotal)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                {invoice.taxPercent > 0 ? `PPN (${invoice.taxPercent}%)` : 'PPN (Non-PPN / 0%)'}
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(invoice.taxAmount)}
              </td>
            </tr>
            <tr className="bg-blue-50 font-black text-blue-950">
              <td colSpan={4} className="p-2.5 border border-slate-300 text-right text-sm">
                TOTAL PENAGIHAN {invoice.taxPercent > 0 ? '(INC. PPN)' : '(NON-PPN)'}
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono text-sm text-blue-900 font-bold">
                {formatIDR(invoice.grandTotal)}
              </td>
            </tr>

            {hasPartialPayment && (
              <>
                <tr className="bg-emerald-50 text-emerald-900 font-bold">
                  <td colSpan={4} className="p-2 border border-slate-300 text-right text-xs">
                    TOTAL TELAH DIBAYAR (CICILAN / PARSIAL)
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono text-xs font-black text-emerald-800">
                    - {formatIDR(paidAmount)} ({percentPaid}%)
                  </td>
                </tr>
                <tr className="bg-amber-100 text-amber-950 font-black">
                  <td colSpan={4} className="p-2.5 border border-slate-300 text-right text-xs uppercase">
                    SISA PIUTANG TAGIHAN YANG HARUS DILUNASI
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right font-mono text-xs font-black text-rose-800">
                    {formatIDR(remainingAmount)}
                  </td>
                </tr>
              </>
            )}
          </tfoot>
        </table>
      </div>

      {/* Payment History / Cicilan Details */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
            CATATAN SETORAN / RIWAYAT PEMBAYARAN CICILAN:
          </p>
          <div className="divide-y divide-slate-200">
            {invoice.payments.map((p, i) => (
              <div key={p.id || i} className="py-1 text-[11px] flex justify-between items-center text-slate-700">
                <div>
                  <span className="font-bold font-mono text-slate-900 mr-2">#{i + 1}</span>
                  <span>{formatDateIndonesian(p.paymentDate)} via {p.paymentMethod}</span>
                  {p.notes && <span className="text-slate-500 italic ml-2">({p.notes})</span>}
                </div>
                <span className="font-mono font-bold text-emerald-800">{formatIDR(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terbilang Box */}
      <div className="bg-slate-50 p-3 rounded border border-slate-200">
        <span className="font-bold text-slate-700">Terbilang (Sisa Tagihan / Total): </span>
        <span className="font-serif italic font-semibold text-blue-950 text-xs">
          "{terbilangRupiah(hasPartialPayment ? remainingAmount : invoice.grandTotal)}"
        </span>
      </div>

      {/* Footer Signatures & QR Code */}
      <div className="pt-6 border-t border-slate-200 flex items-end justify-between gap-6">
        <QRCodeBadge
          docNumber={invoice.invoiceNumber}
          docType="INVOICE"
          issueDate={formatDateIndonesian(invoice.issueDate)}
          companyWebsite={profile.website}
        />

        {showSignatures && (
          <div className="text-center relative min-w-[180px]">
            <p className="text-slate-600 mb-1">Departemen Keuangan,</p>
            <p className="font-bold text-blue-950">{profile.legalName || profile.name}</p>

            <div className="relative my-2 h-16 flex items-center justify-center">
              {showStamp && (
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 z-0">
                  {invoice.status === 'Lunas' ? (
                    profile.defaultStampBase64 ? (
                      <img
                        src={profile.defaultStampBase64}
                        alt="Cap Stempel Finance Lunas"
                        className="max-h-16 max-w-[80px] object-contain rotate-[-8deg]"
                      />
                    ) : (
                      <div className="border-2 border-emerald-600 rounded-full w-20 h-20 flex flex-col items-center justify-center rotate-[-12deg] bg-emerald-50/70 p-1 text-center shadow-2xs">
                        <span className="text-[7px] font-black text-emerald-900 uppercase tracking-tighter leading-none">
                          {profile.shortName || 'PT LDI'}
                        </span>
                        <span className="text-[11px] font-black text-emerald-700 uppercase my-0.5 leading-none tracking-tight">
                          LUNAS
                        </span>
                        <span className="text-[6px] font-bold text-emerald-800 uppercase leading-none">
                          PAID / OFFICIAL
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="border-2 border-red-600 rounded-full w-20 h-20 flex flex-col items-center justify-center rotate-[-12deg] bg-red-50/80 p-1 text-center shadow-2xs">
                      <span className="text-[7px] font-black text-red-900 uppercase tracking-tighter leading-none">
                        {profile.shortName || 'PT LDI'}
                      </span>
                      <span className="text-[10px] font-black text-red-600 uppercase my-0.5 leading-none tracking-tight">
                        BELUM BAYAR
                      </span>
                      <span className="text-[6px] font-bold text-red-700 uppercase leading-none">
                        {invoice.status === 'Dibayar Sebagian' ? `PARSIAL ${percentPaid}%` : 'UNPAID / TAGIHAN'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {signatureImage ? (
                <div className="flex flex-col items-center z-10 relative">
                  <img
                    src={signatureImage}
                    alt="Tanda Tangan Digital Finance"
                    className="max-h-14 object-contain"
                  />
                  <VerifiedDigitalSignBadge
                    companyLegalName={profile.legalName || profile.name}
                    signerName={profile.financeManager || 'Finance Department'}
                    className="mt-0.5"
                  />
                </div>
              ) : (
                <div className="w-36 h-12 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
              )}
            </div>

            <p className="font-bold text-slate-900 underline">{profile.financeManager || 'Siti Rahmawati, S.E.'}</p>
            <p className="text-slate-500 text-[10px]">Finance Manager</p>
          </div>
        )}
      </div>
    </div>
  );
};
