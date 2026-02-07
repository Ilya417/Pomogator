import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LogOut, Trash2, Send, Zap, Cpu, Camera,
  User, Sun, Moon, Search, Download, ShieldCheck, Edit3, X
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
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Ошибка: " + error.message);
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-10 rounded-[3.5rem] w-full max-w-md text-center border shadow-2xl ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500 animate-bounce" size={40} />
        <h2 className="text-4xl font-black uppercase italic mb-8">ПОМОГАТОР</h2>
        <form onSubmit={handleAuth} className="space-y-3 mb-6">
          <input type="email" placeholder="ПОЧТА" required onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500" />
          <input type="password" placeholder="ПАРОЛЬ" required onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500" />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white uppercase">{isRegistering ? 'РЕГИСТРАЦИЯ' : 'ВОЙТИ'}</button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black text-indigo-500 uppercase">{isRegistering ? 'УЖЕ ЕСТЬ АККАУНТ?' : 'НОВЫЙ ПОЛЬЗОВАТЕЛЬ'}</button>
      </div>
    </div>
  );
}

function MainApp({ session, isDark, setIsDark }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`profile_${userEmail}`);
    return saved ? JSON.parse(saved) : { name: userEmail.split('@')[0].toUpperCase(), avatar: 'https://cdn-icons-png.flaticon.com/512/8727/8727604.png' };
  });

  useEffect(() => {
    fetchTickets();
    const ch = supabase.channel('glb').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function fetchTickets() {
    let { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (error) console.log(error);
    if (!isAdmin) data = data?.filter(t => t.user_email === userEmail);
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
    doc.text("OTCHET POMOGATOR", 14, 20);
    tickets.forEach((t, i) => doc.text(`${i+1}. ${t.title} (Каб: ${t.room}) - ${t.status}`, 14, 30 + (i*10)));
    doc.save("otchet.pdf");
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-20 px-6 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-40 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
          <img src={profile.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500" />
          <div>
            <h1 className="text-sm font-black uppercase italic leading-none">{profile.name}</h1>
            <p className="text-[8px] font-bold text-indigo-500 uppercase">{isAdmin ? 'АДМИНИСТРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="p-2 text-emerald-500"><Download size={22}/></button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-indigo-500">{isDark ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-500/50"><LogOut size={22}/></button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="relative mb-8">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
           <input placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} className="w-full p-4 pl-12 rounded-2xl outline-none border font-bold text-xs bg-slate-500/5" />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase text-indigo-500">ЗАЯВКИ: {tickets.length}</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={profile.name} isDark={isDark} />}
        </div>

        <div className="grid gap-6">
          {tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search)).map(t => (
            <div key={t.id} className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black uppercase italic">{t.title}</h3>
                  <p className="text-[10px] font-bold opacity-50">КАБИНЕТ: {t.room} | ОТ: {t.user_name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteTicket(t.id)} className="text-red-500"><Trash2 size={18}/></button>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black text-white ${t.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                    {t.status === 'done' ? 'ГОТОВО' : 'В РАБОТЕ'}
                  </div>
                </div>
              </div>
              {isAdmin && t.status !== 'done' && (
                <button onClick={async () => { await supabase.from('tickets').update({status: 'done'}).eq('id', t.id); fetchTickets(); }} className="w-full bg-emerald-600 py-3 rounded-2xl text-[10px] font-black text-white uppercase mb-4">ЗАВЕРШИТЬ</button>
              )}
              <Chat ticketId={t.id} userEmail={userEmail} userName={profile.name} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="p-10 rounded-[3rem] w-full max-w-sm bg-slate-900 border border-white/10 text-center text-white">
            <h2 className="text-2xl font-black italic mb-6 text-indigo-500 uppercase">ПРОФИЛЬ</h2>
            <img src={profile.avatar} className="w-24 h-24 mx-auto rounded-3xl object-cover ring-4 ring-indigo-500 mb-6" />
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 rounded-2xl mb-4 bg-white/5 font-bold outline-none" />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsProfileOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black">СОХРАНИТЬ</button>
            <button onClick={() => setIsProfileOpen(false)} className="mt-4 text-[9px] font-black opacity-40 uppercase">ЗАКРЫТЬ</button>
          </div>
        </div>
      )}
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
  const send = async () => { if(!msg.trim()) return; await supabase.from('ticket_comments').insert([{ ticket_id: ticketId, user_email: userEmail, user_name: userName, message: msg }]); setMsg(''); };
  return (
    <div className="mt-2 p-4 rounded-2xl bg-black/20">
      <div className="max-h-24 overflow-y-auto mb-3 space-y-2 text-[10px] font-bold">
        {messages.map(m => <div key={m.id} className={m.user_email === userEmail ? 'text-right' : 'text-left'}><span className="px-3 py-1 bg-indigo-600 rounded-xl inline-block text-white">{m.message}</span></div>)}
      </div>
      <div className="flex gap-2"><input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="ОТВЕТИТЬ..." className="flex-1 bg-transparent outline-none text-[10px] font-bold" /><button onClick={send} className="text-indigo-500"><Send size={16}/></button></div>
    </div>
  );
}

function NewTicketBtn({ onCreated, userEmail, userName, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');

  const handleSend = async () => {
    if (!title || !room) return alert("ЗАПОЛНИТЕ ПОЛЯ!");
    // УБРАЛИ image_url из запроса, чтобы база не выдавала ошибку!
    const { error } = await supabase.from('tickets').insert([{ 
      title: title.toUpperCase(), 
      room, 
      user_email: userEmail, 
      user_name: userName, 
      status: 'new' 
    }]);
    
    if (error) {
        alert("Ошибка базы данных: " + error.message);
    } else {
        setIsOpen(false); 
        onCreated();
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/20">НОВАЯ ЗАЯВКА</button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6">
          <div className="p-8 rounded-[3rem] w-full max-w-md bg-slate-900 border border-white/10 text-white">
            <h2 className="text-2xl font-black italic text-indigo-500 mb-6 uppercase">СОЗДАТЬ ТИКЕТ</h2>
            <div className="space-y-4">
              <input placeholder="ЧТО СЛУЧИЛОСЬ?" onChange={e => setTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500" />
              <input placeholder="НОМЕР КАБИНЕТА" onChange={e => setRoom(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500" />
              <div className="p-4 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 text-center">
                <Camera size={24} className="mx-auto mb-2 opacity-20"/>
                <p className="text-[8px] font-black opacity-40 uppercase">ФОТО БУДЕТ ДОСТУПНО ПОСЛЕ ОБНОВЛЕНИЯ БАЗЫ</p>
              </div>
              <button onClick={handleSend} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase">ОТПРАВИТЬ</button>
              <button onClick={() => setIsOpen(false)} className="w-full mt-2 text-[9px] font-black opacity-40 uppercase text-center">ОТМЕНА</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
