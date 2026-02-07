import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, MapPin, Trash2, Camera, Send, CheckCircle2, 
  Clock, Zap, Cpu, User, Sun, Moon, Mail, Lock, Search, Download, Share2
} from 'lucide-react';

// --- Инициализация Supabase ---
const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'ily4glotov@yandex.ru';
const TG_BOT_TOKEN = '8491548873:AAE_DDgazopwT0VXf51RKtA2gcvhmhBOKwk';
const TG_CHAT_ID = '1920949380';

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
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <Cpu className="animate-spin text-indigo-500" size={50} />
    </div>
  );

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- СТРАНИЦА АВТОРИЗАЦИИ (Вход + Регистрация) ---
function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Ошибка регистрации: " + error.message);
      else alert("Аккаунт создан! Теперь вы можете войти.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Ошибка входа: " + error.message);
    }
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500 animate-pulse" size={40} />
        <h2 className={`text-3xl font-black uppercase italic tracking-tighter mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Pomogator</h2>
        
        <form onSubmit={handleAuth} className="space-y-3 mb-6">
          <input type="email" placeholder="Email" required onChange={e => setEmail(e.target.value)} className={`w-full p-4 rounded-xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <input type="password" placeholder="Пароль" required onChange={e => setPassword(e.target.value)} className={`w-full p-4 rounded-xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <button className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
            {isRegistering ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black uppercase text-indigo-500 mb-6">
          {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
        </button>

        <div className="flex gap-4 border-t border-white/5 pt-6">
          <button onClick={() => alert("VK API в режиме модерации")} className="flex-1 bg-[#0077FF] py-3 rounded-xl flex justify-center text-white"><Share2 size={20}/></button>
          <button onClick={() => alert("Yandex API в режиме модерации")} className="flex-1 bg-red-500 py-3 rounded-xl flex justify-center text-white font-black">Я</button>
        </div>
      </div>
    </div>
  );
}

// --- ГЛАВНЫЙ ЭКРАН ---
function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`profile_${userEmail}`);
    return saved ? JSON.parse(saved) : { name: userEmail.split('@')[0], avatar: 'https://cdn-icons-png.flaticon.com/512/8727/8727604.png' };
  });

  useEffect(() => {
    fetchTickets();
    const ch = supabase.channel('realtime_db').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function fetchTickets() {
    let { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) data = data.filter(t => t.user_email === userEmail);
    setTickets(data || []);
  }

  // КНОПКА ОТЧЕТА (Безопасный метод для Vercel)
  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF();
      doc.text("POMOGATOR SYSTEM REPORT", 14, 20);
      doc.autoTable({
        head: [["ID", "TASK", "ROOM", "STATUS"]],
        body: tickets.map(t => [t.id.slice(0,5), t.title, t.room, t.status]),
        startY: 30
      });
      doc.save("Report.pdf");
    } catch (e) {
      alert("Библиотека PDF загружается, подождите пару секунд и нажмите еще раз!");
    }
  };

  const filtered = tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search));

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      {/* ШАПКА С КНОПКОЙ ПРОФИЛЯ */}
      <header className={`h-20 px-8 border-b flex items-center justify-between sticky top-0 backdrop-blur-xl z-50 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
          <img src={profile.avatar} className="w-10 h-10 rounded-xl border-2 border-indigo-500 object-cover" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-black uppercase italic leading-none">Pomogator</h1>
            <p className="text-[8px] text-indigo-500 font-bold uppercase">{profile.name}</p>
          </div>
        </div>

        <div className="flex-1 max-w-xs mx-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
          <input placeholder="Поиск..." onChange={e => setSearch(e.target.value)} className={`w-full py-2 pl-10 rounded-xl outline-none text-xs border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="p-2 text-emerald-500"><Download size={20}/></button>
          <button onClick={() => setIsDark(!isDark)} className="p-2">{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-500/50"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Заявки ({filtered.length})</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={profile.name} />}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {filtered.map(t => (
            <div key={t.id} className={`p-8 rounded-[2.5rem] border transition-all ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">{t.title}</h3>
                <span className={`text-[8px] font-black px-2 py-1 rounded-lg ${t.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'} text-white`}>{t.status.toUpperCase()}</span>
              </div>
              <div className="flex gap-4 text-[9px] font-bold text-slate-500 mb-6 uppercase">
                <span>📍 Каб. {t.room}</span>
                <span>👤 {t.user_name}</span>
              </div>
              {isAdmin && t.status !== 'done' && (
                <button onClick={async () => { await supabase.from('tickets').update({status: 'done'}).eq('id', t.id); fetchTickets(); }} className="w-full bg-emerald-600 py-3 rounded-xl text-[9px] font-black text-white uppercase mb-4">Решено</button>
              )}
              <Chat ticketId={t.id} userEmail={userEmail} userName={profile.name} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>

      {/* ОКНО ПРОФИЛЯ */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className={`p-10 rounded-[3rem] w-full max-w-sm text-center border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-2xl font-black uppercase italic mb-6">Профиль</h2>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <img src={profile.avatar} className="w-full h-full rounded-2xl object-cover border-2 border-indigo-500" />
            </div>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className={`w-full p-4 rounded-xl mb-4 font-bold outline-none border ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsSettingsOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white uppercase tracking-widest">Сохранить</button>
            <button onClick={() => setIsSettingsOpen(false)} className="mt-4 text-[8px] text-slate-500 font-black uppercase">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ЧАТ REALTIME ---
function Chat({ ticketId, userEmail, userName, isDark }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchMsgs();
    const ch = supabase.channel(`chat_${ticketId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, (p) => {
      setMessages(prev => [...prev, p.new]);
    }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [ticketId]);

  async function fetchMsgs() {
    const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages(data || []);
  }

  const send = async () => {
    if (!msg.trim()) return;
    await supabase.from('ticket_comments').insert([{ ticket_id: ticketId, user_email: userEmail, user_name: userName, message: msg }]);
    setMsg('');
  };

  return (
    <div className={`mt-2 rounded-2xl p-4 ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
      <div className="max-h-24 overflow-y-auto space-y-2 mb-3 pr-2 text-[9px] font-bold">
        {messages.map(m => (
          <p key={m.id} className={m.user_email === userEmail ? 'text-right text-indigo-400' : 'text-left'}>{m.message}</p>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ответить..." className="flex-1 bg-transparent outline-none text-[10px] font-bold" />
        <button onClick={send} className="text-indigo-500"><Send size={14}/></button>
      </div>
    </div>
  );
}

// --- КНОПКА НОВОЙ ЗАДАЧИ ---
function NewTicketBtn({ onCreated, userEmail, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');

  const handleSend = async () => {
    if (!title || !room) return alert("Заполните всё!");
    await supabase.from('tickets').insert([{ title, room, user_email: userEmail, user_name: userName, status: 'new' }]);
    setIsOpen(false);
    onCreated();
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-black uppercase text-white shadow-lg">Новая задача</button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="p-10 rounded-[3rem] w-full max-w-md bg-slate-900 border border-white/10">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-indigo-500">Создать заявку</h2>
            <input placeholder="Что сломалось?" onChange={e => setTitle(e.target.value)} className="w-full p-4 rounded-xl mb-3 bg-white/5 border-none text-white font-bold" />
            <input placeholder="Кабинет" onChange={e => setRoom(e.target.value)} className="w-full p-4 rounded-xl mb-6 bg-white/5 border-none text-white font-bold" />
            <button onClick={handleSend} className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white uppercase tracking-widest">Отправить</button>
            <button onClick={() => setIsOpen(false)} className="w-full mt-4 text-[9px] text-slate-500 font-black uppercase">Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}
