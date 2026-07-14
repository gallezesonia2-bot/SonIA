import { useEffect, useRef, useState } from "react";
import { uploadAttachment, transcribeAudio } from "../api";
import { IconPlus, IconMic, IconSparkles, IconChevronDown, IconPaperclip, IconSend, IconSpeaker, IconMessage, IconFolder, IconX } from "../icons.jsx";

const chips = [
  { icon: IconSparkles, label: "Write code" },
  { icon: IconMessage, label: "Explain concept" },
  { icon: IconFolder, label: "Create plan" },
  { icon: IconPaperclip, label: "Upload file" },
];

export default function HomePage({ user, onStartChat }) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [recording, setRecording] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [recTime, setRecTime] = useState(0);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function handleFilePick(e) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      const entry = {
        id,
        file,
        filename: file.name,
        size: file.size,
        contentType: file.type,
        url: preview,
        uploading: true,
      };
      setAttachments((prev) => [...prev, entry]);
      try {
        const res = await uploadAttachment(file);
        setAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, url: `${res.url}`, uploading: false } : a))
        );
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, uploading: false, error: err.message } : a))
        );
      }
    }
    if (e.target) e.target.value = "";
  }

  function handleRemoveAttachment(id) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target && target.url && target.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((a) => a.id !== id);
    });
  }

  async function startRecording() {
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
          const text = (data.text || "").trim();
          if (text) {
            setInput(text);
          }
        } catch (err) {
          console.error("Transcription failed", err);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => setRecTime((t) => t + 1), 1000);
    } catch (err) {
      console.error("Could not access microphone", err);
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

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function handleSend() {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (attachments.some((a) => a.uploading)) return;
    const payload = attachments.map((a) => ({
      filename: a.filename,
      url: a.url,
      content_type: a.contentType,
      size: a.size,
    }));
    setInput("");
    setAttachments([]);
    onStartChat?.(text, payload);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const firstName = user?.name ? user.name.split(" ")[0] : "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F10]">
      <div className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7c3aed]/10">
              <IconSparkles className="h-6 w-6 text-[#7c3aed]" />
            </div>
            <h1 className="font-serif text-5xl font-semibold tracking-tight text-white">
              {greeting}, {firstName}
            </h1>
            <p className="mt-4 text-gray-400 text-lg">How can I help you today?</p>
          </div>

          <div
            className={`rounded-[1.5rem] border transition duration-300 ${
              isFocused
                ? "border-[#7c3aed]/40 shadow-[0_0_50px_rgba(124,58,237,0.12)]"
                : "border-[#2A2A2E] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            }`}
            style={{ background: "#1C1C1E" }}
          >
            <div className="flex flex-col">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={1}
                placeholder="Type a message..."
                className="min-h-[60px] w-full resize-none bg-transparent px-6 pt-5 text-sm leading-6 text-gray-100 outline-none placeholder:text-gray-500"
              />
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-5 pt-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-2 rounded-2xl border border-[#2A2A2E] bg-[#141416] px-3 py-2 text-xs text-gray-300">
                      {att.url && att.contentType?.startsWith("image/") ? (
                        <img src={att.url} alt={att.filename} className="h-6 w-6 rounded object-cover" />
                      ) : (
                        <IconPaperclip className="h-3.5 w-3.5 text-gray-500" />
                      )}
                      <span className="max-w-[10rem] truncate">{att.filename}</span>
                      <span className="text-[11px] text-gray-500">{att.uploading ? "Uploading…" : ""}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="rounded-full p-0.5 text-gray-500 transition hover:text-gray-300"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full p-2 text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
                  >
                    <IconPlus className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilePick}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-full border border-[#2A2A2E] px-3 py-1.5 text-xs text-gray-400 transition hover:border-[#7c3aed]/40 hover:text-gray-200"
                  >
                    SonIA 4.0
                    <IconChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`rounded-full p-2 transition hover:bg-white/5 ${recording ? "text-red-500" : "text-gray-500"}`}
                  >
                    <IconMic className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-2 text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
                  >
                    <IconSpeaker className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() && attachments.length === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#7c3aed] text-white transition hover:opacity-90 disabled:opacity-40"
                  >
                    <IconSend className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {recording && (
                <div className="mx-4 mb-3 flex items-center gap-3 rounded-full border border-[#7c3aed]/40 bg-[#141416] px-4 py-2">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                  <span className="text-sm tabular-nums text-gray-300">{formatDuration(recTime)}</span>
                  <span className="ml-auto text-xs text-gray-500">Recording… tap mic to stop</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2E] bg-[#1C1C1E] px-4 py-2 text-sm text-gray-400 transition hover:border-[#7c3aed]/40 hover:text-gray-200"
              >
                <chip.icon className="h-4 w-4 text-gray-500" />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
