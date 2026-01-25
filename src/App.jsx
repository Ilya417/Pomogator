import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, Shield, MapPin, Settings, Loader2,
  Trash2, Camera, FileUp, ExternalLink, MessageSquare, Send, X, CheckCircle2, Clock
} from 'lucide-react';

const supabaseUrl = 'https://yjbswbvakjiulyvkfcyt.supabase.co';
const supabaseKey = 'sb_publishable_RtfrdU2tsh1EtKrWwafc_Q_KfXAeMh6';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'ily4glotov@yandex.ru';
const TG_BOT_TOKEN = '8491548873:AAE_DDgazopwT0VXf51RKtA2gcvhmhBOKwk';
const TG_CHAT_ID = '1920949380';

// Функция отправки в Telegram
const sendTgMessage = async (ticket) => {
  const priorityEmoji = ticket.priority === 'urgent' ? '🚨 СРОЧНО' : '☕ ОБЫЧНАЯ';
  const text = `🆕 НОВАЯ ЗАЯВКА\n\n` +
               `📌 Тема: ${ticket.title}\n` +
               `📍 Кабинет: ${ticket.room}\n` +
               `👤 Отправитель: ${ticket.user_name}\n` +
               `⚡ Приоритет: ${priorityEmoji}\n` +
               `📎 Файл: ${ticket.file_url ? 'Прикреплен' : 'Нет'}`;

  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text })
    });
  } catch (e) {
    console.error("Ошибка Telegram:", e);
  }
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
    </div>
  );

  return !session ? <AuthPage /> : <MainApp session={session} />;
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
async function uploadFile(file, folder = 'tickets') {
  if (!file) return null;
  const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const filePath = `${folder}/${fileName}`;
  const { data, error } = await supabase.storage.from('uploads').upload(filePath, file);
  if (error) { alert("Ошибка загрузки: " + error.message); return null; }
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return publicUrl;
}

// --- КОМПОНЕНТ ЧАТА ---
function Chat({ ticketId, userEmail, userName }) {
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
    <div className="mt-4 border-t border-white/5 pt-4">
      <div className="max-h-40 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`text-xs p-2 rounded-xl ${m.user_email === userEmail ? 'bg-indigo-600/20 ml-8' : 'bg-white/5 mr-8'}`}>
            <p className="font-black text-[9px] uppercase opacity-50 mb-1">{m.user_name}</p>
            <p>{m.message}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Написать..."
          className="flex-1 bg-white/5 p-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-white"
        />
        <button onClick={sendMessage} className="bg-indigo-600 p-2 rounded-xl hover:bg-indigo-500"><Send size={14} className="text-white"/></button>
      </div>
    </div>
  );
}

// --- СТРАНИЦА ВХОДА ---
function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#020617] p-6 text-slate-200">
      <div className="bg-slate-900 border border-white/5 p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
        <Shield className="mx-auto mb-6 text-indigo-500" size={50} />
        <h2 className="text-2xl font-black uppercase mb-8 italic tracking-tighter text-white">Service Desk</h2>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition text-white" />
          <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition text-white" />
          <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 text-white">
            {isSignUp ? 'Регистрация' : 'Войти'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-6 text-[10px] text-slate-500 uppercase font-black hover:text-indigo-400 transition tracking-widest">
          {isSignUp ? 'Уже есть аккаунт?' : 'Создать аккаунт'}
        </button>
      </div>
    </div>
  );
}

