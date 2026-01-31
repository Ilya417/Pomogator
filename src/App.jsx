import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, MapPin, Settings, Trash2, Camera, FileUp, 
  ExternalLink, Send, CheckCircle2, Clock, Zap, Globe, Cpu, 
  User, Sun, Moon, Mail, Lock
} from 'lucide-react';

// --- Инициализация Supabase ---
const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Настройки уведомлений ---
const ADMIN_EMAIL = 'ily4glotov@yandex.ru';
const TG_BOT_TOKEN = '8525863322:AAHpkeIzdBIzgpxg1DCuOqR7z0ihzfS_yMo';
const TG_CHAT_ID = '1920949380';

const sendTgMessage = async (ticket) => {
  const priorityEmoji = ticket.priority === 'urgent' ? '🚨 СРОЧНО' : '☕ ОБЫЧНАЯ';
  const text = `🚀 ПОМОГАТОР: НОВАЯ ЗАДАЧА\n\n` +
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
  } catch (e) { console.error("Ошибка TG"); }
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
      <Cpu className={`animate-pulse ${isDark ? 'text-indigo-500' : 'text-indigo-600'}`} size={60} />
      <p className="mt-4 font-black uppercase tracking-[0.3em] text-indigo-500 text-xs">Запуск системы Pomogator...</p>
    </div>
  );

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- Загрузка файлов ---
async function uploadFile(file, folder = 'tickets') {
  if (!file) return null;
  const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const filePath = `${folder}/${fileName}`;
  const { data, error } = await supabase.storage.from('uploads').upload(filePath, file);
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return publicUrl;
}

// --- Чат ---
function Chat({ ticketId, userEmail, userName, isDark }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
    const sub = supabase.channel(`chat-${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, fetchMessages)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [ticketId]);

  async function fetchMessages() {
    const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    await supabase.from('ticket_comments').insert([{
      ticket_id: ticketId, user_email: userEmail, user_name: userName, message: newMessage
    }]);
    setNewMessage('');
  }

  return (
    <div className={`mt-6 rounded-3xl p-4 border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
      <div className="max-h-32 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`text-[11px] p-3 rounded-2xl transition-all ${m.user_email === 'system' ? 'bg-indigo-500/10 text-center text-indigo-400' : m.user_email === userEmail ? 'bg-indigo-600/20 ml-6 border-r-2 border-indigo-500' : 'bg-slate-500/10 mr-6 border-l-2 border-slate-400'}`}>
            <span className="font-black opacity-40 block mb-1 uppercase text-[9px]">{m.user_name}</span>
            {m.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Написать..." className={`flex-1 p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-white/5 text-white' : 'bg-white text-slate-900 border border-slate-200'}`} />
        <button onClick={sendMessage} className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 active:scale-95 transition-all shadow-lg"><Send size={14} className="text-white"/></button>
      </div>
    </div>
  );
}

// --- Авторизация ---
function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Ошибка: " + error.message);
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-12 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl animate-slide-up border ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-6 text-indigo-500 animate-bounce-slow" size={60} />
        <h2 className={`text-4xl font-black uppercase italic mb-2 tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Pomogator</h2>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-10 text-indigo-500">Support System 2.0</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} className={`w-full p-5 rounded-2xl outline-none border transition-all ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-600'}`} />
          <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} className={`w-full p-5 rounded-2xl outline-none border transition-all ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-600'}`} />
          <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 text-white">
            {isSignUp ? 'Регистрация' : 'Вход'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-8 text-[9px] text-slate-500 uppercase font-black hover:text-indigo-400 tracking-[0.2em]">
          {isSignUp ? 'Есть аккаунт? Войти' : 'Создать новый аккаунт'}
        </button>
      </div>
    </div>
  );
}

