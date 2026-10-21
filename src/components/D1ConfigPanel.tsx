import React, { useState, useEffect } from 'react';
import { Database, Server, Key, RefreshCw, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, Check, Globe, ShieldCheck } from 'lucide-react';
import { apiTestCloudflareD1, apiSaveCloudflareConfig, apiGetCloudflareConfig } from '../api/client';
import { D1Config } from '../types';

interface D1ConfigPanelProps {
  currentStatus?: 'connected' | 'loading' | 'offline' | 'disconnected';
  onStatusChange?: (status: 'connected' | 'disconnected' | 'offline') => void;
  onConfigSaved?: (config: D1Config) => void;
}

export const D1ConfigPanel: React.FC<D1ConfigPanelProps> = ({
  currentStatus = 'offline',
  onStatusChange,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<D1Config>({
    databaseId: '',
    workerEndpoint: 'https://api.cloudflare.com/client/v4',
    apiToken: '',
    accountId: '',
    mode: 'local',
    isConnected: false,
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
    message: '',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      // 1. Try local storage
      const saved = localStorage.getItem('ldi_db_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (isMounted) {
            setConfig({
              databaseId: parsed.databaseId || '',
              workerEndpoint: parsed.workerEndpoint || parsed.endpoint || 'https://api.cloudflare.com/client/v4',
              apiToken: parsed.apiToken || '',
              accountId: parsed.accountId || '',
              mode: parsed.mode || 'local',
              isConnected: Boolean(parsed.isConnected),
              lastTested: parsed.lastTested,
              lastTestMessage: parsed.lastTestMessage,
              latency: parsed.latency,
            });
            if (parsed.lastTestMessage) {
              setTestState({
                loading: false,
                success: parsed.isConnected ?? null,
                message: parsed.lastTestMessage,
                latency: parsed.latency,
              });
            }
          }
          return;
        } catch (e) {
          // ignore
        }
      }

      // 2. Fetch from backend server
      try {
        const serverConfig = await apiGetCloudflareConfig();
        if (serverConfig && isMounted) {
          setConfig({
            databaseId: serverConfig.databaseId || '',
            workerEndpoint: serverConfig.workerEndpoint || 'https://api.cloudflare.com/client/v4',
            apiToken: serverConfig.apiToken || '',
            accountId: serverConfig.accountId || '',
            mode: serverConfig.mode || 'local',
            isConnected: Boolean(serverConfig.isConnected),
            lastTested: serverConfig.lastTested,
            lastTestMessage: serverConfig.lastTestMessage,
            latency: serverConfig.latency,
          });
        }
      } catch (err) {
        // Safe ignore
      }
    }

    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTestConnection = async () => {
    setTestState({
      loading: true,
      success: null,
      message: 'Sedang menghubungi & memverifikasi koneksi ke Cloudflare D1 / Worker API...',
    });

    try {
      const data = await apiTestCloudflareD1({
        endpoint: config.workerEndpoint,
        accountId: config.accountId,
        databaseId: config.databaseId,
        apiToken: config.apiToken,
      });

      if (data.success) {
        const updatedConfig = {
          ...config,
          isConnected: true,
          lastTested: new Date().toISOString(),
          lastTestMessage: data.message,
          latency: data.latency,
        };
        setConfig(updatedConfig);
        localStorage.setItem('ldi_db_config', JSON.stringify(updatedConfig));
        apiSaveCloudflareConfig(updatedConfig).catch(() => {});

        setTestState({
          loading: false,
          success: true,
          message: data.message || 'Koneksi ke Cloudflare D1 Database berhasil terverifikasi!',
          latency: data.latency,
        });

        if (onStatusChange) {
          onStatusChange('connected');
        }
        if (onConfigSaved) {
          onConfigSaved(updatedConfig);
        }
      } else {
        const updatedConfig = {
          ...config,
          isConnected: false,
          lastTested: new Date().toISOString(),
          lastTestMessage: data.message,
        };
        setConfig(updatedConfig);
        localStorage.setItem('ldi_db_config', JSON.stringify(updatedConfig));
        apiSaveCloudflareConfig(updatedConfig).catch(() => {});

        setTestState({
          loading: false,
          success: false,
          message: data.message || 'Gagal memverifikasi koneksi API.',
        });

        if (onStatusChange) {
          onStatusChange('disconnected');
        }
      }
    } catch (err: any) {
      setTestState({
        loading: false,
        success: false,
        message: `Koneksi gagal: ${err.message || 'Tidak dapat terhubung ke endpoint Cloudflare D1'}`,
      });
      if (onStatusChange) {
        onStatusChange('disconnected');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setTestState({
      loading: true,
      success: null,
      message: 'Sedang memvalidasi dan menyimpan konfigurasi Cloudflare D1...',
    });

    try {
      const testRes = await apiTestCloudflareD1({
        endpoint: config.workerEndpoint,
        accountId: config.accountId,
        databaseId: config.databaseId,
        apiToken: config.apiToken,
      });

      const isConnected = Boolean(testRes.success);
      const newConfig: D1Config = {
        ...config,
        mode: 'd1',
        isConnected,
        lastTested: new Date().toISOString(),
        lastTestMessage: testRes.message,
        latency: testRes.latency,
      };

      localStorage.setItem('ldi_db_config', JSON.stringify(newConfig));
      await apiSaveCloudflareConfig(newConfig).catch(() => {});
      setConfig(newConfig);

      setTestState({
        loading: false,
        success: isConnected,
        message: testRes.message,
        latency: testRes.latency,
      });

      if (onStatusChange) {
        onStatusChange(isConnected ? 'connected' : 'disconnected');
      }
      if (onConfigSaved) {
        onConfigSaved(newConfig);
      }
    } catch (err: any) {
      const isConnected = false;
      const newConfig: D1Config = {
        ...config,
        mode: 'd1',
        isConnected,
        lastTested: new Date().toISOString(),
        lastTestMessage: err.message,
      };

      localStorage.setItem('ldi_db_config', JSON.stringify(newConfig));
      await apiSaveCloudflareConfig(newConfig).catch(() => {});
      setConfig(newConfig);

      setTestState({
        loading: false,
        success: false,
        message: `Gagal verifikasi koneksi: ${err.message || 'Periksa API Token dan Database ID Anda.'}`,
      });

      if (onStatusChange) {
        onStatusChange('disconnected');
      }
      if (onConfigSaved) {
        onConfigSaved(newConfig);
      }
    }
  };

  const handleResetLocal = async () => {
    const newConfig: D1Config = {
      ...config,
      mode: 'local',
      isConnected: false,
      lastTested: new Date().toISOString(),
      lastTestMessage: 'Beralih ke mode Local Storage',
    };
    localStorage.setItem('ldi_db_config', JSON.stringify(newConfig));
    await apiSaveCloudflareConfig(newConfig).catch(() => {});
    setConfig(newConfig);

    setTestState({
      loading: false,
      success: null,
      message: 'Sistem berhasil dialihkan ke Mode Local Storage (Data tersimpan di server lokal).',
    });

    if (onStatusChange) {
      onStatusChange('offline');
    }
    if (onConfigSaved) {
      onConfigSaved(newConfig);
    }
  };

  const effectiveStatus = currentStatus || (config.mode === 'd1' && config.isConnected ? 'connected' : config.mode === 'd1' ? 'disconnected' : 'offline');

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-900">
            <Database className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Konfigurasi Cloudflare D1 Database & Worker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Integrasi sinkronisasi data real-time dengan Cloudflare D1 SQL Server
            </p>
          </div>
        </div>

        {/* Live Synchronized Status Badge */}
        <div className="flex items-center gap-2">
          {effectiveStatus === 'connected' && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cloudflare D1 Connected
            </span>
          )}
          {effectiveStatus === 'disconnected' && (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold px-3 py-1 rounded-full border border-rose-300 dark:border-rose-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Cloudflare D1 Disconnected
            </span>
          )}
          {effectiveStatus === 'loading' && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Menghubungkan...
            </span>
          )}
          {effectiveStatus === 'offline' && (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Local Storage Mode
            </span>
          )}
        </div>
      </div>

      {/* Mode Status Summary Card */}
      <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Sinkronisasi Header & Backend
            </span>
            <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">
              {config.mode === 'd1'
                ? config.isConnected
                  ? `Terhubung ke Cloudflare D1 (Database ID: ${config.databaseId || '-'})`
                  : 'Konfigurasi D1 tersimpan, namun koneksi belum diverifikasi atau gagal.'
                : 'Aplikasi berjalan independen dengan server lokal Express & browser disk.'}
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              Auto-Sync Check
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Worker API / Cloudflare Endpoint</span>
          </label>
          <input
            type="text"
            value={config.workerEndpoint}
            onChange={(e) => setConfig({ ...config, workerEndpoint: e.target.value })}
            placeholder="https://api.cloudflare.com/client/v4 atau https://worker-anda.workers.dev"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Gunakan default <code>https://api.cloudflare.com/client/v4</code> untuk koneksi langsung via Cloudflare REST API.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cloudflare Account ID</span>
            </label>
            <input
              type="text"
              value={config.accountId}
              onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
              placeholder="Contoh: a1b2c3d4e5f6g7h8..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cloudflare D1 Database ID</span>
            </label>
            <input
              type="text"
              value={config.databaseId}
              onChange={(e) => setConfig({ ...config, databaseId: e.target.value })}
              placeholder="UUID Database (Contoh: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Cloudflare API Token (D1 Edit / Read Permission)</span>
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={config.apiToken}
              onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
              placeholder="API Token dari Cloudflare Dashboard"
              className="w-full px-3.5 py-2.5 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title={showToken ? 'Sembunyikan Token' : 'Lihat Token'}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Output Hasil Tes Koneksi Real-Time */}
        {testState.message && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl border text-xs leading-relaxed transition-all ${
              testState.success === true
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : testState.success === false
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            }`}
          >
            <div className="flex items-center justify-between font-semibold mb-1">
              <span className="flex items-center space-x-1.5">
                {testState.success === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                {testState.success === false && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                {testState.loading && <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />}
                <span>Status Verifikasi Cloudflare D1</span>
              </span>
              {testState.latency !== undefined && (
                <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono">
                  {testState.latency} ms
                </span>
              )}
            </div>
            <p>{testState.message}</p>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testState.loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testState.loading ? 'animate-spin' : ''}`} />
            <span>{testState.loading ? 'Menguji Koneksi...' : 'Tes Koneksi Sekarang'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetLocal}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Mode Local Storage
            </button>

            <button
              type="submit"
              disabled={testState.loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Verifikasi</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default D1ConfigPanel;
