import React, { useState, useEffect } from 'react';
import { ActiveTab, UserProfile, RobloxExperience, Conversation } from './types';
import { AppLayout } from './components/AppLayout';
import { WorkspaceCopilot } from './components/WorkspaceCopilot';
import { McpServersHub } from './components/McpServersHub';
import { AcademiaView } from './components/AcademiaView';
import { ExperiencesAndAssets } from './components/ExperiencesAndAssets';
import { SettingsView } from './components/SettingsView';

const STORAGE_CHATS_KEY = 'studiocopilot_chats_v2';
const STORAGE_PROFILE_KEY = 'studiocopilot_profile_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace-copilot');

  const [userProjects, setUserProjects] = useState<RobloxExperience[]>(() => {
    try {
      const saved = localStorage.getItem('pablito_projects_nxd053750@gmail.com');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [selectedProject, setSelectedProject] = useState<string>(() => {
    return userProjects[0]?.title || '';
  });

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Conversations State shared with Sidebar
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'chat-1',
        title: 'Hola',
        createdAt: '14:30',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Hola Studio Copilot, ¿en qué me puedes ayudar para programar en Luau?',
            timestamp: '14:30',
          },
          {
            id: 'm2',
            role: 'assistant',
            content:
              '¡Hola! Soy tu Copilot especializado en Roblox Studio y Luau, desarrollado por Pablito Studios.\n\nPuedo ayudarte sin límites a:\n- Escribir scripts modulares bajo `--!strict`.\n- Diseñar sistemas de combate, tiendas, economía con DataStores e inventarios.\n- Explicar y corregir errores de ejecución en Output.\n- Automatizar la creación de instancias mediante servidores MCP y Rojo.\n\n¿Qué mecánica o script te gustaría programar hoy?',
            timestamp: '14:31',
          },
        ],
      },
    ];
  });

  const [activeChatId, setActiveChatId] = useState<string>(() => {
    return conversations[0]?.id || 'chat-1';
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Laura G.',
      role: 'Lead Luau Dev',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBSsiJQDN2MN4_Lx1LKOCG1p3AuQfZDYZZW39fBuHvC3GSj5emlnBu4uefycKvu8nMohwJsjEbLOqb0m4Oom4MZcq69uqrgex_92TRwAlF3VM3nSgGLpax_yPyzhxVsqYEEr3hTdzrpdgi33wDGWBhBiV8Spbm0AGE4Jl5JxMaycGnEGOKTfLOwwd9mA81guvXpD4i4R5b7_NDCiE2ZiZ4EFJNLiAY6llhBWPZ249oEb4Am_lD95y3R',
      email: 'nxd053750@gmail.com',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: Conversation = {
      id: newId,
      title: 'Nueva conversación',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [],
    };
    setConversations([newChat, ...conversations]);
    setActiveChatId(newId);
    setActiveTab('workspace-copilot');
  };

  const handleDeleteChat = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const fallback: Conversation = {
        id: `chat-${Date.now()}`,
        title: 'Nueva conversación',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [],
      };
      setConversations([fallback]);
      setActiveChatId(fallback.id);
    } else {
      setConversations(remaining);
      if (activeChatId === id) {
        setActiveChatId(remaining[0].id);
      }
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
    );
  };

  const handleTogglePinChat = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const handleOpenExperienceInCopilot = (exp: RobloxExperience) => {
    setSelectedProject(exp.title);
    setActiveTab('workspace-copilot');
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userProfile={userProfile}
      conversations={conversations}
      activeChatId={activeChatId}
      onSelectChat={(id) => {
        setActiveChatId(id);
        setActiveTab('workspace-copilot');
      }}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
      onRenameChat={handleRenameChat}
      onTogglePinChat={handleTogglePinChat}
      selectedProject={selectedProject}
      onSelectProject={setSelectedProject}
      userProjects={userProjects}
      isDownloadModalOpen={isDownloadModalOpen}
      setIsDownloadModalOpen={setIsDownloadModalOpen}
    >
      {activeTab === 'workspace-copilot' && (
        <WorkspaceCopilot
          conversations={conversations}
          setConversations={setConversations}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          selectedProject={selectedProject}
          onNavigateToTab={setActiveTab}
          onCodeInsertViaMcp={(code, filename) => {
            console.log(`[MCP Insert] ${filename}: ${code.slice(0, 30)}...`);
          }}
        />
      )}

      {activeTab === 'servidores-mcp' && (
        <div className="flex-1 overflow-y-auto">
          <McpServersHub onNavigateToTab={setActiveTab} />
        </div>
      )}

      {activeTab === 'academia-de-lau' && (
        <div className="flex-1 overflow-y-auto">
          <AcademiaView
            onOpenCopilotWithCode={(_code, _filename) => {
              setActiveTab('workspace-copilot');
            }}
          />
        </div>
      )}

      {activeTab === 'mis-experiencias-y-assets' && (
        <div className="flex-1 overflow-y-auto">
          <ExperiencesAndAssets
            userEmail={userProfile.email}
            onNavigateToTab={setActiveTab}
            onOpenExperienceInCopilot={handleOpenExperienceInCopilot}
            onProjectsUpdated={(updated) => {
              setUserProjects(updated);
              if (!selectedProject && updated.length > 0) {
                setSelectedProject(updated[0].title);
              }
            }}
          />
        </div>
      )}

      {activeTab === 'configuracion-y-tokens-api' && (
        <div className="flex-1 overflow-y-auto">
          <SettingsView
            onProfileUpdated={(updated) => setUserProfile(updated)}
          />
        </div>
      )}
    </AppLayout>
  );
}
