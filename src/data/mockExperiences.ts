import { RobloxExperience, ReusableAsset, McpServerInfo } from '../types';

export const INITIAL_EXPERIENCES: RobloxExperience[] = [];

export const INITIAL_REUSABLE_ASSETS: ReusableAsset[] = [
  {
    id: 'asset-1',
    title: 'DataStoreSafeWrapper.luau',
    category: 'DataStore',
    type: 'ModuleScript',
    description: 'Control de pcall, backoff exponencial, cola de peticiones con deduplicación y auto-mocking para Studio offline.',
    tags: ['ProfileService', 'RetryPolicy'],
    version: 'v3.1.0',
    linesCount: 240,
    sizeOrLines: 'v3.1.0 • 240 líneas',
    code: `--!strict
-- DataStoreSafeWrapper.luau
-- Desarrollado por Pablito Studios para Studio Copilot
local DataStoreService = game:GetService("DataStoreService")
local SafeDataStore = {}
SafeDataStore.__index = SafeDataStore

export type SafeStore = {
    _store: GlobalDataStore,
    _cache: { [string]: any },
    getWithRetry: (self: SafeStore, key: string, maxAttempts: number?) -> (boolean, any),
    setWithRetry: (self: SafeStore, key: string, value: any, maxAttempts: number?) -> boolean,
}

function SafeDataStore.new(storeName: string): SafeStore
    local self = setmetatable({}, SafeDataStore)
    self._store = DataStoreService:GetDataStore(storeName)
    self._cache = {}
    return (self :: any) :: SafeStore
end

function SafeDataStore:getWithRetry(key: string, maxAttempts: number?): (boolean, any)
    local attempts = maxAttempts or 3
    for i = 1, attempts do
        local success, result = pcall(function()
            return self._store:GetAsync(key)
        end)
        if success then return true, result end
        task.wait(2 ^ (i - 1))
    end
    return false, nil
end

function SafeDataStore:setWithRetry(key: string, value: any, maxAttempts: number?): boolean
    local attempts = maxAttempts or 3
    for i = 1, attempts do
        local success = pcall(function()
            self._store:SetAsync(key, value)
        end)
        if success then return true end
        task.wait(2 ^ (i - 1))
    end
    return false
end

return SafeDataStore`,
  },
  {
    id: 'asset-2',
    title: 'RaycastHitboxV4.luau',
    category: 'Combat',
    type: 'Physics Tool',
    description: 'Detección de impactos milimétrica basada en attachments y Vector3 ray tracing sin sobrecarga de TouchTransmitters.',
    tags: ['DmgFilter', 'Attachments'],
    version: 'v4.0.2',
    linesCount: 512,
    sizeOrLines: 'v4.0.2 • 512 líneas',
    code: `--!strict
-- RaycastHitboxV4.luau
-- Detección de impacto de alta frecuencia sin lag de físicas
local Workspace = game:GetService("Workspace")
local Hitbox = {}
Hitbox.__index = Hitbox

function Hitbox.new(character: Model, weaponPart: BasePart)
    local self = setmetatable({}, Hitbox)
    self.Character = character
    self.WeaponPart = weaponPart
    self.Points = {}
    self.Active = false
    self.HitTargets = {}
    return self
end

function Hitbox:Start()
    self.Active = true
    table.clear(self.HitTargets)
end

function Hitbox:Stop()
    self.Active = false
end

return Hitbox`,
  },
  {
    id: 'asset-3',
    title: 'WeatherEngine.rbxm',
    category: 'VFX',
    type: 'Atmosphere Package',
    description: 'Lluvia volumétrica, nubes procedurales, iluminación sincronizada por TweenService y efectos de sonido en SoundService.',
    tags: ['Lighting', 'Atmosphere'],
    version: 'v1.2',
    linesCount: 180,
    sizeOrLines: 'v1.2 • 1.8 MB rbxm',
    code: `--!strict
-- WeatherEngine Controller
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")

local Weather = {}

function Weather.SetRain(intensity: number)
    local tweenInfo = TweenInfo.new(3, Enum.EasingStyle.Sine, Enum.EasingDirection.Out)
    TweenService:Create(Lighting, tweenInfo, {
        FogEnd = 200 - (intensity * 100),
        Brightness = 1.2 - (intensity * 0.6)
    }):Play()
end

return Weather`,
  },
  {
    id: 'asset-4',
    title: 'LeaderstatsEconomy.luau',
    category: 'Economy',
    type: 'ServerScriptService',
    description: 'Sistema de monedas duales (Monedas / Gemas VIP) con sincronización fluida de UI y listeners reactivos ValueChanged.',
    tags: ['IntConst', 'Replication'],
    version: 'v2.0',
    linesCount: 188,
    sizeOrLines: 'v2.0 • 188 líneas',
    code: `--!strict
-- LeaderstatsEconomy.luau (ServerScriptService)
local Players = game:GetService("Players")

local function onPlayerAdded(player: Player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Monedas"
    coins.Value = 100
    coins.Parent = leaderstats

    local gems = Instance.new("IntValue")
    gems.Name = "Gemas"
    gems.Value = 5
    gems.Parent = leaderstats
end

Players.PlayerAdded:Connect(onPlayerAdded)`,
  },
];

export const INITIAL_MCP_SERVERS: McpServerInfo[] = [
  {
    id: 'roblox-bridge',
    name: 'Roblox Open Cloud & Studio Bridge',
    status: 'online',
    endpoint: 'http://localhost:3001/mcp',
    latency: '4ms',
    tools: ['create_instance', 'modify_script', 'sync_datastore', 'upload_rbxm'],
    active: true,
    transport: 'HTTP SSE + IPC Rojo',
    description: 'Sincronizador bidireccional entre Gemini y Workspace en tiempo real.',
  },
  {
    id: 'luau-lsp',
    name: 'Luau Language Server Protocol (LSP)',
    status: 'online',
    endpoint: 'stdio://luau-lsp-daemon-v1.34',
    latency: '1.2ms',
    tools: ['typecheck_code', 'autocomplete', 'diagnostics_lint', 'format_luau'],
    active: true,
    transport: 'stdio / PIPE_LUAU_01',
    description: 'Análisis estático en tiempo real, inferencia estricta y linteo de tipos Luau.',
  },
  {
    id: 'asset-store',
    name: 'Roblox Asset & Creator Store MCP',
    status: 'online',
    endpoint: 'https://api.roblox.com/v1/assets/mcp',
    latency: '28ms',
    tools: ['search_toolbox', 'fetch_audio_id', 'import_fbx_mesh', 'validate_moderation'],
    active: true,
    transport: 'HTTPS REST (OAuth 2.0 PKCE)',
    description: 'Búsqueda semántica, curaduría de meshes, audios verificados y moderación.',
  },
  {
    id: 'blender-mcp',
    name: 'Blender & 3D Generative Mesh MCP',
    status: 'standby',
    endpoint: 'unix:///tmp/blender-mcp-ipc.sock',
    latency: '—',
    tools: ['export_obj_to_studio', 'rig_r15_avatar'],
    active: false,
    transport: 'IPC Domain Socket',
    description: 'Generación procedural y autorigging de humanoides para Roblox R15.',
  },
];
