// Lua/Luau execution engine for Studio Copilot Academia
// Combines real Fengari Lua 5.3 engine with a resilient in-browser sandbox runner

export interface RunResult {
  out: string[];
  err?: string;
}

declare global {
  interface Window {
    fengari?: any;
  }
}

export function hasFengari(): boolean {
  return typeof window !== 'undefined' && !!window.fengari && !!window.fengari.lua;
}

export function runLuaWithFengari(code: string): RunResult {
  const { lua, lauxlib, lualib, to_luastring: ts, to_jsstring: js } = window.fengari;

  // Infinite loop protection
  if (/while\s+true\s+do/.test(code) && !/break|return/.test(code)) {
    return { out: [], err: 'Posible bucle infinito detectado: falta un break o condición de parada.' };
  }

  try {
    const l = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(l);

    const out: string[] = [];
    let err: string | undefined;

    // Harness script collecting print outputs safely
    const pre = `
__o = {}
print = function(...)
  local t = {}
  for i = 1, select("#", ...) do
    t[#t + 1] = tostring((select(i, ...)))
  end
  __o[#__o + 1] = table.concat(t, "\\t")
end
os = nil io = nil debug = nil package = nil require = nil dofile = nil loadfile = nil
`;

    const status = lauxlib.luaL_dostring(l, ts(pre + '\n' + code));
    if (status !== 0) {
      const rawErr = js(lua.lua_tostring(l, -1));
      err = rawErr.replace(/\[string "[\s\S]*?"\]:(\d+):/, (_m: string, n: string) => `Línea ${parseInt(n, 10) - 1}:`);
    }

    lua.lua_getglobal(l, ts('__o'));
    if (lua.lua_istable(l, -1)) {
      const len = lua.lua_rawlen(l, -1);
      for (let i = 1; i <= len; i++) {
        lua.lua_rawgeti(l, -1, i);
        out.push(js(lua.lua_tostring(l, -1)));
        lua.lua_pop(l, 1);
      }
    }

    return { out, err };
  } catch (e: any) {
    return { out: [], err: e?.message || 'Error en ejecución de Fengari' };
  }
}

// Strip single line comments --
function stripComment(line: string): string {
  let inQuote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuote) {
      if (char === inQuote && line[i - 1] !== '\\') inQuote = null;
    } else {
      if (char === '"' || char === "'") {
        inQuote = char;
      } else if (char === '-' && line[i + 1] === '-') {
        return line.slice(0, i);
      }
    }
  }
  return line;
}

