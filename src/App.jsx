import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, MapPin, Settings, Trash2, Camera, FileUp, 
  ExternalLink, Send, CheckCircle2, Clock, Zap, Globe, Cpu, 
  User, Sun, Moon, Mail, Lock, Search, Download, Share2, Filter, BarChart3
} from 'lucide-react';

// --- Конфигурация ---
const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'ily4glotov@yandex.ru';
const TG_BOT_TOKEN = '8491548873:AAE_DDgazopwT0VXf51RKtA2gcvhmhBOKwk';
const TG_CHAT_ID = '1920949380';

// --- Уведомления Telegram ---
const sendTgMessage = async (ticket) => {
  const priorityEmoji = ticket.priority === 'urgent' ? '🚨 СРОЧНО' : '☕ ОБЫЧНАЯ';
  const text = `🚀 POMOGATOR: НОВАЯ ЗАДАЧА\n\n` +
               `📌 Тема: ${ticket.title}\n` +
               `📍 Кабинет: ${ticket.room}\n` +
               `👤 Отправитель: ${ticket.user_name}\n` +
               `⚡ Приоритет: ${priorityEmoji}`;
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text })
    });
  } catch (e) { console.error("TG Error"); }
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className={`h-screen flex flex-col items-center justify-center ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <Cpu className={`animate-spin-slow ${isDark ? 'text-indigo-500' : 'text-indigo-600'}`} size={60} />
      <p className="mt-4 font-black uppercase tracking-[0.3em] text-indigo-500 text-xs">Pomogator Engine Loading...</p>
    </div>
  );

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- Авторизация ---
function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginWithSocial = (name) => {
    alert(`🔐 Авторизация через ${name} сейчас находится на стадии модерации API.\n\nПожалуйста, используйте вход по Email для демонстрации.`);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: upErr } = await supabase.auth.signUp({ email, password });
      if (upErr) alert(upErr.message);
    }
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-12 rounded-[4rem] w-full max-w-md text-center shadow-2xl border ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-6 text-indigo-500 animate-bounce-slow" size={60} />
        <h2 className={`text-5xl font-black uppercase italic tracking-tighter mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Pomogator</h2>
        
        <form onSubmit={handleAuth} className="space-y-4 mb-10">
          <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} className={`w-full p-5 rounded-2xl outline-none border transition-all ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} className={`w-full p-5 rounded-2xl outline-none border transition-all ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20">Войти в систему</button>
        </form>

        <div className="flex gap-4">
          <button onClick={() => loginWithSocial('ВКонтакте')} className="flex-1 bg-[#4C75A3] py-4 rounded-2xl flex justify-center text-white hover:opacity-90 transition-all">
            <Share2 size={24}/>
          </button>
          <button onClick={() => loginWithSocial('Яндекс')} className="flex-1 bg-red-500 py-4 rounded-2xl flex justify-center text-white hover:opacity-90 transition-all font-black text-xl">
            Я
          </button>
        </div>
        <p className="mt-6 text-[9px] text-slate-500 uppercase font-bold tracking-widest">Social Auth v1.0 (Beta)</p>
      </div>
    </div>
  );
}

