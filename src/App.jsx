import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, LogOut, Shield, MapPin, Settings, Loader2,
  Trash2, Camera, FileUp, ExternalLink, MessageSquare, Send, CheckCircle2, Clock, 
  BarChart3, AlertCircle, Zap, Globe, Cpu, User
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
  } catch (e) { console.error("TG Error"); }
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
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="relative mb-4">
        <Cpu className="animate-pulse text-indigo-500" size={60} />
        <div className="absolute inset-0 blur-2xl bg-indigo-500/20"></div>
      </div>
      <p className="text-indigo-400 font-black uppercase tracking-[0.3em] animate-pulse text-xs">Pomogator Loading...</p>
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
  if (error) return null;
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
    <div className="mt-6 bg-black/20 rounded-[2rem] p-4 border border-white/5">
      <div className="max-h-32 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`text-[11px] p-3 rounded-2xl transition-all ${m.user_email === 'system' ? 'bg-indigo-500/10 text-center text-indigo-300' : m.user_email === userEmail ? 'bg-indigo-600/20 ml-6 border-r-2 border-indigo-500' : 'bg-white/5 mr-6 border-l-2 border-slate-500'}`}>
            <span className="font-black opacity-40 block mb-1 uppercase text-[9px]">{m.user_name}</span>
            {m.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ваш ответ..." className="flex-1 bg-white/5 p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-white" />
        <button onClick={sendMessage} className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 active:scale-90 transition-all shadow-lg shadow-indigo-600/20"><Send size={14} className="text-white"/></button>
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
    if (error) alert("Ошибка: " + error.message);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="bg-slate-900/50 border border-white/10 p-12 rounded-[3.5rem] w-full max-w-md text-center backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-indigo-500 rounded-full blur-sm"></div>
        <Zap className="mx-auto mb-6 text-indigo-500 animate-bounce-slow" size={60} />
        <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter text-white">Pomogator</h2>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-10">Next-Gen Support</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 p-5 rounded-2xl outline-none border border-white/5 focus:border-indigo-500 transition-all text-white" />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 p-5 rounded-2xl outline-none border border-white/5 focus:border-indigo-500 transition-all text-white" />
          <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-600/20 text-white">
            {isSignUp ? 'Создать ID' : 'Войти в систему'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-8 text-[9px] text-slate-500 uppercase font-black hover:text-indigo-400 tracking-[0.2em] transition-all">
          {isSignUp ? 'Назад к авторизации' : 'Создать новый аккаунт'}
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
      avatar: 'https://cdn-icons-png.flaticon.com/512/8727/8727604.png',
      role: isAdmin ? 'Supreme Admin' : 'Agent'
    };
  });

  useEffect(() => {
    fetchTickets();
    const sub = supabase.channel('realtime-pomogator').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchTickets() {
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('user_email', userEmail);
    const { data } = await query;
    setTickets(data || []);
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
    fetchTickets();
  }

  const stats = {
    total: tickets.length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    efficiency: Math.round((tickets.filter(t => t.status === 'done').length / (tickets.length || 1)) * 100)
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans">
      <header className="h-28 border-b border-white/5 flex items-center px-10 justify-between sticky top-0 bg-[#020617]/80 backdrop-blur-2xl z-40">
        <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setIsSettingsOpen(true)}>
          <div className="relative">
            <img src={profile.avatar} className="w-14 h-14 rounded-[1.5rem] border-2 border-indigo-500/40 object-cover group-hover:border-indigo-500 transition-all duration-500 shadow-lg shadow-indigo-500/10" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-4 border-[#020617]"></div>
          </div>
          <div className="hidden sm:block">
            <p className="text-lg font-black text-white leading-none tracking-tight">{profile.name}</p>
            <p className="text-[9px] text-indigo-400 uppercase font-black mt-2 tracking-[0.2em] flex items-center gap-2">
              <Globe size={10} className="animate-spin-slow"/> {profile.role} • {stats.efficiency}% Score
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="hidden md:flex gap-8">
              <div className="text-center"><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Active</p><p className="text-xl font-black text-white italic">{stats.total}</p></div>
              <div className="text-center"><p className="text-[9px] font-black uppercase text-red-500 tracking-widest">Critical</p><p className="text-xl font-black text-red-500 italic">{stats.urgent}</p></div>
           </div>
           <div className="w-[1px] h-10 bg-white/10"></div>
           <button onClick={() => supabase.auth.signOut()} className="p-4 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"><LogOut size={24}/></button>
        </div>
      </header>

      <main className="p-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
           <div>
              <h1 className="text-6xl font-black uppercase italic tracking-tighter text-white leading-none">Pomogator</h1>
              <div className="h-1 w-24 bg-indigo-600 mt-4 rounded-full"></div>
           </div>
           {!isAdmin && <NewTicketBtn onCreated={fetchTickets} userEmail={userEmail} profile={profile} />}
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {tickets.map((t, i) => (
            <div key={t.id} style={{animationDelay: `${i * 100}ms`}} className={`bg-slate-900/30 border p-10 rounded-[3.5rem] hover:bg-slate-900/50 transition-all duration-500 group relative flex flex-col animate-slide-up ${t.priority === 'urgent' && t.status !== 'done' ? 'border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.1)]' : 'border-white/5 shadow-xl'}`}>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] ${t.priority === 'urgent' ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {t.priority === 'urgent' ? 'Critical' : 'Standard'}
                      </span>
                      <span className="text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] bg-white/5 text-slate-400">
                        {t.status === 'new' ? 'Queued' : t.status === 'process' ? 'In Progress' : 'Resolved'}
                      </span>
                   </div>
                   <h3 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-tight group-hover:text-indigo-400 transition-colors">{t.title}</h3>
                </div>
                {isAdmin && (
                  <button onClick={async () => { if(confirm("Delete?")) await supabase.from('tickets').delete().eq('id', t.id); fetchTickets(); }} className="text-slate-600 hover:text-red-500 transition-all p-3 hover:bg-red-500/10 rounded-2xl"><Trash2 size={22}/></button>
                )}
              </div>

              {isAdmin && t.status !== 'done' && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button onClick={() => updateStatus(t.id, 'process')} className="bg-indigo-600 hover:bg-indigo-500 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                    <Clock size={14}/> Start Fix
                  </button>
                  <button onClick={() => updateStatus(t.id, 'done')} className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                    <CheckCircle2 size={14}/> Complete
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <span className="flex items-center gap-2"><MapPin size={14} className="text-indigo-500"/> Room {t.room}</span>
                <span className="flex items-center gap-2"><User size={14} className="text-slate-600"/> {t.user_name}</span>
                {t.file_url && (
                  <a href={t.file_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-white transition-all flex items-center gap-2">
                    <ExternalLink size={14}/> Attachment
                  </a>
                )}
              </div>

              <Chat ticketId={t.id} userEmail={userEmail} userName={profile.name} />
            </div>
          ))}
        </div>
      </main>

      {/* MODAL SETTINGS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 p-12 rounded-[4rem] w-full max-w-sm text-center shadow-2xl animate-scale-up">
            <div className="relative w-32 h-32 mx-auto mb-10 group">
              <img src={profile.avatar} className="w-full h-full rounded-[2.5rem] object-cover border-4 border-indigo-500 shadow-2xl" />
              <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
                <Camera size={32} className="text-white"/>
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                  const url = await uploadFile(e.target.files[0], 'avatars');
                  if (url) setProfile(prev => ({...prev, avatar: url}));
                }} />
              </label>
            </div>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-white/5 p-5 rounded-2xl mb-6 text-white text-center font-bold outline-none border border-white/5 focus:border-indigo-500" placeholder="Display Name" />
            <button onClick={() => { localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile)); setIsSettingsOpen(false); }} className="w-full bg-indigo-600 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl text-white">Save Identity</button>
            <button onClick={() => setIsSettingsOpen(false)} className="mt-6 text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-white transition-all">Dismiss</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-fade-in { animation: fade-in 0.4s ease-out both; }
        .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 20px; }
      `}</style>
    </div>
  );
}

// --- КНОПКА СОЗДАНИЯ ---
function NewTicketBtn({ onCreated, userEmail, profile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', room: '', file: null, priority: 'normal' });
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!form.title || !form.room) return alert("Fill required fields!");
    setLoading(true);
    const url = form.file ? await uploadFile(form.file) : null;
    const ticketData = { title: form.title, room: form.room, user_email: userEmail, user_name: profile.name, status: 'new', file_url: url, priority: form.priority };
    
    const { data: newTicket, error } = await supabase.from('tickets').insert([ticketData]).select().single();
    if(!error && newTicket) {
      await supabase.from('ticket_comments').insert([{ ticket_id: newTicket.id, user_email: 'system', user_name: 'AI SYSTEM', message: 'Hello! Your Pomogator ticket has been logged and IT staff notified via Telegram.' }]);
      await sendTgMessage(ticketData); 
      setIsOpen(false);
      setForm({ title: '', room: '', file: null, priority: 'normal' });
      onCreated();
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-indigo-600 w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all group relative">
        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-0 group-hover:opacity-40 transition-all"></div>
        <Plus size={40} className="text-white relative z-10"/>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 p-12 rounded-[4rem] w-full max-w-lg border border-white/10 shadow-2xl animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Zap size={150}/></div>
            <h2 className="text-4xl font-black uppercase italic mb-10 text-indigo-500 tracking-tighter relative z-10">New Request</h2>

            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
              <button onClick={() => setForm({...form, priority: 'urgent'})} className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${form.priority === 'urgent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/5 text-slate-500'}`}>Critical</button>
              <button onClick={() => setForm({...form, priority: 'normal'})} className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${form.priority === 'normal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/5 text-slate-500'}`}>Normal</button>
            </div>

            <div className="space-y-4 mb-10 relative z-10">
              <input onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 p-6 rounded-3xl text-white outline-none border border-white/5 focus:border-indigo-500 transition-all font-bold" placeholder="What happened?" />
              <input onChange={e => setForm({...form, room: e.target.value})} className="w-full bg-white/5 p-6 rounded-3xl text-white outline-none border border-white/5 focus:border-indigo-500 transition-all font-bold" placeholder="Room Number" />
              <label className="flex items-center gap-4 w-full bg-white/5 p-6 rounded-3xl border border-dashed border-white/10 cursor-pointer hover:border-indigo-500 transition-all">
                <FileUp className="text-indigo-400" size={24}/>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest overflow-hidden text-ellipsis">{form.file ? form.file.name : 'Attach Image/File'}</span>
                <input type="file" className="hidden" onChange={e => setForm({...form, file: e.target.files[0]})} />
              </label>
            </div>

            <button onClick={handleSend} disabled={loading} className="w-full bg-indigo-600 py-6 rounded-3xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50 text-white">
              {loading ? 'Transmitting...' : 'Dispatch to IT'}
            </button>
            <button onClick={() => setIsOpen(false)} className="w-full mt-6 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] hover:text-white transition-all">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
