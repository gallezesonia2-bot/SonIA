import { useState } from "react";
import { IconPlus, IconMessage, IconFolder, IconFile, IconSettings, IconLogout } from "../icons.jsx";
import { listProjects, listFiles, getSettings } from "../api";
import logo from "../assets/sonia-robot-logo.svg";

const navItems = [
  { icon: IconMessage, label: "Chats" },
  { icon: IconFolder, label: "Projects" },
  { icon: IconFile, label: "Files" },
  { icon: IconSettings, label: "Customize" },
];

export default function Sidebar({ user, onNewChat, onSelectConversation, activeConversationId, reloadKey, onSignOut }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeNav, setActiveNav] = useState("Chats");
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  async function handleNavClick(item) {
    setActiveNav(item.label);
    setActionMsg("");
    if (item.label === "Projects" && user?.id) {
      try {
        const data = await listProjects(user.id);
        setProjects(data);
      } catch (e) {
        setActionMsg(e.message);
      }
    } else if (item.label === "Files" && user?.id) {
      try {
        const data = await listFiles(user.id);
        setFiles(data);
      } catch (e) {
        setActionMsg(e.message);
      }
    } else if (item.label === "Customize" && user?.id) {
      try {
        const data = await getSettings(user.id);
        setSettings(data);
      } catch (e) {
        setActionMsg(e.message);
      }
    }
  }

  return (
    <aside className="flex w-[260px] shrink-0 flex-col h-screen bg-[#0F0F10] text-gray-300">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl">
          <img src={logo} alt="SonIA" className="h-8 w-8" />
        </div>
        <span className="text-lg font-semibold text-white">SonIA</span>
      </div>

      <div className="px-4">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#2A2A2E] bg-[#1C1C1E] px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-[#7c3aed]/50 hover:text-white"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7c3aed] text-xs text-white">
            <IconPlus className="h-3 w-3" />
          </span>
          New conversation
        </button>
      </div>

      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => handleNavClick(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeNav === item.label
                    ? "bg-[#1C1C1E] text-white"
                    : "text-gray-400 hover:bg-[#1C1C1E] hover:text-gray-200"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {activeNav === "Projects" && (
        <div className="mt-4 flex-1 overflow-y-auto px-5">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Projects</div>
          {actionMsg && <div className="mb-2 text-xs text-red-400">{actionMsg}</div>}
          {projects.length === 0 && !actionMsg && (
            <div className="text-sm text-gray-500">No projects yet</div>
          )}
          <ul className="space-y-1">
            {projects.map((p) => (
              <li key={p.id}>
                <div className="rounded-lg px-3 py-2 text-sm text-gray-300">
                  <div className="font-medium text-white">{p.title}</div>
                  {p.description && <div className="text-xs text-gray-500">{p.description}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeNav === "Files" && (
        <div className="mt-4 flex-1 overflow-y-auto px-5">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Files</div>
          {actionMsg && <div className="mb-2 text-xs text-red-400">{actionMsg}</div>}
          {files.length === 0 && !actionMsg && (
            <div className="text-sm text-gray-500">No files uploaded yet</div>
          )}
          <ul className="space-y-1">
            {files.map((f, idx) => (
              <li key={idx}>
                <a href={f.url} target="_blank" rel="noreferrer" className="block rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:text-white">
                  <div className="flex items-center gap-2">
                    <IconFile className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{f.filename}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeNav === "Customize" && (
        <div className="mt-4 flex-1 overflow-y-auto px-5">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Customize</div>
          {actionMsg && <div className="mb-2 text-xs text-red-400">{actionMsg}</div>}
          {settings && (
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <div className="text-xs text-gray-500">Theme</div>
                <div className="text-white">{settings.theme}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Model</div>
                <div className="text-white">{settings.model}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#6366f1] text-xs font-semibold text-white">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">{user?.name || user?.email}</div>
            <div className="truncate text-xs text-gray-500">Free plan</div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="ml-auto rounded-lg p-1.5 text-gray-500 transition hover:text-gray-300"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
