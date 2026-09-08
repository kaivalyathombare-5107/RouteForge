import React, { useState } from 'react';
import { Bot, Compass, Send, Sparkles, ShieldCheck, ArrowRight, CornerDownLeft, RefreshCw, MessageSquare, Crown, Languages, Mic, X } from 'lucide-react';
import { Trip, RecoveryOption } from '../types';

interface AIAssistantDrawerProps {
  trip: Trip;
  isDisrupted: boolean;
  recoveryOptions: RecoveryOption[];
  onSelectOption: (opt: RecoveryOption) => void;
  onNavigateTab: (tab: any) => void;
  isFloating?: boolean;
  onCloseFloating?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  engineSource?: string;
  originalSpoken?: string;
  sourceLang?: string;
  actionChips?: { label: string; action: () => void }[];
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  trip,
  isDisrupted,
  recoveryOptions,
  onSelectOption,
  onNavigateTab,
  isFloating = false,
  onCloseFloating,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'ai',
      text: isDisrupted
        ? '⚠️ Attention: Flight connection has a critical delay notice. Our chief travel desk has audited your Udaipur Lake Palace itinerary. You are entitled to ₹7,060 in statutory refunds under DGCA CAR, and we have hand-crafted 3 luxury recovery plans to protect your heritage suite check-in.'
        : 'Welcome to ReRoute Privé Personal Travel Desk. We are actively monitoring your luxury rail, air, and royal palace reservations. How may we assist your journey today?',
      timestamp: '13:42 IST',
      actionChips: isDisrupted ? [
        { label: 'Review Recovery Plans', action: () => onNavigateTab('recovery_planner') },
        { label: 'Audit Mandated Refunds', action: () => onNavigateTab('refund_intelligence') },
        { label: 'Inspect 3D Living Graph', action: () => onNavigateTab('command_center') },
      ] : undefined,
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const [isOpen, setIsOpen] = useState(!isFloating);

  if (isFloating && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-[60] flex w-[72px] h-[38px] sm:w-[76px] sm:h-[40px] items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#0B0D13] text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.35)] transition-all hover:scale-105 hover:bg-[#D4AF37] hover:text-slate-950 hover:shadow-[0_0_40px_rgba(212,175,55,0.55)] cursor-pointer animate-concierge-entrance"
        title="Open ReRoute Privé Personal Travel Concierge"
        aria-label="Open ReRoute Privé Personal Travel Concierge"
      >
        <Bot className="h-6 w-6 sm:h-[26px] sm:w-[26px] text-[#D4AF37]" strokeWidth={2.2} />
        {/* Ivory / cream circular indicator dot nestled at top right of pill as in reference */}
        <span className="absolute -top-1 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-60"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-[#FCE7AC] border border-[#0B0D13]"></span>
        </span>
      </button>
    );
  }

