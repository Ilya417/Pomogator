import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, MapPin, Trash2, Camera, Send, CheckCircle2, 
  Clock, Zap, Cpu, User, Sun, Moon, Mail, Lock, Search, Download
} from 'lucide-react';

// --- Инициализация Supabase ---
const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Настройки уведомлений ---
const ADMIN_EMAIL = 'ily4glotov@yandex.ru';
const TG_BOT_TOKEN = '8491548873:AAE_DDgazopwT0VXf51RKtA2gcvhmhBOKwk';
const TG_CHAT_ID = '1920949380';

// Функция уведомления в Telegram
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
  } catch (e) { console.error("TG Error", e); }
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
      <Cpu className="animate-spin text-indigo-500 mb-4" size={60} />
      <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 animate-pulse">Pomogator Engine v3.0</div>
    </div>
  );

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- СТРАНИЦА АВТОРИЗАЦИИ С ЛОГОТИПАМИ ВК/ЯНДЕКС ---
function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) alert(signUpError.message);
      else alert("Аккаунт создан! Проверьте почту или войдите.");
    }
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-12 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl border transition-all ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-6 text-indigo-500 animate-pulse" size={50} />
        <h2 className={`text-4xl font-black uppercase italic tracking-tighter mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Pomogator</h2>
        
        <form onSubmit={handleAuth} className="space-y-4 mb-10">
          <input type="email" placeholder="Email" required onChange={e => setEmail(e.target.value)} className={`w-full p-4 rounded-2xl outline-none border transition-all font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <input type="password" placeholder="Пароль" required onChange={e => setPassword(e.target.value)} className={`w-full p-4 rounded-2xl outline-none border transition-all font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all active:scale-95">Войти</button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}></div></div>
          <span className={`relative px-4 text-[9px] uppercase font-black tracking-widest ${isDark ? 'bg-[#0b1224] text-slate-500' : 'bg-white text-slate-400'}`}>Вход через соцсети</span>
        </div>

        <div className="flex gap-4">
          {/* ВК */}
          <button onClick={() => alert("VK Auth: API в режиме модерации")} className="flex-1 bg-[#0077FF] py-4 rounded-2xl flex justify-center items-center hover:scale-105 active:scale-90 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.071 2H8.929C4.468 2 2 4.468 2 8.929v6.142C2 19.532 4.468 22 8.929 22h6.142c4.461 0 6.929-2.468 6.929-6.929V8.929C22 4.468 19.532 2 15.071 2z" fill="white"/>
              <path d="M12.916 16.32c-3.923 0-6.16-2.688-6.254-7.16h1.968c.064 3.28 1.512 4.672 2.656 4.96V9.16h1.856v2.832c1.136-.12 2.328-1.4 2.736-2.832h1.856c-.304 1.768-1.576 3.048-2.52 3.592.944.44 2.4 1.56 2.952 3.568h-2.032c-.432-1.344-1.512-2.384-2.616-2.496v2.496h-1.656z" fill="#0077FF"/>
            </svg>
          </button>
          {/* ЯНДЕКС */}
          <button onClick={() => alert("Yandex Auth: API в режиме модерации")} className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl flex justify-center items-center hover:scale-105 active:scale-90 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#FC3F1D"/>
              <path d="M13.6231 16.1466H12.3392V14.1945C11.9069 14.8344 11.2351 15.2227 10.3235 15.2227C8.8037 15.2227 7.74792 14.1601 7.74792 12.3675C7.74792 10.5181 8.85172 9.38794 10.4578 9.38794C11.3315 9.38794 12.0125 9.77619 12.3968 10.4251V9.52243H13.6231V16.1466ZM10.7459 10.4154C9.69956 10.4154 9.00839 11.1642 9.00839 12.3292C9.00839 13.484 9.71876 14.1944 10.7363 14.1944C11.7538 14.1944 12.445 13.484 12.445 12.3292C12.445 11.1642 11.7634 10.4154 10.7459 10.4154Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---
function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;

  useEffect(() => {
    fetchTickets();
    const channel = supabase.channel('global_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchTickets())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchTickets() {
    let { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) data = data.filter(t => t.user_email === userEmail);
    setTickets(data || []);
  }

  // Генерация PDF
  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.text("POMOGATOR SYSTEM REPORT", 14, 20);
    doc.autoTable({
      head: [["ID", "TASK", "ROOM", "STATUS"]],
      body: tickets.map(t => [t.id.slice(0,5), t.title.toUpperCase(), t.room, t.status.toUpperCase()]),
      startY: 30,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save("Report_Pomogator.pdf");
  };

  const filtered = tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search));

  return (
    <div className={`min-h-screen transition-all ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-20 px-8 border-b flex items-center justify-between sticky top-0 backdrop-blur-xl z-50 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <Zap className="text-indigo-500 animate-pulse" size={24} />
          <h1 className="text-xl font-black uppercase italic tracking-tighter">Pomogator</h1>
        </div>
        <div className="flex-1 max-w-sm mx-10 relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
          <input placeholder="Найти задачу или кабинет..." onChange={e => setSearch(e.target.value)} className={`w-full py-2 pl-10 rounded-xl outline-none text-xs border ${isDark ? 'bg-white/5 border-white/5 focus:border-indigo-500' : 'bg-slate-100 border-slate-200 focus:border-indigo-600'}`} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportPDF} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"><Download size={20}/></button>
          <button onClick={() => setIsDark(!isDark)} className="p-2">{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-500/50"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Задачи в работе: {filtered.length}</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} isDark={isDark} />}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {filtered.map(t => (
            <div key={t.id} className={`p-8 rounded-[3rem] border transition-all ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{t.title}</h3>
                <span className={`text-[8px] font-black px-2 py-1 rounded-lg ${t.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'} text-white uppercase`}>
                  {t.status === 'done' ? 'Ready' : 'Process'}
                </span>
              </div>
              <div className="flex gap-4 text-[9px] font-bold text-slate-500 mb-6 uppercase">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-indigo-500"/> Каб. {t.room}</span>
                <span className="flex items-center gap-1"><User size={12}/> {t.user_name}</span>
              </div>
              {isAdmin && t.status !== 'done' && (
                <button onClick={async () => { await supabase.from('tickets').update({status: 'done'}).eq('id', t.id); fetchTickets(); }} className="w-full bg-emerald-600 py-3 rounded-2xl text-[9px] font-black text-white uppercase mb-6 hover:bg-emerald-500 transition-all">Завершить задачу</button>
              )}
              {/* ЧАТ С REALTIME */}
              <Chat ticketId={t.id} userEmail={userEmail} userName={userEmail.split('@')[0]} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// --- ЧАТ С ПОДДЕРЖКОЙ REALTIME ---
function Chat({ ticketId, userEmail, userName, isDark }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchMsgs();
    const ch = supabase.channel(`chat_${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [ticketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMsgs() {
    const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages(data || []);
  }

  const send = async () => {
    if (!msg.trim()) return;
    const { error } = await supabase.from('ticket_comments').insert([{ ticket_id: ticketId, user_email: userEmail, user_name: userName, message: msg }]);
    if (!error) setMsg('');
  };

  return (
    <div className={`mt-2 rounded-[2rem] p-5 ${isDark ? 'bg-black/40' : 'bg-slate-50 border border-slate-100'}`}>
      <div className="max-h-32 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.user_email === userEmail ? 'items-end' : 'items-start'}`}>
            <span className="text-[7px] uppercase font-black opacity-30 mb-1 px-2">{m.user_name}</span>
            <div className={`px-4 py-2 rounded-2xl text-[10px] font-bold ${m.user_email === userEmail ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'}`}>
              {m.message}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2 border-t border-white/5 pt-3">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Написать..." className="flex-1 bg-transparent outline-none text-[10px] font-bold" />
        <button onClick={send} className="text-indigo-500 hover:scale-110 transition-all"><Send size={16}/></button>
      </div>
    </div>
  );
}

// --- КНОПКА СОЗДАНИЯ ---
function NewTicketBtn({ onCreated, userEmail, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', room: '', priority: 'normal' });

  const handleSend = async () => {
    if (!form.title || !form.room) return alert("Заполните поля!");
    const { error } = await supabase.from('tickets').insert([{ ...form, user_email: userEmail, user_name: userEmail.split('@')[0], status: 'new' }]);
    if (!error) {
      await sendTgMessage({ ...form, user_name: userEmail.split('@')[0] });
      setIsOpen(false);
      onCreated();
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-black uppercase text-white shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all">Создать задачу</button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className={`p-10 rounded-[3.5rem] w-full max-w-md border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-3xl font-black uppercase italic mb-8 text-indigo-500">Новый тикет</h2>
            <div className="space-y-4">
              <input placeholder="Что произошло?" onChange={e => setForm({...form, title: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
              <input placeholder="Номер кабинета" onChange={e => setForm({...form, room: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border font-bold ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
              <div className="flex gap-2">
                <button onClick={() => setForm({...form, priority: 'urgent'})} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase ${form.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-white/5'}`}>Срочно</button>
                <button onClick={() => setForm({...form, priority: 'normal'})} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase ${form.priority === 'normal' ? 'bg-indigo-600 text-white' : 'bg-white/5'}`}>Обычная</button>
              </div>
              <button onClick={handleSend} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white uppercase tracking-widest mt-4">Отправить</button>
              <button onClick={() => setIsOpen(false)} className="w-full mt-2 text-[9px] font-black text-slate-500 uppercase">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
