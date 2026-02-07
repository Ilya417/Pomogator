import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LogOut, Trash2, Send, Zap, Cpu, Camera,
  User, Sun, Moon, Search, Download, ShieldCheck, Edit3, X, CheckCircle2, Clock
} from 'lucide-react';

const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

const TG_BOT_TOKEN = '8491548873:AAE_DDgazopwT0VXf51RKtA2gcvhmhBOKwk';
const TG_CHAT_ID = '1920949380';
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#020617] text-indigo-500"><Cpu className="animate-spin" size={50} /></div>;

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- ОТПРАВКА В ТЕЛЕГРАМ ---
const sendTelegram = async (title, room, user) => {
  const text = `🔔 **НОВАЯ ЗАЯВКА**\n\n🛠 Что: ${title}\n📍 Где: ${room}\n👤 Кто: ${user}`;
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' })
    });
  } catch (e) { console.error(e); }
};

// --- СТРАНИЦА ВХОДА ---
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
    <div className={`h-screen flex items-center justify-center p-6 transition-all duration-700 ${isDark ? 'bg-[#020617]' : 'bg-slate-100'}`}>
      <div className={`p-10 rounded-[3rem] w-full max-w-md text-center border shadow-2xl animate-in fade-in zoom-in duration-500 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500 animate-pulse" size={40} />
        <h2 className="text-4xl font-black uppercase italic mb-8 tracking-tighter">ПОМОГАТОР</h2>
        <form onSubmit={handleAuth} className="space-y-3">
          <input type="email" placeholder="ПОЧТА" required onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:ring-2 ring-indigo-500 transition-all" />
          <input type="password" placeholder="ПАРОЛЬ" required onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:ring-2 ring-indigo-500 transition-all" />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30">
            {isRegistering ? 'РЕГИСТРАЦИЯ' : 'ВОЙТИ'}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="mt-6 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">
          {isRegistering ? 'УЖЕ ЕСТЬ АККАУНТ?' : 'СОЗДАТЬ АККАУНТ'}
        </button>
      </div>
    </div>
  );
}

// --- ГЛАВНОЕ ПРИЛОЖЕНИЕ ---
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
    const sub = supabase.channel('tickets_real').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchTickets() {
    let { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) data = data?.filter(t => t.user_email === userEmail);
    setTickets(data || []);
  }

  const deleteTicket = async (id) => {
    if (confirm("УДАЛИТЬ ЗАЯВКУ?")) { await supabase.from('tickets').delete().eq('id', id); fetchTickets(); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from('tickets').update({ status }).eq('id', id);
    fetchTickets();
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-20 px-6 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-40 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsProfileOpen(true)}>
          <div className="relative overflow-hidden rounded-xl">
            <img src={profile.avatar} className="w-10 h-10 object-cover ring-2 ring-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase italic leading-none">{profile.name}</h1>
            <p className="text-[8px] font-bold text-indigo-500 flex items-center gap-1 uppercase">
                {isAdmin ? <ShieldCheck size={10}/> : <User size={10}/>} {isAdmin ? 'АДМИН' : 'ЮЗЕР'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDark(!isDark)} className="p-2 hover:bg-indigo-500/10 rounded-full transition-all text-indigo-500">{isDark ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 hover:bg-red-500/10 rounded-full transition-all text-red-500/60"><LogOut size={22}/></button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Заявок в работе: {tickets.length}</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={profile.name} isDark={isDark} />}
        </div>

        <div className="grid gap-6">
          {tickets.map((t, idx) => (
            <div key={t.id} style={{ animationDelay: `${idx * 100}ms` }} className={`p-6 rounded-[2.5rem] border animate-in slide-in-from-bottom-5 fade-in duration-500 ${isDark ? 'bg-slate-900/50 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {t.image_url && <img src={t.image_url} className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-lg" />}
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-1">{t.title}</h3>
                    <div className="flex items-center gap-3 opacity-60 text-[10px] font-bold uppercase">
                        <span className="flex items-center gap-1"><Clock size={12}/> Кабинет: {t.room}</span>
                        <span>👤 {t.user_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteTicket(t.id)} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black text-white shadow-lg ${t.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                    {t.status === 'done' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                    {t.status === 'done' ? 'ВЫПОЛНЕНО' : 'В ПРОЦЕССЕ'}
                  </div>
                </div>
              </div>

              {isAdmin && t.status !== 'done' && (
                <button onClick={() => updateStatus(t.id, 'done')} className="w-full mb-4 py-3 bg-emerald-600 rounded-2xl font-black text-white text-[11px] uppercase shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all">ЗАВЕРШИТЬ ЗАЯВКУ</button>
              )}

              <TicketChat ticketId={t.id} userEmail={userEmail} userName={profile.name} isDark={isDark} />
            </div>
          ))}
        </div>
      </main>

      {/* МОДАЛКА ПРОФИЛЯ */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="p-10 rounded-[3.5rem] w-full max-w-sm bg-slate-900 border border-white/10 text-center shadow-3xl">
            <h2 className="text-2xl font-black italic mb-6 text-indigo-500 uppercase tracking-widest">Профиль</h2>
            <div className="relative w-28 h-28 mx-auto mb-6">
                <img src={profile.avatar} className="w-full h-full rounded-[2rem] object-cover ring-4 ring-indigo-500/50" />
                <label className="absolute -bottom-2 -right-2 bg-indigo-600 p-2.5 rounded-xl cursor-pointer shadow-xl hover:scale-110 transition-all">
                    <Camera size={18} color="white"/>
                    <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) setProfile({...profile, avatar: URL.createObjectURL(file)});
                    }} />
                </label>
            </div>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 rounded-2xl mb-4 bg-white/5 font-bold text-white outline-none border border-transparent focus:border-indigo-500 transition-all" />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsProfileOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white shadow-lg">СОХРАНИТЬ</button>
            <button onClick={() => setIsProfileOpen(false)} className="mt-4 text-[10px] font-black opacity-40 uppercase text-white hover:opacity-100 transition-opacity">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- КОМПОНЕНТ ЧАТА ---
