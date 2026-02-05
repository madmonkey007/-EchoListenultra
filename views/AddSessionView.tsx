
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
  const [ruleValue, setRuleValue] = useState(15); 
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

        if (!response.ok) throw new Error(`Deepgram Error: ${response.statusText}`);

        const data = await response.json();
        const words = data.results?.channels?.[0]?.alternatives?.[0]?.words || [];
        
        setProgress(60);
        setProcessingStatus('slicing');

        if (words.length > 0) {
          let currentTokens: string[] = [];
          let currentWords: WordTiming[] = [];
          let currentStart = words[0].start;
          let activeSpeaker = words[0].speaker;
          let lastReportedSpeaker = words[0].speaker;
          let turnCounter = 0;

          words.forEach((w: any, i: number) => {
            const token = w.punctuated_word || w.word;
            
            // Check for actual speaker swap to count as a "Turn"
            if (w.speaker !== lastReportedSpeaker) {
              turnCounter++;
              lastReportedSpeaker = w.speaker;
            }

            let shouldSplit = false;
            const segmentDuration = w.end - currentStart;

            if (method === SlicingMethod.DURATION) {
              shouldSplit = segmentDuration >= ruleValue * 60;
            } else if (method === SlicingMethod.TURNS) {
              // Only split when turn count is reached and the segment is long enough to be meaningful
              shouldSplit = turnCounter >= ruleValue && segmentDuration > 2;
            } else {
              // Paragraph: split on speaker change if block > 8s
              shouldSplit = (w.speaker !== lastReportedSpeaker) && segmentDuration > 8;
            }

            if (shouldSplit || i === words.length - 1) {
              // Include the current word in the segment being finished
              currentTokens.push(token);
              currentWords.push({ word: token, start: w.start, end: w.end });

              segments.push({
                id: `seg-${segments.length}`,
                startTime: currentStart,
                endTime: w.end,
                text: currentTokens.join(' '),
                speaker: (activeSpeaker || 0) + 1,
                words: [...currentWords]
              });

              // Prepare for next segment
              currentTokens = [];
              currentWords = [];
              currentStart = w.end;
              turnCounter = 0;
              if (i + 1 < words.length) {
                activeSpeaker = words[i+1].speaker;
                lastReportedSpeaker = words[i+1].speaker;
              }
            } else {
              currentTokens.push(token);
              currentWords.push({ word: token, start: w.start, end: w.end });
            }
          });
        }
      } else {
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
              { text: `Precisely transcribe this audio. Slice into segments based on ${method} rule: every ${ruleValue} ${method === SlicingMethod.TURNS ? 'speaker turns' : 'minutes'}. Output JSON only.` }
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
        segments = JSON.parse(response.text).segments;
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
      alert("Error: " + (e as Error).message);
      setProcessingStatus('idle');
    }
  };

  const statusText = {
    idle: 'Import Settings',
    uploading: 'Uploading Asset...',
    transcribing: 'AI Transcription...',
    slicing: 'Segmenting Audio...',
    saving: 'Caching Final...'
  }[processingStatus];

  return (
    <div className="p-6 pb-24 space-y-8 bg-background-light dark:bg-background-dark min-h-full transition-colors duration-500">
      <header className="flex items-center gap-4 pt-4">
        <button onClick={() => navigate('/')} className="size-10 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-90">
          <span className="material-symbols-outlined text-slate-500">arrow_back</span>
        </button>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Import Session</h2>
      </header>

      <div onClick={() => processingStatus === 'idle' && fileInputRef.current?.click()} className={`flex flex-col items-center justify-center p-12 bg-surface-light dark:bg-surface-dark border-2 border-dashed rounded-[2.5rem] transition-all ${selectedFile ? 'border-accent shadow-lg scale-[1.02]' : 'border-slate-200 dark:border-white/10'} ${processingStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent/40'}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <span className="material-symbols-outlined text-4xl mb-4 text-accent">{selectedFile ? 'verified' : 'cloud_upload'}</span>
        <p className="font-bold text-sm text-center truncate w-full text-slate-900 dark:text-white">{selectedFile ? selectedFile.name : 'Tap to select audio file'}</p>
      </div>

      {processingStatus === 'idle' ? (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest mb-3 ml-1">Slicing Mode</h3>
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-surface-dark p-1 rounded-2xl border border-slate-200 dark:border-white/5">
              {[SlicingMethod.DURATION, SlicingMethod.TURNS, SlicingMethod.PARAGRAPH].map(m => (
                <button key={m} onClick={() => setMethod(m)} className={`py-3 text-[10px] font-black rounded-xl transition-all ${method === m ? 'bg-slate-900 dark:bg-primary text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{m}</button>
              ))}
            </div>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex justify-between mb-4 items-baseline">
               <span className="text-xs font-black uppercase tracking-widest text-accent">Sensitivity</span>
               <span className="text-2xl font-black text-slate-900 dark:text-white">{ruleValue} {method === SlicingMethod.DURATION ? 'min' : 'turns'}</span>
             </div>
             <input type="range" className="w-full h-1.5 bg-slate-100 dark:bg-background-dark rounded-full appearance-none accent-accent cursor-pointer" min="1" max="60" value={ruleValue} onChange={(e) => setRuleValue(parseInt(e.target.value))} />
             <p className="text-[9px] font-medium text-slate-400 mt-4 leading-relaxed">
               {method === SlicingMethod.TURNS ? 'Segments audio every X speaker changes. Highly recommended for dialogues.' : 'Splits audio into fixed time intervals. Best for monologues.'}
             </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-6 animate-fade-in text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-accent animate-pulse">{statusText}</span>
            <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{progress}%</span>
          </div>
          <div className="h-4 bg-slate-100 dark:bg-surface-dark rounded-full overflow-hidden border border-slate-200 dark:border-white/5 mx-4 p-1">
            <div className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(0,228,255,0.4)] transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <button 
        onClick={handleGenerate} 
        disabled={processingStatus !== 'idle' || !selectedFile || !isOnline} 
        className={`w-full py-6 rounded-[2.5rem] font-display text-lg font-black transition-all active:scale-[0.98] ${isOnline && selectedFile ? 'bg-slate-900 dark:bg-accent text-white dark:text-black shadow-2xl' : 'bg-slate-200 dark:bg-gray-700 opacity-50 cursor-not-allowed text-slate-400'}`}
      >
        {processingStatus === 'idle' ? 'Commence Engine' : 'AI Processing...'}
      </button>
    </div>
  );
};

export default AddSessionView;
