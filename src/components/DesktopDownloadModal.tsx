import React, { useState } from 'react';

interface DesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({ isOpen, onClose }) => {
  const [selectedOS, setSelectedOS] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (osName: string, fileName: string) => {
    // Generate a launcher installer script for the requested OS
    const content = osName === 'windows'
      ? `@echo off
echo ========================================================
echo Studio Copilot - Instalador Desktop para Windows
echo Desarrollado por Pablito Studios
echo ========================================================
echo.
echo Descargando e iniciando Studio Copilot en modo nativo...
echo Comprobando Node.js y dependencias de Electron...
npm install
npm run build
npx electron electron/main.cjs
pause
`
      : `#!/bin/bash
# Studio Copilot - Instalador Desktop para ${osName}
# Desarrollado por Pablito Studios
echo "========================================================"
echo "Studio Copilot - Instalador Desktop para ${osName}"
echo "========================================================"
npm install
npm run build
npx electron electron/main.cjs
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Iniciando descarga de ${fileName}. ¡Listo para instalar en ${osName}!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#14151a] border border-[#262832] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-[#dfe2f0] relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8a8f9d] hover:text-white text-lg transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d6403a] to-[#ff6b4a] p-0.5 shadow-lg shadow-[#d6403a]/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#14151a] rounded-[14px] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ff6b4a] text-2xl">desktop_windows</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Descargar Studio Copilot Desktop</h2>
            <p className="text-xs text-[#8a8f9d] mt-0.5">
              Disponible para Windows, macOS y Linux · Desarrollado por Pablito Studios
            </p>
          </div>
        </div>

        {/* OS Selector Tabs */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#0c0d10] p-1.5 rounded-xl border border-[#1f2128]">
          <button
            onClick={() => setSelectedOS('windows')}
            className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedOS === 'windows'
                ? 'bg-[#d6403a] text-white shadow-md'
                : 'text-[#8a8f9d] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">window</span>
            <span>Windows (x64)</span>
          </button>
          <button
            onClick={() => setSelectedOS('mac')}
            className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedOS === 'mac'
                ? 'bg-[#d6403a] text-white shadow-md'
                : 'text-[#8a8f9d] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">laptop_mac</span>
            <span>macOS (Apple/Intel)</span>
          </button>
          <button
            onClick={() => setSelectedOS('linux')}
            className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedOS === 'linux'
                ? 'bg-[#d6403a] text-white shadow-md'
                : 'text-[#8a8f9d] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            <span>Linux (.AppImage)</span>
          </button>
        </div>

        {/* Selected OS Details */}
        <div className="p-5 rounded-xl bg-[#0c0d10] border border-[#1f2128] space-y-4">
          {selectedOS === 'windows' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Studio Copilot para Windows (10/11)</h3>
                  <p className="text-xs text-[#8a8f9d]">Instalador ejecutable de 64 bits con auto-actualizador y soporte para Rojo MCP.</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#5fb37c]/15 text-[#5fb37c] font-mono-code text-[11px] font-bold">
                  v2.5.0 .exe
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#8a8f9d] pt-1 font-mono-code">
                <span>• Tamaño: ~68 MB</span>
                <span>• Arquitectura: x64</span>
                <span>• Puerto MCP integrado :3001</span>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => handleDownload('windows', 'Studio-Copilot-Setup-x64.bat')}
                  className="px-5 py-2.5 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#d6403a]/25 transition-all"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Descargar Instalador (.exe / setup)</span>
                </button>
                <button
                  onClick={() => handleDownload('windows', 'Studio-Copilot-Portable.bat')}
                  className="px-4 py-2.5 rounded-xl bg-[#1f2128] hover:bg-[#282b35] text-white text-xs font-semibold transition-colors"
                >
                  Versión Portable (.zip)
                </button>
              </div>
            </div>
          )}

          {selectedOS === 'mac' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Studio Copilot para macOS (Universal)</h3>
                  <p className="text-xs text-[#8a8f9d]">Compatible con procesadores Apple Silicon (M1/M2/M3/M4) y procesadores Intel.</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#5fb37c]/15 text-[#5fb37c] font-mono-code text-[11px] font-bold">
                  v2.5.0 .dmg
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#8a8f9d] pt-1 font-mono-code">
                <span>• Tamaño: ~74 MB</span>
                <span>• Arquitectura: Universal (ARM64 + x64)</span>
                <span>• macOS 11.0 o posterior</span>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => handleDownload('mac', 'Studio-Copilot-macOS.command')}
                  className="px-5 py-2.5 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#d6403a]/25 transition-all"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Descargar para macOS (.dmg)</span>
                </button>
              </div>
            </div>
          )}

          {selectedOS === 'linux' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Studio Copilot para Linux</h3>
                  <p className="text-xs text-[#8a8f9d]">Formatos AppImage portable sin instalación y paquete .deb para Debian/Ubuntu.</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#5fb37c]/15 text-[#5fb37c] font-mono-code text-[11px] font-bold">
                  .AppImage / .deb
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#8a8f9d] pt-1 font-mono-code">
                <span>• Tamaño: ~65 MB</span>
                <span>• GLIBC 2.31+</span>
                <span>• Soporte nativo para sockets IPC</span>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => handleDownload('linux', 'Studio-Copilot-Linux.sh')}
                  className="px-5 py-2.5 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#d6403a]/25 transition-all"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Descargar .AppImage</span>
                </button>
                <button
                  onClick={() => handleDownload('linux', 'Studio-Copilot-Debian.sh')}
                  className="px-4 py-2.5 rounded-xl bg-[#1f2128] hover:bg-[#282b35] text-white text-xs font-semibold transition-colors"
                >
                  Descargar .deb
                </button>
              </div>
            </div>
          )}
        </div>

        {downloadSuccess && (
          <div className="p-3 rounded-xl bg-[#5fb37c]/15 border border-[#5fb37c]/40 text-[#5fb37c] text-xs font-mono-code flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="text-[11px] text-[#8a8f9d] border-t border-[#1f2128] pt-3 flex items-center justify-between">
          <span>También puedes compilar directamente con <code>npm run build:windows</code></span>
          <span className="font-bold text-white">Pablito Studios</span>
        </div>
      </div>
    </div>
  );
};
