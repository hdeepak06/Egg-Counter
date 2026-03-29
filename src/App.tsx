import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  History, 
  BarChart3, 
  MessageSquare, 
  Moon, 
  Sun, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ChevronLeft,
  Egg,
  Flame,
  TrendingUp,
  Send
} from 'lucide-react';
import { EggLog, UserStats, ChatMessage } from './types';
import { analyzeProtein } from './services/geminiService';

// --- Components ---

const Keypad = ({ onInput, onClear, onSave, currentInput }: { 
  onInput: (val: string) => void, 
  onClear: () => void, 
  onSave: () => void,
  currentInput: string 
}) => {
  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'Save'];

  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-xs mx-auto mt-8">
      {buttons.map((btn) => (
        <motion.button
          key={btn}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (btn === 'C') onClear();
            else if (btn === 'Save') onSave();
            else onInput(btn);
          }}
          className={`h-16 rounded-2xl flex items-center justify-center text-xl font-semibold shadow-sm
            ${btn === 'Save' ? 'bg-amber-500 text-white col-span-1' : 
              btn === 'C' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}
        >
          {btn === 'Save' ? <Save size={24} /> : btn}
        </motion.button>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center space-y-2">
    <div className={`p-2 rounded-full ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{label}</span>
  </div>
);

const HistoryItem = ({ log, onDelete, onEdit }: { 
  log: EggLog, 
  onDelete: (id: string) => void, 
  onEdit: (log: EggLog) => void,
  key?: string | number
}) => {
  const date = new Date(log.date);
  const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between mb-3"
    >
      <div className="flex items-center space-x-4">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
          <Egg className="text-amber-600 dark:text-amber-400" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg">{log.count} Eggs</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{formattedDate}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button onClick={() => onEdit(log)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
          <Edit2 size={18} />
        </button>
        <button onClick={() => onDelete(log.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [logs, setLogs] = useState<EggLog[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [view, setView] = useState<'home' | 'history' | 'stats' | 'chat' | 'settings'>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I am your Egg Counter Protein Assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingLog, setEditingLog] = useState<EggLog | null>(null);

  const resetData = () => {
    if (window.confirm('Are you sure you want to delete all your logs? This cannot be undone.')) {
      setLogs([]);
      localStorage.removeItem('egg_logs');
    }
  };

  // Load data
  useEffect(() => {
    const savedLogs = localStorage.getItem('egg_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('egg_logs', JSON.stringify(logs));
  }, [logs]);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleInput = (val: string) => {
    if (currentInput.length < 2) {
      setCurrentInput(prev => prev + val);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    const count = parseInt(currentInput);
    if (isNaN(count)) return;

    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);

    if (editingLog) {
      setLogs(prev => prev.map(l => l.id === editingLog.id ? { ...l, count } : l));
      setEditingLog(null);
    } else {
      const newLog: EggLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        count
      };
      setLogs(prev => [newLog, ...prev]);
    }
    setCurrentInput('');
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const startEdit = (log: EggLog) => {
    setEditingLog(log);
    setCurrentInput(log.count.toString());
    setView('home');
  };

  const calculateStats = (): UserStats => {
    if (logs.length === 0) return { streak: 0, averagePerDay: 0, weeklyTotal: 0, monthlyTotal: 0 };

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(today);
    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      
      if (logDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (logDate.getTime() < checkDate.getTime()) {
        break;
      }
    }

    const totalEggs = logs.reduce((sum, l) => sum + l.count, 0);
    const uniqueDays = new Set(logs.map(l => new Date(l.date).toDateString())).size;
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyTotal = logs.filter(l => new Date(l.date) >= oneWeekAgo).reduce((sum, l) => sum + l.count, 0);
    const monthlyTotal = logs.filter(l => new Date(l.date) >= oneMonthAgo).reduce((sum, l) => sum + l.count, 0);

    return {
      streak,
      averagePerDay: parseFloat((totalEggs / uniqueDays).toFixed(1)),
      weeklyTotal,
      monthlyTotal
    };
  };

  const stats = calculateStats();

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    const response = await analyzeProtein(chatInput);
    setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 p-2 rounded-xl text-white">
            <Egg size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Egg Counter</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center"
            >
              <div className="mt-4 w-full bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                <AnimatePresence>
                  {isSaving && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-amber-500/20 p-8 rounded-full">
                        <Egg className="text-amber-500" size={64} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  {editingLog ? 'Editing Entry' : 'Eggs Eaten Today'}
                </span>
                <div className="flex items-baseline">
                  <span className="text-7xl font-black text-amber-500">{currentInput || '0'}</span>
                  <Egg className="ml-2 text-amber-300" size={32} />
                </div>
              </div>

              <Keypad 
                onInput={handleInput} 
                onClear={() => setCurrentInput('')} 
                onSave={handleSave}
                currentInput={currentInput}
              />

              {editingLog && (
                <button 
                  onClick={() => { setEditingLog(null); setCurrentInput(''); }}
                  className="mt-4 text-slate-500 flex items-center space-x-1"
                >
                  <X size={16} />
                  <span>Cancel Edit</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl flex items-center space-x-3">
                  <Flame className="text-orange-500" size={24} />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Streak</p>
                    <p className="text-xl font-black">{stats.streak} Days</p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-center space-x-3">
                  <TrendingUp className="text-blue-500" size={24} />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Avg/Day</p>
                    <p className="text-xl font-black">{stats.averagePerDay}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-6">History</h2>
              {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No logs yet. Start eating!</p>
                </div>
              ) : (
                logs.map(log => (
                  <HistoryItem key={log.id} log={log} onDelete={deleteLog} onEdit={startEdit} />
                ))
              )}
            </motion.div>
          )}

          {view === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h2 className="text-2xl font-bold mb-6">Analytics</h2>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Weekly" value={stats.weeklyTotal} icon={BarChart3} color="bg-indigo-500" />
                <StatCard label="Monthly" value={stats.monthlyTotal} icon={TrendingUp} color="bg-emerald-500" />
                <StatCard label="Avg/Day" value={stats.averagePerDay} icon={Egg} color="bg-amber-500" />
                <StatCard label="Streak" value={stats.streak} icon={Flame} color="bg-orange-500" />
              </div>

              <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold mb-4">Protein Insight</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  You've consumed approximately <span className="text-amber-500 font-bold">{stats.weeklyTotal * 6.5}g</span> of protein from eggs this week. 
                  Eggs are a complete protein source containing all 9 essential amino acids.
                </p>
              </div>
            </motion.div>
          )}

          {view === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-[60vh]"
            >
              <h2 className="text-2xl font-bold mb-4">Protein AI</h2>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-amber-500 text-white rounded-tr-none' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChatSubmit} className="relative">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about protein..."
                  className="w-full bg-slate-100 dark:bg-slate-800 p-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-xl"
                >
                  <Send size={20} />
                </button>
              </form>
            </motion.div>
          )}
          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                    <span className="font-semibold">Dark Mode</span>
                  </div>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-amber-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <a 
                  href="https://github.com/HDeepak6/Egg-counter" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                      <Plus size={20} className="rotate-45" /> {/* Using Plus as a placeholder for GitHub icon if needed, or just text */}
                    </div>
                    <div>
                      <span className="font-semibold block">GitHub Repository</span>
                      <span className="text-xs text-slate-500">View source code</span>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="rotate-180 text-slate-400" />
                </a>

                <div className="pt-8">
                  <button 
                    onClick={resetData}
                    className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl font-bold flex items-center justify-center space-x-2"
                  >
                    <Trash2 size={20} />
                    <span>Reset All Data</span>
                  </button>
                </div>

                <div className="text-center pt-12">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Egg Counter v1.0.0</p>
                  <p className="text-[10px] text-slate-400 mt-1">Made with ❤️ for healthy habits</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 px-4 py-4 flex justify-between items-center z-20">
        <NavButton active={view === 'home'} onClick={() => setView('home')} icon={Plus} label="Track" />
        <NavButton active={view === 'history'} onClick={() => setView('history')} icon={History} label="Logs" />
        <NavButton active={view === 'stats'} onClick={() => setView('stats')} icon={BarChart3} label="Stats" />
        <NavButton active={view === 'chat'} onClick={() => setView('chat')} icon={MessageSquare} label="AI" />
        <NavButton active={view === 'settings'} onClick={() => setView('settings')} icon={Edit2} label="Settings" />
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);
