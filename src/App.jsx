import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LogOut, Trash2, Send, Zap, Cpu, Camera,
  User, Sun, Moon, Search, Download, ShieldCheck, Edit3, X
} from 'lucide-react';

const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

// ДАННЫЕ ТЕЛЕГРАМ
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#020617]"><Cpu className="animate-spin text-indigo-500" size={50} /></div>;

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- ОТПРАВКА В ТГ ---
const sendTelegram = async (title, room, user) => {
  const text = `🚀 **НОВАЯ ЗАЯВКА**\n\n📝 Суть: ${title}\n📍 Кабинет: ${room}\n👤 Отправитель: ${user}`;
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' })
    });
  } catch (e) { console.error("Ошибка ТГ:", e); }
};

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
      <div className={`p-10 rounded-[3rem] w-full max-w-md text-center border shadow-2xl ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500 animate-pulse" size={40} />
        <h2 className="text-4xl font-black uppercase italic mb-8">ПОМОГАТОР</h2>
        <form onSubmit={handleAuth} className="space-y-3 mb-6">
          <input type="email" placeholder="ПОЧТА" required onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500 transition-all" />
          <input type="password" placeholder="ПАРОЛЬ" required onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500 transition-all" />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white uppercase tracking-widest">{isRegistering ? 'СОЗДАТЬ' : 'ВОЙТИ'}</button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black text-indigo-500 uppercase">{isRegistering ? 'УЖЕ ЕСТЬ АККАУНТ?' : 'РЕГИСТРАЦИЯ'}</button>
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
    let { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) data = data?.filter(t => t.user_email === userEmail);
    setTickets(data || []);
  }

  const deleteTicket = async (id) => {
    if (confirm("УДАЛИТЬ?")) { await supabase.from('tickets').delete().eq('id', id); fetchTickets(); }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`h-20 px-6 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-40 ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
          <img src={profile.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500" />
          <div>
            <h1 className="text-sm font-black uppercase italic leading-none">{profile.name}</h1>
            <p className="text-[8px] font-bold text-indigo-500">{isAdmin ? 'АДМИНИСТРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-indigo-500">{isDark ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-500/50"><LogOut size={22}/></button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase text-indigo-500">ЗАЯВКИ: {tickets.length}</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={profile.name} isDark={isDark} />}
        </div>

        <div className="grid gap-6">
          {tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.room.includes(search)).map(t => (
            <div key={t.id} className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {t.image_url && <img src={t.image_url} className="w-16 h-16 rounded-xl object-cover border border-indigo-500/20" />}
                  <div>
                    <h3 className="text-xl font-black uppercase italic">{t.title}</h3>
                    <p className="text-[10px] font-bold opacity-50 uppercase">КАБИНЕТ: {t.room} | ОТ: {t.user_name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteTicket(t.id)} className="text-red-500"><Trash2 size={18}/></button>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black text-white ${t.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                    {t.status === 'done' ? 'ГОТОВО' : 'В РАБОТЕ'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ПРОФИЛЬ */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6">
          <div className="p-10 rounded-[3rem] w-full max-w-sm bg-slate-900 border border-white/10 text-center">
            <h2 className="text-2xl font-black italic mb-6 text-indigo-500">ПРОФИЛЬ</h2>
            <div className="relative w-24 h-24 mx-auto mb-6">
                <img src={profile.avatar} className="w-full h-full rounded-3xl object-cover ring-4 ring-indigo-500" />
                <label className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-xl cursor-pointer">
                    <Camera size={16} color="white"/>
                    <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) setProfile({...profile, avatar: URL.createObjectURL(file)});
                    }} />
                </label>
            </div>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 rounded-2xl mb-4 bg-white/5 font-bold text-white outline-none" />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsProfileOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white">СОХРАНИТЬ</button>
            <button onClick={() => setIsProfileOpen(false)} className="mt-4 text-[9px] font-black opacity-40 uppercase text-white">ЗАКРЫТЬ</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewTicketBtn({ onCreated, userEmail, userName, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [tempImg, setTempImg] = useState(null);

  const handleSend = async () => {
    if (!title || !room) return alert("ЗАПОЛНИТЕ ПОЛЯ!");
    
    // ОТПРАВКА В БАЗУ
    const { error } = await supabase.from('tickets').insert([{ 
      title: title.toUpperCase(), 
      room, 
      user_email: userEmail, 
      user_name: userName, 
      status: 'new',
      image_url: tempImg // Это сработает, если ты создал колонку!
    }]);
    
    if (!error) {
        await sendTelegram(title.toUpperCase(), room, userName); // ОТПРАВКА В ТГ
        setIsOpen(false); 
        onCreated();
    } else {
        alert("Ошибка базы: Создай колонку image_url в SQL Editor!");
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/20">НОВАЯ ЗАЯВКА</button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6">
          <div className="p-8 rounded-[3rem] w-full max-w-md bg-slate-900 border border-white/10 text-white">
            <h2 className="text-2xl font-black italic text-indigo-500 mb-6 uppercase text-center">СОЗДАТЬ ТИКЕТ</h2>
            <div className="space-y-4">
              <input placeholder="ЧТО СЛУЧИЛОСЬ?" onChange={e => setTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500" />
              <input placeholder="КАБИНЕТ" onChange={e => setRoom(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500" />
              
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                {tempImg ? <img src={tempImg} className="w-12 h-12 rounded-lg object-cover" /> : <Camera size={24} className="opacity-20"/>}
                <label className="text-[10px] font-black cursor-pointer bg-indigo-600/20 px-4 py-2 rounded-xl text-indigo-400">
                  {tempImg ? 'ИЗМЕНИТЬ ФОТО' : 'ДОБАВИТЬ ФОТО'}
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) setTempImg(URL.createObjectURL(file));
                  }} />
                </label>
              </div>

              <button onClick={handleSend} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase shadow-lg">ОТПРАВИТЬ</button>
              <button onClick={() => setIsOpen(false)} className="w-full mt-2 text-[9px] font-black opacity-40 uppercase text-center">ОТМЕНА</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
