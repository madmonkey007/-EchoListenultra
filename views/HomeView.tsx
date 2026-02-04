
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioSession, UserStats } from '../types.ts';

interface HomeViewProps {
  sessions: AudioSession[];
}

const HomeView: React.FC<HomeViewProps> = ({ sessions }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const stats: UserStats = {
    weeklyGoal: 10.0,
    currentWeekly: 6.8,
    vocabularyCount: 245,
    vocabularyGrowth: 18
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 pb-32 animate-fade-in min-h-full">
      <header className="flex justify-between items-end mb-12 pt-6">
        <div>
          <p className="text-[11px] font-black text-accent uppercase tracking-[0.5em] mb-1">Architecture</p>
          <h1 className="font-display text-4xl font-black tracking-tighter text-white">EchoListen</h1>
        </div>
        <button 
          onClick={() => navigate('/settings')} 
          className="size-12 rounded-2xl bg-surface-dark border border-white/5 flex items-center justify-center transition-all active:scale-90 active:bg-white/10"
        >
          <span className="material-symbols-outlined text-gray-400 text-2xl">settings</span>
        </button>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-surface-dark/60 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Learning Flow</p>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-black font-display text-white">{stats.currentWeekly}</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase">Hrs</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent shadow-[0_0_8px_rgba(0,228,255,0.5)] transition-all duration-1000" 
              style={{ width: `${(stats.currentWeekly / stats.weeklyGoal) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-surface-dark/60 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Lexicon</p>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-white">{stats.vocabularyCount}</span>
              <span className="text-[10px] font-black text-accent">+{stats.vocabularyGrowth}</span>
            </div>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">Growth</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-12">
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">search</span>
        <input 
          type="text" 
          placeholder="Explore your audio..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-dark border border-white/5 rounded-[2rem] py-5 pl-14 pr-6 text-sm text-white focus:border-accent/30 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-gray-600 font-medium outline-none"
        />
      </div>

      {/* Collections Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-display text-xl font-black tracking-tight text-white/90">Library</h3>
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{filteredSessions.length} units</span>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="space-y-4">
            {filteredSessions.map(session => (
              <div 
                key={session.id} 
                onClick={() => navigate(`/player/${session.id}`)}
                className="group flex items-center gap-5 bg-surface-dark/30 hover:bg-surface-dark/60 p-4 rounded-[2.2rem] border border-white/5 transition-all duration-300 cursor-pointer active:scale-[0.98]"
              >
                <div className="size-20 rounded-[1.5rem] overflow-hidden shrink-0 shadow-xl relative bg-white/5 border border-white/5">
                  <img src={session.coverUrl} alt={session.title} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-black text-base truncate text-white/90 mb-1">{session.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-md">Ready</span>
                    <p className="text-[11px] text-gray-500 truncate font-medium">{session.subtitle}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-700 mr-2">chevron_right</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center opacity-20">
             <span className="material-symbols-outlined text-5xl mb-4 font-light">audio_file</span>
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;
