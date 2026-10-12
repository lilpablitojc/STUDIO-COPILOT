import React, { useState, useEffect } from 'react';
import { INITIAL_MCP_SERVERS } from '../data/mockExperiences';
import { McpServerInfo } from '../types';

interface McpServersHubProps {
  onNavigateToTab: (tab: any) => void;
}

export const McpServersHub: React.FC<McpServersHubProps> = ({ onNavigateToTab }) => {
  const [servers, setServers] = useState<McpServerInfo[]>(INITIAL_MCP_SERVERS);
  const [selectedTool, setSelectedTool] = useState<string>('create_instance');
  const [isLocalBridgeConnected, setIsLocalBridgeConnected] = useState<boolean>(false);
  const [isCheckingBridge, setIsCheckingBridge] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [jsonPayload, setJsonPayload] = useState<string>(
    JSON.stringify(
      {
        className: 'Part',
        parent: 'game.Workspace',
        properties: {
          Name: 'PablitoBeacon',
          Position: [0, 5, 0],
          Color: '#d6403a',
          Anchored: true,
        },
      },
      null,
      2
    )
  );

  const [consoleLogs, setConsoleLogs] = useState<
    {
      id: number;
      type: 'client' | 'response';
      time: string;
      title: string;
      body: string;
    }[]
  >([
    {
      id: 1,
      type: 'client',
      time: new Date().toLocaleTimeString(),
      title: 'tools/call: create_instance',
      body: 'Inicializado cliente JSON-RPC 2.0 para Roblox Studio.',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const checkBridgeStatus = async () => {
    setIsCheckingBridge(true);
    try {
      const res = await fetch('/api/mcp/status');
      if (res.ok) {
        const data = await res.json();
        setIsLocalBridgeConnected(data.localBridge?.connected || false);
        if (data.localBridge?.connected) {
          showToast('✓ Bridge conectado a Roblox Studio (:3001)');
        } else {
          showToast('Bridge local desconectado. Inicia Rojo o tu daemon en :3001');
        }
      }
    } catch {
      setIsLocalBridgeConnected(false);
      showToast('Error al comprobar daemon local');
    } finally {
      setIsCheckingBridge(false);
    }
  };

  useEffect(() => {
    checkBridgeStatus();
  }, []);

  const handleToolChange = (tool: string) => {
    setSelectedTool(tool);
    switch (tool) {
      case 'create_instance':
        setJsonPayload(
          JSON.stringify(
            {
              className: 'Part',
              parent: 'game.Workspace',
              properties: { Name: 'PablitoBeacon', Position: [0, 5, 0], Anchored: true },
            },
            null,
            2
          )
        );
        break;
      case 'modify_script':
        setJsonPayload(
          JSON.stringify(
            {
              targetPath: 'ServerScriptService/GameManager.server.luau',
              source: '--!strict\nprint("Sincronizado vía MCP con Pablito Studio")',
            },
            null,
            2
          )
        );
        break;
      case 'typecheck_code':
        setJsonPayload(
          JSON.stringify(
            {
              code: '--!strict\nlocal coins: number = 100\nprint(coins)',
              mode: 'strict',
            },
            null,
            2
          )
        );
        break;
      case 'sync_datastore':
        setJsonPayload(
          JSON.stringify(
            {
              datastoreName: 'PlayerData_v1',
              key: 'Player_12345',
              value: { Coins: 50, Level: 2 },
            },
            null,
            2
          )
        );
        break;
    }
  };

  const handleDispatchRpc = async () => {
    setIsExecuting(true);
    const nowTime = new Date().toLocaleTimeString();
    const callId = Math.floor(Math.random() * 90000 + 10000);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(jsonPayload);
    } catch {
      showToast('Error: JSON de argumentos inválido');
      setIsExecuting(false);
      return;
    }

    const clientLog = {
      id: Date.now(),
      type: 'client' as const,
      time: nowTime,
      title: `tools/call > ${selectedTool} (id: ${callId})`,
      body: JSON.stringify(parsedArgs, null, 2),
    };
    setConsoleLogs((prev) => [clientLog, ...prev.slice(0, 9)]);

    try {
      const response = await fetch('/api/mcp/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          id: callId,
          params: {
            name: selectedTool,
            arguments: parsedArgs,
          },
        }),
      });

      const data = await response.json();
      const respLog = {
        id: Date.now() + 1,
        type: 'response' as const,
        time: new Date().toLocaleTimeString(),
        title: `Resultado (status: ${data.result?.status || 'OK'})`,
        body: JSON.stringify(data.result, null, 2),
      };
      setConsoleLogs((prev) => [respLog, ...prev.slice(0, 9)]);
      showToast('✓ Llamada MCP ejecutada');
    } catch {
      showToast('Error de comunicación con el endpoint MCP');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-full bg-[#0c0d10] text-[#dfe2f0] p-4 md:p-8 space-y-6 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-6 z-50 bg-[#14151a] border border-[#d6403a] text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono-code animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#d6403a]">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Clean Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#14151a] border border-[#262832] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Conexiones & Protocolo MCP</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#d6403a]/15 text-[#ffb4ab] border border-[#d6403a]/30 font-mono-code">
              Pablito Studio
            </span>
          </div>
          <p className="text-xs text-[#8a8f9d] mt-1">
            Conecta herramientas externas, sincronización Rojo y análisis estático con el entorno de Luau.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={checkBridgeStatus}
            disabled={isCheckingBridge}
            className="px-4 py-2 rounded-xl bg-[#1f2128] hover:bg-[#262832] text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm ${isCheckingBridge ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isCheckingBridge ? 'Comprobando...' : 'Comprobar Bridge'}</span>
          </button>

          <button
            onClick={() => onNavigateToTab('configuracion-y-tokens-api')}
            className="px-4 py-2 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-[#d6403a]/25 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            <span>Configurar Puertos</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Servers Status & Interactive Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configured MCP Services (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8a8f9d] px-1">
            Servidores de Herramientas
          </div>

          <div className="space-y-3">
            {/* Rojo / Roblox Studio Bridge */}
            <div className="p-4 rounded-2xl bg-[#14151a] border border-[#262832] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5fb37c]"></span>
                  <h3 className="text-sm font-bold text-white">Roblox Studio Bridge (Rojo)</h3>
                </div>
                <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border ${
                  isLocalBridgeConnected
                    ? 'bg-[#5fb37c]/15 text-[#5fb37c] border-[#5fb37c]/30'
                    : 'bg-[#1f2128] text-[#8a8f9d] border-[#262832]'
                }`}>
                  {isLocalBridgeConnected ? 'Activo (:3001)' : 'Standby (:3001)'}
                </span>
              </div>
              <p className="text-xs text-[#8a8f9d] leading-relaxed">
                Permite insertar scripts creados por el Copilot directamente en tu proyecto abierto de Roblox Studio.
              </p>
              <div className="text-[11px] font-mono-code text-[#4cd7f6] pt-1">
                Herramientas: create_instance, modify_script, sync_datastore
              </div>
            </div>

            {/* Luau LSP Daemon */}
            <div className="p-4 rounded-2xl bg-[#14151a] border border-[#262832] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></span>
                  <h3 className="text-sm font-bold text-white">Luau Language Server (LSP)</h3>
                </div>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/20">
                  Listo
                </span>
              </div>
              <p className="text-xs text-[#8a8f9d] leading-relaxed">
                Validador estático oficial de Luau. Comprueba tipos, sintaxis y advertencias de código.
              </p>
              <div className="text-[11px] font-mono-code text-[#4cd7f6] pt-1">
                Herramientas: typecheck_code, lint_diagnostics
              </div>
            </div>

            {/* Roblox Open Cloud */}
            <div className="p-4 rounded-2xl bg-[#14151a] border border-[#262832] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb95f]"></span>
                  <h3 className="text-sm font-bold text-white">Roblox Open Cloud API</h3>
                </div>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#ffb95f]/10 text-[#ffb95f] border border-[#ffb95f]/20">
                  Configurable
                </span>
              </div>
              <p className="text-xs text-[#8a8f9d] leading-relaxed">
                Publicación remota de Places, gestión de DataStores en la nube y consulta de inventario oficial.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean JSON-RPC 2.0 Playground (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8a8f9d]">
              Playground de Herramientas MCP (JSON-RPC 2.0)
            </span>
            <span className="text-[10px] font-mono-code text-[#8a8f9d]">spec v1.2</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#14151a] border border-[#262832] space-y-4 shadow-xl">
            {/* Tool Selection */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'create_instance', label: 'create_instance' },
                { id: 'modify_script', label: 'modify_script' },
                { id: 'typecheck_code', label: 'typecheck_code' },
                { id: 'sync_datastore', label: 'sync_datastore' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleToolChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all cursor-pointer ${
                    selectedTool === t.id
                      ? 'bg-[#d6403a] text-white font-bold shadow-md shadow-[#d6403a]/25'
                      : 'bg-[#1f2128] text-[#8a8f9d] hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* JSON Editor */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#8a8f9d] mb-1.5 font-mono-code">
                <span>Parámetros de llamada (JSON):</span>
                <button
                  onClick={() => handleToolChange(selectedTool)}
                  className="hover:underline text-[11px]"
                >
                  Restablecer
                </button>
              </div>
              <textarea
                rows={7}
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#090a0d] border border-[#262832] font-mono-code text-xs text-[#dfe2f0] outline-none focus:border-[#d6403a] leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#8a8f9d] font-mono-code">
                Protocolo: JSON-RPC 2.0
              </span>
              <button
                onClick={handleDispatchRpc}
                disabled={isExecuting}
                className="px-5 py-2 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#d6403a]/25 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>{isExecuting ? 'Ejecutando...' : 'Ejecutar Llamada MCP'}</span>
              </button>
            </div>

            {/* Execution Log */}
            <div className="pt-3 border-t border-[#262832] space-y-2">
              <div className="text-xs font-bold text-[#8a8f9d] font-mono-code">
                Registro de Salida Reciente:
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 font-mono-code text-xs">
                {consoleLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-lg border text-[11px] ${
                      log.type === 'response'
                        ? 'bg-[#1f2128]/70 border-[#5fb37c]/30 text-[#dfe2f0]'
                        : 'bg-[#090a0d] border-[#262832] text-[#8a8f9d]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#8a8f9d] mb-1">
                      <span className="font-bold text-white">{log.title}</span>
                      <span>{log.time}</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-[11px] overflow-x-auto leading-relaxed">
                      {log.body}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
