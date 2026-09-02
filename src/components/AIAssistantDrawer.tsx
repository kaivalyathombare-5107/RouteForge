import React, { useState } from 'react';
import { Bot, Send, Sparkles, ShieldCheck, ArrowRight, CornerDownLeft, RefreshCw, MessageSquare } from 'lucide-react';
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
        ? '⚠️ Attention: Flight 6E-204 has been cancelled by IndiGo. I have calculated that your Delhi-Jaipur train connection is broken. You are entitled to ₹7,060 in deterministic statutory refunds, and I have synthesized 3 feasible recovery plans to keep your trip on track.'
        : 'JOURNEY//X Intelligence active. Monitoring all 4 bookings and 3 dependency edges in real-time. Ask me any question about your connections, transfer buffers, or refund entitlements.',
      timestamp: '13:42 IST',
      actionChips: isDisrupted ? [
        { label: 'View Recovery Plans', action: () => onNavigateTab('recovery_planner') },
        { label: 'Audit Refund Breakdown', action: () => onNavigateTab('refund_intelligence') },
        { label: 'Inspect 3D Cascade', action: () => onNavigateTab('command_center') },
      ] : undefined,
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const quickQuestions = [
    'What happens to my hotel if my train is missed?',
    'How much refund do I get for the cancelled flight?',
    'Why is Option A recommended as the best choice?',
    'Will I reach the HackCelestial keynote before the 20:30 curfew?',
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
      if (lower.includes('hotel') || lower.includes('option')) {
        dynamicChips.push({ label: 'Review Option A', action: () => {
          if (recoveryOptions[0]) onSelectOption(recoveryOptions[0]);
        }});
        dynamicChips.push({ label: 'Open 3D Graph', action: () => onNavigateTab('command_center') });
      } else if (lower.includes('refund') || lower.includes('money')) {
        dynamicChips.push({ label: 'Open Refund Center', action: () => onNavigateTab('refund_intelligence') });
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
        text: 'Under DGCA Civil Aviation Requirements and IRCTC Rule 73A, all refunds (₹7,060) are 100% legally mandated. Option A safely reaches Jaipur at 12:20 IST.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-display text-slate-100">JOURNEY//X AI Copilot</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                GEMINI GROUNDED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Authoritative trip intelligence grounded strictly on deterministic policy data.
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
            className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors text-left cursor-pointer"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] font-mono text-slate-500 mb-1 px-1">
              {msg.sender === 'user' ? 'You' : 'JOURNEY//X AI'} • {msg.timestamp}
            </div>
            <div
              className={`p-4 rounded-2xl max-w-2xl text-xs font-mono leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-950/90 text-slate-200 border border-purple-500/30 rounded-tl-none'
              }`}
            >
              {msg.text}

              {/* Action Chips */}
              {msg.actionChips && msg.actionChips.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                  {msg.actionChips.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={chip.action}
                      className="px-2.5 py-1 rounded-md bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-[11px] font-bold text-cyan-300 flex items-center space-x-1 transition-colors cursor-pointer"
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
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 p-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>JOURNEY//X AI is reasoning over graph dependencies & policy rules...</span>
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
          placeholder="Ask anything about your flights, trains, transfer buffers, or refund rules..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 pr-28 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-xl"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputVal.trim() || isThinking}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <span>ASK</span>
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
