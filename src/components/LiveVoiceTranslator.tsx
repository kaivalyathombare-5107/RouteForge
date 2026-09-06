import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Sparkles,
  Send,
  ArrowRight,
  ArrowLeftRight,
  Copy,
  Check,
  RefreshCw,
  Radio,
  AudioWaveform as WaveformIcon,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Laptop,
  ExternalLink,
  Info,
  Zap
} from 'lucide-react';

export interface LanguageOption {
  code: string;
  speechCode: string;
  name: string;
  flag: string;
  nativeName: string;
}

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'requesting' | 'unsupported';
export type DeviceCategory = 'ios' | 'android' | 'desktop';

export interface DeviceInfo {
  category: DeviceCategory;
  label: string;
  browser: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', speechCode: 'hi-IN', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
  { code: 'en', speechCode: 'en-US', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'fr', speechCode: 'fr-FR', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', speechCode: 'es-ES', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'de', speechCode: 'de-DE', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'ja', speechCode: 'ja-JP', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'it', speechCode: 'it-IT', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ar', speechCode: 'ar-SA', name: 'Arabic', flag: '🇦🇪', nativeName: 'العربية' },
  { code: 'ta', speechCode: 'ta-IN', name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
  { code: 'ru', speechCode: 'ru-RU', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
];

export const PRESET_VOICE_PROMPTS = [
  {
    label: 'Hindi: Train Delay & TDR',
    lang: 'hi',
    text: 'मेरी ट्रेन 12952 लेट हो गई है, क्या मुझे पूरा रिफंड मिलेगा?',
    desc: 'Asks about missed train connection and IRCTC Rule 73A refund'
  },
  {
    label: 'Hindi: Flight Cancelled',
    lang: 'hi',
    text: 'मेरी इंडिगो फ्लाइट रद्द हो गई है, उदयपुर पहुंचने के लिए नया विकल्प क्या है?',
    desc: 'Inquires about IndiGo 6E-204 cancellation and recovery flight'
  },
  {
    label: 'French: Chauffeur Transfer',
    lang: 'fr',
    text: 'Où se trouve mon chauffeur pour le transfert au palais d’Udaipur?',
    desc: 'Asks about royal chauffeur airport pickup'
  },
  {
    label: 'Spanish: Hotel Check-in',
    lang: 'es',
    text: 'Por favor notifique al hotel ITC Rajputana que llegaré tarde.',
    desc: 'Requests late check-in hold at heritage hotel'
  },
  {
    label: 'Japanese: Baggage & Refund',
    lang: 'ja',
    text: 'フライトキャンセルの払い戻しと手荷物の振替について教えてください。',
    desc: 'Asks about flight cancellation refund and baggage transfer'
  }
];

interface LiveVoiceTranslatorProps {
  onInsertToInput?: (text: string) => void;
  onSendDirectly?: (text: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  isStandalone?: boolean;
}

export const LiveVoiceTranslator: React.FC<LiveVoiceTranslatorProps> = ({
  onInsertToInput,
  onSendDirectly,
  isOpen = true,
  onToggle,
  isStandalone = false,
}) => {
  const [sourceLang, setSourceLang] = useState<string>('hi');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimSpokenText, setInterimSpokenText] = useState<string>('');
  const [finalSpokenText, setFinalSpokenText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [phoneticGuide, setPhoneticGuide] = useState<string>('');
  const [engineSource, setEngineSource] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Cross-device microphone permission & environment state
  const [micPermission, setMicPermission] = useState<MicPermissionState>('prompt');
  const [deviceDetails, setDeviceDetails] = useState<DeviceInfo>({
    category: 'desktop',
    label: 'Desktop Computer',
    browser: 'Browser',
  });
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  // Detect device category & initial permission state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsInIframe(window.self !== window.top);

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    let browser = 'Browser';
    if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
    else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';

    if (isIOS) {
      setDeviceDetails({ category: 'ios', label: 'Apple iOS (iPhone / iPad)', browser });
    } else if (isAndroid) {
      setDeviceDetails({ category: 'android', label: 'Android Mobile / Tablet', browser });
    } else {
      setDeviceDetails({ category: 'desktop', label: 'Desktop Computer', browser });
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermission('unsupported');
      return;
    }

    // Attempt permission query if supported by this browser
    if (navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions.query({ name: 'microphone' as PermissionName })
          .then((status) => {
            setMicPermission(status.state as MicPermissionState);
            status.onchange = () => {
              setMicPermission(status.state as MicPermissionState);
            };
          })
          .catch(() => {
            // Safari / WebKit does not support { name: 'microphone' } query
            // Remains 'prompt' so user is prompted on first interaction
          });
      } catch {
        // Fallback for browsers that don't support mic permission query
      }
    }
  }, []);