// Resilient in-browser Lua/Luau simulator for standalone operation
export function runLuaSimulation(code: string): RunResult {
  const out: string[] = [];
  const lines = code.split('\n');

  // Fast evaluation helper
  try {
    // Check for obvious syntax typos
    for (let idx = 0; idx < lines.length; idx++) {
      const raw = lines[idx];
      const stripped = stripComment(raw).trim();
      const lineNum = idx + 1;
      if (!stripped) continue;

      if (stripped.startsWith('prnt(')) {
        return { out: [], err: `Línea ${lineNum}: attempt to call a nil value (global 'prnt')` };
      }
      if (stripped.startsWith('print(') && !stripped.endsWith(')')) {
        return { out: [], err: `Línea ${lineNum}: falta cerrar el paréntesis ")"` };
      }
      if (stripped.includes('string.') && !stripped.startsWith('print(') && !stripped.includes('=')) {
        // e.g. syntax check
      }
    }

    // Execute through JavaScript JS scope simulation
    const jsTranspiled: string[] = [
      'const __out = [];',
      'const print = (...args) => { __out.push(args.map(a => a === undefined ? "nil" : String(a)).join("\\t")); };',
      'const type = (x) => { if (x === null || x === undefined) return "nil"; if (typeof x === "number") return "number"; if (typeof x === "string") return "string"; if (typeof x === "boolean") return "boolean"; if (Array.isArray(x) || typeof x === "object") return "table"; if (typeof x === "function") return "function"; return typeof x; };',
      'const typeof_luau = type;',
      'const pcall = (fn, ...args) => { try { return [true, fn(...args)]; } catch(e) { return [false, e.message || String(e)]; } };',
      'const error = (msg) => { throw new Error(msg); };',
      'const string = { upper: (s) => String(s).toUpperCase(), sub: (s, i, j) => String(s).slice((i||1)-1, j !== undefined ? j : String(s).length), format: (fmt, ...args) => { let idx = 0; return fmt.replace(/%[ds]/g, () => String(args[idx++])); } };',
      'const table = { insert: (t, v) => { if (Array.isArray(t)) t.push(v); else t[Object.keys(t).length + 1] = v; return t; } };',
      'const ipairs = (t) => { if (!Array.isArray(t)) t = Object.values(t); return t.map((v, i) => [i + 1, v]); };',
      'const pairs = (t) => Object.entries(t);',
    ];

    // Transpile common Lua patterns line by line
    let indent = '';
    for (let i = 0; i < lines.length; i++) {
      let l = stripComment(lines[i]).trim();
      if (!l) continue;

      // Convert --!strict header
      if (l.startsWith('--!')) continue;

      // Replace Lua operators
      // Convert Lua table syntax { a = 1 } or { "a", "b" }
      // Convert Lua concatenation ..
      l = l.replace(/(\w+)\s*:\s*([A-Za-z0-9_]+)\b/g, '$1'); // Strip Luau type annotations like `vidas: number` -> `vidas`

      // Convert table len #
      l = l.replace(/#([A-Za-z0-9_]+)/g, '($1.length || Object.keys($1).length)');

      // Convert .. to string concat
      l = l.replace(/\s*\.\.\s*/g, ' + ');

      // Convert ~= to !=
      l = l.replace(/~=/g, '!=');

      // Convert 'and', 'or', 'not'
      l = l.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');

      // Convert 'local function name(args)'
      const fnMatch = l.match(/^(?:local\s+)?function\s+([A-Za-z0-9_]+)\s*\((.*?)\)/);
      if (fnMatch) {
        jsTranspiled.push(`function ${fnMatch[1]}(${fnMatch[2]}) {`);
        indent += '  ';
        continue;
      }

      // Convert 'return function(args)'
      const retFnMatch = l.match(/^return\s+function\s*\((.*?)\)/);
      if (retFnMatch) {
        jsTranspiled.push(`return function(${retFnMatch[1]}) {`);
        indent += '  ';
        continue;
      }

      // Convert 'for i = a, b, step do'
      const forNumMatch = l.match(/^for\s+([A-Za-z0-9_]+)\s*=\s*([^,]+),\s*([^,]+)(?:,\s*([^,]+))?\s+do$/);
      if (forNumMatch) {
        const v = forNumMatch[1];
        const start = forNumMatch[2];
        const end = forNumMatch[3];
        const step = forNumMatch[4] || '1';
        if (step.includes('-')) {
          jsTranspiled.push(`for (let ${v} = ${start}; ${v} >= ${end}; ${v} += (${step})) {`);
        } else {
          jsTranspiled.push(`for (let ${v} = ${start}; ${v} <= ${end}; ${v} += (${step})) {`);
        }
        indent += '  ';
        continue;
      }

      // Convert 'for i, v in ipairs(t) do'
      const forIpairsMatch = l.match(/^for\s+([A-Za-z0-9_]+),\s*([A-Za-z0-9_]+)\s+in\s+ipairs\((.*?)\)\s+do$/);
      if (forIpairsMatch) {
        const ivar = forIpairsMatch[1];
        const vvar = forIpairsMatch[2];
        const arr = forIpairsMatch[3];
        jsTranspiled.push(`for (let [${ivar}, ${vvar}] of ipairs(${arr})) {`);
        indent += '  ';
        continue;
      }

      // Convert 'while cond do'
      const whileMatch = l.match(/^while\s+(.*?)\s+do$/);
      if (whileMatch) {
        jsTranspiled.push(`while (${whileMatch[1]}) {`);
        indent += '  ';
        continue;
      }

      // Convert 'if cond then'
      const ifMatch = l.match(/^if\s+(.*?)\s+then$/);
      if (ifMatch) {
        jsTranspiled.push(`if (${ifMatch[1]}) {`);
        indent += '  ';
        continue;
      }

      // Convert 'elseif cond then'
      const elseifMatch = l.match(/^elseif\s+(.*?)\s+then$/);
      if (elseifMatch) {
        jsTranspiled.push(`} else if (${elseifMatch[1]}) {`);
        continue;
      }

      // Convert 'else'
      if (l === 'else') {
        jsTranspiled.push(`} else {`);
        continue;
      }

      // Convert 'end'
      if (l === 'end' || l.endsWith('end')) {
        jsTranspiled.push(`}`);
        indent = indent.slice(2);
        continue;
      }

      // Convert 'local var = val'
      if (l.startsWith('local ')) {
        const rest = l.slice(6);
        // Table literals like `{ a = 1 }`
        let sanitized = rest.replace(/\{\s*([A-Za-z0-9_]+)\s*=/g, '{ $1:');
        jsTranspiled.push(`let ${sanitized};`);
        continue;
      }

      // Single line if ... then ... else ... end
      const inlineIf = l.match(/^if\s+(.*?)\s+then\s+(.*?)(?:\s+else\s+(.*?))?\s+end$/);
      if (inlineIf) {
        const cond = inlineIf[1];
        const thenBranch = inlineIf[2];
        const elseBranch = inlineIf[3];
        if (elseBranch) {
          jsTranspiled.push(`if (${cond}) { ${thenBranch}; } else { ${elseBranch}; }`);
        } else {
          jsTranspiled.push(`if (${cond}) { ${thenBranch}; }`);
        }
        continue;
      }

      // Standalone expressions
      jsTranspiled.push(`${l};`);
    }

    jsTranspiled.push('return __out;');

    // Evaluate
    const execFn = new Function(jsTranspiled.join('\n'));
    const resultOut = execFn();
    return { out: Array.isArray(resultOut) ? resultOut : [] };
  } catch (err: any) {
    return { out, err: err?.message || String(err) };
  }
}

// Master execution selector
export function executeLuau(code: string): RunResult {
  if (hasFengari()) {
    try {
      const res = runLuaWithFengari(code);
      if (!res.err) return res;
      // If Fengari had syntax error, let's also check simulator or return Fengari error
      return res;
    } catch {
      return runLuaSimulation(code);
    }
  }
  return runLuaSimulation(code);
}
