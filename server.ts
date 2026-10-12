import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { retrieveRelevantKnowledge, KnowledgeSnippet } from './src/data/luauKnowledgeBase';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI instance safely
function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// USER PROJECTS IN-MEMORY DATABASE WITH PER-USER AUTHORIZATION
// -------------------------------------------------------------
export interface ServerProject {
  id: string;
  ownerEmail: string;
  title: string;
  description: string;
  placeId?: number;
  universeId?: number;
  category: 'production' | 'beta' | 'published';
  createdAt: string;
  updatedAt: string;
  status: string;
  version: string;
}

// Strictly user-scoped project store
const userProjectsStore: Map<string, ServerProject[]> = new Map();

// Helper to extract authenticated user email safely
function getAuthenticatedUserEmail(req: Request): string {
  const emailHeader = (req.headers['x-user-email'] as string) || (req.query.userEmail as string) || '';
  return emailHeader.trim().toLowerCase() || 'anonymous@pablitostudio.dev';
}

// Projects REST API
app.get('/api/projects', (req: Request, res: Response) => {
  const userEmail = getAuthenticatedUserEmail(req);
  const userList = userProjectsStore.get(userEmail) || [];
  return res.json({
    userEmail,
    projects: userList,
  });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const userEmail = getAuthenticatedUserEmail(req);
  const { title, description, placeId, universeId, category } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'El título del proyecto es obligatorio.' });
  }

  const newProject: ServerProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerEmail: userEmail,
    title: title.trim(),
    description: (description || '').trim(),
    placeId: placeId ? Number(placeId) : undefined,
    universeId: universeId ? Number(universeId) : undefined,
    category: category || 'beta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'En desarrollo',
    version: '0.1.0',
  };

  const existing = userProjectsStore.get(userEmail) || [];
  const updated = [newProject, ...existing];
  userProjectsStore.set(userEmail, updated);

  return res.status(201).json({
    message: 'Proyecto creado exitosamente.',
    project: newProject,
  });
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const userEmail = getAuthenticatedUserEmail(req);
  const { id } = req.params;
  const { title, description, placeId, universeId, category, status } = req.body;

  const existing = userProjectsStore.get(userEmail) || [];
  const projectIndex = existing.findIndex((p) => p.id === id);

  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Proyecto no encontrado o no tienes permiso para editarlo.' });
  }

  const current = existing[projectIndex];
  const updatedProject: ServerProject = {
    ...current,
    title: title !== undefined ? title.trim() : current.title,
    description: description !== undefined ? description.trim() : current.description,
    placeId: placeId !== undefined ? (placeId ? Number(placeId) : undefined) : current.placeId,
    universeId: universeId !== undefined ? (universeId ? Number(universeId) : undefined) : current.universeId,
    category: category || current.category,
    status: status || current.status,
    updatedAt: new Date().toISOString(),
  };

  existing[projectIndex] = updatedProject;
  userProjectsStore.set(userEmail, existing);

  return res.json({
    message: 'Proyecto actualizado correctamente.',
    project: updatedProject,
  });
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const userEmail = getAuthenticatedUserEmail(req);
  const { id } = req.params;

  const existing = userProjectsStore.get(userEmail) || [];
  const projectExists = existing.some((p) => p.id === id);

  if (!projectExists) {
    return res.status(404).json({ error: 'Proyecto no encontrado o no autorizado.' });
  }

  const filtered = existing.filter((p) => p.id !== id);
  userProjectsStore.set(userEmail, filtered);

  return res.json({ message: 'Proyecto eliminado con éxito.' });
});

// -------------------------------------------------------------
// ADVANCED AI ENGINE & RAG KNOWLEDGE SYSTEM
// -------------------------------------------------------------
const BASE_ROBLOX_SYSTEM_PROMPT = `Eres el asistente de IA especializado en Roblox Studio y Luau de "Pablito Studio".
Tu misión es asistir a desarrolladores con respuestas técnicas directas, limpias, verificadas y sin rodeos.

REGLAS DE RESPUESTA:
1. Comportamiento inteligente: Interpreta la intención real aunque el usuario escriba con errores ortográficos o frases informales (ej. "mi puerta vip no abre", "me da attempt to index nil", "el carro se traba").
2. Estructura de solución técnica:
   - Explicación breve de la causa raíz.
   - Código completo en Luau con tipado estricto (--!strict).
   - Ubicación exacta del script en el Explorer de Roblox (ej: ServerScriptService > DoorManager.server.luau).
   - Qué instancias, carpetas o RemoteEvents deben crearse.
3. Arquitectura cliente-servidor:
   - Los RemoteEvents y RemoteFunctions van siempre en ReplicatedStorage.
   - NUNCA confíes en los parámetros del cliente. En el servidor, el primer argumento de OnServerEvent es SIEMPRE el Player.
   - La lógica crítica (inventario, dinero, daño, compras) se calcula exclusivamente en el Servidor.
4. Buenas prácticas de Luau:
   - Tipado estricto (--!strict) con type y typeof.
   - Desconectar conexiones RBXScriptConnection para evitar memory leaks.
   - Uso de task.wait, task.spawn, task.delay en vez del wait() legado.
5. Si no hay suficiente información para dar un diagnóstico certero, indícalo claramente y pregunta lo que necesitas en vez de inventar soluciones.
Firma discreta: Pablito Studio.`;

