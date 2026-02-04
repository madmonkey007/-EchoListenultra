
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AudioSession, PlayerMode, PlaybackMode, AudioSegment, WordDefinition, SavedWord, Modality, WordTiming } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";

const SPEAKER_COLORS = ["text-accent", "text-indigo-400", "text-emerald-400", "text-orange-400", "text-pink-400"];
const LATENCY_COMPENSATION = 0.05;

// AudioContext Singleton for TTS and UI sounds to prevent "Too many AudioContexts"
let globalTTSContext: AudioContext | null = null;
const getTTSContext = () => {
  if (!globalTTSContext) {
    globalTTSContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return globalTTSContext;
};

const getAudioFromDB = (id: string): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EchoListenStorage', 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('audio_files')) return resolve(null);
      const transaction = db.transaction('audio_files', 'readonly');
      const store = transaction.objectStore('audio_files');
      const getRequest = store.get(id);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

interface PlayerViewProps {
  sessions: AudioSession[];
  savedWords: SavedWord[];
  toggleWord: (word: string, sessionId: string, def?: any) => void;
  onUpdateSession: (id: string, updates: Partial<AudioSession>) => void;
}

const PlayerView: React.FC<PlayerViewProps> = ({ sessions, savedWords, toggleWord, onUpdateSession }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<PlayerMode>(PlayerMode.CONTEXT);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.LIST_LOOP);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); 
  const [activeIdx, setActiveIdx] = useState(0); 
  const [speed, setSpeed] = useState(1.0);
  const [isSourceReady, setIsSourceReady] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const session = useMemo(() => sessions.find(s => s.id === id) || sessions[0], [sessions, id]);
  const [editedSegments, setEditedSegments] = useState<AudioSegment[]>(session.segments);

  useEffect(() => { setEditedSegments(session.segments); }, [session.segments]);

  const dialogueBlocks = useMemo(() => {
    const blocks: { speaker: number; segments: AudioSegment[]; startIdx: number }[] = [];
    editedSegments.forEach((seg, idx) => {
      const lastBlock = blocks[blocks.length - 1];
      const speakerId = typeof seg.speaker === 'number' ? seg.speaker : 1;
      if (lastBlock && lastBlock.speaker === speakerId) lastBlock.segments.push(seg);
      else blocks.push({ speaker: speakerId, segments: [seg], startIdx: idx });
    });
    return blocks;
  }, [editedSegments]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const handleAudioEnded = () => {
    if (!audioRef.current) return;
    if (playbackMode === PlaybackMode.SINGLE_LOOP) {
      audioRef.current.currentTime = editedSegments[activeIdx].startTime;
      audioRef.current.play();
    } else if (playbackMode === PlaybackMode.SHUFFLE) {
      const next = Math.floor(Math.random() * editedSegments.length);
      jumpToSegment(next);
    } else {
      if (activeIdx < editedSegments.length - 1) jumpToSegment(activeIdx + 1);
      else setIsPlaying(false);
    }
  };

  useEffect(() => {
    let url: string | null = null;
    const currentAudio = new Audio();
    const initAudio = async () => {
      const blob = await getAudioFromDB(session.id);
      if (blob) {
        url = URL.createObjectURL(blob);
        currentAudio.src = url;
        audioRef.current = currentAudio;
        currentAudio.currentTime = editedSegments[activeIdx]?.startTime || 0;
        currentAudio.playbackRate = speed;
        currentAudio.addEventListener('canplaythrough', () => setIsSourceReady(true));
        currentAudio.addEventListener('ended', handleAudioEnded);
      }
    };
    initAudio();
    return () => {
      currentAudio.pause();
      currentAudio.removeEventListener('ended', handleAudioEnded);
      if (url) URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [session.id]);

  useEffect(() => {
    if (audioRef.current && isSourceReady) {
      audioRef.current.playbackRate = speed;
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isSourceReady, speed]);

  useEffect(() => {
    const sync = () => {
      if (audioRef.current && isSourceReady) {
        const time = audioRef.current.currentTime;
        setCurrentTime(time);
        
        if (playbackMode === PlaybackMode.SINGLE_LOOP) {
          const seg = editedSegments[activeIdx];
          if (time >= seg.endTime) audioRef.current.currentTime = seg.startTime;
        }

        const adjustedTime = time + (isPlaying ? LATENCY_COMPENSATION : 0);
        const idx = editedSegments.findIndex(s => adjustedTime >= s.startTime && adjustedTime < s.endTime);
        if (idx !== -1 && idx !== activeIdx) {
          setActiveIdx(idx);
          if (scrollRef.current && !isEditMode) {
            const activeEl = scrollRef.current.querySelector(`[data-seg-idx="${idx}"]`);
            if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      rafRef.current = requestAnimationFrame(sync);
    };
    rafRef.current = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(rafRef.current);
  }, [editedSegments, isSourceReady, isEditMode, activeIdx, isPlaying, playbackMode]);

  const handleWordClick = async (word: string, sentence: string) => {
    if (isEditMode) return;
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim().toLowerCase();
    if (!cleanWord) return;
    
    setSelectedWord({ word: cleanWord, phonetic: "...", definition: "", translation: "Translating...", example: sentence });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the English word "${cleanWord}" in context of "${sentence}". JSON: {word, phonetic, definition, translation}.`,
        config: { responseMimeType: "application/json" }
      });
      setSelectedWord({ ...JSON.parse(response.text), example: sentence });
    } catch (e) { setSelectedWord(null); }
  };

  const playWordAudio = async () => {
    if (!selectedWord || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${selectedWord.word}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = getTTSContext();
        if (ctx.state === 'suspended') await ctx.resume();
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) { setIsSpeaking(false); }
  };

  const jumpToSegment = (idx: number) => {
    if (audioRef.current && isSourceReady) {
      audioRef.current.currentTime = editedSegments[idx].startTime;
      setActiveIdx(idx);
      if (!isPlaying) setIsPlaying(true);
      setShowPlaylist(false);
    }
  };

  const togglePlaybackMode = () => {
    if (playbackMode === PlaybackMode.LIST_LOOP) setPlaybackMode(PlaybackMode.SINGLE_LOOP);
    else if (playbackMode === PlaybackMode.SINGLE_LOOP) setPlaybackMode(PlaybackMode.SHUFFLE);
    else setPlaybackMode(PlaybackMode.LIST_LOOP);
  };

  const renderTextWithClicks = (segment: AudioSegment, currentTime: number, activeColor: string, dimColor: string, state: string) => {
    const { text, words: wordTimings, startTime, endTime } = segment;
    const tokens = text.split(/\s+/);
    const lowerSavedWords = savedWords.map(w => w.word.toLowerCase());
    const adjustedTime = currentTime + LATENCY_COMPENSATION;
    const hasWordTimings = wordTimings && wordTimings.length === tokens.length;
    
    let tokenBoundaries: { start: number, end: number }[] = [];
    if (hasWordTimings) {
      tokenBoundaries = wordTimings!.map(w => ({ start: w.start, end: w.end }));
    } else {
      const totalChars = text.length || 1;
      const totalDuration = Math.max(0.1, endTime - startTime);
      let runningChars = 0;
      tokenBoundaries = tokens.map(t => {
        const tLen = t.length + 1;
        const start = startTime + (runningChars / totalChars) * totalDuration;
        runningChars += tLen;
        const end = startTime + (runningChars / totalChars) * totalDuration;
        return { start, end };
      });
    }

    return (
      <div className="flex flex-wrap items-center w-full">
        {tokens.map((w, idx) => {
          const { start, end } = tokenBoundaries[idx];
          let fillPercent = state === 'past' || adjustedTime >= end ? 100 : state === 'current' && adjustedTime >= start && adjustedTime < end ? ((adjustedTime - start) / (end - start)) * 100 : 0;
          const cleanWord = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
          const isSaved = lowerSavedWords.includes(cleanWord);
          return (
            <span key={idx} onClick={(ev) => { ev.stopPropagation(); handleWordClick(w, text); }} className={`relative cursor-pointer py-0.5 px-0.5 mr-1.5 transition-all select-text ${isSaved ? 'border-b-2 border-accent shadow-[0_4px_0_-2px_rgba(0,228,255,0.4)]' : ''}`} style={{ backgroundImage: `linear-gradient(90deg, ${isSaved ? '#00E4FF' : activeColor} ${fillPercent}%, ${isSaved ? 'rgba(0,228,255,0.3)' : dimColor} ${fillPercent}%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: isSaved ? '900' : 'inherit' }}>{w}</span>
          );
        })}
      </div>
    );
  };

  const PlaybackModeIcon = () => {
    if (playbackMode === PlaybackMode.LIST_LOOP) return <span className="material-symbols-outlined text-white/30">repeat</span>;
    if (playbackMode === PlaybackMode.SINGLE_LOOP) return <span className="material-symbols-outlined text-accent">repeat_one</span>;
    return <span className="material-symbols-outlined text-accent">shuffle</span>;
  };

  return (
    <div className="flex flex-col h-full bg-[#181C21] text-white overflow-hidden relative">
      {/* Word Definition Overlay */}
      {selectedWord && (
        <div className="absolute inset-0 z-[200] flex items-end justify-center animate-fade-in p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedWord(null)}></div>
          <div className="relative w-full max-w-md bg-surface-dark rounded-[3rem] p-10 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-slide-up mb-24">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-4xl font-black mb-1">{selectedWord.word}</h3><p className="text-accent text-sm italic font-medium">{selectedWord.phonetic}</p></div>
              <button onClick={playWordAudio} className={`size-14 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-accent text-black scale-95 shadow-[0_0_20px_rgba(0,228,255,0.5)]' : 'bg-white/5 text-white hover:bg-white/10'}`}><span className="material-symbols-outlined text-2xl fill-1">{isSpeaking ? 'volume_up' : 'volume_down'}</span></button>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl mb-8 border border-white/5"><p className="text-white text-xl font-black mb-2">{selectedWord.translation}</p><p className="text-gray-400 text-sm leading-relaxed">{selectedWord.definition}</p></div>
            <button onClick={() => toggleWord(selectedWord.word, session.id, selectedWord)} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 ${savedWords.some(w => w.word.toLowerCase() === selectedWord.word.toLowerCase()) ? 'bg-white/10 text-white' : 'bg-accent text-black shadow-xl shadow-accent/20'}`}>{savedWords.some(w => w.word.toLowerCase() === selectedWord.word.toLowerCase()) ? 'Remove from Saved' : 'Save to Folder'}</button>
          </div>
        </div>
      )}

      {/* Playlist Drawer */}
      {showPlaylist && (
        <div className="absolute inset-0 z-[150] flex items-end justify-center animate-fade-in p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlaylist(false)}></div>
          <div className="relative w-full max-w-md bg-surface-dark rounded-t-[3rem] p-6 border-t border-x border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up h-[70vh] flex flex-col overflow-hidden">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 shrink-0"></div>
            <div className="flex justify-between items-center mb-6 px-4 shrink-0">
              <h3 className="text-xl font-black">Segment Collection</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{editedSegments.length} items</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-12">
              {editedSegments.map((seg, idx) => (
                <div key={seg.id} onClick={() => jumpToSegment(idx)} className={`p-5 rounded-3xl border transition-all active:scale-[0.98] cursor-pointer ${activeIdx === idx ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeIdx === idx ? 'text-accent' : 'text-gray-500'}`}>Segment {idx + 1}</span>
                    <span className="text-[9px] font-black tabular-nums text-gray-400">{Math.floor(seg.startTime)}s</span>
                  </div>
                  <p className={`text-sm font-bold line-clamp-2 leading-relaxed ${activeIdx === idx ? 'text-white' : 'text-gray-400'}`}>{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="px-6 pt-12 pb-4 flex justify-between items-center z-20 shrink-0">
        <button onClick={() => navigate('/')} className="size-10 flex items-center justify-center rounded-xl bg-white/5"><span className="material-symbols-outlined">expand_more</span></button>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
           {[{ id: PlayerMode.VINYL, icon: 'album' }, { id: PlayerMode.LYRICS, icon: 'segment' }, { id: PlayerMode.CONTEXT, icon: 'article' }].map(m => (
             <button key={m.id} onClick={() => setMode(m.id)} className={`size-10 rounded-lg flex items-center justify-center transition-all ${mode === m.id ? 'bg-accent text-black shadow-lg shadow-accent/10' : 'text-white/40'}`}><span className="material-symbols-outlined text-xl">{m.icon}</span></button>
           ))}
        </div>
        <div className="flex gap-2">
           <button onClick={() => isEditMode ? (onUpdateSession(session.id, { segments: editedSegments }), setIsEditMode(false)) : setIsEditMode(true)} className={`size-10 rounded-xl flex items-center justify-center transition-all ${isEditMode ? 'bg-green-500 text-white' : 'bg-white/5 text-white/40'}`}><span className="material-symbols-outlined text-lg">{isEditMode ? 'check' : 'edit_note'}</span></button>
           <button onClick={() => setSpeed(s => s >= 2 ? 0.5 : s + 0.25)} className="size-10 rounded-xl bg-white/5 text-[10px] font-black">{speed}x</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6" ref={scrollRef}>
        {mode === PlayerMode.VINYL && (
          <div className="h-full flex flex-col items-center justify-center py-10 space-y-12 animate-fade-in">
             <div className={`size-64 rounded-full bg-gradient-to-tr from-gray-900 to-black p-1 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/5 relative flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}>
               <div className="size-full rounded-full overflow-hidden border-2 border-white/10"><img src={session.coverUrl} className="size-full object-cover opacity-50" alt="" /></div>
               <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_transparent_40%,_black_90%)]"></div>
               <div className="absolute size-10 rounded-full bg-[#181C21] border-2 border-white/10 flex items-center justify-center shadow-inner"><div className="size-2 rounded-full bg-accent"></div></div>
             </div>
             <div className="text-center max-w-sm px-4">
               <h4 className="text-xl font-black text-white leading-relaxed">{renderTextWithClicks(editedSegments[activeIdx], currentTime, '#FFF', '#888', 'current')}</h4>
               <p className="text-[10px] uppercase font-black tracking-widest text-accent mt-4">Now Playing</p>
             </div>
          </div>
        )}

        {mode === PlayerMode.LYRICS && (
          <div className="space-y-16 py-32 animate-fade-in">
            {editedSegments.map((seg, idx) => (
              <div key={seg.id} data-seg-idx={idx} onClick={() => jumpToSegment(idx)} className={`transition-all duration-700 cursor-pointer ${activeIdx === idx ? 'scale-110 opacity-100' : 'scale-95 opacity-20 hover:opacity-40 blur-[0.5px]'}`}>
                <div className="text-3xl font-black leading-tight tracking-tighter">
                  {renderTextWithClicks(seg, currentTime, '#00E4FF', '#FFFFFF', idx < activeIdx ? 'past' : idx === activeIdx ? 'current' : 'future')}
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === PlayerMode.CONTEXT && (
          <div className="space-y-12 pb-48 pt-6">
            {dialogueBlocks.map((block, bIdx) => {
              const isBlockActive = activeIdx >= block.startIdx && activeIdx < block.startIdx + block.segments.length;
              const speakerColor = SPEAKER_COLORS[(block.speaker - 1) % SPEAKER_COLORS.length];
              return (
                <div key={bIdx} className={`transition-all duration-500 ${isBlockActive ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="flex items-center gap-3 mb-4"><div className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${speakerColor}`}><span className="material-symbols-outlined text-xs">record_voice_over</span>Speaker {block.speaker}</div></div>
                  <div className="space-y-8">
                    {block.segments.map((seg, sIdx) => {
                      const absIdx = block.startIdx + sIdx;
                      return (
                        <div key={seg.id} data-seg-idx={absIdx} className="w-full">
                          {isEditMode ? <textarea value={seg.text} onChange={(e) => { const n = [...editedSegments]; n[absIdx] = { ...n[absIdx], text: e.target.value }; setEditedSegments(n); }} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:ring-1 focus:ring-accent outline-none text-white leading-relaxed" rows={2} /> : 
                          <div className="text-xl font-bold leading-relaxed tracking-tight" onClick={() => jumpToSegment(absIdx)}>
                            {renderTextWithClicks(seg, currentTime, '#00E4FF', '#FFFFFF', absIdx < activeIdx ? 'past' : absIdx === activeIdx ? 'current' : 'future')}
                          </div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="px-8 pb-12 pt-6 bg-[#181C21] border-t border-white/5 z-20 shrink-0">
        <div className="flex justify-between text-[10px] font-black text-gray-500 mb-4 tracking-widest uppercase tabular-nums">
          <span>{Math.floor(currentTime/60)}:{(currentTime%60).toFixed(0).padStart(2,'0')}</span>
          <span>{Math.floor(session.duration/60)}:{(session.duration%60).toFixed(0).padStart(2,'0')}</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full mb-8 cursor-pointer relative" onClick={(e) => {
          if (isEditMode) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const p = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) audioRef.current.currentTime = p * session.duration;
        }}>
          <div className="h-full bg-accent transition-all duration-200" style={{ width: `${(currentTime/session.duration)*100}%` }}></div>
        </div>
        <div className="flex items-center justify-between">
           <button onClick={togglePlaybackMode} className="size-12 rounded-xl flex items-center justify-center transition-all active:scale-90">
             <PlaybackModeIcon />
           </button>
           
           <div className="flex items-center gap-8">
             <button onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 5 }} className="material-symbols-outlined text-3xl text-white/30 active:scale-90 transition-transform">replay_5</button>
             <button onClick={() => setIsPlaying(!isPlaying)} className="size-20 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-90 transition-all">
               <span className="material-symbols-outlined text-5xl fill-1">{isPlaying ? 'pause' : 'play_arrow'}</span>
             </button>
             <button onClick={() => { if(audioRef.current) audioRef.current.currentTime += 5 }} className="material-symbols-outlined text-3xl text-white/30 active:scale-90 transition-transform">forward_5</button>
           </div>

           <button onClick={() => setShowPlaylist(true)} className="size-12 rounded-xl flex items-center justify-center text-white/30 active:scale-90 transition-all">
             <span className="material-symbols-outlined">format_list_bulleted</span>
           </button>
        </div>
      </footer>
    </div>
  );
};

export default PlayerView;