function TicketChat({ ticketId, userEmail, userName, isDark }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchMsgs();
    const ch = supabase.channel(`chat_${ticketId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` }, p => setMessages(v => [...v, p.new])).subscribe();
    return () => supabase.removeChannel(ch);
  }, [ticketId]);

  async function fetchMsgs() { 
    const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }); 
    setMessages(data || []); 
  }

  const send = async () => { 
    if(!msg.trim()) return; 
    await supabase.from('ticket_comments').insert([{ ticket_id: ticketId, user_email: userEmail, user_name: userName, message: msg }]); 
    setMsg(''); 
  };

  return (
    <div className={`mt-2 p-4 rounded-3xl ${isDark ? 'bg-black/30' : 'bg-slate-100/50'}`}>
      <div className="max-h-32 overflow-y-auto mb-3 space-y-2 pr-2 scrollbar-hide">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.user_email === userEmail ? 'items-end' : 'items-start'}`}>
            <span className="text-[8px] font-black opacity-40 mb-1 uppercase px-2">{m.user_name}</span>
            <span className={`px-4 py-2 rounded-2xl text-[10px] font-bold shadow-sm inline-block max-w-[80%] ${m.user_email === userEmail ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                {m.message}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 bg-black/5 p-2 rounded-2xl">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Написать сообщение..." className="flex-1 bg-transparent outline-none text-[11px] font-bold px-2 placeholder:opacity-30" />
        <button onClick={send} className="bg-indigo-600 p-2.5 rounded-xl text-white hover:scale-105 transition-all shadow-md shadow-indigo-600/20"><Send size={14}/></button>
      </div>
    </div>
  );
}

// --- КНОПКА СОЗДАНИЯ ---
function NewTicketBtn({ onCreated, userEmail, userName, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [tempImg, setTempImg] = useState(null);

  const handleSend = async () => {
    if (!title || !room) return alert("Заполни все поля!");
    const { error } = await supabase.from('tickets').insert([{ 
      title: title.toUpperCase(), 
      room, 
      user_email: userEmail, 
      user_name: userName, 
      status: 'new',
      image_url: tempImg 
    }]);
    
    if (!error) {
        await sendTelegram(title.toUpperCase(), room, userName);
        setIsOpen(false); setTempImg(null); onCreated();
    } else {
        alert("Ошибка! Проверь колонки в базе.");
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-8 py-3 rounded-full text-[10px] font-black text-white uppercase shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all">СОЗДАТЬ ЗАЯВКУ</button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="p-10 rounded-[4rem] w-full max-w-md bg-slate-900 border border-white/10 text-white shadow-3xl">
            <h2 className="text-3xl font-black italic text-indigo-500 mb-8 uppercase text-center tracking-tighter">Новый тикет</h2>
            <div className="space-y-4">
              <input placeholder="ЧТО СЛОМАЛОСЬ?" onChange={e => setTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500 transition-all" />
              <input placeholder="КАБИНЕТ / ОФИС" onChange={e => setRoom(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500 transition-all" />
              
              <div className="group relative flex items-center justify-center p-8 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 hover:border-indigo-500 transition-colors cursor-pointer">
                {tempImg ? (
                    <div className="text-center">
                        <img src={tempImg} className="w-24 h-24 rounded-2xl object-cover mb-2 ring-2 ring-indigo-500" />
                        <p className="text-[8px] font-black text-indigo-400">ИЗМЕНИТЬ</p>
                    </div>
                ) : (
                    <div className="text-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <Camera size={40} className="mx-auto mb-2"/>
                        <p className="text-[10px] font-black">ПРИКРЕПИТЬ ФОТО</p>
                    </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) setTempImg(URL.createObjectURL(file));
                }} />
              </div>

              <button onClick={handleSend} className="w-full bg-indigo-600 py-5 rounded-3xl font-black uppercase shadow-xl hover:bg-indigo-500 transition-all">ОТПРАВИТЬ ЗАЯВКУ</button>
              <button onClick={() => setIsOpen(false)} className="w-full mt-2 text-[10px] font-black opacity-30 uppercase hover:opacity-100 transition-opacity">ОТМЕНА</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
