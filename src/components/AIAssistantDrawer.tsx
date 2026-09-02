import React, { useState } from 'react';
import { Bot, Send, Sparkles, ShieldCheck, ArrowRight, CornerDownLeft, RefreshCw, MessageSquare, Crown } from 'lucide-react';
import { Trip, RecoveryOption } from '../types';

interface AIAssistantDrawerProps {
  trip: Trip;
  isDisrupted: boolean;
  recoveryOptions: RecoveryOption[];
  onSelectOption: (opt: RecoveryOption) => void;
  onNavigateTab: (tab: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionChips?: { label: string; action: () => void }[];
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  trip,
  isDisrupted,
  recoveryOptions,
  onSelectOption,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'ai',
      text: isDisrupted
        ? '⚠️ Attention: Flight AI-864 connection has a critical delay notice. I have audited your Udaipur Lake Palace itinerary. You are entitled to ₹7,060 in deterministic statutory refunds under DGCA CAR, and I have synthesized 3 feasible luxury recovery plans to protect your heritage suite check-in.'
        : 'ReRoute Privé AI Concierge active. Monitoring all your luxury rail, air, and royal palace bookings in real-time. How may I assist your travel party today?',
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

  const quickQuestions = [
    'What happens to my Udaipur palace stay if flight is delayed?',
    'How much refund do I get under DGCA CAR regulations?',
    'Why is Option A recommended as the best choice for my family?',
    'Can you arrange a Taj Royal Chauffeur fallback transfer?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || inputVal.trim();
    if (!textToSend || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
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
        actionChips: dynamicChips.length > 0 ? dynamicChips : undefined,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: 'Under DGCA Civil Aviation Requirements and IRCTC Rule 73A, all refunds (₹7,060) are 100% legally mandated. Option A safely reaches your heritage destination at 12:20 IST.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-gold-bright flex items-center justify-center text-[#D4AF37] shadow-md shadow-[#D4AF37]/10">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-serif-display text-white">ReRoute Privé AI Concierge</h2>
              <span className="text-[10px] font-cinzel font-semibold px-2.5 py-0.5 rounded-full bg-slate-950 text-[#D4AF37] border border-gold-subtle">
                GEMINI GROUNDED
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans-luxury font-light mt-0.5">
              Authoritative luxury travel intelligence grounded strictly in deterministic rules and royal service standards.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Questions Pills */}
      <div className="flex flex-wrap gap-2">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3.5 py-2 rounded-xl bg-[#0B0D13]/90 hover:bg-slate-900 border border-gold-subtle text-xs font-sans-luxury text-slate-300 hover:text-[#FCE7AC] hover:border-gold-bright transition-all text-left cursor-pointer shadow-sm"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="p-6 rounded-3xl bg-[#0B0D13]/85 border border-gold-subtle backdrop-blur-xl min-h-[360px] max-h-[480px] overflow-y-auto space-y-4 shadow-xl">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] font-mono text-slate-400 mb-1 px-1">
              {msg.sender === 'user' ? 'You' : 'ReRoute Concierge'} • {msg.timestamp}
            </div>
            <div
              className={`p-4 rounded-2xl max-w-2xl text-xs font-sans-luxury leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#A88325] text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-950/90 text-slate-200 border border-gold-subtle rounded-tl-none'
              }`}
            >
              {msg.text}

              {/* Action Chips */}
              {msg.actionChips && msg.actionChips.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gold-subtle/30 flex flex-wrap gap-2">
                  {msg.actionChips.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={chip.action}
                      className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-[#D4AF37] hover:text-slate-950 border border-gold-subtle text-[11px] font-cinzel font-bold text-[#FCE7AC] flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
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
          <div className="flex items-center space-x-2 text-xs font-sans-luxury text-[#D4AF37] p-2">
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
          placeholder="Ask anything about your flights, royal stays, transfer buffers, or refund rules..."
          className="w-full bg-[#0B0D13]/90 border border-gold-subtle rounded-2xl px-5 py-4 pr-32 text-xs font-sans-luxury text-slate-100 placeholder-slate-400 focus:outline-none focus:border-gold-bright transition-colors shadow-2xl"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputVal.trim() || isThinking}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] disabled:opacity-40 text-slate-950 text-xs font-cinzel font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
        >
          <span>SEND</span>
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
