
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioSession, SlicingMethod, AIProviderConfig, AudioSegment, WordTiming } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@deepgram/sdk';

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
}

const AddSessionView: React.FC<AddSessionViewProps> = ({ onAdd, apiConfig }) => {
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
    if (!selectedFile) return;

    setProcessingStatus('uploading');
    setProgress(10);

    try {
      const sessionId = Math.random().toString(36).substr(2, 9);
      const audioDuration = await getAudioDuration(selectedFile);

      // Guard: 5-minute duration limit
      const MAX_DURATION_SECONDS = 5 * 60;
      if (audioDuration > MAX_DURATION_SECONDS) {
        alert(`Audio exceeds 5-minute limit (${Math.round(audioDuration / 60)}:${(audioDuration % 60).toFixed(0).padStart(2, '0')}). Please upload a shorter file.`);
        setProcessingStatus('idle');
        return;
      }

      let segments: AudioSegment[] = [];
      const canUseDeepgram = apiConfig.provider === 'deepgram' && apiConfig.deepgramApiKey && apiConfig.deepgramApiKey !== 'your_deepgram_api_key_here';

      if (!canUseDeepgram && apiConfig.provider === 'deepgram') {
        alert("Please configure your Deepgram API Key in Settings first.");
        setProcessingStatus('idle');
        return;
      }

      setProcessingStatus('transcribing');
      setProgress(30);

      if (canUseDeepgram) {
        const deepgram = createClient(apiConfig.deepgramApiKey);

        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
          selectedFile,
          {
            model: 'nova-3',
            smart_format: true,
            diarize: true,
            language: apiConfig.deepgramLanguage || 'en'
          }
        );

        if (error) throw new Error(`Deepgram Error: ${error.message}`);
        const words = result.results?.channels?.[0]?.alternatives?.[0]?.words || [];
        
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

            let split = false;
            if (method === SlicingMethod.DURATION) split = (w.end - currentStart >= ruleValue * 60);
            else if (method === SlicingMethod.TURNS) split = (turnCount >= ruleValue);
            else split = (speakerChanged && (w.end - currentStart > 5));

            if (split || isLast) {
              segments.push({
                id: `seg-${segments.length}`,
                startTime: currentStart,
                endTime: w.end,
                text: currentTokens.join(' '),
                speaker: (lastSpeaker || 0) + 1,
                words: [...currentWords]
              });
              currentTokens = []; currentWords = []; currentStart = w.end; lastSpeaker = w.speaker; turnCount = 0;
            }
          });
        }
      } else {
        // Gemini Flow (Built-in Key)
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const reader = new FileReader();
        const base64Audio = await new Promise<string>((res) => {
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(selectedFile);
        });
        
        const response = await ai.models.generateContent({
          model: apiConfig.geminiModel,
          contents: {
            parts: [
              { inlineData: { mimeType: selectedFile.type || 'audio/mpeg', data: base64Audio } },
              { text: `Transcribe this audio with Speaker Diarization. Identify Speaker 1, 2, etc. 
                       Analyze the content and split it into segments based on the ${method} rule (sensitivity: ${ruleValue}).
                       Return JSON format: {segments: [{startTime, endTime, text, speaker}]}` }
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
        subtitle: `${segments.length} segments • ${canUseDeepgram ? 'Deepgram ASR' : 'Built-in Engine'}`,
        coverUrl: `https://picsum.photos/seed/${sessionId}/400/400`,
        segments,
        duration: audioDuration || segments[segments.length - 1]?.endTime || 0,
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
    idle: 'Start Transcription',
    uploading: 'Preparing File...',
    transcribing: 'AI Engine Working...',
    slicing: 'Analyzing Dialogue...',
    saving: 'Optimizing Store...'
  }[processingStatus];

  return (
    <div className="p-6 pb-24 space-y-8 bg-background-dark min-h-full">
      <header className="flex items-center gap-4 pt-4">
        <button onClick={() => navigate('/')} className="size-10 bg-surface-dark rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="text-xl font-black text-white">Upload Audio</h2>
      </header>

      <div onClick={() => processingStatus === 'idle' && fileInputRef.current?.click()} className={`flex flex-col items-center justify-center p-12 bg-surface-dark border-2 border-dashed rounded-[2.5rem] transition-all ${selectedFile ? 'border-accent shadow-[0_0_20px_rgba(0,228,255,0.1)]' : 'border-white/10'} ${processingStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <span className="material-symbols-outlined text-4xl mb-4 text-accent">{selectedFile ? 'task' : 'upload'}</span>
        <p className="font-bold text-sm text-center truncate w-full text-white">{selectedFile ? selectedFile.name : 'Select File'}</p>
      </div>

      {processingStatus === 'idle' ? (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Slicing Method</h3>
          <div className="grid grid-cols-3 bg-surface-dark p-1 rounded-2xl">
            {[SlicingMethod.DURATION, SlicingMethod.TURNS, SlicingMethod.PARAGRAPH].map(m => (
              <button key={m} onClick={() => setMethod(m)} className={`py-3 text-[10px] font-black rounded-xl transition-all ${method === m ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{m}</button>
            ))}
          </div>
          <div className="bg-surface-dark p-6 rounded-3xl">
             <div className="flex justify-between mb-4"><span className="text-xs font-bold text-accent">Sensitivity</span><span className="text-xl font-black text-white">{ruleValue}</span></div>
             <input type="range" className="w-full h-1 bg-background-dark rounded-full appearance-none accent-accent" min="1" max="60" value={ruleValue} onChange={(e) => setRuleValue(parseInt(e.target.value))} />
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-4 animate-fade-in">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-accent">{statusText}</span>
            <span className="text-2xl font-black text-white">{progress}%</span>
          </div>
          <div className="h-3 bg-surface-dark rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <button onClick={handleGenerate} disabled={processingStatus !== 'idle' || !selectedFile} className="w-full bg-accent py-5 rounded-[2rem] font-black text-black shadow-2xl disabled:opacity-20 transition-all active:scale-95">
        {processingStatus === 'idle' ? 'Start Processing' : 'Processing...'}
      </button>
    </div>
  );
};

export default AddSessionView;
