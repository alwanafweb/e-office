import React, { useState, useEffect } from 'react';
import { Database, Server, Key, RefreshCw, CheckCircle2, XCircle, AlertCircle, Eye, Check, Globe } from 'lucide-react';

interface D1ConfigPanelProps {
  onStatusChange?: (status: 'connected' | 'disconnected' | 'local') => void;
}

export const D1ConfigPanel: React.FC<D1ConfigPanelProps> = ({ onStatusChange }) => {
  const [config, setConfig] = useState({
    databaseId: '',
    workerEndpoint: 'https://api.cloudflare.com/client/v4',
    apiToken: '',
    accountId: '',
    mode: 'local' as 'd1' | 'local'
  });

  const [showToken, setShowToken] = useState(false);
  const [testState, setTestState] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
    latency?: number;
  }>({
    loading: false,
    success: null,
    message: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('ldi_db_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({
          databaseId: parsed.databaseId || '',
          workerEndpoint: parsed.workerEndpoint || parsed.endpoint || 'https://api.cloudflare.com/client/v4',
          apiToken: parsed.apiToken || '',
          accountId: parsed.accountId || '',
          mode: parsed.mode || 'local'
        });
      } catch (e) {
        console.error('Gagal membaca konfigurasi D1');
      }
    }
  }, []);

  const handleTestConnection = async () => {
    setTestState({
      loading: true,
      success: null,
      message: 'Sedang menghubungkan & mengetes koneksi ke Worker API / Cloudflare D1...'
    });

    try {
      const response = await fetch('/api/cloudflare/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: config.workerEndpoint,
          accountId: config.accountId,
          databaseId: config.databaseId,
          apiToken: config.apiToken
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestState({
          loading: false,
          success: true,
          message: data.message || 'Koneksi ke Cloudflare D1 Database berhasil terverifikasi!',
          latency: data.latency
        });
      } else {
        setTestState({
          loading: false,
          success: false,
          message: data.message || 'Gagal memverifikasi koneksi API.'
        });
      }
    } catch (err: any) {
      setTestState({
        loading: false,
        success: false,
        message: `Koneksi gagal: ${err.message || 'Tidak dapat terhubung ke endpoint'}`
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = { ...config, mode: 'd1' as const };
    localStorage.setItem('ldi_db_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    if (onStatusChange) {
      onStatusChange(config.databaseId && config.apiToken ? 'connected' : 'local');
    }
    alert('Konfigurasi Cloudflare D1 berhasil disimpan!');
  };

  const handleResetLocal = () => {
    const newConfig = { ...config, mode: 'local' as const };
    localStorage.setItem('ldi_db_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    if (onStatusChange) {
      onStatusChange('local');
    }
    alert('Sistem beralih ke Mode Local Storage.');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">D1ConfigPanel - Cloudflare Backend</h3>
          <p className="text-xs text-slate-500">Integrasi dinamis ke Cloudflare D1 Database & Worker API</p>
        </div>
      </div>

      {/* Mode Status Indicator */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Mode Storage</p>
          <div className="flex items-center space-x-2 mt-1">
            {config.mode === 'd1' && config.databaseId ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                D1 Cloudflare Connected
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-600 flex items-center bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                Local Storage Mode
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Worker API Endpoint</span>
          </label>
          <input
            type="text"
            value={config.workerEndpoint}
            onChange={(e) => setConfig({ ...config, workerEndpoint: e.target.value })}
            placeholder="https://api.cloudflare.com/client/v4 atau https://worker-anda.workers.dev"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <Server className="w-3.5 h-3.5 text-blue-600" />
            <span>Cloudflare Account ID</span>
          </label>
          <input
            type="text"
            value={config.accountId}
            onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
            placeholder="Cloudflare Account ID"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Cloudflare D1 Database ID</span>
          </label>
          <input
            type="text"
            value={config.databaseId}
            onChange={(e) => setConfig({ ...config, databaseId: e.target.value })}
            placeholder="Database ID (UUID)"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <Key className="w-3.5 h-3.5 text-blue-600" />
            <span>API Token</span>
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={config.apiToken}
              onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
              placeholder="Cloudflare API Token"
              className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Output Hasil Tes Koneksi */}
        {testState.message && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed ${
              testState.success === true
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : testState.success === false
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center justify-between font-semibold mb-1">
              <span className="flex items-center space-x-1.5">
                {testState.success === true && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {testState.success === false && <XCircle className="w-4 h-4 text-red-600" />}
                {testState.loading && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
                <span>Hasil Tes Koneksi D1</span>
              </span>
              {testState.latency && (
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-mono">
                  {testState.latency} ms
                </span>
              )}
            </div>
            <p>{testState.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testState.loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testState.loading ? 'animate-spin' : ''}`} />
            <span>{testState.loading ? 'Menguji Koneksi...' : 'Tes Koneksi'}</span>
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleResetLocal}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Mode Local Storage
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default D1ConfigPanel;
