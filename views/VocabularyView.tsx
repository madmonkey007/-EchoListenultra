
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedWord, AudioSession } from '../types.ts';

interface VocabularyViewProps {
  savedWords: SavedWord[];
  sessions: AudioSession[];
  onUpdateWord: (word: string, updates: Partial<SavedWord>) => void;
}

const REVIEW_INTERVALS = [0, 1, 2, 4, 7, 15, 30, 90]; // Days

const VocabularyView: React.FC<VocabularyViewProps> = ({ savedWords, sessions, onUpdateWord }) => {
  const navigate = useNavigate();
  const [testMode, setTestMode] = useState(false);
  const [testIdx, setTestIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const dueWords = useMemo(() => savedWords.filter(w => w.nextReview <= Date.now()), [savedWords]);
  
  const folders = useMemo(() => {
    const groups: Record<string, SavedWord[]> = {};
    savedWords.forEach(w => {
      if (!groups[w.sessionId]) groups[w.sessionId] = [];
      groups[w.sessionId].push(w);
    });
    return Object.entries(groups).map(([id, words]) => ({
      session: sessions.find(s => s.id === id),
      words
    }));
  }, [savedWords, sessions]);

  const handleReviewAction = (known: boolean) => {
    const word = dueWords[testIdx];
    const newStage = known ? Math.min(word.stage + 1, REVIEW_INTERVALS.length - 1) : 0;
    const nextInterval = REVIEW_INTERVALS[newStage] * 24 * 60 * 60 * 1000;
    
    onUpdateWord(word.word, {
      stage: newStage,
      nextReview: Date.now() + nextInterval
    });

    if (testIdx < dueWords.length - 1) {
      setTestIdx(testIdx + 1);
      setShowAnswer(false);
    } else {
      setTestMode(false);
      setTestIdx(0);
    }
  };

  if (testMode && dueWords.length > 0) {
    const current = dueWords[testIdx];
    return (
      <div className="flex flex-col h-full bg-background-dark p-8 animate-fade-in">
        <header className="flex justify-between items-center mb-12">
          <button onClick={() => setTestMode(false)} className="size-10 bg-surface-dark rounded-xl flex items-center justify-center text-gray-500"><span className="material-symbols-outlined">close</span></button>
          <div className="text-[10px] font-black uppercase tracking-widest text-accent">Reviewing {testIdx + 1} / {dueWords.length}</div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
          <div className="space-y-2">
            <h2 className="text-6xl font-black tracking-tighter text-white">{current.word}</h2>
            <p className="text-accent italic font-medium">{current.phonetic}</p>
          </div>

          <div className={`transition-all duration-500 w-full max-w-sm ${showAnswer ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="bg-surface-dark p-8 rounded-[3rem] border border-white/5 space-y-4">
              <h3 className="text-3xl font-black text-white">{current.translation}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{current.definition}</p>
            </div>
          </div>
        </div>

        <div className="pb-12 space-y-4">
          {!showAnswer ? (
            <button onClick={() => setShowAnswer(true)} className="w-full bg-white py-6 rounded-3xl text-black font-black uppercase tracking-widest shadow-xl">Reveal Answer</button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => handleReviewAction(false)} className="bg-red-500/10 text-red-400 py-6 rounded-3xl font-black uppercase tracking-widest border border-red-500/20">I Forgot</button>
               <button onClick={() => handleReviewAction(true)} className="bg-green-500/10 text-green-400 py-6 rounded-3xl font-black uppercase tracking-widest border border-green-500/20">I Knew It</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 animate-fade-in bg-background-dark min-h-full">
      <header className="flex justify-between items-center mb-10 pt-4">
        <div>
          <h2 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-1.5 opacity-80">Knowledge base</h2>
          <h1 className="font-display text-4xl font-black tracking-tighter text-white">Vocabulary</h1>
        </div>
        <div className="size-12 rounded-2xl bg-surface-dark border border-white/5 flex items-center justify-center shadow-inner">
           <span className="material-symbols-outlined text-accent font-black">school</span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="bg-surface-dark/40 border border-white/5 p-6 rounded-[2.5rem]">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Total Words</p>
            <span className="text-4xl font-black font-display text-white">{savedWords.length}</span>
         </div>
         <div className="bg-surface-dark/40 border border-white/5 p-6 rounded-[2.5rem]">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Due Today</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black font-display text-accent">{dueWords.length}</span>
            </div>
         </div>
      </div>

      <div className="space-y-10">
        <h3 className="font-display text-xl font-black tracking-tight text-white px-2">Session Collections</h3>
        {folders.length > 0 ? (
          folders.map(({ session, words }, fIdx) => (
            <div key={fIdx} className="space-y-4">
               <div className="flex items-center gap-3 px-2">
                 <div className="size-1 w-8 bg-accent/20 rounded-full"></div>
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{session?.title || "Unknown Session"}</span>
               </div>
               <div className="grid grid-cols-1 gap-3">
                 {words.map((w, idx) => (
                   <div key={idx} className="group flex items-center justify-between bg-surface-dark/40 p-5 rounded-[2rem] border border-white/5 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent">
                           <span className="text-lg font-black uppercase">{w.word[0]}</span>
                        </div>
                        <div>
                           <h4 className="font-black text-white tracking-tight">{w.word}</h4>
                           <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Next Review: {new Date(w.nextReview).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className={`size-3 rounded-full ${w.stage > 4 ? 'bg-green-500' : w.stage > 2 ? 'bg-yellow-500' : 'bg-accent/30'}`}></div>
                   </div>
                 ))}
               </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
             <span className="material-symbols-outlined text-6xl mb-4">collections_bookmark</span>
             <p className="font-bold text-xs uppercase tracking-[0.2em]">Library is Empty</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => dueWords.length > 0 && setTestMode(true)}
        disabled={dueWords.length === 0}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all z-50 ${dueWords.length > 0 ? 'bg-accent text-black active:scale-95' : 'bg-white/5 text-gray-600 opacity-50'}`}
      >
        {dueWords.length > 0 ? `Start Review (${dueWords.length})` : 'Nothing to Review'}
      </button>
    </div>
  );
};

export default VocabularyView;