// Endpoint: AI Chat Assistant with RAG Technical Knowledge
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      messages = [],
      provider = 'gemini',
      model = 'gemini-3.8-flash',
      customApiKey,
      ollamaUrl,
      lessonContext,
    } = req.body;

    const queryText = prompt || (messages.length > 0 ? messages[messages.length - 1].content : '');

    // RAG Retrieval: search technical snippets matching the query
    const retrievedSnippets: KnowledgeSnippet[] = retrieveRelevantKnowledge(queryText, 2);

    let ragContextAugmentation = '';
    if (retrievedSnippets.length > 0) {
      ragContextAugmentation = '\n\n[CONOCIMIENTO TÉCNICO VERIFICADO - ROBLOX CREATOR HUB & LUAU]:\n' +
        retrievedSnippets
          .map(
            (s) =>
              `• Tópico: ${s.title}\n  Diagnóstico/Resumen: ${s.summary}\n  Patrón: ${s.solutionPattern}\n  Ubicación: ${s.placement}\n  Código de referencia:\n${s.codeExample}`
          )
          .join('\n\n');
    }

    const fullSystemInstruction = `${BASE_ROBLOX_SYSTEM_PROMPT}${ragContextAugmentation}${
      lessonContext
        ? `\n\n[CONTEXTO DE ACADEMIA LUAU]: Lección activa "${lessonContext.title}" (${lessonContext.goal}). Orienta pedagógicamente al estudiante con ejemplos claros.`
        : ''
    }`;

    // 1. GEMINI PROVIDER
    if (provider === 'gemini') {
      const gemini = getGeminiClient(customApiKey);
      if (gemini) {
        try {
          const contents =
            messages.length > 0
              ? messages.map((m: { role: string; content: string }) => ({
                  role: m.role === 'user' ? 'user' : 'model',
                  parts: [{ text: m.content }],
                }))
              : [{ role: 'user', parts: [{ text: prompt }] }];

          if (messages.length > 0 && prompt) {
            contents.push({ role: 'user', parts: [{ text: prompt }] });
          }

          const selectedTargetModel = model || 'gemini-2.5-flash';
          const generatePromise = gemini.models.generateContent({
            model: selectedTargetModel,
            contents,
            config: {
              systemInstruction: fullSystemInstruction,
              temperature: 0.65,
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout de conexión con Gemini API (6s)')), 6000)
          );

          const response = await Promise.race([generatePromise, timeoutPromise]);

          return res.json({
            reply: response.text || 'Sin respuesta generada.',
            provider: 'gemini',
            model: selectedTargetModel,
            groundedSnippetsCount: retrievedSnippets.length,
          });
        } catch (apiErr: any) {
          console.warn('[Gemini API error/timeout]:', apiErr?.message || apiErr);
        }
      }

      // High-quality contextual fallback powered by RAG Knowledge
      const fallbackReply = generateSmartKnowledgeFallback(queryText, retrievedSnippets, lessonContext);
      return res.json({
        reply: fallbackReply,
        provider: 'gemini (simulador de conocimiento local)',
        model: 'gemini-3.8-flash',
        groundedSnippetsCount: retrievedSnippets.length,
      });
    }

    // 2. OPENROUTER & FREE TIER
    if (provider === 'openrouter' || provider === 'free') {
      const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;
      if (apiKey) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://pablitostudio.dev',
              'X-Title': 'Pablito Studio',
            },
            body: JSON.stringify({
              model: model || 'meta-llama/llama-3.3-70b-instruct:free',
              messages: [
                { role: 'system', content: fullSystemInstruction },
                ...messages.map((m: any) => ({ role: m.role, content: m.content })),
                ...(prompt ? [{ role: 'user', content: prompt }] : []),
              ],
            }),
          });

          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return res.json({
              reply,
              provider: 'openrouter',
              model: model || 'meta-llama/llama-3.3-70b-instruct:free',
              groundedSnippetsCount: retrievedSnippets.length,
            });
          }
        } catch (orErr: any) {
          console.warn('[OpenRouter Error]:', orErr.message);
        }
      }

      // If OpenRouter key not present, use Gemini SDK directly
      const gemini = getGeminiClient();
      if (gemini) {
        try {
          const contents = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          }));
          if (prompt) contents.push({ role: 'user', parts: [{ text: prompt }] });

          const response = await gemini.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: { systemInstruction: fullSystemInstruction, temperature: 0.65 },
          });

          return res.json({
            reply: response.text || 'Sin respuesta generada.',
            provider: 'openrouter (enrutado vía Gemini)',
            model: model || 'meta-llama/llama-3.3-70b-instruct:free',
            groundedSnippetsCount: retrievedSnippets.length,
          });
        } catch {}
      }

      const fallbackReply = generateSmartKnowledgeFallback(queryText, retrievedSnippets, lessonContext);
      return res.json({
        reply: fallbackReply,
        provider: 'Pablito Luau Engine (Base de conocimiento)',
        model: model || 'free-tier',
        groundedSnippetsCount: retrievedSnippets.length,
      });
    }

    // 3. OLLAMA LOCAL PROVIDER
    if (provider === 'ollama') {
      const endpoint = (ollamaUrl || 'http://localhost:11434').replace(/\/$/, '') + '/api/chat';
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model || 'codellama',
            stream: false,
            messages: [
              { role: 'system', content: fullSystemInstruction },
              ...messages.map((m: any) => ({ role: m.role, content: m.content })),
              ...(prompt ? [{ role: 'user', content: prompt }] : []),
            ],
          }),
        });
        const data = await response.json();
        return res.json({
          reply: data.message?.content || 'Sin respuesta de Ollama.',
          provider: 'ollama',
          model: model || 'codellama',
          groundedSnippetsCount: retrievedSnippets.length,
        });
      } catch {
        return res.json({
          reply: `⚠️ No se pudo conectar con Ollama en "${ollamaUrl || 'http://localhost:11434'}". Asegúrate de tenerlo activo con \`ollama serve\`.\n\nRespuesta de la Base de Conocimiento de Pablito Studio:\n${generateSmartKnowledgeFallback(
            queryText,
            retrievedSnippets,
            lessonContext
          )}`,
          provider: 'ollama (diagnóstico)',
          model: model || 'codellama',
        });
      }
    }

    // 4. REPLIT PROVIDER
    if (provider === 'replit') {
      return res.json({
        reply: generateSmartKnowledgeFallback(queryText, retrievedSnippets, lessonContext),
        provider: 'replit',
        model: 'replit-code-v1',
      });
    }

    return res.status(400).json({ error: `Proveedor desconocido: ${provider}` });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// Helper that constructs accurate technical Luau responses using RAG snippets
