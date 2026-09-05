import React, { useState } from 'react';
import {
  Languages,
  Radio,
  Sparkles,
  ShieldAlert,
  Bot,
  Volume2,
  Copy,
  Check,
  Plane,
  Building,
  Car,
  HeartPulse,
  ArrowRight,
  Headphones
} from 'lucide-react';
import { LiveVoiceTranslator, SUPPORTED_LANGUAGES } from './LiveVoiceTranslator';

interface LiveTranslatorSectionProps {
  onNavigateSection?: (section: 'destinations' | 'journeys' | 'emergency' | 'concierge' | 'translator') => void;
}

export const LiveTranslatorSection: React.FC<LiveTranslatorSectionProps> = ({
  onNavigateSection,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'transit' | 'stays' | 'chauffeur' | 'emergency'>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const phraseCategories = [
    { id: 'all', label: 'All Curated Dialogues' },
    { id: 'transit', label: 'Air & Rail Transit', icon: Plane },
    { id: 'stays', label: 'Palaces & Stays', icon: Building },
    { id: 'chauffeur', label: 'Chauffeur & Transfer', icon: Car },
    { id: 'emergency', label: 'Emergency & Aid', icon: HeartPulse },
  ];

  const travelPhrases = [
    {
      category: 'transit',
      sourceLang: 'Hindi',
      english: 'My flight has been cancelled, what is the next fastest luxury connection?',
      hindi: 'मेरी उड़ान रद्द कर दी गई है, अगला सबसे तेज़ लक्जरी विकल्प क्या है?',
      phonetic: 'Meri udaan radd kar di gayi hai, agla sabse tez luxury vikalp kya hai?',
      tag: 'DGCA Disruption',
    },
    {
      category: 'transit',
      sourceLang: 'French',
      english: 'Where can I find the priority baggage belt for first class travelers?',
      hindi: 'प्रथम श्रेणी के यात्रियों के लिए प्राथमिकता बैगेज बेल्ट कहाँ है?',
      phonetic: 'Où se trouve le tapis à bagages prioritaire pour la première classe ?',
      tag: 'Airport Priority',
    },
    {
      category: 'stays',
      sourceLang: 'Hindi',
      english: 'Please notify the Udaipur Lake Palace butler that we will arrive late tonight.',
      hindi: 'कृपया उदयपुर लेक पैलेस के बटलर को सूचित करें कि हम आज रात देर से पहुंचेंगे।',
      phonetic: 'Kripya Udaipur Lake Palace ke butler ko soochit karein ki hum aaj raat der se pahunchenge.',
      tag: 'Heritage Hospitality',
    },
    {
      category: 'stays',
      sourceLang: 'Spanish',
      english: 'Could you arrange an authentic royal dining experience in the private courtyard?',
      hindi: 'क्या आप निजी आंगन में एक प्रामाणिक शाही भोजन की व्यवस्था कर सकते हैं?',
      phonetic: '¿Podría organizar una auténtica experiencia gastronómica real en el patio privado?',
      tag: 'Dining Concierge',
    },
    {
      category: 'chauffeur',
      sourceLang: 'Hindi',
      english: 'The royal chauffeur sedan is waiting at VIP Gate 2 with flight placard.',
      hindi: 'शाही ड्राइवर सेडान वीआईपी गेट 2 पर फ्लाइट नेमकार्ड के साथ प्रतीक्षा कर रही है।',
      phonetic: 'Shahi driver sedan VIP Gate 2 par flight placard ke saath pratiksha kar rahi hai.',
      tag: 'Chauffeur Protocol',
    },
    {
      category: 'emergency',
      sourceLang: 'Hindi',
      english: 'I need immediate medical doctor assistance at the heritage suite.',
      hindi: 'मुझे हेरिटेज सुइट में तत्काल चिकित्सा डॉक्टर सहायता की आवश्यकता है।',
      phonetic: 'Mujhe heritage suite mein tatkal chikitsa doctor sahayata ki aavashyakta hai.',
      tag: 'Urgent Medical',
    },
  ];

  const filteredPhrases = travelPhrases.filter(
    (p) => activeTab === 'all' || p.category === activeTab
  );

  const handleCopyPhrase = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeakPhrase = (text: string, langCode: string = 'hi-IN') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gold-subtle/60 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-cinzel font-bold tracking-[0.25em] text-[#D4AF37] uppercase flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
              <span>Real-Time Multilingual Voice Engine</span>
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#FCE7AC] border border-[#D4AF37]/30">
              10 Global Dialects
            </span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-white mt-1.5">
            Global Travel Speech & Concierge Translator
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-sans-luxury max-w-3xl mt-1 leading-relaxed">
            Bidirectional real-time microphone speech recognition, neural translation across 10 international languages, native phonetic transliteration, and high-fidelity text-to-speech voice playback.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigateSection?.('concierge')}
            className="flex items-center space-x-2 px-4 py-2 rounded-full border border-gold-subtle bg-slate-950/80 hover:bg-[#D4AF37]/10 text-xs font-cinzel text-[#FCE7AC] transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Disruption Shield Concierge</span>
          </button>
          <button
            onClick={() => onNavigateSection?.('emergency')}
            className="flex items-center space-x-2 px-4 py-2 rounded-full border border-red-500/40 bg-red-950/20 hover:bg-red-950/40 text-xs font-cinzel text-red-300 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Emergency Hotlines</span>
          </button>
        </div>
      </div>

      {/* PRIMARY TRANSLATOR CONTAINER */}
      <div className="relative">
        <LiveVoiceTranslator
          isStandalone={true}
          isOpen={true}
          onSendDirectly={(translated) => {
            onNavigateSection?.('concierge');
          }}
        />
      </div>

      {/* SUPPORTED LANGUAGES MARQUEE PILLS */}
      <div className="p-4 rounded-2xl bg-[#090B10]/80 border border-gold-subtle/40 backdrop-blur-md">
        <div className="flex items-center space-x-2 mb-3">
          <Languages className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-cinzel font-semibold tracking-wider text-[#FCE7AC] uppercase">
            Active Neural Dialect Matrix (Full Voice Recognition & Synthesis)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-gold-subtle/30 text-xs font-sans-luxury text-slate-300"
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="font-medium text-white">{lang.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({lang.nativeName})</span>
            </div>
          ))}
        </div>
      </div>

      {/* ESSENTIAL LUXURY TRAVEL DIALOGUE PRESETS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-serif-display text-xl text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Essential Luxury Travel Dialogue Guides</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans-luxury">
              Verified high-priority dialogues with phonetic pronunciation guides and instant audio playback.
            </p>
          </div>

          {/* Categories Tab Pill Selector */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-950 border border-gold-subtle/40">
            {phraseCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-cinzel transition-all cursor-pointer ${
                  activeTab === cat.id
                    ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phrases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPhrases.map((phrase, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-[#090B10] border border-gold-subtle/50 hover:border-[#D4AF37]/70 transition-all space-y-3 shadow-lg group relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950 text-[#D4AF37] border border-gold-subtle">
                  {phrase.tag}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSpeakPhrase(phrase.hindi, 'hi-IN')}
                    title="Speak in Hindi"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#D4AF37] hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopyPhrase(`${phrase.english}\n${phrase.hindi}`, idx)}
                    title="Copy Phrase"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#D4AF37] hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">English</span>
                <p className="text-xs sm:text-sm text-slate-200 font-sans-luxury font-medium mt-0.5">
                  "{phrase.english}"
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-gold-subtle/30 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-wider">Hindi Translation & Phonetics</span>
                <p className="text-xs sm:text-sm text-[#FCE7AC] font-sans-luxury font-semibold">
                  "{phrase.hindi}"
                </p>
                <p className="text-[11px] text-slate-400 font-mono italic">
                  Guide: {phrase.phonetic}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
