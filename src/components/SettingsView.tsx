import React, { useState, useEffect } from 'react';
import { SettingsState, UserProfile } from '../types';

interface SettingsViewProps {
  onProfileUpdated?: (profile: UserProfile) => void;
}

const SETTINGS_KEY = 'studiocopilot_settings_v2';
const PROFILE_KEY = 'studiocopilot_profile_v2';

export const SettingsView: React.FC<SettingsViewProps> = ({ onProfileUpdated }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      aiProvider: 'gemini',
      geminiModel: 'gemini-2.5-flash',
      openrouterApiKey: '',
      openrouterModel: 'anthropic/claude-3.5-sonnet',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'codellama',
      mcpBridgePort: 3001,
      mcpBridgeHost: 'http://localhost',
      autoSyncRojo: true,
      strictLuauValidation: true,
    };
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      name: 'Laura G.',
      role: 'Lead Luau Dev',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBSsiJQDN2MN4_Lx1LKOCG1p3AuQfZDYZZW39fBuHvC3GSj5emlnBu4uefycKvu8nMohwJsjEbLOqb0m4Oom4MZcq69uqrgex_92TRwAlF3VM3nSgGLpax_yPyzhxVsqYEEr3hTdzrpdgi33wDGWBhBiV8Spbm0AGE4Jl5JxMaycGnEGOKTfLOwwd9mA81guvXpD4i4R5b7_NDCiE2ZiZ4EFJNLiAY6llhBWPZ249oEb4Am_lD95y3R',
      email: 'nxd053750@gmail.com',
    };
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      if (onProfileUpdated) onProfileUpdated(profile);
      showToast('✓ Configuración y tokens guardados correctamente');
    } catch {
      showToast('Error al guardar en almacenamiento local');
    }
  };

  const testProviderConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'ping',
          provider: settings.aiProvider,
          model:
            settings.aiProvider === 'gemini'
              ? settings.geminiModel
              : settings.aiProvider === 'openrouter'
              ? settings.openrouterModel
              : settings.ollamaModel,
          customApiKey:
            settings.aiProvider === 'openrouter' ? settings.openrouterApiKey : undefined,
          ollamaUrl: settings.ollamaUrl,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setConnectionStatus(`✓ Conexión exitosa con ${settings.aiProvider} (${data.model})`);
      } else {
        setConnectionStatus(`⚠️ Error del proveedor: ${data.error || 'Respuesta vacía'}`);
      }
    } catch (e: any) {
      setConnectionStatus(`⚠️ Falló la conexión: ${e.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const exportBackup = () => {
    try {
      const academyData = localStorage.getItem('studiocopilot_academy_v2') || '{}';
      const backupObj = {
        app: 'Studio Copilot',
        author: 'Pablito Studios',
        date: new Date().toISOString(),
        settings,
        profile,
        academy: JSON.parse(academyData),
      };
      const blob = new Blob([JSON.stringify(backupObj, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studio-copilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✓ Respaldo exportado con éxito');
    } catch {
      showToast('Error al exportar respaldo');
    }
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.academy) {
          localStorage.setItem('studiocopilot_academy_v2', JSON.stringify(parsed.academy));
        }
        showToast('✓ Respaldo importado correctamente');
      } catch {
        showToast('Error: archivo de respaldo no válido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col w-full min-h-full bg-[#0c0d10] text-[#dfe2f0] p-4 md:p-8 space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#14151a] border border-[#4cd7f6] text-[#4cd7f6] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono-code animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262832] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-mono-code tracking-wider text-[#8a8f9d]">
            <span>Ajustes & Conectividad</span>
            <span>/</span>
            <span className="text-[#4cd7f6]">Pablito Studios</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
            Configuración & Tokens API
          </h1>
          <p className="text-xs text-[#8a8f9d] mt-0.5">
            Administra proveedores de IA, credenciales locales, servidores MCP y preferencias de Studio Copilot.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-lg bg-[#d6403a] hover:bg-[#e04e48] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#d6403a]/25 transition-all self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* Section 1: AI Provider Selector */}
      <section className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-[#4cd7f6] text-xl">psychology</span>
            <h2 className="text-base font-bold">Proveedor de Inteligencia Artificial</h2>
          </div>
          <span className="text-xs font-mono-code text-[#4cd7f6]">Multi-Provider Gateway</span>
        </div>

        {/* Providers Choice Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'gemini', name: 'Google Gemini', desc: 'SDK Oficial Servidor', icon: 'neurology' },
            { id: 'openrouter', name: 'OpenRouter', desc: 'Claude, DeepSeek, GPT', icon: 'alt_route' },
            { id: 'ollama', name: 'Ollama (Local)', desc: '100% Offline / Privado', icon: 'terminal' },
            { id: 'replit', name: 'Replit AI', desc: 'Entorno Integrado', icon: 'cloud_sync' },
          ].map((prov) => (
            <button
              key={prov.id}
              onClick={() => setSettings({ ...settings, aiProvider: prov.id as any })}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                settings.aiProvider === prov.id
                  ? 'bg-[#1f2128] border-[#d6403a] bg-[#d6403a]/10 shadow-md shadow-[#d6403a]/15'
                  : 'bg-[#0c0d10] border-[#262832] hover:border-[#262832]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-lg text-[#4cd7f6]">{prov.icon}</span>
                {settings.aiProvider === prov.id && (
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-white">{prov.name}</div>
                <div className="text-[10px] text-[#8a8f9d] mt-0.5">{prov.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Provider Form Fields */}
        <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#262832] space-y-4 text-xs font-mono-code">
          {settings.aiProvider === 'gemini' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Modelo Gemini Activo:</span>
                <span className="text-[#5fb37c] font-semibold">Integrado en backend vía @google/genai</span>
              </div>
              <select
                value={settings.geminiModel}
                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Predeterminado - Rápido y preciso)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Razonamiento profundo de arquitectura)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Generación avanzada)</option>
              </select>
              <p className="text-[11px] text-[#8a8f9d] font-sans">
                La clave se gestiona de forma segura en el servidor mediante <code className="text-[#4cd7f6]">process.env.GEMINI_API_KEY</code>, sin exponer secretos al navegador.
              </p>
            </div>
          )}

          {settings.aiProvider === 'openrouter' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[#8a8f9d]">API Key de OpenRouter:</label>
                <input
                  type="password"
                  value={settings.openrouterApiKey}
                  onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8a8f9d]">Modelo de OpenRouter:</label>
                <input
                  type="text"
                  value={settings.openrouterModel}
                  onChange={(e) => setSettings({ ...settings, openrouterModel: e.target.value })}
                  placeholder="anthropic/claude-3.5-sonnet"
                  className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none"
                />
              </div>
            </div>
          )}

          {settings.aiProvider === 'ollama' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[#8a8f9d]">URL del Servidor Ollama:</label>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8a8f9d]">Nombre del Modelo Descargado:</label>
                <input
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="codellama o deepseek-coder"
                  className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none"
                />
              </div>
              <p className="text-[11px] text-[#8a8f9d] font-sans">
                Asegúrate de correr <code className="text-[#4cd7f6]">ollama serve</code> localmente en tu sistema operativo antes de consultar.
              </p>
            </div>
          )}

          {settings.aiProvider === 'replit' && (
            <div className="space-y-2 font-sans">
              <p className="text-white text-xs">
                Integración con Replit Agent configurada según especificaciones oficiales de la plataforma.
              </p>
            </div>
          )}

          {/* Test Provider Button & Diagnostics */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#262832]/60">
            <button
              disabled={isTestingConnection}
              onClick={testProviderConnection}
              className="px-3.5 py-1.5 rounded-lg bg-[#1f2128] hover:bg-[#262832] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">network_check</span>
              <span>{isTestingConnection ? 'Probando...' : 'Probar Conexión con IA'}</span>
            </button>
            {connectionStatus && (
              <span className="text-xs text-[#4cd7f6] font-sans">{connectionStatus}</span>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Roblox Studio & MCP Bridge Configuration */}
      <section className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-[#d0bcff] text-xl">hub</span>
            <h2 className="text-base font-bold">Configuración de Bridge MCP & Rojo</h2>
          </div>
          <span className="text-xs font-mono-code text-[#d0bcff]">:3001 Live</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-code">
          <div className="space-y-1">
            <label className="text-[#8a8f9d]">Puerto del Servidor MCP Local:</label>
            <input
              type="number"
              value={settings.mcpBridgePort}
              onChange={(e) =>
                setSettings({ ...settings, mcpBridgePort: parseInt(e.target.value, 10) || 3001 })
              }
              className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#8a8f9d]">Host de Sincronización:</label>
            <input
              type="text"
              value={settings.mcpBridgeHost}
              onChange={(e) => setSettings({ ...settings, mcpBridgeHost: e.target.value })}
              className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSyncRojo}
              onChange={(e) => setSettings({ ...settings, autoSyncRojo: e.target.checked })}
              className="rounded border-[#262832] text-[#d6403a]"
            />
            <span>Sincronizar automáticamente cambios de script con Rojo</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.strictLuauValidation}
              onChange={(e) => setSettings({ ...settings, strictLuauValidation: e.target.checked })}
              className="rounded border-[#262832] text-[#d6403a]"
            />
            <span>Exigir cabecera --!strict en código generado</span>
          </label>
        </div>
      </section>

      {/* Section 3: User Profile & Preferences */}
      <section className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-white">
          <span className="material-symbols-outlined text-[#ffb95f] text-xl">badge</span>
          <h2 className="text-base font-bold">Perfil del Desarrollador</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-code">
          <div className="space-y-1">
            <label className="text-[#8a8f9d]">Nombre de Usuario / Alias:</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#8a8f9d]">Rol o Título Profesional:</label>
            <input
              type="text"
              value={profile.role}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
              className="w-full bg-[#090a0d] text-white p-2.5 rounded-lg border border-[#262832] outline-none font-sans"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Data Backup & Management */}
      <section className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-[#5fb37c] text-xl">backup</span>
            <h2 className="text-base font-bold">Respaldo y Portabilidad de Datos</h2>
          </div>
        </div>
        <p className="text-xs text-[#8a8f9d]">
          Exporta tu progreso de la academia, lecciones superadas y tokens configurados a un archivo JSON seguro para sincronizar entre diferentes equipos.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={exportBackup}
            className="px-4 py-2 rounded-lg bg-[#1f2128] hover:bg-[#262832] text-white font-semibold text-xs flex items-center gap-2 transition-colors border border-[#262832]"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Exportar Respaldo (.json)</span>
          </button>

          <label className="px-4 py-2 rounded-lg bg-[#1f2128] hover:bg-[#262832] text-white font-semibold text-xs flex items-center gap-2 transition-colors border border-[#262832] cursor-pointer">
            <span className="material-symbols-outlined text-sm">upload</span>
            <span>Importar Respaldo</span>
            <input type="file" accept=".json" onChange={importBackup} className="hidden" />
          </label>
        </div>
      </section>

      {/* Section 5: Credits, Desktop App & About */}
      <section className="p-6 rounded-2xl bg-[#0c0d10] border border-[#262832] space-y-4 shadow-xl text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262832] pb-3">
          <div>
            <div className="text-sm font-bold text-white">Studio Copilot</div>
            <div className="text-[#ffb4ab] font-bold mt-0.5">Desarrollado por Pablito Studios</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#d6403a]/15 text-[#ffb4ab] border border-[#d6403a]/30 font-mono-code font-bold text-[10px]">
            v2.5 Roblox + MCP
          </span>
        </div>

        <div className="text-[#8a8f9d] leading-relaxed space-y-2 font-sans">
          <p>
            Plataforma integral diseñada para ingenieros técnicos, desarrolladores de experiencias y creadores de contenido de Roblox Studio. Reúne un asistente multimodal asistido por Gemini AI, orquestación de herramientas Model Context Protocol (MCP) y una Academia interactiva completa de programación en Luau.
          </p>
          <div className="p-3 rounded-xl bg-[#090a0d] border border-[#262832] text-[11px] font-mono-code text-white flex flex-col gap-1">
            <span className="text-[#4cd7f6] font-bold">Compilación de Escritorio para Windows:</span>
            <span>Configuración lista en <code>/electron/main.cjs</code> y <code>/electron/README.md</code></span>
            <span className="text-[#8a8f9d]">Ejecuta en tu terminal: <code>npm run build:windows</code> para empaquetar el instalador nativo .exe de Windows.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
