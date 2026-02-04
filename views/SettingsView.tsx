
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioSession, AIProviderConfig } from '../types.ts';

const LANGUAGES = [
  { code: 'en', name: 'English (Global)' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
];

interface SettingsViewProps {
  sessions?: AudioSession[];
  apiConfig: AIProviderConfig;
  onConfigChange: (c: AIProviderConfig) => void;
  onDeleteCache?: (id: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ sessions = [], apiConfig, onConfigChange, onDeleteCache }) => {
  const navigate = useNavigate();
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [localConfig, setLocalConfig] = useState<AIProviderConfig>({ ...apiConfig });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // 检查应用是否已安装
  React.useEffect(() => {
    // 检查是否在独立窗口运行（已安装）
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // 监听 beforeinstallprompt 事件
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[Settings] PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 监听安装完成事件
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[Settings] PWA installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[Settings] Install outcome:', outcome);
      setDeferredPrompt(null);
    } else {
      // 如果没有 deferredPrompt，尝试手动提示
      alert('请在浏览器地址栏点击安装图标，或使用浏览器菜单"安装应用"');
    }
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const updateConfig = (updates: Partial<AIProviderConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-32 bg-background-dark min-h-full">
      <header className="flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/')} className="size-10 flex items-center justify-center rounded-xl bg-surface-dark border border-white/5 active:scale-90 transition-transform">
             <span className="material-symbols-outlined text-gray-400">arrow_back</span>
           </button>
           <h1 className="font-display text-3xl font-black tracking-tight text-white">Settings</h1>
        </div>
      </header>

      {/* Provider Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <span className="material-symbols-outlined text-gray-500 text-sm">hub</span>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Model Provider</h3>
        </div>
        <div className="grid grid-cols-2 bg-surface-dark p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => updateConfig({ provider: 'gemini' })}
            className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${localConfig.provider === 'gemini' ? 'bg-primary text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Built-in Engine
          </button>
          <button 
            onClick={() => updateConfig({ provider: 'deepgram' })}
            className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${localConfig.provider === 'deepgram' ? 'bg-primary text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Custom ASR
          </button>
        </div>
      </section>

       {/* Preference Settings */}
      <section className="bg-surface-dark/40 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
        <div className="space-y-2">
          <label htmlFor="language-select" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Learning Language</label>
          <div className="relative">
            <select
              id="language-select"
              name="language"
              value={localConfig.deepgramLanguage}
              onChange={(e) => updateConfig({ deepgramLanguage: e.target.value })}
              className="w-full bg-background-dark border border-white/5 rounded-xl py-4 px-5 text-sm text-white appearance-none outline-none cursor-pointer focus:ring-1 focus:ring-accent"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
          </div>
        </div>

        {/* Deepgram API Key Configuration - Only show when Deepgram is selected */}
        {localConfig.provider === 'deepgram' && (
          <div className="space-y-2">
            <label htmlFor="deepgram-key" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Deepgram API Key</label>
            <div className="relative">
              <input
                id="deepgram-key"
                type="password"
                placeholder="Enter your Deepgram API key"
                value={localConfig.deepgramApiKey}
                onChange={(e) => updateConfig({ deepgramApiKey: e.target.value })}
                className="w-full bg-background-dark border border-white/5 rounded-xl py-4 px-5 text-sm text-white outline-none focus:ring-1 focus:ring-accent placeholder-gray-600"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">vpn_key</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Get your key from <a href="https://console.deepgram.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Deepgram Console</a>. Your key will be stored locally in your browser.
            </p>
          </div>
        )}

        {/* System Status - Different for each provider */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className={`size-10 rounded-xl bg-background-dark flex items-center justify-center ${localConfig.provider === 'deepgram' ? 'text-primary' : 'text-accent'}`}>
               <span className="material-symbols-outlined">{localConfig.provider === 'deepgram' ? 'cloud' : 'auto_awesome'}</span>
             </div>
             <div>
               <h4 className="font-black text-sm text-white">System Status</h4>
               <p className={`text-[10px] uppercase tracking-widest ${localConfig.provider === 'deepgram' ? 'text-primary' : 'text-green-400'}`}>
                 {localConfig.provider === 'deepgram' ? 'Deepgram Active' : 'Built-in Key Active'}
               </p>
             </div>
           </div>
           <p className="text-xs text-gray-400 leading-relaxed italic">
             {localConfig.provider === 'deepgram'
               ? "Using Deepgram's industry-leading speech recognition for accurate transcription and speaker identification."
               : "Using the system's pre-configured intelligence engine for high-speed transcription and analysis."
             }
           </p>
        </div>
      </section>

      {/* PWA Installation */}
      {!isInstalled && (
        <section className="bg-gradient-to-r from-primary/20 to-accent/10 p-6 rounded-[2.5rem] border border-accent/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
              <span className="material-symbols-outlined">download</span>
            </div>
            <div>
              <h4 className="font-black text-sm text-white">安装应用</h4>
              <p className="text-[10px] text-accent uppercase tracking-widest">
                {deferredPrompt ? '可以安装' : '查看浏览器菜单'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            安装后可离线使用，并在桌面创建快捷方式。体验更流畅的原生应用感觉！
          </p>
          <button
            onClick={handleInstall}
            disabled={!deferredPrompt}
            className={`w-full py-4 rounded-xl font-display text-sm font-black uppercase tracking-wider transition-all ${
              deferredPrompt
                ? 'bg-accent text-background-dark hover:opacity-90 shadow-lg shadow-accent/30'
                : 'bg-surface-dark text-gray-500 cursor-not-allowed'
            }`}
          >
            {deferredPrompt ? '立即安装' : '使用浏览器菜单安装'}
          </button>
        </section>
      )}

      {/* Save Button */}
      <button 
        onClick={handleSave}
        className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-primary to-accent border border-white/10 font-display text-lg font-black text-white shadow-2xl active:scale-[0.98] transition-all relative overflow-hidden group"
      >
        <div className={`absolute inset-0 bg-accent flex items-center justify-center transition-transform duration-500 ${saveFeedback ? 'translate-y-0' : 'translate-y-full'}`}>
          <span className="text-background-dark uppercase tracking-widest text-xs">Preferences Saved</span>
        </div>
        <span className="relative z-10">Save Preferences</span>
      </button>

      <div className="pt-4 text-center">
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">EchoListen v1.2.5 Stable</p>
      </div>
    </div>
  );
};

export default SettingsView;