// --- Основное приложение ---
function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`profile_${userEmail}`);
    return saved ? JSON.parse(saved) : {
      name: userEmail.split('@')[0],
      avatar: 'https://cdn-icons-png.flaticon.com/512/8727/8727604.png',
      role: isAdmin ? 'Администратор' : 'Сотрудник'
    };
  });

  useEffect(() => {
    fetchTickets();
    const sub = supabase.channel('realtime-pomogator').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchTickets() {
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('user_email', userEmail);
    const { data } = await query;
    setTickets(data || []);
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
    fetchTickets();
  }

  const stats = {
    total: tickets.length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    efficiency: Math.round((tickets.filter(t => t.status === 'done').length / (tickets.length || 1)) * 100)
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-24 border-b flex items-center px-10 justify-between sticky top-0 backdrop-blur-2xl z-40 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
          <div className="relative">
            <img src={profile.avatar} className="w-12 h-12 rounded-2xl border-2 border-indigo-500/40 object-cover" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-current"></div>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-black leading-none">{profile.name}</p>
            <p className="text-[9px] text-indigo-500 uppercase font-black mt-1 tracking-widest">{profile.role}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={() => setIsDark(!isDark)} className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-indigo-600'}`}>
              {isDark ? <Sun size={20}/> : <Moon size={20}/>}
           </button>
           <button onClick={() => setIsSettingsOpen(true)} className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}><Settings size={20}/></button>
           <button onClick={() => supabase.auth.signOut()} className="p-3 text-red-500/50 hover:text-red-500 transition-all"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:row justify-between items-start md:items-end mb-12 gap-6">
           <div>
              <h1 className={`text-5xl font-black uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Pomogator</h1>
              <div className="h-1 w-16 bg-indigo-600 mt-2 rounded-full"></div>
           </div>
           
           <div className="flex gap-3">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                <p className="text-[8px] font-black uppercase text-slate-500">Всего заявок</p>
                <p className="text-xl font-black">{stats.total}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <p className="text-[8px] font-black uppercase text-red-500">Срочно</p>
                <p className="text-xl font-black text-red-500">{stats.urgent}</p>
              </div>
              {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} profile={profile} isDark={isDark} />}
           </div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {tickets.map((t, i) => (
            <div key={t.id} style={{animationDelay: `${i * 100}ms`}} className={`p-8 rounded-[3rem] transition-all animate-slide-up border ${isDark ? 'bg-slate-900/40 border-white/5 hover:bg-slate-900/60' : 'bg-white border-slate-200 shadow-xl shadow-black/5'} ${t.priority === 'urgent' && t.status !== 'done' ? 'ring-1 ring-red-500/50' : ''}`}>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${t.priority === 'urgent' ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-500'}`}>
                        {t.priority === 'urgent' ? 'Критично' : 'Обычная'}
                      </span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                        {t.status === 'new' ? 'Очередь' : t.status === 'process' ? 'В работе' : 'Готово'}
                      </span>
                   </div>
                   <h3 className={`text-2xl font-black tracking-tighter uppercase italic ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h3>
                </div>
                {isAdmin && (
                  <button onClick={async () => { if(confirm("Удалить?")) await supabase.from('tickets').delete().eq('id', t.id); fetchTickets(); }} className="text-slate-500 hover:text-red-500 transition-all p-2"><Trash2 size={18}/></button>
                )}
              </div>

              {isAdmin && t.status !== 'done' && (
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button onClick={() => updateStatus(t.id, 'process')} className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl text-[9px] font-black uppercase text-white transition-all">В работу</button>
                  <button onClick={() => updateStatus(t.id, 'done')} className="bg-emerald-600 hover:bg-emerald-500 py-3 rounded-2xl text-[9px] font-black uppercase text-white transition-all">Завершить</button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[9px] font-black uppercase mb-4 opacity-70">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-indigo-500"/> Каб. {t.room}</span>
                <span className="flex items-center gap-1"><User size={12}/> {t.user_name}</span>
                {t.file_url && <a href={t.file_url} target="_blank" rel="noreferrer" className="text-indigo-500 flex items-center gap-1"><ExternalLink size={12}/> Файл</a>}
              </div>

              <Chat ticketId={t.id} userEmail={userEmail} userName={profile.name} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className={`p-10 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl animate-scale-up border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-2xl font-black uppercase italic mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Мой Профиль</h2>
            <div className="relative w-24 h-24 mx-auto mb-8 group">
              <img src={profile.avatar} className="w-full h-full rounded-[2rem] object-cover border-4 border-indigo-500 shadow-xl" />
              <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/60 rounded-[2rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                <Camera size={24} className="text-white"/>
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                  const url = await uploadFile(e.target.files[0], 'avatars');
                  if (url) setProfile(prev => ({...prev, avatar: url}));
                }} />
              </label>
            </div>
            <div className="space-y-3 mb-8">
               <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className={`w-full p-4 rounded-2xl font-bold outline-none border ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} placeholder="Имя" />
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => alert("Инструкция отправлена")} className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase ${isDark ? 'bg-white/5 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}><Mail size={12}/> Почта</button>
                  <button onClick={() => alert("Ссылка отправлена")} className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase ${isDark ? 'bg-white/5 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}><Lock size={12}/> Пароль</button>
               </div>
            </div>
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsSettingsOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg">Сохранить</button>
            <button onClick={() => setIsSettingsOpen(false)} className="mt-4 text-[9px] text-slate-500 uppercase font-black">Закрыть</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.6s ease-out both; }
        .animate-fade-in { animation: fade-in 0.3s ease-out both; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67) both; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- Кнопка создания задачи ---
function NewTicketBtn({ onCreated, userEmail, profile, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', room: '', file: null, priority: 'normal' });
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!form.title || !form.room) return alert("Заполните поля!");
    setLoading(true);
    const url = form.file ? await uploadFile(form.file) : null;
    const ticketData = { title: form.title, room: form.room, user_email: userEmail, user_name: profile.name, status: 'new', file_url: url, priority: form.priority };
    const { data: newTicket, error } = await supabase.from('tickets').insert([ticketData]).select().single();
    if(!error && newTicket) {
      await supabase.from('ticket_comments').insert([{ ticket_id: newTicket.id, user_email: 'system', user_name: 'POMOGATOR AI', message: 'Заявка принята. Ожидайте специалиста.' }]);
      await sendTgMessage(ticketData); 
      setIsOpen(false);
      setForm({ title: '', room: '', file: null, priority: 'normal' });
      onCreated();
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all">
        <Plus size={32} className="text-white"/>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className={`p-10 rounded-[3rem] w-full max-w-lg shadow-2xl animate-scale-up border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-3xl font-black uppercase italic mb-8 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Новая Задача</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => setForm({...form, priority: 'urgent'})} className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.priority === 'urgent' ? 'bg-red-500 text-white' : (isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Критично 🚨</button>
              <button onClick={() => setForm({...form, priority: 'normal'})} className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.priority === 'normal' ? 'bg-indigo-600 text-white' : (isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Обычная ☕</button>
            </div>
            <div className="space-y-3 mb-8">
              <input onChange={e => setForm({...form, title: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-600'}`} placeholder="Что нужно сделать?" />
              <input onChange={e => setForm({...form, room: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-600'}`} placeholder="Номер кабинета" />
              <label className={`flex items-center gap-3 w-full p-5 rounded-2xl border border-dashed cursor-pointer ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <FileUp className="text-indigo-500" size={20}/>
                <span className="text-[9px] text-slate-500 font-black uppercase truncate">{form.file ? form.file.name : 'Прикрепить файл'}</span>
                <input type="file" className="hidden" onChange={e => setForm({...form, file: e.target.files[0]})} />
              </label>
            </div>
            <button onClick={handleSend} disabled={loading} className="w-full bg-indigo-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl text-white hover:bg-indigo-500 transition-all disabled:opacity-50">
              {loading ? 'Отправка...' : 'Создать Заявку'}
            </button>
            <button onClick={() => setIsOpen(false)} className="w-full mt-4 text-[9px] text-slate-500 uppercase font-black">Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}
