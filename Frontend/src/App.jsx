import { useState, useEffect, useRef } from "react";
import { API_URL, signIn, sendMessage, uploadAttachment, createConversation, getMessages } from "./api";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import HomePage from "./components/HomePage";
import LoginScreen from "./components/LoginScreen";
import VerifyScreen from "./components/VerifyScreen";

const STORAGE_USER = "sia_user";

function getStoredUser() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_USER);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return { ...parsed, verified: parsed.verified ?? true };
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [signInLoading, setSignInLoading] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }

    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success") === "true") {
      const userId = params.get("id");
      const email = params.get("email");
      const name = params.get("name");

      if (userId && email) {
        const userData = { id: userId, email, name: name || "", verified: true };
        setUser(userData);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (conversationId || messages.length) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, conversationId]);

  async function handleSignIn(email, name) {
    setError(null);
    setSignInLoading(true);

    try {
      const signedUser = await signIn(email, name);
      if (!signedUser.verified) {
        setPendingEmail(signedUser.email);
      } else {
        finishSignIn(signedUser);
      }
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setSignInLoading(false);
    }
  }

  function finishSignIn(signedUser) {
    setUser(signedUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_USER, JSON.stringify(signedUser));
    }
    setMessages([]);
    setConversationId(null);
    setAttachments([]);
    setReloadKey((key) => key + 1);
  }

  function handleVerified(verifiedUser) {
    setPendingEmail(null);
    finishSignIn(verifiedUser);
  }

  function handleSignOut() {
    setShowSignOutConfirm(false);
    setUser(null);
    setMessages([]);
    setConversationId(null);
    setAttachments([]);
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_USER);
    }
  }

  async function handleAddAttachments(fileList) {
    const files = Array.from(fileList || []);
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
          prev.map((a) => (a.id === id ? { ...a, url: `${API_URL}${res.url}`, uploading: false } : a))
        );
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, uploading: false, error: err.message } : a))
        );
      }
    }
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

  async function sendMessageText(text, attachmentsPayload = []) {
    if (!conversationId) {
      setError("Please start a new chat first.");
      return;
    }
    if (!text.trim() && attachmentsPayload.length === 0) return;

    setMessages((prev) => [...prev, { role: "user", content: text, attachments: attachmentsPayload }]);
    setIsSending(true);
    setError(null);

    try {
      const data = await sendMessage(conversationId, text, attachmentsPayload);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message || "Could not send the message.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (attachments.some((a) => a.uploading)) {
      setError("Please wait for attachments to finish uploading.");
      return;
    }
    const payload = attachments.map((a) => ({
      filename: a.filename,
      url: a.url,
      content_type: a.contentType,
      size: a.size,
    }));
    setInput("");
    setAttachments([]);
    sendMessageText(text, payload);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleVoiceTranscript(text) {
    if (!text || !text.trim()) return;
    sendMessageText(text.trim(), []);
  }

  async function handleNewChat() {
    if (!user) {
      setError("Please sign in before creating a chat.");
      return;
    }

    try {
      const convo = await createConversation(user.id, "New Conversation");
      setConversationId(convo.id);
      setMessages([]);
      setError(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err.message || "Could not create a new conversation.");
    }
  }

  async function handleSelectConversation(selectedId) {
    if (!selectedId) return;

    try {
      const loadedMessages = await getMessages(selectedId);
      setConversationId(selectedId);
      setMessages(Array.isArray(loadedMessages) ? loadedMessages : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Unable to load the conversation.");
    }
  }

  async function handleStartChatFromHome(text, attachmentsPayload = []) {
    if (!user) return;

    try {
      const convo = await createConversation(user.id, "New Conversation");
      setConversationId(convo.id);
      setMessages([]);
      setError(null);
      setReloadKey((key) => key + 1);

      if (text && text.trim()) {
        setMessages((prev) => [...prev, { role: "user", content: text, attachments: attachmentsPayload }]);
        setIsSending(true);
        try {
          const data = await sendMessage(convo.id, text, attachmentsPayload);
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } catch (err) {
          setError(err.message || "Could not send the message.");
        } finally {
          setIsSending(false);
        }
      }
    } catch (err) {
      setError(err.message || "Could not create a new conversation.");
    }
  }

  function handleGoHome() {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setAttachments([]);
    setError(null);
  }

  if (!user && !pendingEmail) {
    return <LoginScreen onSignIn={handleSignIn} isLoading={signInLoading} error={error} />;
  }

  if (pendingEmail) {
    return (
      <VerifyScreen
        email={pendingEmail}
        onVerified={handleVerified}
        onBack={() => setPendingEmail(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0F0F10] text-gray-200">
      <Sidebar
        user={user}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        activeConversationId={conversationId}
        reloadKey={reloadKey}
        onSignOut={() => setShowSignOutConfirm(true)}
      />

      <div className="flex-1">
        {conversationId ? (
          <ChatWindow
            user={user}
            isBackendAlive
            messages={messages}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            isSending={isSending}
            error={error}
            bottomRef={bottomRef}
            conversationId={conversationId}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            attachments={attachments}
            onAddAttachments={handleAddAttachments}
            onRemoveAttachment={handleRemoveAttachment}
            onVoiceTranscript={handleVoiceTranscript}
            onGoHome={handleGoHome}
          />
        ) : (
          <HomePage user={user} onStartChat={handleStartChatFromHome} />
        )}
      </div>

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-[#1E1E24] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Sign out</h3>
            <p className="mt-2 text-sm text-gray-400">Are you sure you want to sign out?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="rounded-full px-5 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                style={{ background: "#7C3AED" }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
