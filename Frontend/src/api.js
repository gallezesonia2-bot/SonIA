const API_URL = "http://127.0.0.1:8000";

export { API_URL };

export async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function signIn(email, name) {
  const res = await fetch(`${API_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Sign in failed");
  }

  return res.json();
}

export async function verifyCode(email, code) {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Verification failed");
  }

  return res.json();
}

export async function resendCode(email) {
  const res = await fetch(`${API_URL}/auth/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Could not resend code");
  }

  return res.json();
}

export async function uploadAttachment(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/attachments`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Upload failed");
  }

  return res.json();
}

export async function transcribeAudio(blob, filename = "recording.webm") {
  const formData = new FormData();
  formData.append("audio", blob, filename);

  const res = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Transcription failed");
  }

  return res.json();
}

export async function createConversation(userId, title = "New Conversation") {
  const res = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to create conversation");
  }

  return res.json();
}

export async function listConversations(userId) {
  const res = await fetch(`${API_URL}/conversations/${userId}`);
  if (!res.ok) {
    throw new Error("Failed to load conversations");
  }
  return res.json();
}

export async function getMessages(conversationId) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`);
  if (!res.ok) {
    throw new Error("Failed to load messages");
  }
  return res.json();
}

export async function deleteConversation(conversationId) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete conversation");
  }
  return res.json();
}

export async function sendMessage(conversationId, message, attachments = []) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message, attachments }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to send message");
  }

  return res.json();
}

export async function createProject(userId, title, description = "") {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title, description }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to create project");
  }
  return res.json();
}

export async function listProjects(userId) {
  const res = await fetch(`${API_URL}/projects/${userId}`);
  if (!res.ok) {
    throw new Error("Failed to load projects");
  }
  return res.json();
}

export async function listFiles(userId) {
  const res = await fetch(`${API_URL}/files/${userId}`);
  if (!res.ok) {
    throw new Error("Failed to load files");
  }
  return res.json();
}

export async function getSettings(userId) {
  const res = await fetch(`${API_URL}/settings/${userId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to load settings");
  }
  return res.json();
}

export async function updateSettings(userId, payload) {
  const res = await fetch(`${API_URL}/settings/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to update settings");
  }
  return res.json();
}
