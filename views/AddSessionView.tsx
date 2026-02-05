
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioSession, SlicingMethod, AIProviderConfig, AudioSegment, WordTiming } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";

const saveAudioToDB = (id: string, blob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EchoListenStorage', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('audio_files')) {
        request.result.createObjectStore('audio_files');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('audio_files', 'readwrite');
      const store = transaction.objectStore('audio_files');
      const putRequest = store.put(blob, id);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.onerror = () => resolve(0);
  });
};

interface AddSessionViewProps {
  onAdd: (session: AudioSession) => void;
  apiConfig: AIProviderConfig;
  isOnline?: boolean;
}

const AddSessionView: React.FC<AddSessionViewProps> = ({ onAdd, apiConfig, isOnline = true }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<SlicingMethod>(SlicingMethod.TURNS);
  const [ruleValue, setRuleValue] = useState(10); 
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'slicing' | 'saving'>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile || !isOnline) return;
    
    const geminiKey = process.env.API_KEY;
    const deepgramKey = apiConfig.deepgramApiKey;

    setProcessingStatus('uploading');
    setProgress(10);

    try {
      const sessionId = Math.random().toString(36).substr(2, 9);
      const audioDuration = await getAudioDuration(selectedFile);
      let segments: AudioSegment[] = [];

      const useDeepgram = apiConfig.provider === 'deepgram' && deepgramKey && deepgramKey.trim().length > 5;

      setProcessingStatus('transcribing');
      setProgress(30);

      if (useDeepgram) {
        console.log("[ASR] Initializing Deepgram Nova-3...");
        const url = new URL('https://api.deepgram.com/v1/listen');
        url.searchParams.append('model', 'nova-3');
        url.searchParams.append('smart_format', 'true');
        url.searchParams.append('diarize', 'true');
        url.searchParams.append('language', apiConfig.deepgramLanguage || 'en');

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Authorization': `Token ${deepgramKey.trim()}`,
            'Content-Type': selectedFile.type || 'audio/mpeg'
          },
          body: selectedFile
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`ASR Service Error: ${errData.err_msg || response.statusText}`);
        }

        const data = await response.json();
        const words = data.results?.channels?.[0]?.alternatives?.[0]?.words || [];
        
        setProgress(60);
        setProcessingStatus('slicing');

        if (words.length > 0) {
          let currentTokens: string[] = [];
          let currentWords: WordTiming[] = [];
          let currentStart = words[0].start;
          let lastSpeaker = words[0].speaker;
          let turnCount = 0;

          words.forEach((w: any, i: number) => {
            const token = w.punctuated_word || w.word;
            currentTokens.push(token);
            currentWords.push({ word: token, start: w.start, end: w.end });

            const isLast = i === words.length - 1;
            const speakerChanged = w.speaker !== lastSpeaker;
            if (speakerChanged) turnCount++;

            let shouldSplit = false;
            if (method === SlicingMethod.DURATION) {
              shouldSplit = (w.end - currentStart >= ruleValue * 60);
            } else if (method === SlicingMethod.TURNS) {
              shouldSplit = (turnCount >= ruleValue);
            } else {
              shouldSplit = (speakerChanged && (w.end - currentStart > 5));
            }

            if (shouldSplit || isLast) {
              segments.push({
                id: `seg-${segments.length}`,
                startTime: currentStart,
                endTime: w.end,
                text: currentTokens.join(' '),
                speaker: (lastSpeaker || 0) + 1,
                words: [...currentWords]
              });
              currentTokens = []; 
              currentWords = []; 
              currentStart = w.end; 
              lastSpeaker = w.speaker; 
              turnCount = 0;
            }
          });
        } else {
          throw new Error("No transcription data returned from server.");
        }
      } else {
        if (!geminiKey) throw new Error("API Key configuration missing. Please check settings.");

        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const reader = new FileReader();
        const base64Audio = await new Promise<string>((res) => {
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(selectedFile);
        });
        
        const response = await ai.models.generateContent({
          model: apiConfig.geminiModel || 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { mimeType: selectedFile.type || 'audio/mpeg', data: base64Audio } },
              { text: `Transcribe this audio. Return ONLY a JSON object with a "segments" array. Each segment needs: startTime(number), endTime(number), text(string), speaker(number). Use ${method} as slicing logic with sensitivity ${ruleValue}.` }
            ]
          },
          config: { 
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                segments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      startTime: { type: Type.NUMBER },
                      endTime: { type: Type.NUMBER },
                      text: { type: Type.STRING },
                      speaker: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          }
        });
        const result = JSON.parse(response.text);
        segments = result.segments;
      }

      setProcessingStatus('saving');
      setProgress(90);
      await saveAudioToDB(sessionId, selectedFile);
      
      onAdd({
        id: sessionId,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        subtitle: `${segments.length} segments • ${useDeepgram ? 'Deepgram' : 'Gemini'}`,
        coverUrl: `https://picsum.photos/seed/${sessionId}/400/400`,
        segments,
        duration: audioDuration || (segments.length > 0 ? segments[segments.length - 1].endTime : 0),
        lastPlayed: 'Just now',
        status: 'ready'
      });
      setProgress(100);
      navigate('/');
    } catch (e) {
      alert("Processing Failed: " + (e as Error).message);
      setProcessingStatus('idle');
    }
  };

  const statusText = {
    idle: 'Initialize ASR',
    uploading: 'Uploading File...',
    transcribing: 'AI Transcribing...',
    slicing: 'Semantic Slicing...',
    saving: 'Caching Assets...'
  }[processingStatus];

  return (
    <div className="p-6 pb-24 space-y-8 bg-background-light dark:bg-background-dark min-h-full transition-colors duration-500">
      <header className="flex items-center gap-4 pt-4">
        <button onClick={() => navigate('/')} className="size-10 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center shadow-sm dark:shadow-none transition-all active:scale-90">
          <span className="material-symbols-outlined text-slate-500 dark:text-gray-400">arrow_back</span>
        </button>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Import Audio</h2>
      </header>

      <div onClick={() => processingStatus === 'idle' && fileInputRef.current?.click()} className={`flex flex-col items-center justify-center p-12 bg-surface-light dark:bg-surface-dark border-2 border-dashed rounded-[2.5rem] transition-all ${selectedFile ? 'border-accent shadow-lg' : 'border-slate-200 dark:border-white/10'} ${processingStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent/50'}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <span className="material-symbols-outlined text-4xl mb-4 text-accent">{selectedFile ? 'check_circle' : 'cloud_upload'}</span>
        <p className="font-bold text-sm text-center truncate w-full text-slate-900 dark:text-white">{selectedFile ? selectedFile.name : 'Tap to select file'}</p>
      </div>

      {processingStatus === 'idle' ? (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest ml-1">Slicing Algorithm</h3>
          <div className="grid grid-cols-3 bg-surface-light dark:bg-surface-dark p-1 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            {[SlicingMethod.DURATION, SlicingMethod.TURNS, SlicingMethod.PARAGRAPH].map(m => (
              <button key={m} onClick={() => setMethod(m)} className={`py-3 text-[10px] font-black rounded-xl transition-all ${method === m ? 'bg-slate-900 dark:bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-white'}`}>{m}</button>
            ))}
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex justify-between mb-4"><span className="text-xs font-bold text-accent">Precision Factor</span><span className="text-xl font-black text-slate-900 dark:text-white">{ruleValue}</span></div>
             <input type="range" className="w-full h-1 bg-slate-100 dark:bg-background-dark rounded-full appearance-none accent-accent" min="1" max="60" value={ruleValue} onChange={(e) => setRuleValue(parseInt(e.target.value))} />
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-4 animate-fade-in text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-accent animate-pulse">{statusText}</span>
            <span className="text-4xl font-black text-slate-900 dark:text-white">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-surface-dark rounded-full overflow-hidden border border-slate-200 dark:border-white/5 mx-4">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <button 
        onClick={handleGenerate} 
        disabled={processingStatus !== 'idle' || !selectedFile || !isOnline} 
        className={`w-full py-5 rounded-[2rem] font-display text-lg font-black transition-all active:scale-95 ${isOnline && selectedFile ? 'bg-slate-900 dark:bg-accent text-white dark:text-black shadow-2xl' : 'bg-slate-200 dark:bg-gray-700 opacity-50 cursor-not-allowed text-slate-400 dark:text-gray-400'}`}
      >
        {processingStatus === 'idle' ? (selectedFile ? 'Process Now' : 'Select File First') : 'Running AI...'}
      </button>
    </div>
  );
};

export default AddSessionView;
