// src/components/ProviderAdapterSection.tsx
import React, { useState } from 'react';
import { Layers, Activity, Database, CheckCircle2, RefreshCw, Terminal, Globe, Lock, ShieldCheck, ExternalLink } from 'lucide-react';
import { providerAdaptersMap, ProviderId } from '../lib/providers';

export const ProviderAdapterSection: React.FC = () => {
  const [selectedAdapterId, setSelectedAdapterId] = useState<ProviderId>('irctc');
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAdapter = async (id: ProviderId) => {
    setIsLoading(true);
    setSelectedAdapterId(id);
    const adapter = providerAdaptersMap[id];
    if (!adapter) {
      setLiveResponse({ error: `Adapter ${id} not found.` });
      setIsLoading(false);
      return;
    }

    try {
      if (id === 'irctc') {
        const res = await adapter.search({ origin: 'NDLS', destination: 'MMCT', departDate: '2026-10-15' });
        setLiveResponse(res);
      } else if (id === 'makemytrip') {
        const res = await adapter.search({ origin: 'BOM', destination: 'DEL', departDate: '2026-10-15' });
        setLiveResponse(res);
      } else if (id === 'uber') {
        const res = await adapter.search({ origin: 'BOM Airport T2', destination: 'The Taj Mahal Palace, Colaba', departDate: '2026-10-15' });
        setLiveResponse(res);
      } else if (id === 'redbus') {
        const res = await adapter.search({ origin: 'Delhi', destination: 'Jaipur', departDate: '2026-10-15' });
        setLiveResponse(res);
      } else if (id === 'ixigo') {
        const res = await adapter.search({ origin: 'BOM', destination: 'JAI', departDate: '2026-10-15' });
        setLiveResponse(res);
      } else if (id === 'ola') {
        const res = await adapter.search({ origin: 'Mumbai', destination: 'Pune', departDate: '2026-10-15' });
        setLiveResponse(res);
      } else if (id === 'rapido') {
        const res = await adapter.search({ origin: 'New Delhi Railway Station', destination: 'Connaught Place', departDate: '2026-10-15' });
        setLiveResponse(res);
      } else if (id === 'goibibo') {
        const res = await adapter.search({ origin: 'Udaipur', destination: 'Udaipur', departDate: '2026-10-15' });
        setLiveResponse(res);
      }
    } catch (e: any) {
      setLiveResponse({ error: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const currentAdapter = providerAdaptersMap[selectedAdapterId] || providerAdaptersMap['irctc'];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center space-x-3 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
            SYSTEM ARCHITECTURE
          </span>
          <span className="text-xs font-mono text-slate-400">UNIFIED ADAPTER PATTERN (8 INTEGRATED PROVIDERS)</span>
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-100">
          Provider Abstraction &amp; Deterministic Pipeline
        </h2>
        <p className="text-xs text-slate-400 font-light mt-1 max-w-3xl">
          RouteForge abstracts heterogeneous legacy provider data into a canonical trip graph. Business rules remain strictly deterministic, paired with expert human travel briefings and contextual guidance.
        </p>
      </div>

      {/* 5-Layer Architectural Stack Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          {
            layer: 'LAYER 1',
            title: 'Raw Provider APIs',
            desc: 'IRCTC PRS, IndiGo GDS, Hotel CRS, Uber Mobility API',
            icon: Globe,
            color: 'border-slate-700 bg-slate-950/60 text-slate-300',
          },
          {
            layer: 'LAYER 2',
            title: 'Provider Adapters',
            desc: '8 Uniform typed adapters with strict provenance tagging',
            icon: Layers,
            color: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300',
          },
          {
            layer: 'LAYER 3',
            title: 'Canonical Trip Graph',
            desc: 'Nodes (Bookings), Edges (Buffers), Spatial 3D coordinates',
            icon: Database,
            color: 'border-blue-500/50 bg-blue-950/30 text-blue-300',
          },
          {
            layer: 'LAYER 4',
            title: 'Deterministic Engines',
            desc: 'BFS Cascade solver, DGCA/IRCTC rules, multi-objective ranking',
            icon: ShieldCheck,
            color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
          },
          {
            layer: 'LAYER 5',
            title: 'Travel Briefing Layer',
            desc: 'Curated concierge intelligence, grounded briefing, localized translations',
            icon: Activity,
            color: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
          },
        ].map(l => (
          <div key={l.layer} className={`p-4 rounded-2xl border ${l.color} space-y-2 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mb-1">
                <span>{l.layer}</span>
                <l.icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold font-display">{l.title}</div>
            </div>
            <p className="text-[11px] font-light opacity-80 leading-snug">{l.desc}</p>
          </div>
        ))}
      </div>

      {/* Live Provider Adapter Test Harness */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase">
              Live Provider Adapter Diagnostic Harness
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {Object.keys(providerAdaptersMap).map((id) => (
              <button
                key={id}
                onClick={() => testAdapter(id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase border transition-all cursor-pointer ${
                  selectedAdapterId === id 
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Adapter Details Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">PROVIDER:</span>
            <span className="text-white font-bold">{currentAdapter.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">CATEGORY:</span>
            <span className="text-cyan-400 uppercase">{currentAdapter.category}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">PROVENANCE:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[#D4AF37] font-semibold">
              {currentAdapter.sourceType}
            </span>
          </div>
        </div>

        {/* Console Payload Inspection */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
            <span>TARGET: {currentAdapter.name} ({currentAdapter.sourceType})</span>
            <span>STATUS: {isLoading ? 'QUERYING TELEMETRY...' : '200 OK'}</span>
          </div>

          <pre className="text-cyan-300 text-[11px] overflow-x-auto p-2 bg-slate-950/60 rounded-lg max-h-72 custom-scrollbar">
            {JSON.stringify(liveResponse || {
              success: true,
              providerId: currentAdapter.id,
              sourceType: currentAdapter.sourceType,
              timestamp: new Date().toISOString(),
              latencyMs: 110,
              capabilities: currentAdapter.capabilities,
              note: 'Click any provider button above to trigger live adapter execution with authentic provenance envelope.',
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
