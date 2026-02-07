import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, MapPin, Trash2, Send, Zap, Cpu, 
  User, Sun, Moon, Search, Download, Share2, ShieldCheck
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

function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message); else alert("Аккаунт создан! Теперь войдите.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Ошибка: " + error.message);
    }
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-10 rounded-[3rem] w-full max-w-md text-center border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500 animate-pulse" size={40} />
        <h2 className={`text-4xl font-black uppercase italic mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>ПОМОГАТОР</h2>
        <form onSubmit={handleAuth} className="space-y-3 mb-6">
          <input type="email" placeholder="Почта" required onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl outline-none border font-bold bg-transparent" />
          <input type="password" placeholder="Пароль" required onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-2xl outline-none border font-bold bg-transparent" />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white uppercase tracking-widest">{isRegistering ? 'СОЗДАТЬ АККАУНТ' : 'ВОЙТИ'}</button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black uppercase text-indigo-500 mb-8 block mx-auto">{isRegistering ? 'УЖЕ ЕСТЬ АККАУНТ?' : 'РЕГИСТРАЦИЯ'}</button>
        <div className="flex gap-4 border-t border-white/5 pt-6">
           <button onClick={() => alert("VK Вход")} className="flex-1 bg-[#0077FF] py-3 rounded-2xl flex justify-center items-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M13.162 18.994c-6.09 0-9.564-4.172-9.71-11.117h3.035c.101 5.091 2.341 7.243 4.12 7.691V7.877h2.86v4.393c1.748-.189 3.585-2.185 4.204-4.393h2.86c-.443 3.243-2.822 5.239-4.532 6.048 1.71.809 4.418 2.531 5.343 5.069h-3.137c-.722-2.253-2.531-3.99-5.026-4.24v4.24h-.017z"/></svg></button>
           <button onClick={() => alert("Яндекс Вход")} className="flex-1 bg-white border border-slate-200 py-3 rounded-2xl flex justify-center items-center"><svg width="24" height="24" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#f33"/><path d="M57.5 73.1h-8.7V61.9c-2.9 4.3-7.4 6.9-13.5 6.9-10.2 0-17.3-7.1-17.3-19.1 0-12.4 7.4-20 18.1-20 5.9 0 10.4 2.6 13 6.9V30.4h8.4v42.7zm-8.7-27c0-7.7-4.6-12.4-11.4-12.4s-11.4 4.7-11.4 12.4c0 7.7 4.7 12.4 11.4 12.4s11.4-4.7 11.4-12.4z" fill="#fff"/></svg></button>
        </div>
      </div>
    </div>
  );
}

function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;
  const userName = userEmail.split('@')[0].toUpperCase();

  useEffect(() => {
    fetchTickets();
    const ch = supabase.channel('r').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function fetchTickets() {
    let { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) data = data.filter(t => t.user_email === userEmail);
    setTickets(data || []);
  }

  const deleteTicket = async (id) => {
    if (window.confirm("Удалить заявку?")) {
      await supabase.from('tickets').delete().eq('id', id);
      fetchTickets();
    }
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.text("OTCHET POMOGATOR", 14, 20);
    tickets.forEach((t, i) => doc.text(`${i+1}. ${t.title} - ${t.room} [${t.status}]`, 14, 30 + (i*10)));
    doc.save("Otchet.pdf");
  };

  const filtered = tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search));

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-20 px-8 border-b flex items-center justify-between sticky top-0 backdrop-blur-xl z-50 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">{userName[0]}</div>
          <div>
            <h1 className="text-sm font-black uppercase italic leading-none">{userName}</h1>
            <p className="text-[9px] font-bold text-indigo-500 uppercase">{isAdmin ? 'АДМИНИСТРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}</p>
          </div>
        </div>
        <div className="flex-1 max-w-xs mx-6 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12}/><input placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} className="w-full py-2 pl-9 rounded-xl outline-none text-[10px] bg-slate-500/10" /></div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="p-2 text-emerald-500"><Download size={20}/></button>
          <button onClick={() => setIsDark(!isDark)} className="p-2">{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-500"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[10px] font-black uppercase text-indigo-500">ВСЕГО ЗАЯВОК: {filtered.length}</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={userName} />}
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {filtered.map(t => (
            <div key={t.id} className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-lg'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black uppercase italic text-lg">{t.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => deleteTicket(t.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                  <span className="text-[8px] font-black bg-indigo-600 px-2 py-1 rounded text-white">{t.status === 'done' ? 'ГОТОВО' : 'В РАБОТЕ'}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold mb-4 opacity-60 uppercase">КАБИНЕТ: {t.room} | ОТ: {t.user_name}</p>
              {isAdmin && t.status !== 'done' && <button onClick={async () => { await supabase.from('tickets').update({status: 'done'}).eq('id', t.id); fetchTickets(); }} className="w-full bg-emerald-600 py-2 rounded-xl text-[10px] font-black text-white mb-4 uppercase">ЗАВЕРШИТЬ</button>}
              <Chat ticketId={t.id} userEmail={userEmail} userName={userName} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Chat({ ticketId, userEmail, userName, isDark }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    fetchMsgs();
    const ch = supabase.channel(`c_${ticketId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, p => setMessages(v => [...v, p.new])).subscribe();
    return () => supabase.removeChannel(ch);
  }, [ticketId]);
  async function fetchMsgs() { const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }); setMessages(data || []); }
  const send = async () => { if (!msg.trim()) return; await supabase.from('ticket_comments').insert([{ ticket_id: ticketId, user_email: userEmail, user_name: userName, message: msg }]); setMsg(''); };
  return (
    <div className="mt-2 bg-black/10 p-4 rounded-2xl">
      <div className="max-h-24 overflow-y-auto mb-3 text-[9px] font-bold space-y-1">{messages.map(m => <p key={m.id} className={m.user_email === userEmail ? 'text-right text-indigo-500' : 'text-left'}>{m.message}</p>)}</div>
      <div className="flex gap-2 border-t border-black/5 pt-2"><input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="ОТВЕТИТЬ..." className="flex-1 bg-transparent text-[10px] outline-none font-bold" /><button onClick={send} className="text-indigo-600"><Send size={14}/></button></div>
    </div>
  );
}

function NewTicketBtn({ onCreated, userEmail, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const handleSend = async () => { if (!title || !room) return; await supabase.from('tickets').insert([{ title, room, user_email: userEmail, user_name: userName, status: 'new' }]); setIsOpen(false); onCreated(); };
  return (
    <><button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/30">НОВАЯ ЗАЯВКА</button>
    {isOpen && <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"><div className="p-10 rounded-[3rem] w-full max-w-md bg-slate-900 border border-white/10 text-center">
      <h2 className="text-2xl font-black italic mb-6 text-indigo-500 uppercase">СОЗДАТЬ ЗАЯВКУ</h2>
      <input placeholder="ЧТО СЛОМАЛОСЬ?" onChange={e => setTitle(e.target.value)} className="w-full p-4 rounded-2xl mb-3 bg-white/5 text-white font-bold outline-none" />
      <input placeholder="КАБИНЕТ" onChange={e => setRoom(e.target.value)} className="w-full p-4 rounded-2xl mb-6 bg-white/5 text-white font-bold outline-none" />
      <button onClick={handleSend} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white uppercase">ОТПРАВИТЬ В IT</button>
      <button onClick={() => setIsOpen(false)} className="w-full mt-4 text-[10px] text-slate-500 font-black uppercase">ОТМЕНА</button>
    </div></div>}</>
  );
}
