import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Conversation } from '../types';

interface WorkspaceCopilotProps {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeChatId: string;
  setActiveChatId: (id: string) => void;
  selectedProject: string;
  onNavigateToTab: (tab: any) => void;
  onCodeInsertViaMcp?: (code: string, path: string) => void;
}

export const WorkspaceCopilot: React.FC<WorkspaceCopilotProps> = ({
  conversations,
  setConversations,
  activeChatId,
  setActiveChatId,
  selectedProject,
  onNavigateToTab,
  onCodeInsertViaMcp,
}) => {
  const [promptInput, setPromptInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat =
    conversations.find((c) => c.id === activeChatId) ||
    conversations[0] || {
      id: 'chat-1',
      title: 'Hola',
      createdAt: '14:30',
      messages: [],
    };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || promptInput).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation title if first message
    let updatedTitle = activeChat.title;
    if (activeChat.messages.length === 0) {
      updatedTitle = text.length > 25 ? text.slice(0, 25) + '...' : text;
    }

    const updatedMessages = [...activeChat.messages, userMsg];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, title: updatedTitle, messages: updatedMessages }
          : c
      )
    );

    setPromptInput('');
    setIsLoading(true);

    try {
      let provider = 'gemini';
      if (
        selectedModel.includes('llama') ||
        selectedModel.includes('deepseek') ||
        selectedModel.includes('mistral')
      ) {
        provider = 'free';
      } else if (selectedModel.includes('ollama')) {
        provider = 'ollama';
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          provider,
          model: selectedModel,
        }),
      });

      const data = await response.json();
      const aiReply = data.reply || 'Sin respuesta del modelo.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id ? { ...c, messages: [...c.messages, aiMsg] } : c
        )
      );
    } catch {
      showToast('Error de conexión con el proveedor. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    showToast('✓ Código copiado al portapapeles');
  };

  const handleInsertMcp = (codeText: string) => {
    if (onCodeInsertViaMcp) {
      onCodeInsertViaMcp(codeText, 'Script.luau');
    }
    showToast('✓ Enviado al servidor MCP de Roblox Studio');
  };

  const handleActionCard = (_title: string, promptText: string) => {
    handleSendMessage(promptText);
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim();
        const code = (lang ? lines.slice(1) : lines).join('\n');

        return (
          <div
            key={index}
            className="my-3 rounded-xl bg-[#090a0d] border border-[#1f2128] overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#14151a] border-b border-[#1f2128]">
              <span className="font-mono-code text-[11px] text-[#4cd7f6] font-semibold">
                {lang || 'luau'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyCode(code)}
                  className="px-2 py-1 rounded bg-[#1f2128] hover:bg-[#282b35] text-[#dfe2f0] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  <span>Copiar</span>
                </button>
                <button
                  onClick={() => handleInsertMcp(code)}
                  className="px-2 py-1 rounded bg-[#d6403a] hover:bg-[#e04e48] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">bolt</span>
                  <span>Insertar via MCP</span>
                </button>
              </div>
            </div>
            <div className="p-3.5 font-mono-code text-xs text-[#dfe2f0] overflow-x-auto leading-relaxed">
              <pre>{code}</pre>
            </div>
          </div>
        );
      }

      return (
        <span key={index} className="whitespace-pre-wrap leading-relaxed text-xs md:text-[13px]">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0a0b0e] text-[#dfe2f0]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#14151a] border border-[#d6403a] text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono-code animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#d6403a]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Conversation Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 flex flex-col justify-between">
        {activeChat.messages.length === 0 ? (
          /* HERO WHEN CHAT IS EMPTY */
          <div className="max-w-3xl mx-auto w-full my-auto flex flex-col items-center text-center space-y-7 animate-fade-in py-4">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14151a] border border-[#262832] text-[11px] text-[#ff8c5a] font-semibold uppercase tracking-wider shadow-sm">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              <span>TU COMPAÑERO DE DESARROLLO EN ROBLOX</span>
            </div>

            {/* Bold Headline */}
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                Tu idea. Tu código.
              </h1>
              <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#d6403a] via-[#ff6b4a] to-[#ff946b] bg-clip-text text-transparent tracking-tight leading-none">
                Tu próximo gran juego.
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-xs md:text-sm text-[#8a8f9d] max-w-lg leading-relaxed">
              Un copilot que habla Luau y piensa en Roblox Studio.<br />
              Crea, resuelve y lleva tu proyecto al siguiente nivel con soporte para MCP.
            </p>

            {/* 4 Interactive Action Cards Grid (2x2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full pt-2">
              {/* Card 1 */}
              <div
                onClick={() =>
                  handleActionCard(
                    'Crea algo nuevo',
                    'Crea un script completo modular en Luau (--!strict) para un sistema de salto doble (Double Jump) con animación y sonido para Roblox Studio.'
                  )
                }
                className="p-5 rounded-2xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] hover:border-[#ff6b4a]/50 text-left transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-lg text-[#ff6b4a]">code</span>
                  <span className="material-symbols-outlined text-sm text-[#626775] group-hover:text-white transition-colors">
                    north_east
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Crea algo nuevo</h3>
                  <p className="text-xs text-[#8a8f9d] mt-0.5">De una idea a tu primer script modular.</p>
                </div>
                <span className="text-[10px] font-mono-code font-bold text-[#626775] group-hover:text-[#ff6b4a] uppercase tracking-wider">
                  GENERAR CÓDIGO LUAU
                </span>
              </div>

              {/* Card 2 */}
              <div
                onClick={() =>
                  handleActionCard(
                    'Mejora tu código',
                    'Revisa y optimiza este código Luau para evitar memory leaks y mejorar el rendimiento de red en Roblox Studio:\n\nlocal Players = game:GetService("Players")\n-- Optimizar'
                  )
                }
                className="p-5 rounded-2xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] hover:border-[#ff6b4a]/50 text-left transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-lg text-[#5fb37c]">shield</span>
                  <span className="material-symbols-outlined text-sm text-[#626775] group-hover:text-white transition-colors">
                    north_east
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Mejora tu código</h3>
                  <p className="text-xs text-[#8a8f9d] mt-0.5">Más seguro. Más limpio. Tipado estricto.</p>
                </div>
                <span className="text-[10px] font-mono-code font-bold text-[#626775] group-hover:text-[#5fb37c] uppercase tracking-wider">
                  REVISAR Y OPTIMIZAR
                </span>
              </div>

              {/* Card 3 */}
              <div
                onClick={() =>
                  handleActionCard(
                    'Resuelve un error',
                    'Tengo este error en Output de Roblox Studio: "attempt to index nil with WaitForChild". ¿Qué significa y cómo lo soluciono paso a paso?'
                  )
                }
                className="p-5 rounded-2xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] hover:border-[#ff6b4a]/50 text-left transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-lg text-[#d6403a]">bug_report</span>
                  <span className="material-symbols-outlined text-sm text-[#626775] group-hover:text-white transition-colors">
                    north_east
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Resuelve un error</h3>
                  <p className="text-xs text-[#8a8f9d] mt-0.5">Pega tu error del Output y soluciónalo.</p>
                </div>
                <span className="text-[10px] font-mono-code font-bold text-[#626775] group-hover:text-[#d6403a] uppercase tracking-wider">
                  DIAGNÓSTICO INMEDIATO
                </span>
              </div>

              {/* Card 4 */}
              <div
                onClick={() =>
                  handleActionCard(
                    'Aprende y avanza',
                    'Explícame cómo funcionan los RemoteEvents y RemoteFunctions en Roblox Studio y cuál es la mejor práctica de cliente-servidor con un ejemplo práctico.'
                  )
                }
                className="p-5 rounded-2xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] hover:border-[#ff6b4a]/50 text-left transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-lg text-[#4cd7f6]">school</span>
                  <span className="material-symbols-outlined text-sm text-[#626775] group-hover:text-white transition-colors">
                    north_east
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Aprende y avanza</h3>
                  <p className="text-xs text-[#8a8f9d] mt-0.5">Explicaciones claras y ejemplos prácticos.</p>
                </div>
                <span className="text-[10px] font-mono-code font-bold text-[#626775] group-hover:text-[#4cd7f6] uppercase tracking-wider">
                  CONSULTAR CONCEPTO
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* MESSAGE STREAM */
          <div className="max-w-3xl mx-auto w-full space-y-6 animate-fade-in pb-4">
            {activeChat.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#d6403a] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#d6403a]/25 mt-0.5">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                      isUser
                        ? 'bg-[#1a1c23] border border-[#262832] text-white rounded-tr-sm'
                        : 'bg-[#14151a] border border-[#262832] text-[#dfe2f0] rounded-tl-sm'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between border-b border-[#262832]/80 pb-2 mb-2 text-[10px] text-[#8a8f9d] font-mono-code">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">Studio Copilot</span>
                          <span>·</span>
                          <span className="text-[#4cd7f6]">Pablito Studios</span>
                        </div>
                        <span>{msg.timestamp}</span>
                      </div>
                    )}

                    <div className="text-xs md:text-sm leading-relaxed">
                      {renderMessageContent(msg.content)}
                    </div>

                    {isUser && (
                      <div className="text-[9px] text-[#626775] font-mono-code text-right mt-1.5">
                        {msg.timestamp}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#262832] flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold font-mono-code">
                      N
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-[#d6403a] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#d6403a]/25 animate-pulse">
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                </div>
                <div className="rounded-2xl p-4 bg-[#14151a] border border-[#262832] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d6403a] animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-[#d6403a] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#d6403a] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-[#8a8f9d] font-mono-code ml-2">
                    Escribiendo código Luau...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Prompt Composer Box (Bottom Centered) */}
        <div className="max-w-3xl mx-auto w-full pt-4">
          <div className="bg-[#14151a] border border-[#262832] focus-within:border-[#d6403a]/70 rounded-2xl p-3 flex flex-col gap-2.5 shadow-xl transition-all">
            <textarea
              ref={textareaRef}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              placeholder="¿Qué vamos a construir hoy? Pregunta sobre Luau, pega tu código o comparte una idea..."
              className="w-full bg-transparent resize-none text-xs md:text-sm text-white placeholder:text-[#626775] outline-none leading-relaxed"
            />

            {/* Bottom bar of prompt box */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('Adjuntar script (.luau/.rbxm)')}
                  className="p-1.5 rounded-lg text-[#8a8f9d] hover:text-white hover:bg-[#1f2128] transition-colors cursor-pointer"
                  title="Adjuntar código o archivo"
                >
                  <span className="material-symbols-outlined text-lg">attach_file</span>
                </button>

                {/* Free Unlimited Model Selector Dropdown */}
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-[#1f2128] text-white text-[11px] font-mono-code rounded-lg pl-6 pr-6 py-1 border border-[#262832] outline-none appearance-none cursor-pointer hover:border-[#8a8f9d] transition-colors"
                  >
                    <option value="gemini-2.5-flash">⚡ gemini-2.5-flash (Predeterminado Ilimitado)</option>
                    <option value="gemini-2.5-pro">⚡ gemini-2.5-pro (Razonamiento Profundo)</option>
                    <option value="gemini-3.8-flash">⚡ gemini-3.8-flash (Avanzado)</option>
                    <option value="meta-llama/llama-3.3-70b-instruct:free">⚡ meta-llama/llama-3.3-70b (Gratis)</option>
                    <option value="deepseek/deepseek-chat:free">⚡ deepseek-chat (Gratis)</option>
                    <option value="ollama">💻 ollama (Local sin límites)</option>
                    <option value="pablito-luau-engine">⚙️ pablito-engine (Offline RAG)</option>
                  </select>
                  <span className="material-symbols-outlined text-[#ff6b4a] text-xs absolute left-2 top-2 pointer-events-none">
                    bolt
                  </span>
                  <span className="material-symbols-outlined text-[#8a8f9d] text-xs absolute right-1.5 top-2 pointer-events-none">
                    expand_more
                  </span>
                </div>

                <span className="w-1.5 h-1.5 rounded-full bg-[#5fb37c]" title="Servicio activo"></span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-[#626775] font-mono-code hidden sm:inline">
                  Enter para enviar
                </span>

                <button
                  disabled={isLoading || !promptInput.trim()}
                  onClick={() => handleSendMessage()}
                  className="w-8 h-8 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-[#d6403a]/25 transition-all cursor-pointer"
                  title="Enviar mensaje"
                >
                  <span className="material-symbols-outlined text-base">arrow_upward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Disclaimer footer */}
          <div className="text-center pt-2 text-[10px] text-[#626775] font-mono-code flex items-center justify-center gap-1">
            <span>Studio Copilot puede cometer errores. Verifica el código antes de usarlo en tu juego.</span>
            <button
              onClick={() => onNavigateToTab('academia-de-lau')}
              className="text-[#8a8f9d] hover:underline cursor-pointer ml-1"
            >
              Más información ↗
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Minimal Status Footer */}
      <footer className="h-7 border-t border-[#1a1c23] px-6 flex items-center justify-between text-[10px] font-mono-code text-[#626775] shrink-0 select-none bg-[#0a0b0e]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5fb37c]"></span>
          <span>Gemini 3.8 Flash [GRATIS ILIMITADO] / Contexto: {selectedProject}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>{'{ }'} Luau Strict v0.6</span>
          <span className="text-[#8a8f9d]">Desarrollado por Pablito Studios</span>
        </div>
      </footer>
    </div>
  );
};
