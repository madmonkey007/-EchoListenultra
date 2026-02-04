
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomeView from './views/HomeView.tsx';
import PlayerView from './views/PlayerView.tsx';
import AddSessionView from './views/AddSessionView.tsx';
import SettingsView from './views/SettingsView.tsx';
import VocabularyView from './views/VocabularyView.tsx';
import BottomNav from './components/BottomNav.tsx';
import { AudioSession, AIProviderConfig, SavedWord } from './types.ts';

const INITIAL_SESSIONS: AudioSession[] = [
  {
    id: 'sample-1',
    title: 'The Future of AI Architecture',
    subtitle: 'Technology • Podcast S01E04',
    coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=400&h=400&auto=format&fit=crop',
    segments: [
      { id: 's1', startTime: 0, endTime: 6, text: "In today's session, we explore the paradigm shift from traditional neural networks to transformer-based architectures.", speaker: 1 },
      { id: 's2', startTime: 6, endTime: 13, text: "The primary challenge remains the quadratic complexity of self-attention mechanisms as sequence length increases.", speaker: 1 },
      { id: 's3', startTime: 13, endTime: 20, text: "Wait, isn't that exactly what the new linear attention variants are trying to solve in recent papers?", speaker: 2 },
      { id: 's4', startTime: 20, endTime: 28, text: "Exactly. By approximating the kernel, we can achieve linear time complexity without sacrificing too much accuracy.", speaker: 1 },
      { id: 's5', startTime: 28, endTime: 35, text: "This opens up possibilities for processing entire books or massive codebases in a single context window.", speaker: 2 }
    ],
    duration: 35,
    lastPlayed: '1d ago',
    status: 'ready'
  }
];

// Default config: Uses the built-in engine (Gemini) which relies on process.env.API_KEY
const DEFAULT_CONFIG: AIProviderConfig = {
  provider: 'gemini',
  geminiModel: 'gemini-3-flash-preview',
  customEndpoint: '',
  customApiKey: '',
  customModelId: '',
  deepgramApiKey: '', 
  deepgramLanguage: 'en' 
};

const AppContent: React.FC<{ 
  sessions: AudioSession[], 
  addSession: (s: AudioSession) => void, 
  updateSession: (id: string, updates: Partial<AudioSession>) => void,
  deleteSession: (id: string) => void,
  savedWords: SavedWord[],
  toggleWord: (word: string, sessionId: string, def?: any) => void,
  updateWord: (word: string, updates: Partial<SavedWord>) => void,
  apiConfig: AIProviderConfig,
  setApiConfig: (c: AIProviderConfig) => void
}> = ({ sessions, addSession, updateSession, deleteSession, savedWords, toggleWord, updateWord, apiConfig, setApiConfig }) => {
  const location = useLocation();
  const isPlayerView = location.pathname.startsWith('/player');

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-background-dark overflow-hidden font-body relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
      <main className={`flex-1 overflow-y-auto no-scrollbar ${isPlayerView ? 'pb-0' : 'pb-24'}`}>
        <Routes>
          <Route path="/" element={<HomeView sessions={sessions} />} />
          <Route path="/player/:id" element={<PlayerView sessions={sessions} savedWords={savedWords} toggleWord={toggleWord} onUpdateSession={updateSession} />} />
          <Route path="/add" element={<AddSessionView onAdd={addSession} apiConfig={apiConfig} />} />
          <Route path="/vocabulary" element={<VocabularyView savedWords={savedWords} sessions={sessions} onUpdateWord={updateWord} />} />
          <Route path="/settings" element={<SettingsView apiConfig={apiConfig} onConfigChange={setApiConfig} sessions={sessions} onDeleteCache={deleteSession} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!isPlayerView && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<AudioSession[]>(() => {
    const saved = localStorage.getItem('echo_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    const saved = localStorage.getItem('echo_words_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [apiConfig, setApiConfig] = useState<AIProviderConfig>(() => {
    const saved = localStorage.getItem('echo_api_config');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });

  // PWA 安装提示状态
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // 监听 PWA 安装事件
  useEffect(() => {
    const handler = (e: Event) => {
      // 阻止默认的安装提示
      e.preventDefault();
      // 保存事件
      setDeferredPrompt(e);
      // 显示自定义安装提示
      setShowInstallPrompt(true);
      console.log('[PWA] beforeinstallprompt event fired');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 检查应用是否已安装
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] App was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return;
    }

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[PWA] User response: ${outcome}`);

    // 清除保存的 prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  useEffect(() => {
    localStorage.setItem('echo_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('echo_words_v2', JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    localStorage.setItem('echo_api_config', JSON.stringify(apiConfig));
  }, [apiConfig]);

  const addSession = (newSession: AudioSession) => setSessions(prev => [newSession, ...prev]);
  
  const updateSession = (id: string, updates: Partial<AudioSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const toggleWord = (word: string, sessionId: string, def?: any) => {
    const lower = word.toLowerCase();
    setSavedWords(prev => {
      const exists = prev.some(w => w.word.toLowerCase() === lower);
      if (exists) return prev.filter(w => w.word.toLowerCase() !== lower);
      
      const newWord: SavedWord = {
        word,
        sessionId,
        addedAt: Date.now(),
        nextReview: Date.now() + 24 * 60 * 60 * 1000, 
        stage: 0,
        definition: def?.definition,
        translation: def?.translation,
        phonetic: def?.phonetic
      };
      return [...prev, newWord];
    });
  };

  const updateWord = (word: string, updates: Partial<SavedWord>) => {
    setSavedWords(prev => prev.map(w => w.word.toLowerCase() === word.toLowerCase() ? { ...w, ...updates } : w));
  };

  return (
    <Router>
      {showInstallPrompt && (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
          <div className="bg-surface-dark border border-accent/30 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-slide-up">
            <div className="flex-1">
              <div className="text-white font-display font-semibold text-sm">
                安装 EchoListen
              </div>
              <div className="text-text-dim text-xs mt-1">
                安装后可离线使用，体验更流畅
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="px-4 py-2 rounded-xl text-text-dim text-sm hover:bg-white/5 transition-all active-scale"
              >
                暂不
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 rounded-xl bg-accent text-background-dark font-semibold text-sm hover:opacity-90 transition-all active-scale shadow-lg shadow-accent/30"
              >
                安装
              </button>
            </div>
          </div>
        </div>
      )}
      <AppContent
        sessions={sessions}
        addSession={addSession}
        updateSession={updateSession}
        deleteSession={deleteSession}
        savedWords={savedWords}
        toggleWord={toggleWord}
        updateWord={updateWord}
        apiConfig={apiConfig}
        setApiConfig={setApiConfig}
      />
    </Router>
  );
};

export default App;
