# Studio Copilot — Aplicación de Escritorio Multiplataforma
**Desarrollado por Pablito Studios**

Studio Copilot está preparado para compilarse y empaquetarse de forma nativa para **Windows**, **macOS** y **Linux** utilizando Electron y Electron Builder.

---

## 1. Requisitos Previos
- Node.js 18+ o Bun
- npm instalado

---

## 2. Instrucciones de Compilación Paso a Paso

### Paso 1: Compilar la aplicación web
```bash
npm run build
```

### Paso 2: Instalar Electron y Electron Builder (si aún no están instalados)
```bash
npm install --save-dev electron electron-builder
```

---

## 3. Generar Instaladores por Sistema Operativo

### 🪟 Para Windows (x64)
Genera el instalador NSIS `.exe` y ejecutable portable:
```bash
npx electron-builder --win --x64
```
*Salida:* `dist_electron/Studio-Copilot-Setup-x64.exe`

### 🍎 Para macOS (Apple Silicon M1/M2/M3 y procesadores Intel)
Genera el paquete de instalación `.dmg` y `.app`:
```bash
npx electron-builder --mac --universal
```
*Salida:* `dist_electron/Studio-Copilot-Mac-Universal.dmg`

### 🐧 Para Linux (Ubuntu, Debian, Fedora, Arch)
Genera el paquete portable universal `.AppImage` y paquete `.deb`:
```bash
npx electron-builder --linux AppImage deb
```
*Salida:* `dist_electron/Studio-Copilot-Linux.AppImage` y `.deb`

---

## 4. Probar en Modo Desarrollo Desktop
Para iniciar la ventana de escritorio inmediatamente sin empaquetar:
```bash
npx electron electron/main.cjs
```
