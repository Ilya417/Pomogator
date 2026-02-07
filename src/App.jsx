import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, MapPin, Trash2, Send, Zap, Cpu, Camera,
  User, Sun, Moon, Search, Download, Share2, ShieldCheck, Edit3, X
} from 'lucide-react';

const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'ily4glotov@yandex.ru';

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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#020617]"><Cpu className="animate-spin text-indigo-500" size={50} /></div>;

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- АВТОРИЗАЦИЯ С ЛОГОТИПАМИ ---
function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-10 rounded-[3.5rem] w-full max-w-md text-center border shadow-2xl ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500 animate-bounce" size={40} />
        <h2 className="text-4xl font-black uppercase italic mb-8">ПОМОГАТОР</h2>
        <form onSubmit={handleAuth} className="space-y-3 mb-6">
          <input type="email" placeholder="ПОЧТА" required onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500 transition-all" />
          <input type="password" placeholder="ПАРОЛЬ" required onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500 transition-all" />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white hover:scale-[1.02] active:scale-95 transition-all">
            {isRegistering ? 'РЕГИСТРАЦИЯ' : 'ВОЙТИ'}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
          {isRegistering ? 'УЖЕ ЕСТЬ АККАУНТ?' : 'НОВЫЙ ПОЛЬЗОВАТЕЛЬ'}
        </button>
        <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
          <button className="flex-1 bg-[#0077FF] py-3 rounded-2xl flex justify-center"><Share2 size={20} color="white"/></button>
          <button className="flex-1 bg-[#FC3F1D] py-3 rounded-2xl text-white font-black text-xl">Я</button>
        </div>
      </div>
    </div>
  );
}

