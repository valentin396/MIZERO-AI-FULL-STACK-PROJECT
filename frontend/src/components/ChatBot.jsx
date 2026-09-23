import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState(null);
  const bottomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => { send('', true); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  async function send(text, isFirst = false) {
    if (!isFirst) setMessages((m) => [...m, { from: 'user', text }]);
    setLoading(true);
    try {
      const res = await api.post('/chat', { session_id: sessionId, message: text });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m, {
        from: 'bot', text: res.data.reply,
        searchResults: res.data.search_results, explain: res.data.nlu_explain,
      }]);
      setDone(res.data.done);
      setOptions(res.data.options);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading || done) return;
    setOptions(null);
    send(input.trim());
    setInput('');
  }

  function handleOption(opt) {
    if (loading || done) return;
    setOptions(null);
    send(opt);
  }

  async function toggleRecording() {
    if (transcribing || done) return;
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicError("Voice input isn't supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        transcribe(blob);
      };

      recorder.start();
      setRecording(true);
    } catch {
      setMicError("Couldn't access your microphone — check permissions and try again.");
    }
  }

  async function transcribe(blob) {
    setTranscribing(true);
    setMicError(null);
    try {
      const form = new FormData();
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      form.append('file', blob, `voice.${ext}`);
      const res = await api.post('/chat/transcribe', form);
      const text = (res.data.text || '').trim();
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
      else setMicError("Didn't catch that — please try again or type your message.");
    } catch (err) {
      setMicError(err.response?.data?.detail || "Voice input isn't available right now.");
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <div className="border border-ink/15 bg-cream flex flex-col h-[70vh] max-h-[640px]">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${m.from === 'user' ? 'bg-hills text-cream' : 'bg-paper text-ink border border-ink/10'}`}>
              {m.text}
            </div>
            {m.searchResults?.length > 0 && (
              <div className="max-w-[80%] mt-1.5 space-y-1.5 w-full">
                {m.searchResults.map((r) => (
                  <Link key={r.id} to={`/items/${r.id}`}
                    className="block border border-ink/10 bg-cream px-3 py-2 text-xs hover:border-clay transition-colors">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-ink/50"> — {r.status} · {r.location}{r.landmark ? `, ${r.landmark}` : ''}</span>
                  </Link>
                ))}
              </div>
            )}
            {m.explain?.length > 0 && <ExplainToggle lines={m.explain} />}
          </div>
        ))}
        {loading && <p className="text-xs text-ink/40">MIZERO is typing…</p>}
        <div ref={bottomRef} />
      </div>
      {options && !done && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-ink/10 bg-paper">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => handleOption(opt)}
              className="text-xs px-3 py-1.5 border border-ink/20 bg-cream hover:border-clay hover:text-clay transition-colors">
              {opt}
            </button>
          ))}
        </div>
      )}
      {micError && (
        <p className="px-4 py-1.5 text-xs text-red-600 border-t border-ink/10 bg-red-50">{micError}</p>
      )}
      <form onSubmit={handleSubmit} className="border-t border-ink/10 flex items-stretch">
        <button type="button" onClick={toggleRecording} disabled={done || transcribing}
          title={recording ? 'Stop recording' : 'Record a voice message'}
          className={`px-3 flex items-center justify-center border-r border-ink/10 disabled:opacity-40 transition-colors ${recording ? 'text-red-600' : 'text-ink/50 hover:text-clay'}`}>
          {transcribing ? <Spinner /> : <MicIcon pulsing={recording} />}
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={done || loading}
          placeholder={done ? 'Report complete' : transcribing ? 'Transcribing…' : recording ? 'Listening…' : 'Andika ubutumwa... (type your reply)'}
          className="flex-1 px-4 py-3 text-sm bg-cream disabled:bg-ink/5 focus:outline-none" />
        <button type="submit" disabled={done || loading} className="px-5 text-sm font-medium text-clay disabled:text-ink/30">Send</button>
      </form>
    </div>
  );
}

function MicIcon({ pulsing }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={pulsing ? 'animate-pulse' : ''}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin text-clay">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ExplainToggle({ lines }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-[80%] mt-1">
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-[11px] text-ink/40 hover:text-clay">
        {open ? 'Hide' : 'Why I understood this →'}
      </button>
      {open && (
        <ul className="mt-1 space-y-0.5 text-[11px] text-ink/50 font-mono">
          {lines.map((l, i) => <li key={i}>• {l}</li>)}
        </ul>
      )}
    </div>
  );
}