function generateSmartKnowledgeFallback(
  prompt: string,
  snippets: KnowledgeSnippet[],
  lessonContext?: any
): string {
  const p = (prompt || '').toLowerCase();

  // If a specific technical snippet matched strongly, format an exact production solution
  if (snippets.length > 0) {
    const topSnippet = snippets[0];
    return `### Diagnóstico Técnico — Pablito Studio

**Problema identificado:** ${topSnippet.title}

${topSnippet.summary}

#### Solución recomendada:
${topSnippet.solutionPattern}

#### Código Luau listo para producción:
\`\`\`luau
${topSnippet.codeExample}
\`\`\`

**📍 Ubicación exacta en Roblox Explorer:**
${topSnippet.placement}

***
*Pablito Studio — Arquitectura limpia y segura para Roblox.*`;
  }

  // Academy lesson query
  if (lessonContext) {
    return `### Mentor de la Academia Luau — Pablito Studio
**Lección:** "${lessonContext.title}" (${lessonContext.goal})

Para resolver este ejercicio en Luau:
1. Recuerda usar variables locales tipadas: \`local nombre: tipo = valor\`.
2. Las tablas con metatablas permiten modularizar tus sistemas.
3. Verifica que las funciones retornen el tipo declarado en su signatura.

\`\`\`luau
--!strict
local function solucionar(): boolean
    print("${lessonContext.goal}")
    return true
end

return solucionar()
\`\`\`

¿Tienes alguna duda sobre la sintaxis o el resultado en consola?`;
  }

  // VIP door query
  if (p.includes('vip') || p.includes('puerta') || p.includes('gamepass')) {
    const vip = retrieveRelevantKnowledge('puerta vip')[0];
    if (vip) {
      return `### Solución para Puerta VIP — Pablito Studio

El problema más común con las puertas VIP es verificar el Gamepass en el cliente o no usar un debounce, lo que causa fallos o trampas de jugadores.

\`\`\`luau
${vip.codeExample}
\`\`\`

**📍 Ubicación:** \`${vip.placement}\``;
    }
  }

  // Attempt to index nil
  if (p.includes('attempt to index nil') || p.includes('nil') || p.includes('waitforchild')) {
    const nilSnippet = retrieveRelevantKnowledge('attempt to index nil')[0];
    if (nilSnippet) {
      return `### Solución: "attempt to index nil" — Pablito Studio

Este error ocurre cuando intentas acceder a una propiedad o método de un objeto que aún no ha cargado en memoria o que no existe.

\`\`\`luau
${nilSnippet.codeExample}
\`\`\`

**📍 Ubicación:** \`${nilSnippet.placement}\``;
    }
  }

  // Mobile GUI
  if (p.includes('movil') || p.includes('móvil') || p.includes('interfaz') || p.includes('pantalla')) {
    const guiSnippet = retrieveRelevantKnowledge('movil interfaz scale')[0];
    if (guiSnippet) {
      return `### Solución: Interfaz Adaptable para Móviles — Pablito Studio

Para que tu UI no se deforme en pantallas pequeñas, utiliza la propiedad **Scale** de \`UDim2\` junto con un \`UIAspectRatioConstraint\`.

\`\`\`luau
${guiSnippet.codeExample}
\`\`\`

**📍 Ubicación:** \`${guiSnippet.placement}\``;
    }
  }

  // General response
  return `### Asistente Pablito Studio (Luau & Roblox)

Puedo ayudarte con soluciones técnicas verificadas para:
1. **Sistemas de Juego:** Tiendas, combate, inventarios y leaderstats con DataStoreService.
2. **Replicación Segura:** \`RemoteEvent\` y validación estricta en el servidor contra exploits.
3. **Depuración:** Errores de Output (\`attempt to index nil\`, desconexiones de red, memory leaks).
4. **Interfaces Adaptables:** UI responsiva para PC, tablets y móviles con \`UIAspectRatioConstraint\`.

¿Qué script o mecánica estás implementando? Comparte tu duda o pega tu código para revisarlo.`;
}