  // Load and cache browser TTS voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // References for Speech Recognition and Audio Stream
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const finalSpokenTextRef = useRef<string>('');

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    finalSpokenTextRef.current = finalSpokenText;
  }, [finalSpokenText]);

  // Check Web Speech Recognition support
  const isSpeechSupported = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const activeSourceObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const activeTargetObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[1];

  // Translation function calling server-side /api/translate
  const performTranslation = async (textToTranslate: string, src: string, tgt: string) => {
    if (!textToTranslate.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLanguage: src,
          targetLanguage: tgt,
        }),
      });
      const data = await res.json();
      if (data && data.translatedText) {
        setTranslatedText(data.translatedText);
        if (data.source) setEngineSource(data.source);
        if (data.detectedSource) setDetectedLanguage(data.detectedSource);
        if (data.phoneticOrNotes) setPhoneticGuide(data.phoneticOrNotes);
      }
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Debounced translation when spoken text changes
  const triggerDebouncedTranslation = (text: string, src: string, tgt: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      performTranslation(text, src, tgt);
    }, 450);
  };

  // Audio Visualizer setup via Web Audio API
  const startAudioVisualizer = async (existingStream?: MediaStream) => {
    try {
      let stream = existingStream || mediaStreamRef.current;
      if (!stream) {
        if (!navigator.mediaDevices?.getUserMedia) return;
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const drawWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(avg);

        // Draw onto canvas if mounted
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / dataArray.length) * 1.5;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
              const barHeight = (dataArray[i] / 255) * canvas.height;
              const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
              gradient.addColorStop(0, '#A88325');
              gradient.addColorStop(1, '#FCE7AC');

              ctx.fillStyle = gradient;
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
              x += barWidth;
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      };

      drawWaveform();
    } catch (err: any) {
      console.warn('Microphone audio visualizer stream notice:', err?.message);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Explicitly prompt the user on any device for microphone permission
  const requestMicrophoneAccess = async (autoStartListening = false): Promise<MediaStream | null> => {
    setSpeechError(null);
    setMicPermission('requesting');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission('unsupported');
      setSpeechError('Microphone hardware access is not supported by this browser environment. You can type directly.');
      return null;
    }

    try {
      // Calling getUserMedia inside user interaction triggers browser permission modal across iOS, Android, and Desktop
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      mediaStreamRef.current = stream;

      if (autoStartListening) {
        executeSpeechRecognition(stream);
      } else {
        // Stop the temporary stream if this was just a permission check
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      return stream;
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError' ||
        err.message?.toLowerCase().includes('denied') ||
        err.message?.toLowerCase().includes('dismissed')
      ) {
        setMicPermission('denied');
        setSpeechError('Microphone permission was denied. Please allow microphone access in your browser or device settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicPermission('unsupported');
        setSpeechError('No microphone hardware detected on this device. You can type directly or select preset phrases.');
      } else {
        setSpeechError(`Microphone error: ${err.message || 'Permission needed'}`);
      }
      return null;
    }
  };

  // Run Speech Recognition with acquired audio permission
  const executeSpeechRecognition = (existingStream?: MediaStream) => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechError('Web Speech Recognition is not supported in this browser. You can type directly or use travel presets.');
      if (existingStream) {
        startAudioVisualizer(existingStream);
        setIsListening(true);
      }
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeSourceObj.speechCode;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        startAudioVisualizer(existingStream);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = finalSpokenTextRef.current;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += (final ? ' ' : '') + event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setInterimSpokenText(interim);
        if (final !== finalSpokenTextRef.current) {
          finalSpokenTextRef.current = final;
          setFinalSpokenText(final);
          triggerDebouncedTranslation(final, sourceLang, targetLang);
        } else if (interim) {
          triggerDebouncedTranslation(interim, sourceLang, targetLang);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermission('denied');
          setSpeechError('Microphone access was denied. Please allow microphone permissions in your browser or device settings.');
          stopListening();
        } else if (event.error === 'no-speech') {
          // Keep listening or ignore
        } else {
          setSpeechError(`Speech recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
            stopAudioVisualizer();
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
          stopAudioVisualizer();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError(`Failed to initialize microphone: ${err?.message}`);
      setIsListening(false);
      isListeningRef.current = false;
      stopAudioVisualizer();
    }
  };

  // Toggle Speech Recognition (verifies permission first on any device)
  const startListening = async () => {
    setSpeechError(null);

    // If permission is not granted, actively request permission first
    if (micPermission !== 'granted') {
      await requestMicrophoneAccess(true);
    } else {
      executeSpeechRecognition();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    stopAudioVisualizer();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Swap Languages
  const handleSwapLanguages = () => {
    const prevSrc = sourceLang;
    const prevTgt = targetLang;
    setSourceLang(prevTgt);
    setTargetLang(prevSrc);

    // Swap text values
    const prevFinal = finalSpokenText;
    const prevTrans = translatedText;
    setFinalSpokenText(prevTrans);
    setTranslatedText(prevFinal);
    setInterimSpokenText('');

    if (prevTrans && prevTrans.trim()) {
      performTranslation(prevTrans, prevTgt, prevSrc);
    }

    if (isListening) {
      stopListening();
    }
  };

  // Copy translated text
  const handleCopy = () => {
    const textToCopy = translatedText || finalSpokenText;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Text-To-Speech strictly in chosen target language
  const handleSpeakTranslation = () => {
    // Only speak the translated text in the chosen target language
    const textToSpeak = translatedText?.trim();
    if (!textToSpeak || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel any previous queue
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

    const targetCode = activeTargetObj.speechCode.toLowerCase().replace('_', '-');
    const targetPrefix = targetLang.toLowerCase().slice(0, 2);

    // Strict voice matching priority for the chosen target language
    let matchedVoice = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-') === targetCode);
    if (!matchedVoice) {
      matchedVoice = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(targetPrefix + '-'));
    }
    if (!matchedVoice) {
      matchedVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith(targetPrefix));
    }
    if (!matchedVoice) {
      matchedVoice = voices.find(v => (v.name || '').toLowerCase().includes(activeTargetObj.name.toLowerCase()));
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = activeTargetObj.speechCode;
    }

    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('[TTS] Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Use a preset voice phrase
  const handleSelectPreset = (preset: typeof PRESET_VOICE_PROMPTS[0]) => {
    setSourceLang(preset.lang);
    setFinalSpokenText(preset.text);
    setInterimSpokenText('');
    performTranslation(preset.text, preset.lang, targetLang);
  };

  // Clear all
  const handleClear = () => {
    setFinalSpokenText('');
    setInterimSpokenText('');
    setTranslatedText('');
    setPhoneticGuide('');
    setEngineSource('');
    setDetectedLanguage('');
    setSpeechError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div id="live-mic-translator-container" className="w-full rounded-2xl bg-[#090B10] border border-gold-bright/40 shadow-2xl p-4 sm:p-5 space-y-4 transition-all overflow-hidden relative">
      {/* Background Subtle Shimmer */}
      <div className="absolute top-0 right-0 w-72 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gold-subtle/30 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-gold-bright/60 flex items-center justify-center text-[#D4AF37] shadow-md shadow-[#D4AF37]/15">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm sm:text-base font-bold font-serif-display text-white tracking-wide">
                Live Travel Speech Translator
              </h4>
              <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-gold-subtle text-[#FCE7AC]">
                <Radio className={`w-2.5 h-2.5 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>{isListening ? 'MIC ACTIVE' : 'LIVE TRANSLATE'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans-luxury">
              Speak in any language via microphone to translate in real-time and query ReRoute Privé Concierge.
            </p>
          </div>
        </div>

        {/* Toggle Button / Collapse */}
        {!isStandalone && onToggle && (
          <button
            onClick={onToggle}
            className="text-slate-400 hover:text-[#FCE7AC] p-1.5 rounded-lg hover:bg-slate-900 text-xs font-sans-luxury flex items-center space-x-1 cursor-pointer transition-colors"
            title="Toggle translator view"
          >
            <span>{isOpen ? 'Minimize' : 'Expand'}</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="space-y-4 pt-1">
          {/* Language Selector Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-gold-subtle/40">
            {/* Source Language */}
            <div className="flex items-center space-x-2 flex-1 min-w-[140px]">
              <span className="text-[10px] uppercase font-mono text-slate-400">Speak in:</span>
              <select
                id="source-language-select"
                value={sourceLang}
                onChange={(e) => {
                  setSourceLang(e.target.value);
                  if (finalSpokenText) performTranslation(finalSpokenText, e.target.value, targetLang);
                }}
                className="bg-[#0B0D13] text-xs font-sans-luxury text-[#FCE7AC] border border-gold-subtle/50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gold-bright transition-colors cursor-pointer w-full"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              id="swap-languages-btn"
              onClick={handleSwapLanguages}
              className="p-2 rounded-lg bg-slate-900 hover:bg-[#D4AF37] hover:text-slate-950 text-[#D4AF37] border border-gold-subtle/50 transition-all cursor-pointer shadow-sm flex items-center justify-center"
              title="Swap Languages"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Target Language */}
            <div className="flex items-center space-x-2 flex-1 min-w-[140px]">
              <span className="text-[10px] uppercase font-mono text-slate-400">Translate to:</span>
              <select
                id="target-language-select"
                value={targetLang}
                onChange={(e) => {
                  const newTgt = e.target.value;
                  setTargetLang(newTgt);
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                  const textToTranslate = finalSpokenText || interimSpokenText;
                  if (textToTranslate) {
                    performTranslation(textToTranslate, sourceLang, newTgt);
                  }
                }}
                className="bg-[#0B0D13] text-xs font-sans-luxury text-[#FCE7AC] border border-gold-subtle/50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gold-bright transition-colors cursor-pointer w-full"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cross-Device Microphone Permission Status & Request Banner */}
          {micPermission !== 'granted' ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950/80 to-amber-950/20 border border-amber-500/40 text-slate-200 text-xs shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-0.5 shrink-0">
                    <Mic className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-cinzel font-bold text-xs text-[#FCE7AC] tracking-wider uppercase">
                        Microphone Permission Required
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-amber-500/30 text-amber-300 flex items-center space-x-1">
                        {deviceDetails.category === 'ios' ? (
                          <Smartphone className="w-3 h-3 text-amber-400" />
                        ) : deviceDetails.category === 'android' ? (
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Laptop className="w-3 h-3 text-sky-400" />
                        )}
                        <span>{deviceDetails.label}</span>
                      </span>
                      {isInIframe && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-900/90 text-slate-400 border border-slate-700">
                          Sandbox Frame
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans-luxury mt-1 leading-relaxed">
                      This website needs permission to use your device's microphone to capture, transcribe, and translate live travel speech.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id="request-mic-permission-btn"
                    onClick={() => requestMicrophoneAccess(true)}
                    disabled={micPermission === 'requesting'}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] text-slate-950 font-cinzel font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Mic className="w-3.5 h-3.5 text-slate-950" />
                    <span>{micPermission === 'requesting' ? 'Asking Browser...' : 'Allow Microphone'}</span>
                  </button>

                  {isInIframe && (
                    <button
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-gold-subtle/50 text-[#FCE7AC] text-xs transition-all cursor-pointer"
                      title="Open full page in new window for direct microphone hardware access"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Denied / Blocked Device Guidance */}
              {micPermission === 'denied' && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-red-300 font-medium">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Microphone access was denied or blocked on {deviceDetails.browser}.</span>
                  </div>
                  <div className="text-[11px] font-sans-luxury text-slate-300 pl-6 space-y-1">
                    <p className="font-semibold text-amber-200">How to enable on your device:</p>
                    {deviceDetails.category === 'ios' ? (
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                        <li>Tap the <strong className="text-white">"AA"</strong> or Website Settings icon in Safari's address bar.</li>
                        <li>Select <strong className="text-white">Website Settings</strong> &gt; <strong className="text-white">Microphone</strong> and choose <strong className="text-emerald-400">Allow</strong>.</li>
                        <li>Then click <strong className="text-[#FCE7AC]">"Ask Permission Again"</strong> below.</li>
                      </ol>
                    ) : deviceDetails.category === 'android' ? (
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                        <li>Tap the <strong className="text-white">🔒 Lock</strong> or Site Settings icon beside the address bar.</li>
                        <li>Tap <strong className="text-white">Permissions</strong> &gt; <strong className="text-white">Microphone</strong> and choose <strong className="text-emerald-400">Allow</strong>.</li>
                        <li>Then click <strong className="text-[#FCE7AC]">"Ask Permission Again"</strong> below.</li>
                      </ol>
                    ) : (
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                        <li>Click the <strong className="text-white">🔒 Lock / Media icon</strong> in your browser's address bar.</li>
                        <li>Set <strong className="text-white">Microphone</strong> permission to <strong className="text-emerald-400">Allow</strong>.</li>
                        <li>Then click <strong className="text-[#FCE7AC]">"Ask Permission Again"</strong> below.</li>
                      </ol>
                    )}
                  </div>

                  <div className="pt-2 pl-6 flex items-center space-x-3">
                    <button
                      onClick={() => requestMicrophoneAccess(true)}
                      className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-400/50 text-white text-[11px] font-cinzel font-bold transition-all cursor-pointer"
                    >
                      Ask Permission Again
                    </button>
                    {isInIframe && (
                      <button
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="text-amber-300 hover:text-white text-[11px] underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Open in Standalone Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-sans-luxury text-[11px]">
                  Microphone access granted on <strong className="text-white">{deviceDetails.label}</strong>. Voice translation is armed.
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                ● MIC GRANTED
              </span>
            </div>
          )}

          {/* Microphone Action & Waveform Display */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/90 border border-gold-subtle/60 shadow-inner">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                id="live-mic-toggle-btn"
                onClick={toggleListening}
                className={`px-5 py-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg w-full sm:w-auto ${
                  isListening
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white animate-pulse ring-2 ring-red-400'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] text-slate-950'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>STOP RECORDING</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-slate-950" />
                    <span>START SPEAKING ({activeSourceObj.flag} {activeSourceObj.name})</span>
                  </>
                )}
              </button>

              {(finalSpokenText || interimSpokenText) && (
                <button
                  onClick={handleClear}
                  className="px-3 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-sans-luxury text-slate-300 transition-colors cursor-pointer"
                  title="Clear spoken and translated text"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Audio Visualizer / Audio Meter */}
            <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
              <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                <WaveformIcon className={`w-3.5 h-3.5 ${isListening ? 'text-[#D4AF37] animate-pulse' : 'text-slate-600'}`} />
                <span>{isListening ? 'RECEIVING AUDIO' : 'MIC READY'}</span>
              </span>
              <div className="w-36 h-7 bg-[#08090C] rounded-lg border border-gold-subtle/40 overflow-hidden flex items-center px-1">
                <canvas
                  ref={canvasRef}
                  width={140}
                  height={28}
                  className="w-full h-full block"
                />
              </div>
            </div>
          </div>

          {/* Speech Error Banner if permission or unsupported */}
          {speechError && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between">
              <span>{speechError}</span>
              <button
                onClick={() => setSpeechError(null)}
                className="text-amber-400 hover:text-white text-xs underline cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Dual Transcription & Translation Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input / Spoken Speech Pane */}
            <div className="p-4 rounded-xl bg-[#0B0D13] border border-gold-subtle/40 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between border-b border-gold-subtle/20 pb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-base">{activeSourceObj.flag}</span>
                  <span className="text-xs font-semibold text-white font-serif-display">
                    Spoken or Typed Input ({activeSourceObj.name})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {isListening && (
                    <span className="text-[10px] font-mono text-emerald-400 animate-pulse flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Listening...</span>
                    </span>
                  )}
                  {finalSpokenText && (
                    <button
                      onClick={handleClear}
                      className="text-[10px] font-mono text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
                      title="Clear text"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Directly Editable Spoken/Typed Text Area */}
              <div className="relative min-h-[95px] max-h-[140px] flex flex-col">
                <textarea
                  value={finalSpokenText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFinalSpokenText(val);
                    setInterimSpokenText('');
                    triggerDebouncedTranslation(val, sourceLang, targetLang);
                  }}
                  placeholder={`Speak or type here in ${activeSourceObj.name} (e.g. where is the hotel Taj?)...`}
                  rows={3}
                  className="w-full h-full bg-transparent text-xs sm:text-sm font-sans-luxury text-slate-100 placeholder:text-slate-500 placeholder:italic resize-none focus:outline-none leading-relaxed"
                />
                {interimSpokenText && (
                  <div className="text-[11px] text-emerald-300/80 italic font-mono mt-1 animate-pulse">
                    🎙️ Listening: {interimSpokenText}
                  </div>
                )}
              </div>

              {/* Character count & status footer */}
              <div className="pt-2 border-t border-gold-subtle/20 flex items-center justify-between text-[11px] text-slate-400">
                <span>{finalSpokenText.length} characters</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isListening ? 'Voice stream active' : 'Click mic to speak or type directly'}
                </span>
              </div>
            </div>

            {/* Live Translated Output Pane */}
            <div
              id="live-translated-output-division"
              className="p-4 rounded-xl bg-gradient-to-br from-[#0E121A] via-[#0A0D14] to-[#07080C] border-2 border-[#D4AF37] ring-1 ring-[#D4AF37]/30 flex flex-col justify-between space-y-2.5 shadow-xl shadow-black/50 transition-all"
            >
              <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{activeTargetObj.flag}</span>
                  <div>
                    <span className="text-xs font-bold text-[#FCE7AC] font-serif-display tracking-wide">
                      Live Translation in {activeTargetObj.name}
                    </span>
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
                      {activeTargetObj.nativeName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isTranslating ? (
                    <span className="text-[10px] font-mono text-[#D4AF37] flex items-center space-x-1 bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                      <Sparkles className="w-3 h-3 animate-spin text-[#D4AF37]" />
                      <span>Translating...</span>
                    </span>
                  ) : engineSource ? (
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                      engineSource.includes('GEMINI')
                        ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#FCE7AC]'
                        : engineSource.includes('GROQ')
                        ? 'border-orange-500/40 bg-orange-500/10 text-orange-200'
                        : engineSource.includes('OFFLINE')
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                    }`}>
                      {engineSource.includes('GEMINI') ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                          <span>Gemini 3.1 Flash</span>
                        </>
                      ) : engineSource.includes('GROQ') ? (
                        <>
                          <Zap className="w-2.5 h-2.5 text-orange-400" />
                          <span>Groq Llama-3.3 Fallback</span>
                        </>
                      ) : engineSource.includes('OFFLINE') ? (
                        <span>📖 Travel Lexicon</span>
                      ) : (
                        <>
                          <Zap className="w-2.5 h-2.5 text-blue-400" />
                          <span>High-Speed Engine</span>
                        </>
                      )}
                    </span>
                  ) : detectedLanguage ? (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      Detected: {detectedLanguage}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Translated Text Box */}
              <div className="min-h-[95px] max-h-[140px] overflow-y-auto text-xs sm:text-sm font-sans-luxury text-[#FCE7AC] font-medium leading-relaxed bg-black/40 p-2.5 rounded-lg border border-gold-subtle/20">
                {translatedText ? (
                  <div>
                    <p className="text-white font-medium selection:bg-[#D4AF37]/40">{translatedText}</p>
                    {phoneticGuide && (
                      <p className="text-[11px] text-[#D4AF37]/80 font-mono mt-1 italic">
                        💡 {phoneticGuide}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-xs">
                    Live translation into {activeTargetObj.name} will appear here accurately as speech or text is provided.
                  </p>
                )}
              </div>

              {/* Action Buttons for Translated Text */}
              <div className="pt-2 border-t border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    id="listen-translation-btn"
                    onClick={handleSpeakTranslation}
                    disabled={!translatedText}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans-luxury flex items-center space-x-1.5 cursor-pointer transition-all border ${
                      isSpeaking
                        ? 'bg-amber-950 text-amber-200 border-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-[#D4AF37] border-[#D4AF37]/60 hover:border-[#D4AF37] hover:shadow-sm'
                    }`}
                    title={`Read aloud in ${activeTargetObj.name} only (${activeTargetObj.speechCode})`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[11px] font-bold text-amber-200">Stop ({activeTargetObj.name})</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[11px] font-semibold">Listen in {activeTargetObj.name}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopy}
                    disabled={!translatedText}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-gold-subtle/30 text-xs font-sans-luxury flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Copy translated text"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Insertion & Send buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (translatedText) onInsertToInput(translatedText);
                    }}
                    disabled={!translatedText}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-gold-subtle/40 text-[11px] font-sans-luxury flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Paste into Concierge input box"
                  >
                    <CornerDownLeft className="w-3 h-3 text-[#D4AF37]" />
                    <span>Insert in Chat</span>
                  </button>

                  <button
                    onClick={() => {
                      if (translatedText) onSendDirectly(translatedText);
                    }}
                    disabled={!translatedText}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] disabled:opacity-40 text-slate-950 text-[11px] font-cinzel font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                    title="Directly query ReRoute Privé Concierge with this translated message"
                  >
                    <span>SEND TO CONCIERGE</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Voice Simulation / Preset Travel Phrases */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-sans-luxury text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>Preset Traveler Voice Prompts (Instant test without microphone):</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_VOICE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(prompt)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-gold-subtle/40 hover:border-gold-bright text-[11px] font-sans-luxury text-slate-300 hover:text-[#FCE7AC] transition-all text-left cursor-pointer flex items-center space-x-1.5"
                >
                  <span className="text-xs">
                    {SUPPORTED_LANGUAGES.find(l => l.code === prompt.lang)?.flag || '🌐'}
                  </span>
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Pipeline Architecture Status */}
          <div className="pt-2 border-t border-gold-subtle/20 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono gap-2">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>Primary: Gemini 3.1 Flash</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center space-x-1 text-orange-400/90">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span>Fallback: Groq (Llama-3.3-70b / Llama-3.1-8b)</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-500">
                <span>Cache: Multilingual Lexicon</span>
              </span>
            </div>
            <span className="text-slate-500">Autonomous failover active</span>
          </div>
        </div>
      )}
    </div>
  );
};