// --- ГЛАВНЫЙ ЭКРАН ---
function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`profile_${userEmail}`);
    return saved ? JSON.parse(saved) : { name: userEmail.split('@')[0], avatar: 'https://cdn-icons-png.flaticon.com/512/8727/8727604.png' };
  });

  useEffect(() => {
    fetchTickets();
    const ch = supabase.channel('global').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function fetchTickets() {
    let { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) data = data.filter(t => t.user_email === userEmail);
    setTickets(data || []);
  }

  const deleteTicket = async (id) => {
    if (confirm("УДАЛИТЬ ЗАЯВКУ?")) {
      await supabase.from('tickets').delete().eq('id', id);
      fetchTickets();
    }
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("OTCHET POMOGATOR", 14, 20);
    tickets.forEach((t, i) => {
      doc.setFontSize(12);
      doc.text(`${i+1}. ${t.title} | Каб: ${t.room} | Статус: ${t.status}`, 14, 35 + (i*10));
    });
    doc.save("otchet.pdf");
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* ХЕДЕР */}
      <header className={`h-20 px-6 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-40 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsProfileOpen(true)}>
          <div className="relative">
            <img src={profile.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500 group-hover:scale-110 transition-all" />
            <Edit3 size={12} className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tighter leading-none">{profile.name}</h1>
            <p className="text-[8px] font-bold text-indigo-500 uppercase flex items-center gap-1">
              {isAdmin ? <ShieldCheck size={10}/> : <User size={10}/>} {isAdmin ? 'АДМИНИСТРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all"><Download size={22}/></button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-indigo-500">{isDark ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-500/40 hover:text-red-500"><LogOut size={22}/></button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="relative mb-8">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
           <input placeholder="ПОИСК ПО ЗАДАЧАМ И КАБИНЕТАМ..." onChange={e => setSearch(e.target.value)} className={`w-full p-4 pl-12 rounded-2xl outline-none border font-bold text-xs ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">ЗАЯВКИ В СИСТЕМЕ: {tickets.length}</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={profile.name} isDark={isDark} />}
        </div>

        <div className="grid gap-6">
          {tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search)).map(t => (
            <div key={t.id} className={`p-6 rounded-[2.5rem] border animate-in fade-in slide-in-from-bottom-4 duration-500 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {t.image_url && <img src={t.image_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/20" />}
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">{t.title}</h3>
                    <p className="text-[10px] font-bold opacity-50 uppercase mt-1">КАБИНЕТ: {t.room} | ОТ: {t.user_name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteTicket(t.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={18}/></button>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black text-white ${t.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                    {t.status === 'done' ? 'ВЫПОЛНЕНО' : 'В ПРОЦЕССЕ'}
                  </div>
                </div>
              </div>
              {isAdmin && t.status !== 'done' && (
                <button onClick={async () => { await supabase.from('tickets').update({status: 'done'}).eq('id', t.id); fetchTickets(); }} className="w-full bg-emerald-600 py-3 rounded-2xl text-[10px] font-black text-white uppercase mb-4 hover:scale-[1.01] transition-all">ОТМЕТИТЬ КАК ВЫПОЛНЕННОЕ</button>
              )}
              <Chat ticketId={t.id} userEmail={userEmail} userName={profile.name} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>

      {/* МОДАЛКА ПРОФИЛЯ */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`p-10 rounded-[3rem] w-full max-w-sm border text-center ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-2xl font-black italic mb-6 text-indigo-500">ПРОФИЛЬ</h2>
            <div className="relative w-24 h-24 mx-auto mb-6">
              <img src={profile.avatar} className="w-full h-full rounded-3xl object-cover ring-4 ring-indigo-500/30" />
              <label className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-xl cursor-pointer hover:scale-110 transition-all shadow-lg">
                <Camera size={16} color="white"/>
                <input type="file" className="hidden" onChange={(e) => {
                  const file = e.target.files[0];
                  if(file) setProfile({...profile, avatar: URL.createObjectURL(file)});
                }} />
              </label>
            </div>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 rounded-2xl mb-4 bg-slate-500/10 font-bold outline-none border border-transparent focus:border-indigo-500" />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsProfileOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white">СОХРАНИТЬ</button>
            <button onClick={() => setIsProfileOpen(false)} className="mt-4 text-[9px] font-black opacity-40 uppercase">ЗАКРЫТЬ</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ЧАТ ---
function Chat({ ticketId, userEmail, userName, isDark }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    fetchMsgs();
    const ch = supabase.channel(`chat_${ticketId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, p => setMessages(v => [...v, p.new])).subscribe();
    return () => supabase.removeChannel(ch);
  }, [ticketId]);
  async function fetchMsgs() { const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }); setMessages(data || []); }
  const send = async () => { if(!msg.trim()) return; await supabase.from('ticket_comments').insert([{ ticket_id: ticketId, user_email: userEmail, user_name: userName, message: msg }]); setMsg(''); };
  return (
    <div className={`mt-2 p-4 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-slate-100'}`}>
      <div className="max-h-24 overflow-y-auto mb-3 space-y-2 text-[10px] font-bold">
        {messages.map(m => (
          <div key={m.id} className={`${m.user_email === userEmail ? 'text-right' : 'text-left'}`}>
            <span className={`px-3 py-1.5 rounded-xl inline-block ${m.user_email === userEmail ? 'bg-indigo-600 text-white' : 'bg-slate-500 text-white'}`}>{m.message}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2"><input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="ОТВЕТИТЬ..." className="flex-1 bg-transparent outline-none text-[10px] font-bold" /><button onClick={send} className="text-indigo-500"><Send size={16}/></button></div>
    </div>
  );
}

// --- НОВАЯ ЗАЯВКА С ФОТО ---
function NewTicketBtn({ onCreated, userEmail, userName, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [img, setImg] = useState(null);

  const handleSend = async () => {
    if (!title || !room) return alert("ЗАПОЛНИТЕ ПОЛЯ!");
    await supabase.from('tickets').insert([{ title, room, user_email: userEmail, user_name: userName, status: 'new', image_url: img }]);
    setIsOpen(false); setImg(null); onCreated();
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-black text-white hover:scale-110 transition-all shadow-xl shadow-indigo-600/20">НОВАЯ ЗАЯВКА</button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className={`p-8 rounded-[3rem] w-full max-w-md border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-black italic text-indigo-500">СОЗДАТЬ ТИКЕТ</h2>
              <button onClick={() => setIsOpen(false)}><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <input placeholder="ЧТО СЛУЧИЛОСЬ?" onChange={e => setTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-500/10 font-bold outline-none border border-transparent focus:border-indigo-500" />
              <input placeholder="НОМЕР КАБИНЕТА" onChange={e => setRoom(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-500/10 font-bold outline-none border border-transparent focus:border-indigo-500" />
              
              <div className="flex gap-4 items-center p-4 bg-slate-500/5 rounded-2xl border-2 border-dashed border-white/10">
                {img ? <img src={img} className="w-12 h-12 rounded-lg object-cover" /> : <Camera size={24} className="opacity-20"/>}
                <label className="text-[10px] font-black cursor-pointer bg-indigo-600/20 px-4 py-2 rounded-xl text-indigo-400">
                  {img ? 'ИЗМЕНИТЬ ФОТО' : 'ДОБАВИТЬ ФОТО'}
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) setImg(URL.createObjectURL(file));
                  }} />
                </label>
              </div>

              <button onClick={handleSend} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white shadow-lg">ОТПРАВИТЬ В IT-ОТДЕЛ</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