// --- Главная ---
function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`profile_${userEmail}`);
    return saved ? JSON.parse(saved) : { name: userEmail.split('@')[0], avatar: 'https://cdn-icons-png.flaticon.com/512/8727/8727604.png' };
  });

  useEffect(() => {
    fetchTickets();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchTickets() {
    let { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) data = data.filter(t => t.user_email === userEmail);
    setTickets(data || []);
  }

  const exportCSV = () => {
    const rows = [["Дата", "Задача", "Кабинет", "Статус"], ...tickets.map(t => [new Date(t.created_at).toLocaleDateString(), t.title, t.room, t.status])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'report.csv'; a.click();
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`min-h-screen transition-all ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-24 px-10 border-b flex items-center justify-between sticky top-0 backdrop-blur-xl z-40 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
          <img src={profile.avatar} className="w-12 h-12 rounded-2xl border-2 border-indigo-500 object-cover shadow-lg" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-black leading-none uppercase italic tracking-tighter">Pomogator</h1>
            <p className="text-[9px] text-indigo-500 font-black uppercase mt-1 tracking-widest">{isAdmin ? 'Администратор' : 'Сотрудник'}</p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
          <input placeholder="Поиск по задачам..." onChange={e => setSearch(e.target.value)} className={`w-full py-3 pl-12 pr-4 rounded-2xl outline-none border transition-all text-xs ${isDark ? 'bg-white/5 border-white/5 focus:border-indigo-500' : 'bg-slate-100 border-slate-200'}`} />
        </div>

        <div className="flex items-center gap-4">
          <button onClick={exportCSV} className="p-3 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"><Download size={22}/></button>
          <button onClick={() => setIsDark(!isDark)} className="p-3 bg-white/5 rounded-xl transition-all">
            {isDark ? <Sun className="text-yellow-400" size={22}/> : <Moon className="text-indigo-600" size={22}/>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 text-red-500/50 hover:text-red-500"><LogOut size={22}/></button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-3 mb-12">
          {['all', 'new', 'process', 'done'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
              {f === 'all' ? 'Все' : f === 'new' ? 'Новые' : f === 'process' ? 'В работе' : 'Готово'}
            </button>
          ))}
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={profile.name} isDark={isDark} />}
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {filtered.map(t => (
            <div key={t.id} className={`p-10 rounded-[3.5rem] border animate-slide-up transition-all ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-black/5'} ${t.priority === 'urgent' && t.status !== 'done' ? 'ring-2 ring-red-500/30' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase mb-2 inline-block ${t.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-indigo-500/20 text-indigo-500'}`}>{t.priority === 'urgent' ? 'Критично' : 'Обычная'}</span>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{t.title}</h3>
                </div>
                {isAdmin && (
                  <button onClick={async () => { if(confirm("Удалить?")) await supabase.from('tickets').delete().eq('id', t.id); fetchTickets(); }} className="text-slate-600 hover:text-red-500"><Trash2 size={20}/></button>
                )}
              </div>

              {isAdmin && t.status !== 'done' && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button onClick={async () => { await supabase.from('tickets').update({status: 'process'}).eq('id', t.id); fetchTickets(); }} className="bg-indigo-600 py-4 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-indigo-500 transition-all">Принять</button>
                  <button onClick={async () => { await supabase.from('tickets').update({status: 'done'}).eq('id', t.id); fetchTickets(); }} className="bg-emerald-600 py-4 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-emerald-500 transition-all">Решено</button>
                </div>
              )}

              <div className="flex gap-6 text-[10px] font-black uppercase text-slate-500 mb-6">
                <span className="flex items-center gap-1"><MapPin size={14} className="text-indigo-500"/> Каб. {t.room}</span>
                <span className="flex items-center gap-1"><User size={14}/> {t.user_name}</span>
              </div>

              <Chat ticketId={t.id} userEmail={userEmail} userName={profile.name} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className={`p-12 rounded-[4rem] w-full max-w-md text-center border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-3xl font-black uppercase italic mb-8">Профиль</h2>
            <div className="relative w-24 h-24 mx-auto mb-8 group">
              <img src={profile.avatar} className="w-full h-full rounded-[2rem] object-cover border-4 border-indigo-500 shadow-xl" />
              <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/60 rounded-[2rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                <Camera size={24} className="text-white"/>
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                  const fileName = `${Date.now()}_avatar`;
                  const { data } = await supabase.storage.from('uploads').upload(`avatars/${fileName}`, e.target.files[0]);
                  if (data) {
                    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(`avatars/${fileName}`);
                    setProfile(prev => ({...prev, avatar: publicUrl}));
                  }
                }} />
              </label>
            </div>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className={`w-full p-5 rounded-2xl mb-4 font-bold outline-none border ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsSettingsOpen(false); }} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white uppercase tracking-widest shadow-lg">Сохранить</button>
            <button onClick={() => setIsSettingsOpen(false)} className="mt-4 text-[9px] text-slate-500 uppercase font-black">Закрыть</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) both; }
        .animate-fade-in { animation: fade-in 0.4s ease-out both; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- Чат ---
function Chat({ ticketId, userEmail, userName, isDark }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
    const sub = supabase.channel(`chat-${ticketId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, fetchMessages).subscribe();
    return () => supabase.removeChannel(sub);
  }, [ticketId]);

  async function fetchMessages() {
    const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    await supabase.from('ticket_comments').insert([{ ticket_id: ticketId, user_email: userEmail, user_name: userName, message: newMessage }]);
    setNewMessage('');
  }

  return (
    <div className={`mt-6 rounded-[2.5rem] p-5 border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
      <div className="max-h-24 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar text-[10px] font-bold">
        {messages.map(m => (
          <div key={m.id} className={m.user_email === userEmail ? 'text-right' : 'text-left'}>
            <span className={`inline-block px-4 py-2 rounded-2xl ${m.user_email === userEmail ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'}`}>{m.message}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Написать..." className="flex-1 bg-transparent outline-none text-[11px] font-bold" />
        <button onClick={sendMessage} className="text-indigo-500 hover:scale-110 transition-all"><Send size={18}/></button>
      </div>
    </div>
  );
}

// --- Кнопка создания ---
function NewTicketBtn({ onCreated, userEmail, userName, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', room: '', priority: 'normal' });

  const handleSend = async () => {
    if (!form.title || !form.room) return alert("Заполните поля!");
    const { data, error } = await supabase.from('tickets').insert([{ ...form, user_email: userEmail, user_name: userName, status: 'new' }]).select().single();
    if (!error) {
      await sendTgMessage({ ...form, user_name: userName });
      setIsOpen(false);
      onCreated();
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-8 py-2 rounded-full text-[10px] font-black uppercase text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all">Новая задача</button>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className={`p-12 rounded-[4rem] w-full max-w-lg border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-3xl font-black uppercase italic mb-8 text-indigo-500">Создать задачу</h2>
            <div className="space-y-4">
              <input placeholder="Что сломалось?" onChange={e => setForm({...form, title: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
              <input placeholder="Кабинет" onChange={e => setForm({...form, room: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setForm({...form, priority: 'urgent'})} className={`py-4 rounded-xl text-[9px] font-black uppercase ${form.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-white/5'}`}>Критично 🚨</button>
                <button onClick={() => setForm({...form, priority: 'normal'})} className={`py-4 rounded-xl text-[9px] font-black uppercase ${form.priority === 'normal' ? 'bg-indigo-600 text-white' : 'bg-white/5'}`}>Обычная ☕</button>
              </div>
              <button onClick={handleSend} className="w-full bg-indigo-600 py-6 rounded-3xl font-black text-white uppercase tracking-widest shadow-xl">Отправить в IT</button>
              <button onClick={() => setIsOpen(false)} className="w-full mt-4 text-[10px] text-slate-500 uppercase font-black">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