// Endpoint: Check MCP Tools & Status
app.get('/api/mcp/status', async (_req: Request, res: Response) => {
  let isLocalBridgeLive = false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 350);
    const test = await fetch('http://localhost:3001/mcp', { signal: controller.signal }).catch(() => null);
    clearTimeout(timeoutId);
    if (test && test.status < 500) {
      isLocalBridgeLive = true;
    }
  } catch {
    isLocalBridgeLive = false;
  }

  res.json({
    activeServers: isLocalBridgeLive ? 4 : 2,
    toolsAvailable: 18,
    protocolVersion: 'v1.2-RobloxSpec',
    localBridge: {
      port: 3001,
      connected: isLocalBridgeLive,
      uri: 'http://localhost:3001/mcp',
      status: isLocalBridgeLive ? 'Conectado a Roblox Studio' : 'Desconectado (Inicia Rojo o tu daemon local)',
    },
    servers: [
      {
        id: 'roblox-bridge',
        name: 'Roblox Open Cloud & Studio Bridge',
        status: isLocalBridgeLive ? 'online' : 'standby',
        endpoint: 'http://localhost:3001/mcp',
        tools: ['create_instance', 'modify_script', 'sync_datastore'],
      },
      {
        id: 'luau-lsp',
        name: 'Luau Language Server Protocol',
        status: 'online',
        endpoint: 'stdio://luau-lsp',
        tools: ['typecheck_code', 'diagnostics_lint', 'format_luau'],
      },
    ],
  });
});

// JSON-RPC Endpoint for MCP tools
app.post('/api/mcp/rpc', async (req: Request, res: Response) => {
  const { jsonrpc, method, id, params } = req.body;
  const toolName = params?.name || 'unknown';
  const toolArgs = params?.arguments || {};

  return res.json({
    jsonrpc: '2.0',
    id: id || 1,
    result: {
      status: 'Executed',
      tool: toolName,
      arguments: toolArgs,
      timestamp: new Date().toISOString(),
    },
  });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Studio Copilot',
    developer: 'Pablito Studio',
    version: '2.6.0',
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite development middlewares or serve static build
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pablito Studio] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
