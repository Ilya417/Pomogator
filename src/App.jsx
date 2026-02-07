import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, MapPin, Settings, Trash2, Camera, FileUp, 
  ExternalLink, Send, CheckCircle2, Clock, Zap, Globe, Cpu, 
  User, Sun, Moon, Mail, Lock, Search, Download, Filter,
  MessageCircle, Share2
} from 'lucide-react';

// --- Инициализация Supabase ---
const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'ily4glotov@yandex.ru';
const TG_BOT_TOKEN = '8491548873:AAE_DDgazopwT0VXf51RKtA2gcvhmhBOKwk';
const TG_CHAT_ID = '1920949380';

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
      <div className="relative">
        <Cpu className={`animate-spin-slow ${isDark ? 'text-indigo-500' : 'text-indigo-600'}`} size={60} />
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-400" size={20}/>
      </div>
      <p className="mt-4 font-black uppercase tracking-[0.3em] text-indigo-500 text-[10px]">Система Помогатор загружается...</p>
    </div>
  );

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- Авторизация ---
function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginWithProvider = async (provider) => {
  if (provider === 'vk' || provider === 'yandex') {
    alert("🚀 Интеграция с " + provider.toUpperCase() + " находится в режиме тестирования (Sandbox). Пожалуйста, воспользуйтесь Google или стандартным входом.");
    return;
  }
  
  const { error } = await supabase.auth.signInWithOAuth({ 
    provider: provider,
    options: {
      redirectTo: window.location.origin
    }
  });
  
  if (error) alert("Ошибка: " + error.message);
};

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) alert(signUpError.message);
    }
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-10 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl animate-slide-up border ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500" size={50} />
        <h2 className={`text-4xl font-black uppercase italic tracking-tighter mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Pomogator</h2>
        
        <form onSubmit={handleEmailAuth} className="space-y-3 mb-6">
          <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all">Войти / Регистрация</button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
          <span className="relative px-3 text-[10px] uppercase font-black text-slate-500 bg-transparent">Или через соцсети</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => loginWithProvider('vk')} className="bg-[#4C75A3] p-3 rounded-xl flex justify-center text-white hover:opacity-80 transition-all"><Share2 size={20}/></button>
          <button onClick={() => loginWithProvider('google')} className="bg-white border border-slate-200 p-3 rounded-xl flex justify-center text-slate-900 hover:bg-slate-50 transition-all"><Globe size={20}/></button>
          <button onClick={() => loginWithProvider('github')} className="bg-[#24292e] p-3 rounded-xl flex justify-center text-white hover:opacity-80 transition-all"><Cpu size={20}/></button>
        </div>
        <p className="mt-6 text-[9px] text-slate-500 uppercase font-bold tracking-widest">Яндекс и ТГ настраиваются в панели Supabase</p>
      </div>
    </div>
  );
}

// --- Главная страница ---
function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;

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

  const exportData = () => {
    const csvRows = [["ID", "Тема", "Кабинет", "Статус", "Дата"]];
    tickets.forEach(t => csvRows.push([t.id, t.title, t.room, t.status, new Date(t.created_at).toLocaleDateString()]));
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tickets_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search);
    const matchesFilter = filter === 'all' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`min-h-screen transition-all ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-24 px-10 border-b flex items-center justify-between sticky top-0 backdrop-blur-xl z-40 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Zap size={24}/>
          </div>
          <div>
            <h1 className="text-xl font-black uppercase italic leading-none tracking-tighter">Pomogator</h1>
            <p className="text-[9px] font-black text-indigo-500 uppercase mt-1">Admin Panel</p>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-10 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по задачам или кабинетам..." 
            className={`w-full py-3 pl-12 pr-4 rounded-2xl outline-none border transition-all text-xs ${isDark ? 'bg-white/5 border-white/5 focus:border-indigo-500' : 'bg-slate-100 border-slate-200 focus:border-indigo-600'}`}
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportData} className={`p-3 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-emerald-400' : 'hover:bg-slate-100 text-emerald-600'}`} title="Экспорт отчета">
            <Download size={20}/>
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-xl bg-white/5 transition-all">
            {isDark ? <Sun className="text-yellow-400" size={20}/> : <Moon className="text-indigo-600" size={20}/>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 text-red-500/50 hover:text-red-500"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'new', 'process', 'done'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : (isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-200 text-slate-600')}`}
              >
                {f === 'all' ? 'Все' : f === 'new' ? 'Новые' : f === 'process' ? 'В работе' : 'Завершены'}
              </button>
            ))}
          </div>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} isDark={isDark} />}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {filteredTickets.map((t) => (
            <TicketCard key={t.id} ticket={t} isAdmin={isAdmin} isDark={isDark} onUpdate={fetchTickets} />
          ))}
          {filteredTickets.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-20">
              <Cpu size={80} className="mx-auto mb-4"/>
              <p className="font-black uppercase tracking-widest">Задач не найдено</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Карточка задачи (вынесена отдельно для чистоты) ---
function TicketCard({ ticket, isAdmin, isDark, onUpdate }) {
  const updateStatus = async (s) => {
    await supabase.from('tickets').update({ status: s }).eq('id', ticket.id);
    onUpdate();
  };

  return (
    <div className={`p-8 rounded-[3rem] border transition-all animate-slide-up group ${isDark ? 'bg-slate-900/40 border-white/5 hover:bg-slate-900/60' : 'bg-white border-slate-200 shadow-xl shadow-black/5'} ${ticket.priority === 'urgent' && ticket.status !== 'done' ? 'ring-2 ring-red-500/20' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${ticket.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-indigo-500/20 text-indigo-500'}`}>{ticket.priority === 'urgent' ? 'Критично' : 'Обычная'}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase">#{ticket.id.slice(0, 5)}</span>
          </div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">{ticket.title}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticket.status === 'done' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
          {ticket.status === 'done' ? <CheckCircle2 size={20}/> : <Clock size={20}/>}
        </div>
      </div>

      <div className="flex gap-6 text-[10px] font-black uppercase text-slate-500 mb-6">
        <span className="flex items-center gap-1"><MapPin size={14} className="text-indigo-500"/> Каб. {ticket.room}</span>
        <span className="flex items-center gap-1"><User size={14}/> {ticket.user_name}</span>
      </div>

      {isAdmin && ticket.status !== 'done' && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => updateStatus('process')} className="bg-indigo-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-indigo-500 transition-all">В работу</button>
          <button onClick={() => updateStatus('done')} className="bg-emerald-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-emerald-500 transition-all">Решено</button>
        </div>
      )}
      
      {/* Чат остается внутри (функция из прошлого кода) */}
      <Chat ticketId={ticket.id} userEmail={ticket.user_email} userName={ticket.user_name} isDark={isDark} />
    </div>
  );
}

