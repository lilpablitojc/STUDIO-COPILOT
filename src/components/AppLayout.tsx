import React, { useState } from 'react';
import { ActiveTab, UserProfile, Conversation, RobloxExperience } from '../types';
import { DesktopDownloadModal } from './DesktopDownloadModal';

interface AppLayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  conversations: Conversation[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePinChat: (id: string) => void;
  selectedProject: string;
  onSelectProject: (proj: string) => void;
  userProjects?: RobloxExperience[];
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  userProfile,
  conversations,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePinChat,
  selectedProject,
  onSelectProject,
  userProjects = [],
  isDownloadModalOpen,
  setIsDownloadModalOpen,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const navItems = [
    {
      id: 'workspace-copilot' as ActiveTab,
      label: 'Copilot',
      icon: 'chat_bubble',
    },
    {
      id: 'mis-experiencias-y-assets' as ActiveTab,
      label: 'Mis proyectos',
      icon: 'folder',
    },
    {
      id: 'academia-de-lau' as ActiveTab,
      label: 'Herramientas Luau & Academia',
      icon: 'code',
    },
    {
      id: 'servidores-mcp' as ActiveTab,
      label: 'Conexiones MCP',
      icon: 'hub',
      badge: 'MCP',
    },
  ];

  const projectList = userProjects.map((p) => p.title);

  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'workspace-copilot':
        return 'Copilot';
      case 'mis-experiencias-y-assets':
        return 'Mis proyectos & Assets';
      case 'academia-de-lau':
        return 'Academia de Luau';
      case 'servidores-mcp':
        return 'Conexiones & Servidores MCP';
      case 'configuracion-y-tokens-api':
        return 'Configuración & Tokens API';
      default:
        return 'Copilot';
    }
  };

  const filteredChats = chatSearch.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(chatSearch.toLowerCase())
      )
    : conversations;

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="flex w-screen h-screen overflow-hidden font-sans bg-[#0c0d10] text-[#dfe2f0] antialiased select-none">
      {/* Desktop Download Modal */}
      <DesktopDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      {/* 1. UNIVERSAL UNIFIED LEFT SIDEBAR (Definitive Home Screen Design) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-72 bg-[#0c0d10] border-r border-[#1a1c23] flex flex-col justify-between p-3 shrink-0 h-full overflow-y-auto transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Brand Logo & Studio Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div
              onClick={() => {
                onTabChange('workspace-copilot');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#d6403a] flex items-center justify-center text-white font-bold shadow-md shadow-[#d6403a]/30 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-base">smart_toy</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-white tracking-tight leading-tight group-hover:text-[#ffb4ab] transition-colors">
                  Studio Copilot
                </span>
                <span className="text-[9px] font-bold text-[#8a8f9d] uppercase tracking-wider">
                  POR PABLITO STUDIOS
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded text-[#8a8f9d] hover:text-white md:hidden"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* "+ Nueva conversación +" Button */}
          <button
            onClick={() => {
              onNewChat();
              onTabChange('workspace-copilot');
              setIsMobileMenuOpen(false);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] text-xs font-semibold text-white flex items-center justify-between transition-all hover:border-[#d6403a]/50 shadow-sm cursor-pointer"
          >
            <span className="text-[#d6403a] font-bold text-base">+</span>
            <span>Nueva conversación</span>
            <span className="text-[#d6403a] font-bold text-base">+</span>
          </button>

          {/* Primary Navigation Menu */}
          <nav className="flex flex-col gap-1 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1a1c23] text-white font-bold border border-[#262832]/60'
                      : 'text-[#8a8f9d] hover:text-white hover:bg-[#14151a] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-base ${
                        isActive ? 'text-[#d6403a]' : 'text-[#8a8f9d]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d6403a]"></span>
                  ) : item.badge ? (
                    <span className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#1f2128] text-[#8a8f9d]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Conversations Section */}
          <div className="pt-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3 text-[10px] font-bold text-[#626775] uppercase tracking-wider">
              <span>CONVERSACIONES</span>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hover:text-white transition-colors"
                title="Buscar conversaciones"
              >
                <span className="material-symbols-outlined text-xs">search</span>
              </button>
            </div>

            {isSearchOpen && (
              <div className="px-2 pb-1">
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Buscar chat..."
                  className="w-full px-2.5 py-1 text-xs bg-[#14151a] border border-[#262832] rounded-lg text-white placeholder-[#626775] focus:outline-none focus:border-[#d6403a]"
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              {sortedChats.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-[#626775] italic">
                  No hay conversaciones
                </div>
              ) : (
                sortedChats.map((chat) => {
                  const isActive = activeChatId === chat.id && activeTab === 'workspace-copilot';
                  const isEditing = editingChatId === chat.id;

                  if (isEditing) {
                    return (
                      <div
                        key={chat.id}
                        className="px-2 py-1.5 rounded-lg bg-[#14151a] border border-[#d6403a] flex items-center gap-1.5 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              onRenameChat(chat.id, editingTitle);
                              setEditingChatId(null);
                            } else if (e.key === 'Escape') {
                              setEditingChatId(null);
                            }
                          }}
                          autoFocus
                          className="flex-1 bg-transparent text-xs text-white outline-none font-medium px-1 py-0.5"
                          placeholder="Nombre del chat..."
                        />
                        <button
                          onClick={() => {
                            onRenameChat(chat.id, editingTitle);
                            setEditingChatId(null);
                          }}
                          className="text-[#5fb37c] hover:text-white p-0.5 cursor-pointer"
                          title="Guardar nombre"
                        >
                          <span className="material-symbols-outlined text-xs">check</span>
                        </button>
                        <button
                          onClick={() => setEditingChatId(null)}
                          className="text-[#8a8f9d] hover:text-[#ffb4ab] p-0.5 cursor-pointer"
                          title="Cancelar"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        onSelectChat(chat.id);
                        onTabChange('workspace-copilot');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#1a1c23] text-white font-medium border border-[#262832]'
                          : 'text-[#8a8f9d] hover:text-white hover:bg-[#14151a]'
                      } ${chat.isPinned ? 'border-l-2 border-[#d6403a] bg-[#14151a]/60' : ''}`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 mr-1">
                        {chat.isPinned ? (
                          <span
                            className="material-symbols-outlined text-xs text-[#d6403a] shrink-0"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            title="Chat fijado"
                          >
                            push_pin
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-xs text-[#8a8f9d] group-hover:text-white shrink-0">
                            chat
                          </span>
                        )}
                        <span className="truncate">{chat.title}</span>
                      </div>

                      {/* Action buttons (Pin, Rename, Delete) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Pin / Unpin button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinChat(chat.id);
                          }}
                          className={`p-0.5 hover:text-white transition-colors cursor-pointer ${
                            chat.isPinned ? 'text-[#d6403a]' : 'text-[#8a8f9d]'
                          }`}
                          title={chat.isPinned ? 'Desanclar chat' : 'Fijar chat al inicio'}
                        >
                          <span
                            className="material-symbols-outlined text-xs"
                            style={{ fontVariationSettings: chat.isPinned ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            push_pin
                          </span>
                        </button>

                        {/* Rename button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(chat.id);
                            setEditingTitle(chat.title);
                          }}
                          className="p-0.5 text-[#8a8f9d] hover:text-white transition-colors cursor-pointer"
                          title="Renombrar chat"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>

                        {/* Delete button */}
                        {conversations.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(chat.id);
                            }}
                            className="p-0.5 text-[#8a8f9d] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                            title="Eliminar chat"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Cards */}
        <div className="flex flex-col gap-2 pt-3 border-t border-[#1a1c23]/80">
          {/* Desktop App Card (Windows, Mac, Linux) */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="w-full text-left p-3 rounded-xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#d6403a]/15 text-[#d6403a] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">download</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">Tu copilot, en escritorio</span>
                <span className="text-[10px] text-[#8a8f9d] leading-tight mt-0.5">
                  Para Windows, Mac y Linux
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-sm text-[#8a8f9d] group-hover:text-white transition-colors">
              north_east
            </span>
          </button>

          {/* Documentation & Academy Quick Link */}
          <button
            onClick={() => {
              onTabChange('academia-de-lau');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#8a8f9d] hover:text-white hover:bg-[#14151a] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span>Documentación & Academia</span>
            </div>
            <span className="material-symbols-outlined text-xs">north_east</span>
          </button>

          {/* Settings Quick Link */}
          <button
            onClick={() => {
              onTabChange('configuracion-y-tokens-api');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#8a8f9d] hover:text-white hover:bg-[#14151a] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>Configuración</span>
            </div>
            <span className="text-[10px] font-mono-code text-[#626775]">v0.1.0</span>
          </button>

          {/* User Account Strip */}
          <div className="flex items-center justify-between px-2 py-1.5 mt-1 rounded-xl bg-[#14151a]/60">
            <div
              onClick={() => {
                onTabChange('configuracion-y-tokens-api');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-[#d6403a]/50"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#d6403a] text-white flex items-center justify-center text-xs font-bold font-mono-code">
                  N
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white leading-none group-hover:text-[#ffb4ab] transition-colors">
                  {userProfile.name || 'nxd053750'}
                </span>
                <span className="text-[9px] text-[#8a8f9d] leading-none mt-0.5">
                  {userProfile.role || 'Cuenta personal'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onTabChange('configuracion-y-tokens-api');
                setIsMobileMenuOpen(false);
              }}
              className="text-[#8a8f9d] hover:text-white cursor-pointer"
              title="Ajustes de cuenta"
            >
              <span className="material-symbols-outlined text-base">more_horiz</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. UNIVERSAL TOP BAR + MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0b0e]">
        {/* Universal Top Header Bar (Matching Home Screen Exactly) */}
        <header className="h-12 border-b border-[#1a1c23] px-4 md:px-6 flex items-center justify-between shrink-0 select-none bg-[#0a0b0e]">
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 rounded md:hidden text-[#8a8f9d] hover:text-white mr-1 cursor-pointer"
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <span className="text-[#8a8f9d] hidden sm:inline">Espacio de trabajo</span>
            <span className="text-[#4a4e5a] hidden sm:inline">&gt;</span>
            <span className="text-white font-medium">{getBreadcrumbLabel()}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#d6403a]/15 text-[#ffb4ab] border border-[#d6403a]/30 font-mono-code text-[9px] font-bold">
              BETA
            </span>
          </div>

          {/* Right: Active Project Selector, MCP Status, & Desktop Download CTA */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Project dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] text-xs text-[#dfe2f0] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs text-[#d6403a]">stadia_controller</span>
                <span className="font-mono-code max-w-[140px] truncate">
                  {selectedProject || (projectList[0] ?? 'Sin proyecto')}
                </span>
                <span className="material-symbols-outlined text-xs text-[#8a8f9d]">expand_more</span>
              </button>

              {isProjectDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-[#14151a] border border-[#262832] rounded-xl shadow-2xl py-1 z-50 animate-fade-in font-mono-code text-xs">
                  <div className="px-3 py-1.5 text-[10px] text-[#8a8f9d] font-bold uppercase tracking-wider border-b border-[#1f2128]">
                    Tus Proyectos
                  </div>
                  {projectList.length === 0 ? (
                    <div className="px-3 py-2 text-[#8a8f9d] text-center text-[11px]">
                      No tienes proyectos aún
                      <button
                        onClick={() => {
                          onTabChange('mis-experiencias-y-assets');
                          setIsProjectDropdownOpen(false);
                        }}
                        className="mt-1 w-full text-center text-[#ffb4ab] hover:underline font-bold block cursor-pointer"
                      >
                        + Crear proyecto
                      </button>
                    </div>
                  ) : (
                    <>
                      {projectList.map((proj) => (
                        <button
                          key={proj}
                          onClick={() => {
                            onSelectProject(proj);
                            setIsProjectDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1a1c23] transition-colors cursor-pointer ${
                            selectedProject === proj ? 'text-[#ffb4ab] font-bold bg-[#1a1c23]' : 'text-[#dfe2f0]'
                          }`}
                        >
                          <span className="truncate">{proj}</span>
                          {selectedProject === proj && (
                            <span className="text-[#d6403a] font-bold text-xs">✓</span>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-[#1f2128] mt-1 pt-1">
                        <button
                          onClick={() => {
                            onTabChange('mis-experiencias-y-assets');
                            setIsProjectDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-[11px] text-[#8a8f9d] hover:text-white hover:bg-[#1a1c23] transition-colors cursor-pointer"
                        >
                          + Gestionar proyectos
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Clean Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#14151a] border border-[#262832] text-xs font-mono-code">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5fb37c]"></span>
              <span className="text-[#8a8f9d]">Pablito Studio</span>
              <span className="text-white font-semibold">Luau v0.6</span>
            </div>

            {/* Desktop App Download CTA */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs text-[#d6403a]">download</span>
              <span className="hidden sm:inline">Descargar App</span>
            </button>
          </div>
        </header>

        {/* 3. MAIN PANE */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0a0b0e] text-[#dfe2f0]">
          {children}
        </main>
      </div>
    </div>
  );
};