// --- ГЛАВНЫЙ ИНТЕРФЕЙС ---
function MainApp({ session }) {
  const [tickets, setTickets] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const userEmail = session.user.email;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`profile_${userEmail}`);
    return saved ? JSON.parse(saved) : {
      name: userEmail.split('@')[0],
      avatar: 'https://as2.ftcdn.net/jpg/02/29/75/83/1000_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg',
      role: isAdmin ? 'Администратор' : 'Пользователь'
    };
  });

  useEffect(() => {
    fetchTickets();
    const sub = supabase.channel('tickets-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchTickets() {
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('user_email', userEmail);
    const { data } = await query;
    setTickets(data || []);
  }

  async function deleteTicket(id) {
    if(!window.confirm("Удалить заявку?")) return;
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchTickets();
  }

  // Функция смены статуса
  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
    if (error) alert(error.message);
    else fetchTickets();
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <header className="h-24 border-b border-white/5 flex items-center px-8 justify-between sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
          <img src={profile.avatar} className="w-12 h-12 rounded-2xl border-2 border-indigo-500/30 object-cover" />
          <div>
            <p className="text-sm font-bold text-white leading-none tracking-tight">{profile.name}</p>
            <p className="text-[10px] text-indigo-400 uppercase font-black mt-1 tracking-widest">{profile.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 hover:bg-white/5 rounded-xl transition text-slate-400 hover:text-white"><Settings size={22}/></button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition"><LogOut size={22}/></button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">{isAdmin ? 'Управление' : 'Заявки'}</h1>
           {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} profile={profile} />}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {tickets.map(t => (
            <div key={t.id} className={`bg-slate-900/40 border p-8 rounded-[2.5rem] hover:bg-slate-900/60 transition group relative flex flex-col ${t.priority === 'urgent' ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold tracking-tight text-white pr-8">{t.title}</h3>
                {isAdmin && (
                  <button onClick={() => deleteTicket(t.id)} className="text-slate-600 hover:text-red-500 transition"><Trash2 size={20}/></button>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${t.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  {t.priority === 'urgent' ? 'Срочно' : 'Подождет'}
                </span>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${t.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                  {t.status === 'new' ? 'Новая' : t.status === 'process' ? 'В работе' : 'Выполнена'}
                </span>
              </div>

              {/* ПАНЕЛЬ СТАТУСА ДЛЯ АДМИНА */}
              {isAdmin && (
                <div className="flex gap-2 mb-4">
                  <button onClick={() => updateStatus(t.id, 'process')} className="flex-1 bg-white/5 hover:bg-indigo-500/20 p-2 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-2">
                    <Clock size={12}/> В работу
                  </button>
                  <button onClick={() => updateStatus(t.id, 'done')} className="flex-1 bg-white/5 hover:bg-emerald-500/20 p-2 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-2">
                    <CheckCircle2 size={12}/> Готово
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.1em] mb-4">
                <span><MapPin size={12} className="inline mr-1"/> Каб. {t.room}</span>
                {t.file_url && (
                  <a href={t.file_url} target="_blank" rel="noreferrer" className="text-indigo-400 flex items-center gap-1 hover:underline">
                    <ExternalLink size={12}/> Файл
                  </a>
                )}
              </div>

              <Chat ticketId={t.id} userEmail={userEmail} userName={profile.name} />
            </div>
          ))}
        </div>
      </main>

      {/* МОДАЛКА НАСТРОЕК */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-slate-900 p-8 rounded-[3rem] w-full max-w-sm border border-white/10 text-center relative shadow-2xl">
            <div className="relative w-28 h-28 mx-auto mb-8 group">
              <img src={profile.avatar} className="w-full h-full rounded-[2.5rem] object-cover border-2 border-indigo-500 shadow-lg" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 cursor-pointer transition duration-300">
                <Camera size={28} className="text-white"/>
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                  const url = await uploadFile(e.target.files[0], 'avatars');
                  if (url) setProfile(prev => ({...prev, avatar: url}));
                }} />
              </label>
            </div>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-white/5 p-4 rounded-2xl mb-4 text-white text-center outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Имя" />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsSettingsOpen(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg text-white">Сохранить</button>
            <button onClick={() => setIsSettingsOpen(false)} className="mt-4 text-[10px] text-slate-600 font-black uppercase tracking-widest">Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- КНОПКА СОЗДАНИЯ ---
function NewTicketBtn({ onCreated, userEmail, profile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', room: '', file: null, priority: 'normal' });
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!form.title || !form.room) return alert("Заполни поля!");
    setLoading(true);
    const url = form.file ? await uploadFile(form.file) : null;

    const ticketData = {
      title: form.title, room: form.room, user_email: userEmail,
      user_name: profile.name, status: 'new', file_url: url, priority: form.priority
    };

    const { error } = await supabase.from('tickets').insert([ticketData]);

    if(!error) {
      await sendTgMessage(ticketData); // Отправка в ТГ
      setIsOpen(false);
      setForm({ title: '', room: '', file: null, priority: 'normal' });
      onCreated();
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:scale-105 transition active:scale-95"><Plus size={32} className="text-white"/></button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-2xl">
          <div className="bg-slate-900 p-10 rounded-[3rem] w-full max-w-md border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic mb-8 text-indigo-500 tracking-tighter">Новая проблема</h2>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setForm({...form, priority: 'urgent'})}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition ${form.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-500'}`}
              >Срочно 🚨</button>
              <button
                onClick={() => setForm({...form, priority: 'normal'})}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition ${form.priority === 'normal' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`}
              >Подождет ☕</button>
            </div>

            <input onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 p-4 rounded-2xl mb-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Что произошло?" />
            <input onChange={e => setForm({...form, room: e.target.value})} className="w-full bg-white/5 p-4 rounded-2xl mb-6 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Номер кабинета" />

            <label className="flex items-center gap-3 w-full bg-white/5 p-4 rounded-2xl mb-8 border border-dashed border-white/10 cursor-pointer hover:border-indigo-500/50 transition">
               <FileUp size={20} className="text-indigo-400 ml-2"/>
               <span className="text-xs text-slate-400 font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap text-ellipsis">
                 {form.file ? form.file.name : 'Добавить файл'}
               </span>
               <input type="file" className="hidden" onChange={e => setForm({...form, file: e.target.files[0]})} />
            </label>

            <button onClick={handleSend} disabled={loading} className="w-full bg-indigo-600 py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50 text-white">
              {loading ? 'Отправка...' : 'Отправить в IT'}
            </button>
            <button onClick={() => setIsOpen(false)} className="w-full mt-4 text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-white transition">Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}