// --- Кнопка создания задачи ---
function NewTicketBtn({ onCreated, userEmail, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', room: '', priority: 'normal' });

  const handleSend = async () => {
    const { error } = await supabase.from('tickets').insert([{ ...form, user_email: userEmail, user_name: userEmail.split('@')[0], status: 'new' }]);
    if (!error) {
      await sendTgMessage({ ...form, user_name: userEmail });
      setIsOpen(false);
      onCreated();
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-2">
        <Plus size={16}/> Создать заявку
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className={`p-10 rounded-[3rem] w-full max-w-md border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-3xl font-black uppercase italic mb-8">Новая задача</h2>
            <div className="space-y-4">
              <input placeholder="Что случилось?" onChange={e => setForm({...form, title: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
              <input placeholder="Кабинет" onChange={e => setForm({...form, room: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`} />
              <select onChange={e => setForm({...form, priority: e.target.value})} className={`w-full p-5 rounded-2xl outline-none border ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-100 border-slate-200'}`}>
                <option value="normal">Обычный приоритет</option>
                <option value="urgent">Критическая ошибка</option>
              </select>
              <button onClick={handleSend} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white uppercase tracking-widest">Отправить</button>
              <button onClick={() => setIsOpen(false)} className="w-full text-[10px] font-black text-slate-500 uppercase">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// (Функция Chat остается такой же, как в предыдущем сообщении)
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
    <div className={`mt-6 rounded-3xl p-4 border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
      <div className="max-h-24 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar text-[10px]">
        {messages.map(m => (
          <div key={m.id} className={m.user_email === userEmail ? 'text-right' : 'text-left'}>
            <span className={`inline-block p-2 rounded-xl ${m.user_email === userEmail ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'}`}>{m.message}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ответ..." className="flex-1 bg-transparent outline-none text-[10px]" />
        <button onClick={sendMessage} className="text-indigo-500"><Send size={14}/></button>
      </div>
    </div>
  );
}
