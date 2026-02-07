import React, { useState, useEffect, useRef } from 'react';
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
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return !session ? <AuthPage isDark={isDark} /> : <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />;
}

// --- ИСПРАВЛЕННЫЙ ТЕЛЕГРАМ ---
const sendTelegram = async (title, room, user) => {
  const text = `🚀 НОВАЯ ЗАЯВКА\n\n📝 Суть: ${title}\n📍 Кабинет: ${room}\n👤 От: ${user}`;
  const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage?chat_id=${TG_CHAT_ID}&text=${encodeURIComponent(text)}`;
  try {
    await fetch(url);
  } catch (e) { console.error("Ошибка ТГ:", e); }
};

function AuthPage({ isDark }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReg, setIsReg] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = isReg 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  return (
    <div className={`h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-10 rounded-[3rem] w-full max-w-md text-center border shadow-2xl ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200'}`}>
        <Zap className="mx-auto mb-4 text-indigo-500 animate-pulse" size={40} />
        <h2 className="text-3xl font-black mb-6 uppercase italic">ПОМОГАТОР</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="EMAIL" required onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500 transition-all" />
          <input type="password" placeholder="ПАРОЛЬ" required onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-2xl border font-bold bg-transparent outline-none focus:border-indigo-500 transition-all" />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-white uppercase shadow-lg hover:scale-105 transition-all">{isReg ? 'Создать' : 'Войти'}</button>
        </form>
        <button onClick={() => setIsReg(!isReg)} className="mt-4 text-[10px] font-black text-indigo-500 uppercase">{isReg ? 'Есть аккаунт?' : 'Регистрация'}</button>
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
    if (confirm("УДАЛИТЬ?")) {
      await supabase.from('tickets').delete().eq('id', id);
      fetchTickets();
    }
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.text("OTCHET", 10, 10);
    tickets.forEach((t, i) => doc.text(`${i+1}. ${t.title} - ${t.room} (${t.status})`, 10, 20 + (i*10)));
    doc.save("report.pdf");
  };

  // ФИЛЬТРАЦИЯ ДЛЯ ПОИСКА
  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.room.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className="h-20 px-6 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-40 bg-inherit/80">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
          <img src={profile.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-black uppercase italic leading-none">{profile.name}</h1>
            <p className="text-[8px] font-bold text-indigo-500">{isAdmin ? 'ADMIN' : 'USER'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full"><Download size={20}/></button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-indigo-500">{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-500/50"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {/* ПОИСК */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ПОИСК ПО ЗАЯВКАМ И КАБИНЕТАМ..." 
            className="w-full p-4 pl-12 rounded-2xl bg-slate-500/10 border-none outline-none font-bold text-xs focus:ring-2 ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">ЗАЯВКИ ({filteredTickets.length})</h2>
          {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} userName={profile.name} />}
        </div>

        <div className="grid gap-4">
          {filteredTickets.map(t => (
            <div key={t.id} className={`p-5 rounded-[2rem] border animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {t.image_url && <img src={t.image_url} className="w-14 h-14 rounded-xl object-cover" />}
                  <div>
                    <h3 className="text-xl font-black uppercase italic leading-tight">{t.title}</h3>
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">КАБ: {t.room} | ОТ: {t.user_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteTicket(t.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all">
                    <Trash2 size={18}/>
                  </button>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black text-white ${t.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                    {t.status === 'done' ? 'ГОТОВО' : 'В РАБОТЕ'}
                  </div>
                </div>
              </div>
              
              {isAdmin && t.status !== 'done' && (
                <button 
                  onClick={async () => { await supabase.from('tickets').update({status: 'done'}).eq('id', t.id); fetchTickets(); }} 
                  className="w-full mt-4 bg-emerald-600 py-2 rounded-xl text-[10px] font-black text-white uppercase hover:bg-emerald-500 transition-all"
                >
                  Завершить работу
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* ПРОФИЛЬ */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="p-10 rounded-[3rem] w-full max-w-sm bg-slate-900 border border-white/10 text-center text-white">
            <h2 className="text-xl font-black italic mb-6 text-indigo-500">ПРОФИЛЬ</h2>
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
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 rounded-2xl mb-4 bg-white/5 font-bold outline-none" />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsProfileOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black">СОХРАНИТЬ</button>
            <button onClick={() => setIsProfileOpen(false)} className="mt-4 text-[9px] font-black opacity-40 uppercase">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewTicketBtn({ onCreated, userEmail, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [img, setImg] = useState(null);

  const handleSend = async () => {
    if (!title || !room) return alert("Заполни поля!");
    const { error } = await supabase.from('tickets').insert([{ 
      title: title.toUpperCase(), room, user_email: userEmail, user_name: userName, status: 'new', image_url: img 
    }]);
    if (!error) {
        await sendTelegram(title.toUpperCase(), room, userName);
        setIsOpen(false); setImg(null); onCreated();
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-black text-white uppercase shadow-lg">НОВАЯ ЗАЯВКА</button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="p-8 rounded-[3.5rem] w-full max-w-md bg-slate-900 border border-white/10 text-white">
            <h2 className="text-2xl font-black italic text-indigo-500 mb-6 text-center">НОВЫЙ ТИКЕТ</h2>
            <div className="space-y-4">
              <input placeholder="ЧТО СЛУЧИЛОСЬ?" onChange={e => setTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500 transition-all" />
              <input placeholder="КАБИНЕТ" onChange={e => setRoom(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 font-bold outline-none border border-transparent focus:border-indigo-500 transition-all" />
              <div className="relative p-6 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 text-center">
                {img ? <img src={img} className="w-20 h-20 mx-auto rounded-xl object-cover mb-2" /> : <Camera size={30} className="mx-auto mb-2 opacity-20"/>}
                <label className="text-[10px] font-black cursor-pointer bg-indigo-500/20 px-4 py-2 rounded-xl text-indigo-400">
                  {img ? 'ИЗМЕНИТЬ ФОТО' : 'ПРИКРЕПИТЬ ФОТО'}
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) setImg(URL.createObjectURL(file));
                  }} />
                </label>
              </div>
              <button onClick={handleSend} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-indigo-500 transition-all">Отправить</button>
              <button onClick={() => setIsOpen(false)} className="w-full text-[10px] font-black opacity-30 uppercase">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