  const handleSend = async (questionText?: string, voiceMeta?: { originalSpoken?: string; sourceLang?: string }) => {
    const textToSend = questionText || inputVal.trim();
    if (!textToSend || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      originalSpoken: voiceMeta?.originalSpoken,
      sourceLang: voiceMeta?.sourceLang,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputVal('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          tripContext: trip,
        }),
      });
      const data = await res.json();

      let dynamicChips: { label: string; action: () => void }[] = [];
      const lower = textToSend.toLowerCase();
      if (lower.includes('hotel') || lower.includes('option') || lower.includes('plan')) {
        dynamicChips.push({ label: 'Select Best Plan', action: () => {
          if (recoveryOptions[0]) onSelectOption(recoveryOptions[0]);
        }});
        dynamicChips.push({ label: 'Open 3D Graph', action: () => onNavigateTab('command_center') });
      } else if (lower.includes('refund') || lower.includes('money') || lower.includes('tdr')) {
        dynamicChips.push({ label: 'Audit Refunds', action: () => onNavigateTab('refund_intelligence') });
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || "I have analyzed your request based on the canonical trip graph.",
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        engineSource: data.source,
        actionChips: dynamicChips.length > 0 ? dynamicChips : undefined,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: 'Under DGCA Civil Aviation Requirements and IRCTC Rule 73A, all refunds (₹7,060) are 100% legally mandated. Option A safely reaches your heritage destination at 12:20 IST.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        engineSource: 'CANONICAL_FALLBACK',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div
      id="concierge-terminal-drawer"
      className={isFloating
        ? 'fixed bottom-4 right-4 z-[60] flex max-h-[calc(100vh-2rem)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-y-auto rounded-3xl border border-gold-subtle bg-[#08090C]/95 p-3 shadow-[0_0_45px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-4'
        : 'w-full space-y-6'}
    >
      {/* Header */}
      <div className={`${isFloating ? 'p-3' : 'p-6'} relative rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl`}>
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-gold-bright flex items-center justify-center text-[#D4AF37] shadow-md shadow-[#D4AF37]/10">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-serif-display text-white">ReRoute Privé Personal Concierge</h2>
            </div>
            <p className="text-xs text-slate-300 font-sans-luxury font-light mt-0.5">
              Authoritative luxury travel stewardship grounded in local master concierges and royal hospitality standards.
            </p>
          </div>
        </div>
        {isFloating && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onCloseFloating?.();
            }}
            className="absolute right-6 top-6 rounded-full border border-slate-700 p-1.5 text-slate-400 transition-colors hover:border-gold-bright hover:text-[#FCE7AC]"
            title="Minimize Travel Concierge"
            aria-label="Minimize Travel Concierge"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Chat Messages Log */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0D13]/85 border border-gold-subtle backdrop-blur-xl min-h-[380px] max-h-[540px] overflow-y-auto space-y-5 shadow-xl">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] font-mono text-slate-400 mb-1 px-1 flex items-center space-x-2">
              <span>{msg.sender === 'user' ? 'You' : 'ReRoute Privé Concierge'} • {msg.timestamp}</span>
              {msg.engineSource && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                  msg.engineSource.includes('GROQ')
                    ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                    : msg.engineSource.includes('GEMINI')
                    ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#FCE7AC]'
                    : 'border-slate-800 bg-slate-900/90 text-slate-400'
                }`}>
                  {msg.engineSource.includes('GROQ')
                    ? '⚡ Groq Llama-3.3 Fallback'
                    : msg.engineSource.includes('GEMINI')
                    ? '✨ Gemini 3.1 Flash'
                    : '🛡️ Canonical Logic'}
                </span>
              )}
            </div>
            <div
              className={`p-5 rounded-2xl max-w-3xl lg:max-w-4xl text-xs sm:text-sm font-sans-luxury leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#A88325] text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-950/90 text-slate-200 border border-gold-subtle rounded-tl-none'
              }`}
            >
              {msg.text}

              {/* Voice Translation Annotation if user spoke in another language */}
              {msg.originalSpoken && (
                <div className="mt-2.5 pt-2 border-t border-slate-950/20 text-[11px] font-mono text-slate-900 flex items-center space-x-1.5 opacity-90">
                  <Mic className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Transcribed from voice: "{msg.originalSpoken}"</span>
                </div>
              )}

              {/* Action Chips */}
              {msg.actionChips && msg.actionChips.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gold-subtle/30 flex flex-wrap gap-2.5">
                  {msg.actionChips.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={chip.action}
                      className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-[#D4AF37] hover:text-slate-950 border border-gold-subtle text-xs font-cinzel font-bold text-[#FCE7AC] flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <span>{chip.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-sans-luxury text-[#D4AF37] p-3">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>ReRoute Concierge is evaluating real-time itinerary parameters and statutory policies...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="relative">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask your Personal Travel Concierge about connections, palace holds, refunds..."
          className="w-full bg-[#0B0D13]/90 border border-gold-subtle rounded-2xl px-6 py-4 sm:py-5 pr-48 text-xs sm:text-sm font-sans-luxury text-slate-100 placeholder-slate-400 focus:outline-none focus:border-gold-bright transition-colors shadow-2xl"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          <button
            id="chat-mic-translator-btn"
            type="button"
            onClick={() => onNavigateTab('translator')}
            className="p-2.5 sm:px-3 rounded-xl border text-xs font-sans-luxury flex items-center space-x-1.5 transition-all cursor-pointer shadow-md bg-slate-900/90 text-[#FCE7AC] border-gold-subtle/60 hover:bg-[#D4AF37]/20 hover:border-gold-bright"
            title="Open Live Voice & Speech Translator"
          >
            <Languages className="w-3.5 h-3.5 text-[#D4AF37]" />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isThinking}
            className="px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] disabled:opacity-40 text-slate-950 text-xs font-cinzel font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
          >
            <span>SEND</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
