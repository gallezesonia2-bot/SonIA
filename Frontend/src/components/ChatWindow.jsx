import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../api";
import { IconMic, IconPaperclip, IconSend, IconX } from "../icons.jsx";

const suggestions = [
  {
    title: "Generate code",
    description: "Create snippets, functions, or scripts quickly.",
    color: "from-[#7c3aed] to-[#8b5cf6]",
  },
  {
    title: "Explain a concept",
    description: "Get clear, step-by-step explanations.",
    color: "from-[#3b82f6] to-[#60a5fa]",
  },
  {
    title: "Solve a math problem",
    description: "Work through equations and logic clearly.",
    color: "from-[#10b981] to-[#34d399]",
  },
  {
    title: "Create a study plan",
    description: "Outline the best path for your goals.",
    color: "from-[#f59e0b] to-[#fbbf24]",
  },
];

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LogoIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="robotEyes">
          <rect width="64" height="64" fill="white" />
          <circle cx="39" cy="26" r="3.2" fill="black" />
          <circle cx="47" cy="26" r="3.2" fill="black" />
          <path d="M58 56 L62 52 L62 56 Z" fill="black" />
        </mask>
      </defs>
      <g fill="white" mask="url(#robotEyes)">
        <path d="M2,18 L26,2 L30,46 L6,54 Z" />
        <rect x="26" y="2" width="34" height="26" rx="13" />
        <rect x="24" y="28" width="38" height="30" rx="15" />
      </g>
    </svg>
  );
}

function CodeBlock({ code, lang }) {
  return (
    <div className="relative my-4 overflow-hidden rounded-3xl border p-4" style={{ borderColor: "var(--code-border)", background: "var(--code-bg)" }}>
      {lang && (
        <div className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.15em]" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>{lang}</div>
      )}
      <button className="absolute right-4 top-4 rounded-full border px-3 py-1 text-xs transition" style={{ borderColor: "var(--border-soft)", background: "var(--hover)", color: "var(--text)" }}>Copy</button>
      <pre className="overflow-x-auto text-sm font-mono leading-6" style={{ color: "var(--text)" }}>{code}</pre>
    </div>
  );
}

