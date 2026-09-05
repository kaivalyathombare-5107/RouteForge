// src/components/ProviderConnectionModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Layers, 
  ExternalLink, 
  Check, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Train,
  Plane,
  Car,
  Bus,
  Lock
} from 'lucide-react';
import { ProviderWithStatus, ProviderId } from '../lib/providers/types';
import { fetchProviders, connectProvider, disconnectProvider } from '../lib/api/providers';

interface ProviderConnectionModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onContinueToJourneys?: () => void;
  isInitialOnboarding?: boolean;
}

export const ProviderConnectionModal: React.FC<ProviderConnectionModalProps> = ({
  isOpen,
  userId,
  onClose,
  onContinueToJourneys,
  isInitialOnboarding = false,
}) => {
  const [providers, setProviders] = useState<ProviderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rail' | 'air' | 'cab' | 'bus'>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    loadProviders();
  }, [isOpen, userId]);

  const loadProviders = async () => {
    setLoading(true);
    const res = await fetchProviders(userId);
    if (res.success) {
      setProviders(res.providers);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const handleToggleConnection = async (provider: ProviderWithStatus) => {
    const pId = provider.id;
    setActionInProgress(prev => ({ ...prev, [pId]: true }));
    setNotification(null);

    try {
      if (provider.connectionState === 'CONNECTED') {
        const res = await disconnectProvider(userId, pId);
        if (res.success) {
          setProviders(prev => prev.map(p => p.id === pId ? { ...p, connectionState: 'NOT_CONNECTED' } : p));
          setNotification({ message: `Disconnected from ${provider.name}`, type: 'success' });
        }
      } else {
        const res = await connectProvider(userId, pId);
        if (res.success) {
          setProviders(prev => prev.map(p => p.id === pId ? { ...p, connectionState: 'CONNECTED' } : p));
          setNotification({ message: `Securely authorized ${provider.name}`, type: 'success' });
        }
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Connection failed', type: 'error' });
    } finally {
      setActionInProgress(prev => ({ ...prev, [pId]: false }));
    }
  };

  const filteredProviders = selectedCategory === 'all' 
    ? providers 
    : providers.filter(p => p.category === selectedCategory || (selectedCategory === 'air' && p.category === 'aggregator'));

  const connectedCount = providers.filter(p => p.connectionState === 'CONNECTED').length;

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-8 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Ambient Gold Glow Aura */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="relative flex items-start justify-between border-b border-gold-subtle/30 pb-5 mb-5 flex-shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
              <span>{isInitialOnboarding ? 'STEP 2 OF 2: RE ROUTE PRIVÉ INTEGRATIONS' : 'PROVIDER CONNECTION CENTER'}</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-white">
              Authorize Multi-Modal Travel Providers
            </h2>
            <p className="text-xs font-sans-luxury text-slate-300 font-light max-w-2xl">
              Connect official partner credentials for automated IRCTC PRS telemetry, DGCA statutory TDR recovery, curbside VIP airport cabs, and real-time flight status.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 rounded-full bg-slate-900 border border-gold-subtle text-[11px] font-mono text-[#FCE7AC]">
              {connectedCount} of {providers.length} Connected
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`mb-4 p-3 rounded-xl flex items-center space-x-2 text-xs font-sans-luxury flex-shrink-0 ${
            notification.type === 'success' 
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200' 
              : 'bg-red-950/60 border border-red-500/40 text-red-200'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-5 flex-shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Providers ({providers.length})
          </button>
          <button
            onClick={() => setSelectedCategory('rail')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedCategory === 'rail'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Train className="w-3 h-3" />
            <span>Rail (IRCTC)</span>
          </button>
          <button
            onClick={() => setSelectedCategory('air')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedCategory === 'air'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Plane className="w-3 h-3" />
            <span>Air &amp; GDS</span>
          </button>
          <button
            onClick={() => setSelectedCategory('cab')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedCategory === 'cab'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>VIP Mobility (Uber/Ola)</span>
          </button>
          <button
            onClick={() => setSelectedCategory('bus')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedCategory === 'bus'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bus className="w-3 h-3" />
            <span>Intercity Sleeper</span>
          </button>
        </div>

        {/* Scrollable Provider Grid */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-cinzel tracking-widest text-[#D4AF37]">SYNCHRONIZING PROVIDER REGISTRY...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProviders.map((provider) => {
                const isConnected = provider.connectionState === 'CONNECTED';
                const inAction = actionInProgress[provider.id];

                return (
                  <div
                    key={provider.id}
                    className={`p-4 rounded-2xl bg-[#0E1017] border transition-all flex flex-col justify-between space-y-3 ${
                      isConnected 
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20' 
                        : 'border-gold-subtle hover:border-gold-bright/60'
                    }`}
                  >
                    <div>
                      {/* Top Row: Title, Badge, Source */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-serif-display font-bold text-base text-white">
                              {provider.name}
                            </h3>
                            {isConnected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                              {provider.category}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[9px] font-mono text-[#D4AF37] px-1.5 py-0.2 rounded bg-slate-900 border border-gold-subtle">
                              {provider.sourceType}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full ${
                          isConnected 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                      </div>

                      <p className="text-xs font-sans-luxury text-slate-300 font-light leading-relaxed mb-3">
                        {provider.description}
                      </p>

                      {/* Capabilities Matrix Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {provider.capabilities.search && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                            ✓ SEARCH
                          </span>
                        )}
                        {provider.capabilities.booking && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                            ✓ DIRECT BOOK
                          </span>
                        )}
                        {provider.capabilities.refundStatus && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                            ✓ TDR AUDIT
                          </span>
                        )}
                        {provider.capabilities.tracking && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40">
                            ✓ TELEMETRY
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-500">
                        {provider.authMethod === 'oauth' && 'OAuth 2.0 Direct'}
                        {provider.authMethod === 'irctc_bridge' && 'IRCTC PRS Bridge'}
                        {provider.authMethod === 'partner_auth' && 'Official Partner Token'}
                        {provider.authMethod === 'deep_link' && 'Deep-Link Bridge'}
                      </div>

                      <button
                        onClick={() => handleToggleConnection(provider)}
                        disabled={inAction}
                        className={`px-4 py-1.5 rounded-xl text-xs font-cinzel font-bold tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 ${
                          isConnected
                            ? 'bg-slate-900 hover:bg-red-950/80 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40'
                            : 'gold-gradient-bar hover:opacity-95 text-slate-950 shadow-sm shadow-[#D4AF37]/20'
                        }`}
                      >
                        {inAction ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isConnected ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>DISCONNECT</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>CONNECT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Action & Security Strip */}
        <div className="pt-5 mt-4 border-t border-gold-subtle/30 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Zero Password Storage • No Web Scraping • Encrypted OAuth Bridge</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {isInitialOnboarding && (
              <button
                onClick={() => {
                  onClose();
                  onContinueToJourneys?.();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
              >
                <span>ENTER PLAN YOUR JOURNEY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {!isInitialOnboarding && (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-cinzel text-xs cursor-pointer"
              >
                CLOSE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
