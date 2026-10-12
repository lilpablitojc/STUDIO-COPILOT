// Base de conocimiento técnico profundo sobre Luau y Roblox Studio
// Desarrollado por Pablito Studio

export interface KnowledgeSnippet {
  id: string;
  category:
    | 'syntax'
    | 'services'
    | 'client-server'
    | 'datastore'
    | 'gui'
    | 'physics'
    | 'security'
    | 'errors'
    | 'performance';
  title: string;
  keywords: string[];
  summary: string;
  solutionPattern: string;
  codeExample: string;
  placement: string;
}

export const LUAU_KNOWLEDGE_BASE: KnowledgeSnippet[] = [
  // 1. VIP DOOR & GAMEPASSES
  {
    id: 'vip-door',
    category: 'security',
    title: 'Puerta VIP y Gamepasses con MarketplaceService',
    keywords: ['puerta vip', 'vip', 'gamepass', 'marketplace', 'door', 'no abre', 'gamepassservice', 'acceso', 'pase'],
    summary:
      'Para una puerta VIP segura, la verificación del Gamepass DEBE realizarse en el servidor usando MarketplaceService:UserOwnsGamePassAsync envuelto en un pcall. El cliente nunca debe decidir si una puerta se abre.',
    solutionPattern:
      '1. Usar un Script de servidor en ServerScriptService o dentro del Modelo de la Puerta.\n2. Conectar el evento Touched de la parte.\n3. Obtener el jugador mediante Players:GetPlayerFromCharacter(hit.Parent).\n4. Aplicar debounce con diccionario para evitar múltiples llamadas por segundo.\n5. Validar la posesión del GamePass con MarketplaceService:UserOwnsGamePassAsync dentro de un pcall.\n6. Modificar Transparency y CanCollide solo en el servidor para el jugador o con TweenService.',
    codeExample: `--!strict
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local GAMEPASS_ID: number = 12345678 -- Reemplazar con ID real del GamePass
local door = script.Parent :: BasePart
local debounceMap: { [number]: boolean } = {}

local function onTouched(hit: BasePart)
    local character = hit.Parent
    if not character then return end
    local player = Players:GetPlayerFromCharacter(character)
    if not player then return end

    if debounceMap[player.UserId] then return end
    debounceMap[player.UserId] = true

    task.delay(2, function()
        debounceMap[player.UserId] = nil
    end)

    local success, ownsPass = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, GAMEPASS_ID)
    end)

    if success and ownsPass then
        door.Transparency = 0.7
        door.CanCollide = false
        task.wait(3)
        door.Transparency = 0
        door.CanCollide = true
    else
        warn(\`[VIP Door] El jugador {player.Name} no posee el GamePass o hubo error de API\`)
    end
end

door.Touched:Connect(onTouched)`,
    placement: 'ServerScriptService > VipDoorHandler.server.luau (o dentro del Modelo de la puerta en Workspace)',
  },

  // 2. ATTEMPT TO INDEX NIL
  {
    id: 'attempt-index-nil',
    category: 'errors',
    title: 'Error común: attempt to index nil (con WaitForChild o Character)',
    keywords: [
      'attempt to index nil',
      'index nil',
      'waitforchild',
      'findfirstchild',
      'nil error',
      'null pointer',
      'error output',
      'humanoid is nil',
    ],
    summary:
      'Este error ocurre al intentar leer una propiedad o invocar un método sobre una variable que vale nil (por ejemplo, cuando un objeto hijo aún no ha cargado, el personaje aún no existe, o FindFirstChild devolvió nil).',
    solutionPattern:
      '1. Si buscas un objeto en el Cliente que aún se está replicando desde el servidor, usa :WaitForChild("Nombre", tiempoLimite).\n2. Si accedes al Character de un Player, usa player.Character or player.CharacterAdded:Wait().\n3. En el caso de Humanoid, espera a que esté listo con :WaitForChild("Humanoid", 5).\n4. Siempre verifica if variable ~= nil then antes de llamar métodos.',
    codeExample: `--!strict
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- FORMA CORRECTA Y SEGURA DE OBTENER PERSONAJE Y HUMANOID EN EL CLIENTE:
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid", 5) :: Humanoid?

if humanoid then
    humanoid.Died:Connect(function()
        print("El jugador ha muerto de forma segura sin excepciones de nil")
    end)
else
    warn("No se encontró el Humanoid tras esperar 5 segundos.")
end`,
    placement: 'StarterPlayer > StarterPlayerScripts > Controller.client.luau',
  },

  // 3. INFINITE YIELD POSSIBLE
  {
    id: 'infinite-yield',
    category: 'errors',
    title: 'Advertencia: Infinite yield possible on "..." con WaitForChild',
    keywords: [
      'infinite yield',
      'infinite yield possible',
      'waitforchild infinite',
      'espera infinita',
      'no carga objeto',
    ],
    summary:
      'Roblox emite esta advertencia cuando un script ejecuta :WaitForChild("Nombre") y el objeto no aparece transcurridos 5 segundos. Ocurre comúnmente por errores tipográficos en el nombre (mayúsculas/minúsculas), porque el objeto nunca fue creado por el servidor, o por problemas de StreamingEnabled.',
    solutionPattern:
      '1. Comprobar que el nombre exacto de la instancia coincida letra por letra (respetando mayúsculas y minúsculas).\n2. Pasar siempre un tiempo de espera límite: :WaitForChild("Objeto", 10).\n3. Validar con un if si la instancia se obtuvo antes de usarla.\n4. Si el servidor crea la instancia en tiempo de ejecución, verificar que se inserte en un contenedor compartido como ReplicatedStorage.',
    codeExample: `--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Pasa un segundo argumento (timeout en segundos) para evitar bloqueos eternos:
local TIMEOUT_SECONDS = 10
local remoteEvent = ReplicatedStorage:WaitForChild("CombatEvent", TIMEOUT_SECONDS) :: RemoteEvent?

if remoteEvent then
    print("RemoteEvent cargado exitosamente")
    remoteEvent:FireServer("Ping")
else
    warn("CombatEvent no cargó en ReplicatedStorage tras 10 segundos. Revisa ServerScriptService.")
end`,
    placement: 'En cualquier LocalScript o Script que espere instancias dinámicas',
  },

  // 4. REMOTE EVENTS CLIENT-SERVER
  {
    id: 'remote-events-client-server',
    category: 'client-server',
    title: 'Comunicación Cliente-Servidor segura con RemoteEvent',
    keywords: [
      'remoteevent',
      'remotefunction',
      'fireserver',
      'fireclient',
      'onserverevent',
      'onclientevent',
      'cliente servidor',
      'comunicacion',
    ],
    summary:
      'Los RemoteEvents permiten enviar mensajes unidireccionales entre Cliente y Servidor. El RemoteEvent debe ubicarse en ReplicatedStorage. El primer argumento recibido en .OnServerEvent es SIEMPRE el Player que emitió la llamada y no puede ser manipulado por el cliente.',
    solutionPattern:
      '1. Crear el RemoteEvent en ReplicatedStorage (o subcarpeta ReplicatedStorage.Events).\n2. En el LocalScript usar remoteEvent:FireServer(parametros...). NUNCA pases el player como argumento.\n3. En el ServerScript escuchar con remoteEvent.OnServerEvent:Connect(function(player, parametros...) ... end).\n4. Validar tipos (typeof), cooldowns y rangos en el servidor.',
    codeExample: `-- SERVIDOR (ServerScriptService/CombatServer.server.luau)
--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local attackEvent = ReplicatedStorage:WaitForChild("AttackEvent") :: RemoteEvent

local cooldowns: { [number]: number } = {}

attackEvent.OnServerEvent:Connect(function(player: Player, attackType: any)
    if typeof(attackType) ~= "string" then return end
    local now = os.clock()
    if cooldowns[player.UserId] and now - cooldowns[player.UserId] < 0.5 then
        return -- Cooldown activo
    end
    cooldowns[player.UserId] = now
    
    print(\`[Servidor] Ataque válido de {player.Name}: {attackType}\`)
end)

-- CLIENTE (StarterPlayerScripts/CombatController.client.luau)
--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local attackEvent = ReplicatedStorage:WaitForChild("AttackEvent") :: RemoteEvent
attackEvent:FireServer("LightAttack")`,
    placement: 'ReplicatedStorage (RemoteEvent) + ServerScriptService (Server) + StarterPlayerScripts (Client)',
  },

  // 5. DATASTORE SERVICE CON PCALL Y BINDTOCLOSE
  {
    id: 'datastore-service',
    category: 'datastore',
    title: 'Guardado Seguro con DataStoreService y Protección contra Pérdida de Datos',
    keywords: [
      'datastore',
      'guardar',
      'datos',
      'monedas',
      'inventario',
      'load',
      'save',
      'leaderstats',
      'pcall',
      'datastore2',
      'profileservice',
    ],
    summary:
      'DataStoreService puede fallar temporalmente debido a límites de peticiones de red o cortes de Roblox. Cualquier llamada a GetAsync, SetAsync o UpdateAsync DEBE estar envuelta en un pcall con reintentos y guardado en PlayerRemoving y BindToClose.',
    solutionPattern:
      '1. Usar :UpdateAsync() preferiblemente sobre :SetAsync() para evitar sobreescrituras en multijugador.\n2. Cargar datos en Players.PlayerAdded y almacenar en una tabla en memoria (caché de sesión).\n3. Guardar en Players.PlayerRemoving.\n4. Conectar game:BindToClose para guardar a todos los jugadores si el servidor se apaga.',
    codeExample: `--!strict
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local PlayerDataStore = DataStoreService:GetDataStore("GameData_v1")
local sessionData: { [number]: { Coins: number, Level: number } } = {}

local function loadData(player: Player)
    local key = \`Player_\${player.UserId}\`
    local success, data = pcall(function()
        return PlayerDataStore:GetAsync(key)
    end)
    
    if success and data then
        sessionData[player.UserId] = data
    else
        sessionData[player.UserId] = { Coins = 0, Level = 1 }
    end
end

local function saveData(player: Player)
    local data = sessionData[player.UserId]
    if not data then return end
    
    local key = \`Player_\${player.UserId}\`
    local success, err = pcall(function()
        PlayerDataStore:SetAsync(key, data)
    end)
    if not success then
        warn(\`[DataStore] Error al guardar datos de \${player.Name}: \${tostring(err)}\`)
    end
    sessionData[player.UserId] = nil
end

Players.PlayerAdded:Connect(loadData)
Players.PlayerRemoving:Connect(saveData)

game:BindToClose(function()
    for _, player in Players:GetPlayers() do
        task.spawn(saveData, player)
    end
    task.wait(2)
end)`,
    placement: 'ServerScriptService > DataStoreManager.server.luau',
  },

  // 6. LUAU OOP Y METATABLAS
  {
    id: 'luau-oop',
    category: 'syntax',
    title: 'Programación Orientada a Objetos (OOP) con Metatablas y Tipado Estricto en Luau',
    keywords: [
      'oop',
      'clase',
      'metatabla',
      'metatable',
      'setmetatable',
      'index',
      'constructores',
      'modulo',
      'objeto',
    ],
    summary:
      'En Luau, los objetos se crean usando tablas y la metatabla __index. Con Luau strict (--!strict), se define un tipo exportado con typeof(setmetatable(...)) para obtener autocompletado y tipado estático perfecto.',
    solutionPattern:
      '1. Crear un ModuleScript.\n2. Definir Class = {} y Class.__index = Class.\n3. Definir export type ClassType.\n4. Implementar función constructora Class.new(...).\n5. Retornar la tabla del módulo.',
    codeExample: `--!strict
local Gun = {}
Gun.__index = Gun

export type Gun = typeof(setmetatable({} :: {
    Damage: number,
    Ammo: number,
    MaxAmmo: number,
}, Gun))

function Gun.new(damage: number, maxAmmo: number): Gun
    local self = setmetatable({}, Gun)
    self.Damage = damage
    self.Ammo = maxAmmo
    self.MaxAmmo = maxAmmo
    return (self :: any) :: Gun
end

function Gun.Shoot(self: Gun): boolean
    if self.Ammo > 0 then
        self.Ammo -= 1
        print(\`Disparo efectuado. Balas restantes: \${self.Ammo}\`)
        return true
    end
    print("¡Sin munición! Recarga.")
    return false
end

function Gun.Reload(self: Gun)
    self.Ammo = self.MaxAmmo
    print("Arma recargada.")
end

return Gun`,
    placement: 'ReplicatedStorage > Modules > Gun.luau (ModuleScript)',
  },

  // 7. DIFERENCIAS LUA vs LUAU (TIPADO, OPERADORES, STRINGS INTERPOLADOS)
  {
    id: 'luau-syntax-features',
    category: 'syntax',
    title: 'Sintaxis Luau vs Lua Estándar: Tipado Estricto, Operadores Compuestos e Interpolación',
    keywords: [
      'diferencias lua luau',
      'luau sintaxis',
      'operadores compuestos',
      'interpolacion de texto',
      'continue',
      'tipos estrictos',
      'strict',
    ],
    summary:
      'Luau es una evolución rápida y tipada de Lua 5.1 desarrollada por Roblox. Añade tipos estáticos (--!strict), interpolación de strings con backticks, operadores compuestos (+=, -=, *=, /=, ..=), la palabra reservada continue, y soporte para tablas tipadas.',
    solutionPattern:
      '1. Incluir --!strict en la primera línea de todos tus scripts.\n2. Usar interpolación \`Hola {nombre}\` en vez de concatenación repetitiva .. .\n3. Usar operadores compuestos como saldo += 10.\n4. Utilizar continue en bucles para saltar a la siguiente iteración.',
    codeExample: `--!strict
-- 1. Operadores compuestos:
local coins: number = 50
coins += 25 -- coins ahora es 75

-- 2. Strings interpolados con backticks:
local playerName: string = "Pablito"
print(\`Bienvenido al juego {playerName}! Tienes {coins} monedas.\`)

-- 3. Uso de continue en bucles:
for i = 1, 10 do
    if i % 2 == 0 then
        continue -- Salta los pares sin anidar if/else
    end
    print(\`Impar: {i}\`)
end

-- 4. Tipos personalizados:
type InventoryItem = {
    Id: string,
    Rarity: "Common" | "Rare" | "Legendary",
    Quantity: number,
}

local potion: InventoryItem = {
    Id = "health_potion",
    Rarity = "Common",
    Quantity = 3,
}`,
    placement: 'Aplica a cualquier script .luau de servidor o cliente',
  },

  // 8. TWEENSERVICE PARA ANIMACIONES SUAVES
  {
    id: 'tweenservice-animations',
    category: 'services',
    title: 'Animaciones de Interfaz y Modelos con TweenService',
    keywords: [
      'tweenservice',
      'tween',
      'animar',
      'suave',
      'easing',
      'transicion',
      'animacion gui',
      'animar parte',
    ],
    summary:
      'TweenService interpola propiedades numéricas, Vector3, Color3, CFrame y UDim2 de forma suave con curvas de aceleración (EasingStyle y EasingDirection). Es mucho más eficiente que bucles while con task.wait().',
    solutionPattern:
      '1. Obtener game:GetService("TweenService").\n2. Definir TweenInfo.new(tiempo, Enum.EasingStyle, Enum.EasingDirection).\n3. Especificar las propiedades objetivo en un diccionario { Transparency = 1 }.\n4. Crear el tween con TweenService:Create(objeto, info, metas) y llamar :Play().',
    codeExample: `--!strict
local TweenService = game:GetService("TweenService")
local part = script.Parent :: BasePart

local tweenInfo = TweenInfo.new(
    1.5, -- Duración en segundos
    Enum.EasingStyle.Quad, -- Estilo suave
    Enum.EasingDirection.Out,
    0, -- Repeticiones
    false, -- No reversa
    0 -- Retardo inicial
)

local goalProperties = {
    Position = part.Position + Vector3.new(0, 10, 0),
    Transparency = 0.5,
    Color = Color3.fromRGB(214, 64, 58),
}

local tween = TweenService:Create(part, tweenInfo, goalProperties)
tween:Play()

tween.Completed:Connect(function(playbackState)
    print("Animación completada con estado:", playbackState)
end)`,
    placement: 'Script dentro de una Parte en Workspace o LocalScript en StarterGui para marcos de UI',
  },

  // 9. RUNSERVICE: RENDERSTEPPED, HEARTBEAT Y STEPPED
  {
    id: 'runservice-loops',
    category: 'services',
    title: 'Ciclos de Ejecución y Frame Rates con RunService (RenderStepped vs Heartbeat)',
    keywords: [
      'runservice',
      'renderstepped',
      'heartbeat',
      'stepped',
      'frame rate',
      'delta time',
      'fps',
      'bucle infinito',
    ],
    summary:
      'RunService sincroniza la ejecución de código con el motor de renderizado y físicas. RenderStepped se ejecuta únicamente en el Cliente antes de pintar el frame (ideal para cámaras). Heartbeat corre en servidor y cliente después de calcular físicas. Stepped corre antes de las físicas con delta time.',
    solutionPattern:
      '1. Obtener RunService.\n2. Usar RenderStepped SOLO en LocalScripts para actualizar la cámara o UI que dependa de la mirada.\n3. Usar Heartbeat para temporizadores precisos de gameplay.\n4. Guardar la conexión RBXScriptConnection y desconectar cuando ya no se use.',
    codeExample: `--!strict
local RunService = game:GetService("RunService")

-- CLIENTE: Seguimiento suave de cámara o efectos
local connection: RBXScriptConnection? = nil

connection = RunService.RenderStepped:Connect(function(deltaTime: number)
    -- deltaTime es el tiempo exacto transcurrido entre frames (ej: 0.016s a 60 FPS)
    -- Ideal para rotar objetos decorativos sin importar los FPS del dispositivo
end)

-- Para desconectar y evitar fugas de memoria:
task.delay(10, function()
    if connection then
        connection:Disconnect()
        connection = nil
    end
end)`,
    placement: 'StarterPlayerScripts > CameraOrVisualFX.client.luau',
  },

  // 10. USERINPUTSERVICE & CONTEXTACTIONSERVICE (MULTIPLATAFORMA)
  {
    id: 'cross-platform-input',
    category: 'services',
    title: 'Controles Multiplataforma para PC, Móvil y Consola con ContextActionService',
    keywords: [
      'userinputservice',
      'contextactionservice',
      'controles movil',
      'botones pantalla',
      'teclado',
      'gamepad',
      'input',
      'saltar',
      'atacar',
    ],
    summary:
      'ContextActionService permite asociar una misma acción a teclas de teclado, botones de mando y crear automáticamente un botón táctil en pantallas móviles con un solo llamado a :BindAction.',
    solutionPattern:
      '1. Obtener game:GetService("ContextActionService").\n2. Crear la función manejadora que reciba (actionName, inputState, inputObject).\n3. Llamar ContextActionService:BindAction(nombre, funcion, crearBotonTactil, teclas...).\n4. Personalizar el botón táctil con :SetTitle o :SetImage.',
    codeExample: `--!strict
local ContextActionService = game:GetService("ContextActionService")
local ACTION_ATTACK = "PlayerAttack"

local function handleAttack(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject)
    if inputState == Enum.UserInputState.Begin then
        print("¡Ataque activado desde PC, Móvil o Gamepad!")
    end
    return Enum.ContextActionResult.Pass
end

-- El tercer parámetro 'true' crea automáticamente un botón en pantallas táctiles de celular:
ContextActionService:BindAction(
    ACTION_ATTACK,
    handleAttack,
    true,
    Enum.KeyCode.F,
    Enum.KeyCode.ButtonX -- Botón X en control Xbox/PlayStation
)

ContextActionService:SetTitle(ACTION_ATTACK, "Atacar")`,
    placement: 'StarterPlayer > StarterPlayerScripts > InputManager.client.luau',
  },

  // 11. PATHFINDINGSERVICE PARA NPCS INTELIGENTES
  {
    id: 'pathfinding-service',
    category: 'services',
    title: 'Inteligencia Artificial y Rutas de NPCs con PathfindingService',
    keywords: [
      'pathfinding',
      'pathfindingservice',
      'npc',
      'enemigo',
      'perseguir',
      'crear ruta',
      'waypoint',
      'movimiento ia',
    ],
    summary:
      'PathfindingService calcula la ruta óptima para que un NPC camine hasta un destino esquivando paredes, saltando obstáculos y recalculando si el objetivo se desplaza.',
    solutionPattern:
      '1. Obtener PathfindingService.\n2. Crear un Path con :CreatePath(agentParameters).\n3. Ejecutar path:ComputeAsync(inicio, fin).\n4. Si path.Status == Enum.PathStatus.Success, iterar los waypoints y llamar humanoid:MoveTo(waypoint.Position).\n5. Escuchar humanoid.MoveToFinished:Wait().',
    codeExample: `--!strict
local PathfindingService = game:GetService("PathfindingService")

local function walkToTarget(npc: Model, targetPosition: Vector3)
    local humanoid = npc:FindFirstChildOfClass("Humanoid")
    local rootPart = npc:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not humanoid or not rootPart then return end

    local path = PathfindingService:CreatePath({
        AgentRadius = 2,
        AgentHeight = 5,
        AgentCanJump = true,
    })

    local success, _ = pcall(function()
        path:ComputeAsync(rootPart.Position, targetPosition)
    end)

    if success and path.Status == Enum.PathStatus.Success then
        local waypoints = path:GetWaypoints()
        for _, waypoint in waypoints do
            if waypoint.Action == Enum.PathWaypointAction.Jump then
                humanoid.Jump = true
            end
            humanoid:MoveTo(waypoint.Position)
            humanoid.MoveToFinished:Wait()
        end
    end
end`,
    placement: 'ServerScriptService o dentro del script del NPC en Workspace',
  },

  // 12. OPTIMIZACIÓN DE MEMORIA Y DESCONEXIÓN DE EVENTOS
  {
    id: 'memory-leaks-connections',
    category: 'performance',
    title: 'Optimización de Memoria y Desconexión de Eventos RBXScriptConnection',
    keywords: [
      'memory leak',
      'lag',
      'optimizacion',
      'rendimiento',
      'disconnect',
      'maid',
      'janitor',
      'eventos',
      'fuga de memoria',
    ],
    summary:
      'Las conexiones a eventos que quedan abiertas tras destruir una parte o tras reiniciar el personaje provocan memory leaks graves en Roblox. Siempre guarda la conexión y llama a :Disconnect() cuando el objeto deje de existir.',
    solutionPattern:
      '1. Guardar la conexión: local conn = part.Touched:Connect(...).\n2. Desconectar cuando ya no se use: conn:Disconnect().\n3. Usar Debris:AddItem(instancia, segundos) para objetos temporales como balas o efectos.',
    codeExample: `--!strict
local Debris = game:GetService("Debris")

local function spawnTemporaryBeacon(position: Vector3)
    local part = Instance.new("Part")
    part.Position = position
    part.Anchored = true
    part.Parent = workspace

    local connection: RBXScriptConnection? = nil
    connection = part.Touched:Connect(function(hit)
        print("Tocado!")
    end)

    -- Al destruirse la parte tras 5 segundos, desconectamos explícitamente:
    task.delay(5, function()
        if connection then
            connection:Disconnect()
            connection = nil
        end
        part:Destroy()
    end)
end`,
    placement: 'ServerScriptService o StarterPlayerScripts según la lógica',
  },

  // 13. FÍSICAS DE VEHÍCULOS Y NETWORK OWNERSHIP
  {
    id: 'vehicle-physics',
    category: 'physics',
    title: 'Físicas de Vehículos y Network Ownership sin atascos',
    keywords: [
      'vehiculo',
      'auto',
      'carro',
      'atascado',
      'network owner',
      'assemblylinearvelocity',
      'vectorforce',
      'springconstraint',
      'fisicas',
    ],
    summary:
      'Los vehículos en Roblox suelen trabarse o responder con lag si el servidor y el cliente compiten por la física. La solución fundamental es asignar el Network Ownership de la parte principal (VehicleSeat o PrimaryPart) al jugador que conduce usando :SetNetworkOwner(player).',
    solutionPattern:
      '1. Asegurar que las partes del vehículo NO estén ancladas (Anchored = false) una vez ensambladas.\n2. Unir las partes con WeldConstraint.\n3. Cuando el jugador se siente en el VehicleSeat, ejecutar VehicleSeat:SetNetworkOwner(player) en un ServerScript.\n4. Al bajarse el jugador, llamar a :SetNetworkOwner(nil).',
    codeExample: `--!strict
local vehicleSeat = script.Parent :: VehicleSeat

vehicleSeat:GetPropertyChangedSignal("Occupant"):Connect(function()
    local occupant = vehicleSeat.Occupant
    if occupant then
        local character = occupant.Parent
        local player = game:GetService("Players"):GetPlayerFromCharacter(character)
        if player then
            -- El cliente ahora calcula la física localmente con 0 latencia de input:
            vehicleSeat:SetNetworkOwner(player)
        end
    else
        -- Nadie conduce: el servidor retoma el control físico
        vehicleSeat:SetNetworkOwner(nil)
    end
end)`,
    placement: 'Dentro del VehicleSeat en el modelo del vehículo (Script del servidor)',
  },

  // 14. GUI RESPONSIVA PARA MÓVILES (SCALE VS OFFSET)
  {
    id: 'mobile-gui-scaling',
    category: 'gui',
    title: 'Interfaces Adaptables para Móviles, Tablets y PC (Scale vs Offset)',
    keywords: [
      'movil',
      'interfaz',
      'gui',
      'screengui',
      'pantalla',
      'scale',
      'offset',
      'uiaspectratioconstraint',
      'responsivo',
      'celular',
    ],
    summary:
      'Para que una interfaz no se corte ni quede gigante en teléfonos o pantallas pequeñas, se debe usar la propiedad Scale de UDim2 (relativa al tamaño de la pantalla) en lugar de Offset (píxeles fijos), acompañado de UIAspectRatioConstraint.',
    solutionPattern:
      '1. Diseñar Frames usando UDim2.new(ScaleX, 0, ScaleY, 0) donde 1 representa el 100% de la pantalla.\n2. Usar AnchorPoint = Vector2.new(0.5, 0.5) y Position = UDim2.new(0.5, 0, 0.5, 0) para centrar.\n3. Agregar un UIAspectRatioConstraint al Frame para que conserve sus proporciones en cualquier resolución.',
    codeExample: `--!strict
-- Creación programática de marco centrado adaptable:
local player = game:GetService("Players").LocalPlayer
local playerGui = player:WaitForChild("PlayerGui") :: PlayerGui

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ResponsiveShopGui"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainContainer"
mainFrame.AnchorPoint = Vector2.new(0.5, 0.5)
mainFrame.Position = UDim2.new(0.5, 0, 0.5, 0)
mainFrame.Size = UDim2.new(0.6, 0, 0.7, 0) -- 60% ancho, 70% alto
mainFrame.BackgroundColor3 = Color3.fromRGB(20, 21, 26)
mainFrame.Parent = screenGui

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = mainFrame

local ratio = Instance.new("UIAspectRatioConstraint")
ratio.AspectRatio = 1.33 -- Mantiene proporción 4:3 en cualquier dispositivo
ratio.Parent = mainFrame`,
    placement: 'StarterGui > ScreenGui > Frame con UIAspectRatioConstraint',
  },

  // 15. ROJO Y FLUJO DE TRABAJO PROFESIONAL
  {
    id: 'rojo-workflow',
    category: 'syntax',
    title: 'Estructuración de Proyectos con Rojo y Studio Copilot',
    keywords: [
      'rojo',
      'sincronizacion',
      'vscode',
      'servidor mcp',
      'default.project.json',
      'server.luau',
      'client.luau',
    ],
    summary:
      'Rojo sincroniza archivos de texto plano (.luau) desde tu editor hacia Roblox Studio en tiempo real. Utiliza nombres de archivo con sufijos .server.luau para scripts de servidor, .client.luau para scripts locales, y .luau para ModuleScripts.',
    solutionPattern:
      '1. Archivos en src/server con extensión .server.luau van a ServerScriptService.\n2. Archivos en src/client con extensión .client.luau van a StarterPlayerScripts.\n3. Archivos en src/shared con extensión .luau van a ReplicatedStorage.\n4. Iniciar rojo serve en puerto 34872 y presionar Connect en el plugin de Studio.',
    codeExample: `{
  "name": "MiJuegoRoblox",
  "tree": {
    "$className": "DataModel",
    "ServerScriptService": {
      "$path": "src/server"
    },
    "ReplicatedStorage": {
      "$path": "src/shared"
    },
    "StarterPlayer": {
      "StarterPlayerScripts": {
        "$path": "src/client"
      }
    }
  }
}`,
    placement: 'default.project.json en la raíz de tu proyecto',
  },
];

// RAG Search function to find relevant knowledge based on prompt
export function retrieveRelevantKnowledge(query: string, maxResults: number = 3): KnowledgeSnippet[] {
  const cleanQuery = (query || '').toLowerCase().trim();
  if (!cleanQuery) return [];

  const scored = LUAU_KNOWLEDGE_BASE.map((item) => {
    let score = 0;

    // Check keyword matches
    for (const kw of item.keywords) {
      if (cleanQuery.includes(kw)) {
        score += 4;
      }
    }

    // Check title match
    const titleWords = item.title.toLowerCase().split(' ');
    for (const word of titleWords) {
      if (word.length > 3 && cleanQuery.includes(word)) {
        score += 2;
      }
    }

    // Category match
    if (cleanQuery.includes(item.category)) {
      score += 1;
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.item);
}