function MessageAttachments({ attachments }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((att, i) => {
        const isImage = (att.content_type || "").startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(att.filename || "");
        if (isImage) {
          return (
            <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-soft)" }}>
              <img src={att.url} alt={att.filename} className="h-32 w-32 object-cover" />
            </a>
          );
        }
        return (
          <a key={i} href={att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)", color: "var(--text)" }}>
            <IconPaperclip className="h-4 w-4" />
            <span className="max-w-[12rem] truncate">{att.filename}</span>
          </a>
        );
      })}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const codeMatch = msg.content.match(/```(\w+)?\n([\s\S]*?)```/);

  const bubbleClasses = isUser
    ? "rounded-[2rem] rounded-br-none bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white shadow-[0_12px_40px_rgba(124,58,237,0.28)]"
    : "group relative rounded-[2rem] rounded-bl-none border p-4 text-gray-100 shadow-lg shadow-[#000000]/20 backdrop-blur-xl";

  const bubbleStyle = isUser ? undefined : { borderColor: "var(--border-soft)", background: "var(--bubble-ai)" };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={bubbleClasses} style={bubbleStyle}>
        {codeMatch ? <CodeBlock lang={codeMatch[1]} code={codeMatch[2]} /> : <div className="whitespace-pre-wrap break-words text-sm leading-7">{msg.content}</div>}
        <MessageAttachments attachments={msg.attachments} />
        {!isUser && (
          <div className="mt-3 hidden items-center justify-end gap-3 opacity-0 transition duration-200 group-hover:flex">
            <button className="rounded-full p-2 transition hover:bg-white/10" style={{ background: "var(--hover)", color: "var(--text-muted)" }}>Good</button>
            <button className="rounded-full p-2 transition hover:bg-white/10" style={{ background: "var(--hover)", color: "var(--text-muted)" }}>Bad</button>
            <button className="rounded-full p-2 transition hover:bg-white/10" style={{ background: "var(--hover)", color: "var(--text-muted)" }}>Retry</button>
            <button className="rounded-full p-2 transition hover:bg-white/10" style={{ background: "var(--hover)", color: "var(--text-muted)" }}>Read</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({
  user,
  messages,
  input,
  setInput,
  handleSend,
  handleKeyDown,
  isSending,
  error,
  bottomRef,
  conversationId,
  onToggleSidebar,
  onGoHome,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onVoiceTranscript,
  onError,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function startRecording() {
    if (!conversationId) {
      onError && onError("Start a chat before sending a voice message.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        try {
          const data = await transcribeAudio(blob);
          onVoiceTranscript(data.text);
        } catch (err) {
          onError && onError(err.message || "Transcription failed");
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => setRecTime((t) => t + 1), 1000);
    } catch (err) {
      onError && onError(err.message || "Could not access the microphone.");
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function toggleRecording() {
    if (recording) stopRecording();
    else startRecording();
  }

  function handleFilePick(e) {
    const files = e.target.files;
    if (files && files.length) onAddAttachments(files);
    e.target.value = "";
  }

  return (
    <div className="flex-1 overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center justify-between border-b px-6 py-5 backdrop-blur-sm" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
        <div className="flex items-center gap-4">
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition xl:hidden"
              style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)", color: "var(--text-muted)" }}
            >
              <IconX className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-3 rounded-3xl px-4 py-3 shadow-sm" style={{ background: "var(--bg-elevated)" }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[#7c3aed] to-[#6366f1] text-xl font-bold text-white">S</div>
            <div>
              <div className="font-semibold" style={{ color: "var(--text-strong)" }}>SonIA</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#6366f1] text-sm font-semibold text-white">
            {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-96px)] flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-6 text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#7c3aed] to-[#6366f1] shadow-2xl shadow-[#7c3aed]/20">
                <LogoIcon className="h-20 w-20" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--text-strong)" }}>
                  Hello {user.name ? user.name.split(" ")[0] : "there"}
                </h1>
                <p className="max-w-xl text-sm" style={{ color: "var(--text-muted)" }}>
                  What can I help you with today? Ask anything — code, design, strategy, or ideas.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl w-full">
                {suggestions.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-[1.75rem] border border-transparent p-5 text-left transition hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${item.color} text-white`}>
                        <span className="text-lg">✦</span>
                      </div>
                    <div className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>{item.title}</div>
                    <div className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-6">
              {messages.map((msg, index) => (
                <MessageBubble key={index} msg={msg} />
              ))}
            </div>
          )}

          {isSending && (
            <div className="mx-auto w-full max-w-3xl px-6">
              <div className="mt-6 flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6366f1]" />
                  <span className="inline-block h-2.5 w-2.5 animate-bounce delay-150 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6366f1]" />
                  <span className="inline-block h-2.5 w-2.5 animate-bounce delay-300 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6366f1]" />
                </div>
                Thinking...
              </div>
            </div>
          )}

          {error && <div className="mx-auto w-full max-w-3xl px-6"><div className="mt-4 rounded-3xl px-4 py-3 text-sm" style={{ background: "var(--bubble-ai)", color: "#fca5a5" }}>{error}</div></div>}

          <div ref={bottomRef} />
        </div>

        <div className="relative border-t px-6 py-4" style={{ borderColor: "var(--border)", background: "var(--bg-app)" }}>
          {recording && (
            <div className="mb-3 flex items-center gap-3 rounded-full border px-4 py-2" style={{ borderColor: "var(--border-accent)", background: "var(--bg-elevated)" }}>
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <div className="flex items-end gap-1">
                <span className="h-3 w-1 animate-pulse rounded-full bg-[#7c3aed]" />
                <span className="h-5 w-1 animate-pulse rounded-full bg-[#7c3aed]" style={{ animationDelay: "150ms" }} />
                <span className="h-4 w-1 animate-pulse rounded-full bg-[#7c3aed]" style={{ animationDelay: "300ms" }} />
                <span className="h-6 w-1 animate-pulse rounded-full bg-[#7c3aed]" style={{ animationDelay: "450ms" }} />
                <span className="h-3 w-1 animate-pulse rounded-full bg-[#7c3aed]" style={{ animationDelay: "600ms" }} />
              </div>
              <span className="text-sm tabular-nums" style={{ color: "var(--text)" }}>{formatDuration(recTime)}</span>
              <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>Recording… tap mic to stop</span>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
                  {att.url && att.contentType?.startsWith("image/") ? (
                    <img src={att.url} alt={att.filename} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <IconPaperclip className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  )}
                  <span className="max-w-[10rem] truncate" style={{ color: "var(--text)" }}>{att.filename}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{att.uploading ? "Uploading…" : formatSize(att.size)}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    className="rounded-full p-1 transition hover:bg-white/10"
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Remove attachment"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 rounded-full border px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] focus-within:ring-2 focus-within:ring-[#7c3aed]/25" style={{ borderColor: "var(--border-accent)", background: "var(--bg-elevated)" }}>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilePick} />

              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 transition hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
                <IconPaperclip className="h-5 w-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message SonIA..."
                className="min-h-[44px] max-h-36 flex-1 resize-none overflow-hidden bg-transparent text-sm leading-6 outline-none placeholder:text-gray-500"
                style={{ color: "var(--text-strong)" }}
              />

              <button
                type="button"
                onClick={toggleRecording}
                disabled={!conversationId}
                className={`rounded-full p-2 transition hover:bg-white/5 disabled:opacity-40 ${recording ? "text-red-500" : ""}`}
                style={{ color: recording ? undefined : "var(--text-muted)" }}
                aria-label={recording ? "Stop recording" : "Record voice message"}
              >
                <IconMic className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !conversationId}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#6366f1] text-white shadow-lg shadow-[#7c3aed]/25 transition disabled:opacity-50"
              >
                <IconSend className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
