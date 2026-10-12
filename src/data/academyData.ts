// Complete syllabus, exercises, challenges, exams and mascot data for Studio Copilot Academia
// Developed by Pablito Studios

import { Lesson, ProjectLesson, Exercise, CodeExercise, MultipleChoiceExercise, ExamItem } from '../types';

export const LEVELS_DICT: Record<number, string> = {
  1: 'Nivel 1 · Primeros pasos',
  2: 'Nivel 2 · Variables y datos',
  3: 'Nivel 3 · Decisiones',
  4: 'Nivel 4 · Bucles',
  5: 'Nivel 5 · Funciones',
  6: 'Nivel 6 · Tablas',
  7: 'Nivel 7 · Lua intermedio',
  8: 'Roblox · Fundamentos de Studio',
};

export const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'Qué es programar, print, comentarios y cómo leer errores en Output.',
  2: 'Guardar datos en variables locales y conocer sus tipos primitivos.',
  3: 'Hacer que el programa tome decisiones con if, elseif y operadores lógicos.',
  4: 'Repetir tareas automáticamente con bucles for y while.',
  5: 'Crear funciones reutilizables con parámetros y sentencias return.',
  6: 'Organizar colecciones de datos en listas indexadas y diccionarios con ipairs.',
  7: 'Manejo seguro de errores con pcall, funciones closure y utilidades string.',
  8: 'Tus primeros pasos en Roblox Studio: Explorer, Services, Instances, Eventos y RemoteEvents seguros.',
};

export const REVIEW_INTERVALS = [1, 3, 7, 16, 35];

const C = (
  id: string,
  q: string,
  start: string,
  out: string[],
  hints: string[],
  sol: string,
  xp: number,
  c: string,
  o: { re?: string; test?: string; ch?: number } = {}
): CodeExercise => ({
  id,
  t: 'code',
  q,
  start,
  out,
  hints,
  sol,
  xp,
  c,
  ...o,
});

const M = (
  id: string,
  q: string,
  opts: string[],
  ans: number,
  why: string,
  c: string
): MultipleChoiceExercise => ({
  id,
  t: 'mc',
  q,
  opts,
  ans,
  why,
  xp: 5,
  c,
});

const R = (id: string, q: string, opts: string[], ans: number, why: string): MultipleChoiceExercise =>
  M(id, q, opts, ans, why, 'roblox');

export const LESSONS_DATA: Lesson[] = [
  {
    id: 'l1',
    lv: 1,
    title: 'Tu primer programa',
    goal: 'Mostrar un mensaje con print()',
    explain: 'Un <b>script</b> es una lista de instrucciones que se ejecutan de arriba abajo. <code>print()</code> escribe en la ventana <b>Output</b>. El texto va entre comillas.',
    code: 'print("Hola, mundo")',
    why: 'print es la instrucción; los paréntesis contienen lo que se muestra.',
    def: 'Un script es un archivo con instrucciones que la computadora sigue una por una, de arriba hacia abajo. print() es la instrucción que escribe un mensaje para que lo veas.',
    ex: [
      C('l1a', 'Muestra exactamente: Hola, Roblox', '-- escribe aquí\n', ['Hola, Roblox'], ['Usa print.', 'El texto va entre comillas dobles.', 'print("Hola, Roblox")'], 'print("Hola, Roblox")', 10, 'print'),
      M('l1b', '¿Qué muestra print(2 + 3)?', ['2 + 3', '5', '23', 'Error'], 1, 'Luau calcula la suma antes de imprimir.', 'operadores'),
    ],
  },
  {
    id: 'l2',
    lv: 1,
    title: 'Texto y números',
    goal: 'Distinguir texto de números',
    explain: 'El texto va entre comillas y se muestra tal cual. Los números van sin comillas y se calculan con <code>+ - *</code>. <code>%</code> da el resto de una división (7 % 2 vale 1) y sirve para saber si un número es par. Con <code>print(\'a\', 1)</code> puedes mostrar varios valores separados por comas.',
    code: 'print("7 * 6")\nprint(7 * 6)',
    why: 'La primera línea muestra el texto 7 * 6; la segunda calcula 42.',
    def: 'Un texto (string) son letras entre comillas. Un número no lleva comillas y se puede calcular.',
    ex: [
      C('l2a', 'Haz que el programa calcule 12 por 3 y muestre el resultado.', 'print()', ['36'], ['Dentro de print va la operación, sin comillas.', 'El símbolo de multiplicar es *.', 'print(12 * 3)'], 'print(12 * 3)', 10, 'numeros', { re: '12\\s*\\*\\s*3' }),
      M('l2b', '¿Qué muestra print("5 + 5")?', ['10', '5 + 5', 'Error', '55'], 1, 'Entre comillas es texto: no se calcula.', 'strings'),
    ],
  },
  {
    id: 'l3',
    lv: 1,
    title: 'Comentarios',
    goal: 'Dejar notas que Luau ignora',
    explain: 'Una línea que empieza con <code>--</code> es un <b>comentario</b>: se ignora. Sirve para explicar código o desactivar una línea.',
    code: '-- Una nota\nprint("Se ve")',
    why: 'Solo la segunda línea se ejecuta.',
    def: 'Un comentario es una nota para personas. La computadora la ignora.',
    ex: [
      C('l3a', 'Activa la línea desactivada para que se muestre "Activo".', '-- print("Activo")', ['Activo'], ['Un comentario desactiva la línea.', 'Quita los dos guiones.', 'print("Activo")'], 'print("Activo")', 10, 'comentarios'),
      M('l3b', '¿Con qué símbolo empieza un comentario de una línea?', ['//', '#', '--', '/*'], 2, 'En Luau se usa --.', 'comentarios'),
    ],
  },
  {
    id: 'l4',
    lv: 1,
    title: 'Leer errores',
    goal: 'Entender un error sencillo',
    explain: 'Output muestra el error y su línea. <code>attempt to call a nil value (global \'prnt\')</code> significa que llamaste a una función que no existe.',
    code: 'prnt("Hola")  --> error',
    why: 'Los errores de escritura son los más comunes.',
    def: 'Un error es un aviso de que algo no se pudo ejecutar. Dice qué pasó y en qué línea.',
    ex: [
      C('l4a', 'Corrige el error para que se muestre "Hola".', 'prnt("Hola")', ['Hola'], ['Lee el error: esa función no existe.', 'Revisa cómo se escribe print.', 'print("Hola")'], 'print("Hola")', 10, 'errores'),
      C('l4b', 'Corrige el error para que se muestre "Listo".', 'print("Listo"', ['Listo'], ['Falta algo al final.', 'Cada ( necesita su ).', 'print("Listo")'], 'print("Listo")', 10, 'errores'),
      M('l4c', '"attempt to call a nil value (global \'prnt\')" significa:', ['Número muy grande', 'Llamaste a una función que no existe', 'Falta una comilla', 'Script vacío'], 1, 'nil significa \'nada\': prnt no está definida.', 'errores'),
    ],
  },
  {
    id: 'l5',
    lv: 2,
    title: 'Crear variables',
    goal: 'Guardar valores con local',
    explain: 'Una <b>variable</b> es una caja con nombre que guarda un valor: <code>local monedas = 50</code>. Úsala escribiendo su nombre.',
    code: 'local monedas = 50\nprint(monedas)',
    why: 'local crea la variable; = le asigna el valor.',
    def: 'Una variable es una caja con nombre donde guardas un valor para usarlo después. local la crea.',
    ex: [
      C('l5a', 'Crea una variable local llamada vidas con valor 3 y muéstrala.', '', ['3'], ['Empieza con la palabra local.', 'local vidas = 3', 'local vidas = 3\nprint(vidas)'], 'local vidas = 3\nprint(vidas)', 10, 'variables', { re: 'local\\s+vidas\\s*=\\s*3' }),
      M('l5b', '¿Qué muestra? local x = 5  x = x + 2  print(x)', ['5', '2', '7', 'Error'], 2, 'x se actualiza a 7.', 'variables'),
    ],
  },
  {
    id: 'l6',
    lv: 2,
    title: 'Modificar y unir texto',
    goal: 'Cambiar valores y concatenar con ..',
    explain: 'Puedes cambiar una variable: <code>puntos = puntos + 5</code>. Para unir textos se usa <code>..</code>, no +.',
    code: 'local n = "Ana"\nprint("Hola " .. n)',
    why: '.. une texto con texto o números.',
    def: 'Reasignar es meter un valor nuevo en la misma caja. Concatenar es pegar textos usando ..',
    ex: [
      C('l6a', 'Suma 5 puntos a la variable antes de mostrarla (debe verse 15).', 'local puntos = 10\nprint(puntos)', ['15'], ['Falta una línea antes del print.', 'Reasigna usando la misma variable.', 'puntos = puntos + 5'], 'local puntos = 10\npuntos = puntos + 5\nprint(puntos)', 10, 'variables', { re: 'puntos\\s*=\\s*puntos\\s*\\+\\s*5' }),
      C('l6b', 'Corrige el error para que se muestre "Hola Ana".', 'local nombre = "Ana"\nprint("Hola " + nombre)', ['Hola Ana'], ['Lee el error: arithmetic on a string.', 'Para unir texto no se usa +.', 'print("Hola " .. nombre)'], 'local nombre = "Ana"\nprint("Hola " .. nombre)', 10, 'concatenacion'),
    ],
  },
  {
    id: 'l7',
    lv: 2,
    title: 'Tipos de datos',
    goal: 'Saber qué tipo es cada valor',
    explain: 'Los valores tienen tipo: <b>number</b>, <b>string</b>, <b>boolean</b> (true/false) y <b>nil</b>. <code>type(x)</code> lo muestra.',
    code: 'print(type(10))\nprint(type("10"))',
    why: 'Se muestra number y luego string.',
    def: 'El tipo de un valor dice qué clase de dato es: number (número), string (texto), boolean (verdadero o falso) o nil (nada).',
    ex: [
      C('l7a', 'Muestra el tipo de la variable edad.', 'local edad = 12\n', ['number'], ['Usa type().', 'Dentro de type va la variable.', 'print(type(edad))'], 'local edad = 12\nprint(type(edad))', 10, 'tipos', { re: 'type\\s*\\(\\s*edad' }),
      M('l7b', '¿Qué tipo es "5"?', ['number', 'string', 'boolean', 'nil'], 1, 'Va entre comillas: es texto.', 'tipos'),
    ],
  },
  {
    id: 'l8',
    lv: 3,
    title: 'if, elseif y else',
    goal: 'Tomar decisiones',
    explain: '<code>if condicion then ... else ... end</code> ejecuta código solo si la condición es verdadera. <code>elseif</code> añade otra pregunta antes del else. Comparaciones: <code>== ~= < > <= >=</code>.',
    code: 'local hp = 0\nif hp > 0 then print("Vivo") else print("Fin") end',
    why: 'hp > 0 es falso, así que se ejecuta el else.',
    def: 'Una condición es una pregunta que se responde con verdadero o falso. if decide qué código se ejecuta según la respuesta.',
    ex: [
      C('l8a', 'Si puntos es 60 o más, muestra "Aprobado"; si no, "Reprobado".', 'local puntos = 75\n', ['Aprobado'], ['Necesitas if ... then ... else ... end.', 'La condición es puntos >= 60.', 'if puntos >= 60 then print("Aprobado") else print("Reprobado") end'], 'local puntos = 75\nif puntos >= 60 then print("Aprobado") else print("Reprobado") end', 15, 'if', { re: '\\bif\\b' }),
      M('l8b', '¿Qué operador significa \'distinto de\' en Luau?', ['!=', '<>', '~=', '=/='], 2, 'En Luau es ~=.', 'comparaciones'),
    ],
  },
  {
    id: 'l9',
    lv: 3,
    title: 'and, or y not',
    goal: 'Combinar condiciones',
    explain: '<code>and</code> exige que ambas sean verdaderas, <code>or</code> que alguna lo sea, <code>not</code> invierte el valor.',
    code: 'print(true and false)\nprint(true or false)',
    why: 'Se muestra false y luego true.',
    def: 'Los operadores lógicos combinan preguntas: and (se cumplen las dos), or (se cumple alguna) y not (lo contrario).',
    ex: [
      C('l9a', 'Muestra "Entra" solo si nivel es 5 o más Y tieneLlave es true.', 'local nivel = 10\nlocal tieneLlave = true\n', ['Entra'], ['Usa if con and.', 'if nivel >= 5 and tieneLlave then', 'if nivel >= 5 and tieneLlave then print("Entra") end'], 'local nivel = 10\nlocal tieneLlave = true\nif nivel >= 5 and tieneLlave then print("Entra") end', 15, 'logica', { re: '\\band\\b' }),
      M('l9b', '¿Qué muestra print(not true)?', ['true', 'false', 'nil', 'Error'], 1, 'not invierte true.', 'logica'),
    ],
  },
  {
    id: 'l10',
    lv: 4,
    title: 'Bucle for',
    goal: 'Repetir un número de veces',
    explain: '<code>for i = 1, 5 do ... end</code> repite el bloque con i valiendo 1, 2, 3, 4 y 5. Un tercer número es el <b>paso</b>: <code>for i = 2, 10, 2</code> va de 2 en 2.',
    code: 'for i = 1, 3 do\n  print(i)\nend',
    why: 'Se muestra 1, 2 y 3, uno por línea.',
    def: 'Un bucle for repite instrucciones una cantidad de veces que ya conoces.',
    ex: [
      C('l10a', 'Muestra los números del 1 al 5, uno por línea.', '', ['1', '2', '3', '4', '5'], ['Usa un for.', 'for i = 1, 5 do', 'for i = 1, 5 do\n  print(i)\nend'], 'for i = 1, 5 do\n  print(i)\nend', 15, 'for', { re: '\\bfor\\b' }),
      M('l10b', '¿Cuántas veces se ejecuta for i = 1, 4 do?', ['3', '4', '5', 'Infinitas'], 1, 'Va de 1 a 4 inclusive.', 'for'),
    ],
  },
  {
    id: 'l11',
    lv: 4,
    title: 'while y bucles infinitos',
    goal: 'Repetir mientras se cumpla algo',
    explain: '<code>while condicion do ... end</code> repite mientras la condición sea verdadera. Si nunca deja de serlo, el bucle es infinito: asegúrate de cambiar la variable.',
    code: 'local n = 3\nwhile n > 0 do\n  print(n)\n  n = n - 1\nend',
    why: 'n baja en cada vuelta y el bucle termina.',
    def: 'Un bucle while repite instrucciones mientras una condición siga siendo verdadera.',
    ex: [
      C('l11a', 'Cuenta regresiva: muestra 3, 2 y 1 usando while.', 'local n = 3\n', ['3', '2', '1'], ['Repite mientras n > 0.', 'Dentro del bucle, resta 1 a n.', 'while n > 0 do\n  print(n)\n  n = n - 1\nend'], 'local n = 3\nwhile n > 0 do\n  print(n)\n  n = n - 1\nend', 15, 'while', { re: '\\bwhile\\b' }),
      M('l11b', '¿Qué falla en: local n = 1  while n > 0 do print(n) end?', ['Nada', 'n nunca cambia: bucle infinito', 'Falta un for', 'print no existe'], 1, 'Sin modificar n la condición siempre es verdadera.', 'while'),
    ],
  },
  {
    id: 'l12',
    lv: 5,
    title: 'Crear funciones',
    goal: 'Reutilizar código con parámetros y return',
    explain: 'Una <b>función</b> agrupa instrucciones. Recibe <b>parámetros</b> y devuelve un valor con <code>return</code>.',
    code: 'local function doble(n)\n  return n * 2\nend\nprint(doble(4))',
    why: 'doble(4) devuelve 8.',
    def: 'Una función es una receta con nombre: recibe ingredientes (parámetros) y entrega un resultado (return).',
    ex: [
      C('l12a', 'Crea la función suma(a, b) que devuelva la suma de a y b.', '', ['5', '0'], ['Define function suma(a, b).', 'Usa return a + b.', 'local function suma(a, b)\n  return a + b\nend'], 'local function suma(a, b)\n  return a + b\nend', 20, 'funciones', { test: 'print(suma(2, 3))\nprint(suma(0, 0))', re: 'function\\s+suma|suma\\s*=\\s*function' }),
      M('l12b', '¿Para qué sirve return?', ['Para imprimir', 'Para devolver un valor al que llamó', 'Para repetir', 'Para comentar'], 1, 'Entrega el resultado de la función.', 'funciones'),
    ],
  },
  {
    id: 'l13',
    lv: 5,
    title: 'Funciones con decisiones',
    goal: 'Combinar if y return',
    explain: 'Una función puede decidir y devolver true o false. Es la base de validar datos en sistemas de Roblox.',
    code: 'local function esMayor(n)\n  return n > 10\nend',
    why: 'Devuelve true si n es mayor que 10.',
    def: 'Una función puede responder sí o no (true o false). Así los juegos validan cosas.',
    ex: [
      C('l13a', 'Crea esPar(n) que devuelva true si n es par y false si no.', '', ['true\tfalse'], ['Un número es par si n % 2 == 0.', 'return n % 2 == 0', 'local function esPar(n)\n  return n % 2 == 0\nend'], 'local function esPar(n)\n  return n % 2 == 0\nend', 20, 'funciones', { test: 'print(esPar(4), esPar(7))', re: '%' }),
      C('l13b', 'Crea saludar(nombre) que devuelva "Hola, " seguido del nombre.', '', ['Hola, Ana'], ['Une textos con ..', 'return "Hola, " .. nombre', 'local function saludar(nombre)\n  return "Hola, " .. nombre\nend'], 'local function saludar(nombre)\n  return "Hola, " .. nombre\nend', 20, 'funciones', { test: 'print(saludar("Ana"))' }),
    ],
  },
  {
    id: 'l14',
    lv: 6,
    title: 'Listas',
    goal: 'Guardar varios valores en una tabla',
    explain: 'Una tabla guarda varios valores: <code>{"espada", "escudo"}</code>. El primer índice es <b>1</b>. <code>#t</code> da su tamaño y <code>table.insert(t, v)</code> añade.',
    code: 'local inv = {"espada"}\ntable.insert(inv, "escudo")\nprint(#inv)',
    why: 'Se muestra 2.',
    def: 'Una tabla usada como lista guarda varios valores en orden. El primer elemento está en la posición 1.',
    ex: [
      C('l14a', 'Añade "pocion" al inventario y muestra cuántos objetos hay (debe ser 3).', 'local inv = {"espada", "escudo"}\n', ['3'], ['Usa table.insert.', 'table.insert(inv, "pocion")', 'table.insert(inv, "pocion")\nprint(#inv)'], 'local inv = {"espada", "escudo"}\ntable.insert(inv, "pocion")\nprint(#inv)', 20, 'tablas', { re: 'table\\.insert|inv\\[\\s*3' }),
      M('l14b', 'En {"a", "b", "c"}, ¿qué índice tiene "a"?', ['0', '1', '2', '-1'], 1, 'En Luau los índices empiezan en 1.', 'tablas'),
    ],
  },
  {
    id: 'l15',
    lv: 6,
    title: 'Diccionarios y recorridos',
    goal: 'Usar claves y recorrer con ipairs',
    explain: 'Un diccionario usa claves: <code>{nombre = "Ana", nivel = 3}</code>. Se lee con <code>t.nivel</code>. Para recorrer una lista: <code>for i, v in ipairs(t) do ... end</code>.',
    code: 'local nums = {2, 4}\nfor i, v in ipairs(nums) do print(v) end',
    why: 'Muestra 2 y 4.',
    def: 'Un diccionario guarda datos con nombre (clave = valor). ipairs recorre una lista elemento por elemento.',
    ex: [
      C('l15a', 'Cambia el nivel del jugador a 4 y muéstralo.', 'local jugador = {nombre = "Ana", nivel = 3}\n', ['4'], ['Usa jugador.nivel = ...', 'jugador.nivel = 4', 'jugador.nivel = 4\nprint(jugador.nivel)'], 'local jugador = {nombre = "Ana", nivel = 3}\njugador.nivel = 4\nprint(jugador.nivel)', 20, 'diccionarios', { re: 'nivel\\s*=\\s*4' }),
      C('l15b', 'Suma todos los números de la lista y muestra el total (12).', 'local nums = {2, 4, 6}\nlocal total = 0\n', ['12'], ['Recorre con ipairs.', 'Dentro del for: total = total + v', 'for i, v in ipairs(nums) do\n  total = total + v\nend\nprint(total)'], 'local nums = {2, 4, 6}\nlocal total = 0\nfor i, v in ipairs(nums) do\n  total = total + v\nend\nprint(total)', 25, 'ipairs', { re: 'pairs|for' }),
    ],
  },
  {
    id: 'l16',
    lv: 7,
    title: 'Errores con pcall',
    goal: 'Evitar que un fallo detenga el programa',
    explain: '<code>pcall(f)</code> ejecuta f sin que un error detenga el programa. Devuelve <b>true</b> si todo fue bien o <b>false</b> y el mensaje si falló.',
    code: 'local ok, err = pcall(function() error("fallo") end)\nprint(ok)',
    why: 'ok es false porque la función lanzó un error.',
    def: 'pcall ejecuta una función de forma segura: si falla, no rompe el programa y te avisa con false.',
    ex: [
      C('l16a', 'Ejecuta falla() con pcall y muestra si tuvo éxito (debe mostrar false).', 'local function falla()\n  error("boom")\nend\n', ['false'], ['Usa pcall(falla).', 'pcall devuelve true o false primero.', 'local ok = pcall(falla)\nprint(ok)'], 'local function falla()\n  error("boom")\nend\nlocal ok = pcall(falla)\nprint(ok)', 20, 'pcall', { re: 'pcall' }),
      M('l16b', 'pcall(f) devuelve como primer valor:', ['El resultado', 'true o false', 'El mensaje', 'Nada'], 1, 'Indica si f terminó sin errores.', 'pcall'),
    ],
  },
  {
    id: 'l17',
    lv: 7,
    title: 'Funciones como valores y closures',
    goal: 'Funciones que recuerdan variables',
    explain: 'Una función puede recordar variables del lugar donde fue creada: eso es un <b>closure</b>. Sirve para contadores y callbacks.',
    code: 'local function contador()\n  local n = 0\n  return function()\n    n = n + 1\n    return n\n  end\nend',
    why: 'La función interna conserva n entre llamadas.',
    def: 'Un closure es una función que recuerda las variables del lugar donde fue creada.',
    ex: [
      C('l17a', 'Crea contador() que devuelva una función; cada llamada a esa función debe devolver 1, 2, 3...', '', ['1\t2\t3'], ['contador crea una variable local n.', 'Devuelve una función que suma 1 a n y la devuelve.', 'local function contador()\n  local n = 0\n  return function()\n    n = n + 1\n    return n\n  end\nend'], 'local function contador()\n  local n = 0\n  return function()\n    n = n + 1\n    return n\n  end\nend', 25, 'closures', { test: 'local c = contador()\nprint(c(), c(), c())', re: 'return\\s+function' }),
      M('l17b', 'En un closure, ¿dónde vive la variable local capturada?', ['Se destruye al salir', 'La función interna la recuerda', 'Es global', 'Es constante'], 1, 'El closure mantiene viva la variable.', 'closures'),
    ],
  },
  {
    id: 'l18',
    lv: 7,
    title: 'Cadenas útiles',
    goal: 'Transformar y construir texto',
    explain: '<code>string.upper</code>, <code>string.sub(s, i, j)</code> y <code>string.format("%d", n)</code> transforman y construyen texto.',
    code: 'print(string.upper("roblox"))\nprint(string.format("Nivel %d", 5))',
    why: 'Se muestra ROBLOX y Nivel 5.',
    def: 'Las funciones de string sirven para cambiar, cortar y armar textos.',
    ex: [
      C('l18a', 'Muestra Nivel 5 usando string.format con la variable nivel.', 'local nivel = 5\n', ['Nivel 5'], ['Usa string.format.', '%d se reemplaza por un número.', 'print(string.format("Nivel %d", nivel))'], 'local nivel = 5\nprint(string.format("Nivel %d", nivel))', 15, 'strings', { re: 'format' }),
      M('l18b', 'string.sub("Hola", 1, 2) devuelve:', ['Ho', 'Hol', 'la', 'H'], 0, 'sub toma del carácter 1 al 2.', 'strings'),
    ],
  },
  {
    id: 'r1',
    lv: 8,
    title: 'Explorer, servicios y Scripts',
    goal: 'Saber dónde va cada Script',
    explain: 'Roblox Studio organiza el juego en una jerarquía en <b>Explorer</b>. <b>Workspace</b> contiene lo que se ve; <b>ServerScriptService</b> guarda Scripts del servidor; <b>ReplicatedStorage</b> guarda lo que cliente y servidor comparten. Los <b>LocalScripts</b> corren en el cliente.',
    code: 'local Players = game:GetService("Players")\nprint("Servidor listo")',
    why: 'GetService obtiene un servicio de forma segura; el Script del servidor imprime en Output.',
    def: 'Explorer es la lista de todo lo que tiene tu juego. Cada contenedor decide quién ve un objeto y dónde se ejecuta el código.',
    mis: [
      'Crea una Part en Workspace',
      'Crea un Script en ServerScriptService con print("Hola desde el servidor")',
      'Pulsa Play y confirma el mensaje en Output de Roblox Studio',
    ],
    ex: [
      R('r1a', '¿Dónde guardarías un Script que maneja las monedas de todos los jugadores?', ['StarterGui', 'ServerScriptService', 'Workspace.Part', 'StarterPack'], 1, 'Los Scripts del servidor van en ServerScriptService.'),
      R('r1b', '¿Qué contenedor NO pueden ver los clientes?', ['ReplicatedStorage', 'ServerStorage', 'StarterGui', 'Workspace'], 1, 'ServerStorage solo existe en el servidor.'),
      R('r1c', '¿Dónde se ejecuta un LocalScript?', ['En el servidor para todos', 'En el cliente de un jugador', 'En la nube sin jugadores', 'Solo en Studio'], 1, 'Corre en el dispositivo del jugador.'),
    ],
  },
  {
    id: 'r2',
    lv: 8,
    title: 'Instances, propiedades y eventos',
    goal: 'Crear objetos y reaccionar a eventos',
    explain: '<code>Instance.new</code> crea objetos; sus propiedades se cambian con <code>objeto.Propiedad = valor</code>. Los eventos se conectan con <code>:Connect(funcion)</code>.',
    code: 'local parte = Instance.new("Part")\nparte.Parent = workspace\nparte.Touched:Connect(function(otro)\n  print("Tocada por", otro.Name)\nend)',
    why: 'Al asignar Parent la Part aparece; la función se ejecuta cada vez que algo la toca.',
    def: 'Una Instance es cualquier objeto de Roblox (una Part, un Script...). Un evento es un aviso que ocurre cuando pasa algo.',
    mis: [
      'Crea una Part y un Script que la haga cambiar de color al tocarla',
      'Comprueba que no cambia si nadie la toca usando un debounce',
    ],
    ex: [
      R('r2a', '¿Qué hace Instance.new("Part")?', ['La muestra al instante', 'Crea la Part; aparece al asignarle un Parent', 'La borra', 'Cambia su color'], 1, 'Se crea en memoria y se ve al asignar Parent.'),
      R('r2b', '¿Para qué sirve WaitForChild?', ['Esperar a que exista un hijo antes de usarlo', 'Borrar hijos', 'Clonar', 'Pausar el juego'], 0, 'Evita errores cuando el objeto aún no cargó.'),
      R('r2c', '¿Qué es Touched?', ['Una propiedad numérica', 'Un evento que se dispara al tocar una parte', 'Un servicio', 'Un tipo de Script'], 1, 'Los eventos se conectan con :Connect.'),
    ],
  },
  {
    id: 'r3',
    lv: 8,
    title: 'Cliente y servidor: RemoteEvent seguro',
    goal: 'No confiar nunca en el cliente',
    explain: 'El cliente puede ser manipulado. Un <b>RemoteEvent</b> comunica cliente y servidor, pero el servidor debe <b>validar</b> tipo, rango y permisos, y decidir él mismo cantidades.',
    code: 'remote.OnServerEvent:Connect(function(jugador, cantidad)\n  if typeof(cantidad) ~= "number" or cantidad < 1 or cantidad > 10 then\n    return\n  end\n  -- el servidor decide el premio\nend)',
    why: 'Si el dato no es válido, el servidor lo ignora.',
    def: 'Un RemoteEvent es un mensajero entre el jugador y el servidor. El servidor siempre debe revisar el mensaje antes de creerlo.',
    mis: [
      'Crea un RemoteEvent en ReplicatedStorage llamado GiveRewardEvent',
      'Escribe un Script que valide tipo y rango de lo que recibe y pruébalo con un valor inválido',
    ],
    ex: [
      R('r3a', 'Un cliente envía "dar 9999 monedas". ¿Qué debe hacer el servidor?', ['Aceptarlo', 'Validar y decidir él mismo la cantidad', 'Confiar si es el dueño', 'Guardarlo directamente'], 1, 'El cliente nunca es de confianza.'),
      R('r3b', '¿Dónde se colocan normalmente los RemoteEvents?', ['ServerStorage', 'ReplicatedStorage', 'Lighting', 'StarterGui'], 1, 'Cliente y servidor deben poder verlos.'),
      R('r3c', '¿Qué debes validar de lo que llega por un RemoteEvent?', ['Nada', 'Tipo, rango y permisos', 'Solo el nombre', 'Solo la hora'], 1, 'Tipo, rango y que el jugador pueda hacer la acción.'),
    ],
  },
];

// Challenges for each lesson
export const CHALLENGES: Record<string, CodeExercise> = {
  l1: C('l1x', 'Desafío: muestra dos líneas: Hola y luego Roblox.', '', ['Hola', 'Roblox'], ['Necesitas dos print.', 'Uno por línea.', 'print("Hola")\nprint("Roblox")'], 'print("Hola")\nprint("Roblox")', 15, 'print', { re: 'print[\\s\\S]*print', ch: 1 }),
  l2: C('l2x', 'Desafío: muestra el resultado de (8 + 2) * 5.', '', ['50'], ['Usa paréntesis para sumar primero.', 'print((8 + 2) * 5)'], 'print((8 + 2) * 5)', 15, 'numeros', { re: '\\(\\s*8\\s*\\+\\s*2\\s*\\)', ch: 1 }),
  l3: C('l3x', 'Desafío: muestra Visible y escribe encima un comentario que explique la línea.', '', ['Visible'], ['Un comentario empieza con --.', 'Escríbelo en la línea anterior.', '-- muestra un texto\nprint("Visible")'], '-- muestra un texto\nprint("Visible")', 15, 'comentarios', { re: '--', ch: 1 }),
  l4: C('l4x', 'Desafío: dos errores. Corrige el código para mostrar Hola y luego 2.', 'prnt("Hola")\nprint(1 +)', ['Hola', '2'], ['Hay un error de nombre y una operación incompleta.', 'print("Hola")\nprint(1 + 1)'], 'print("Hola")\nprint(1 + 1)', 20, 'errores', { ch: 1 }),
  l5: C('l5x', 'Desafío: crea las variables locales ancho = 4 y alto = 3 y muestra su producto.', '', ['12'], ['Crea las dos variables.', 'Multiplícalas dentro de print.', 'local ancho = 4\nlocal alto = 3\nprint(ancho * alto)'], 'local ancho = 4\nlocal alto = 3\nprint(ancho * alto)', 15, 'variables', { re: 'ancho[\\s\\S]*alto', ch: 1 }),
  l6: C('l6x', 'Desafío: muestra Zoe es nivel 7 uniendo las variables.', 'local nombre = "Zoe"\nlocal nivel = 7\n', ['Zoe es nivel 7'], ['Usa ..', 'Une nombre, " es nivel " y nivel.', 'print(nombre .. " es nivel " .. nivel)'], 'local nombre = "Zoe"\nlocal nivel = 7\nprint(nombre .. " es nivel " .. nivel)', 15, 'concatenacion', { re: '\\.\\.', ch: 1 }),
  l7: C('l7x', 'Desafío: muestra el tipo de true y el de nil, en dos líneas.', '', ['boolean', 'nil'], ['Usa type dos veces.', 'print(type(true))\nprint(type(nil))'], 'print(type(true))\nprint(type(nil))', 15, 'tipos', { re: 'type', ch: 1 }),
  l8: C('l8x', 'Desafío: con n = 0 muestra cero si n es 0, positivo si es mayor y negativo si es menor.', 'local n = 0\n', ['cero'], ['Necesitas if, elseif y else.', 'Compara con == 0 y con > 0.'], 'local n = 0\nif n == 0 then print("cero") elseif n > 0 then print("positivo") else print("negativo") end', 20, 'if', { re: 'elseif', ch: 1 }),
  l9: C('l9x', 'Desafío: con edad = 15 muestra Joven si edad es mayor que 12 y menor que 18.', 'local edad = 15\n', ['Joven'], ['Combina dos condiciones con and.', 'edad > 12 and edad < 18'], 'local edad = 15\nif edad > 12 and edad < 18 then print("Joven") end', 20, 'logica', { re: '\\band\\b', ch: 1 }),
  l10: C('l10x', 'Desafío: muestra los pares del 2 al 10 usando un for con paso 2.', '', ['2', '4', '6', '8', '10'], ['for acepta un tercer valor: el paso.', 'for i = 2, 10, 2 do', 'for i = 2, 10, 2 do\n  print(i)\nend'], 'for i = 2, 10, 2 do\n  print(i)\nend', 20, 'for', { re: 'for\\s+\\w+\\s*=\\s*2\\s*,\\s*10\\s*,\\s*2', ch: 1 }),
  l11: C('l11x', 'Desafío: con while, duplica n (empieza en 1) mientras n sea 50 o menos y muestra el resultado final (64).', 'local n = 1\n', ['64'], ['La condición es n <= 50.', 'Dentro: n = n * 2'], 'local n = 1\nwhile n <= 50 do\n  n = n * 2\nend\nprint(n)', 20, 'while', { re: 'while', ch: 1 }),
  l12: C('l12x', 'Desafío: crea maximo(a, b) que devuelva el mayor de los dos.', '', ['9\t10'], ['Compara a y b con if.', 'Devuelve el mayor con return.'], 'local function maximo(a, b)\n  if a > b then return a end\n  return b\nend', 25, 'funciones', { test: 'print(maximo(3, 9), maximo(10, 2))', ch: 1 }),
  l13: C('l13x', 'Desafío: crea puedeEntrar(edad, tieneEntrada) que devuelva true solo si edad >= 13 y tieneEntrada.', '', ['true\tfalse\tfalse'], ['Combina las condiciones con and.', 'return edad >= 13 and tieneEntrada'], 'local function puedeEntrar(edad, tieneEntrada)\n  return edad >= 13 and tieneEntrada\nend', 25, 'funciones', { test: 'print(puedeEntrar(15, true), puedeEntrar(10, true), puedeEntrar(20, false))', ch: 1 }),
  l14: C('l14x', 'Desafío: crea la lista {"a", "b", "c"} y muestra su último elemento usando #.', '', ['c'], ['# da el tamaño de la lista.', 'El último índice es #t.'], 'local t = {"a", "b", "c"}\nprint(t[#t])', 20, 'tablas', { re: '#', ch: 1 }),
  l15: C('l15x', 'Desafío: cuenta cuántas veces aparece "x" en la lista.', 'local t = {"x", "y", "x"}\nlocal c = 0\n', ['2'], ['Recorre con ipairs.', 'Si v == "x" suma 1 a c.'], 'local t = {"x", "y", "x"}\nlocal c = 0\nfor i, v in ipairs(t) do\n  if v == "x" then c = c + 1 end\nend\nprint(c)', 25, 'ipairs', { re: 'pairs|for', ch: 1 }),
  l16: C('l16x', 'Desafío: crea seguro(f) que devuelva true si f() no falla y false si falla.', '', ['true\tfalse'], ['Usa pcall(f).', 'Devuelve el primer valor de pcall.'], 'local function seguro(f)\n  local ok = pcall(f)\n  return ok\nend', 25, 'pcall', { test: 'print(seguro(function() return 1 end), seguro(function() error("x") end))', re: 'pcall', ch: 1 }),
  l17: C('l17x', 'Desafío: crea sumador(n) que devuelva una función que sume n a lo que reciba.', '', ['6\t15'], ['Devuelve una función.', 'La función interna usa n.'], 'local function sumador(n)\n  return function(x)\n    return x + n\n  end\nend', 25, 'closures', { test: 'local suma5 = sumador(5)\nprint(suma5(1), suma5(10))', ch: 1 }),
  l18: C('l18x', 'Desafío: muestra ROBLOX en mayúsculas a partir de la variable s.', 'local s = "roblox"\n', ['ROBLOX'], ['Usa string.upper.', 'print(string.upper(s))'], 'local s = "roblox"\nprint(string.upper(s))', 15, 'strings', { re: 'upper', ch: 1 }),
};

// Embed challenge into each lesson if present
LESSONS_DATA.forEach((lesson) => {
  const ch = CHALLENGES[lesson.id];
  if (ch && !lesson.ex.some((e) => e.id === ch.id)) {
    lesson.ex.push(ch);
  }
});

// Projects
export const PROJECTS_DATA: ProjectLesson[] = [
  {
    id: 'p1',
    lv: 5,
    title: 'Proyecto 1 · Sistema de vida',
    goal: 'Variables, decisiones y una función reutilizable',
    explain: 'Construirás el sistema de vida de un juego: restar daño, comprobar si el jugador sigue vivo y reutilizar la lógica en una función.',
    code: 'local vida = 100\nlocal dano = 30\nvida = vida - dano\nprint(vida)',
    why: 'Cada paso añade una pieza al sistema.',
    ex: [
      C('p1a', 'Paso 1: con vida = 100 y dano = 30, calcula y muestra la vida restante.', 'local vida = 100\nlocal dano = 30\n', ['70'], ['Resta dano a vida.', 'print(vida - dano)'], 'local vida = 100\nlocal dano = 30\nprint(vida - dano)', 25, 'proyecto', { re: '-' }),
      C('p1b', 'Paso 2: muestra Vivo si la vida restante es mayor que 0, o Derrotado si no.', 'local vida = 100 - 30\n', ['Vivo'], ['Usa if y else.', 'vida > 0'], 'local vida = 100 - 30\nif vida > 0 then print("Vivo") else print("Derrotado") end', 25, 'proyecto', { re: '\\bif\\b' }),
      C('p1c', 'Paso 3: crea aplicarDano(vida, dano) que devuelva la vida restante sin bajar de 0.', '', ['30\t0'], ['Calcula la resta.', 'Si es menor que 0, devuelve 0.'], 'local function aplicarDano(vida, dano)\n  local r = vida - dano\n  if r < 0 then r = 0 end\n  return r\nend', 30, 'proyecto', { test: 'print(aplicarDano(50, 20), aplicarDano(10, 30))' }),
    ],
  },
  {
    id: 'p2',
    lv: 4,
    title: 'Proyecto 2 · Tablas y sumas',
    goal: 'Bucles for con acumuladores y condiciones',
    explain: 'Usarás bucles para generar una tabla de multiplicar, sumar un rango y contar valores que cumplen una regla.',
    code: 'local total = 0\nfor i = 1, 3 do\n  total = total + i\nend\nprint(total)',
    why: 'El acumulador guarda el resultado parcial.',
    ex: [
      C('p2a', 'Paso 1: muestra la tabla del 3 hasta 3 x 3 con el formato 3 x 1 = 3.', '', ['3 x 1 = 3', '3 x 2 = 6', '3 x 3 = 9'], ['Usa un for de 1 a 3.', 'Une textos con .. y calcula 3 * i.'], 'for i = 1, 3 do\n  print("3 x " .. i .. " = " .. 3 * i)\nend', 25, 'proyecto', { re: 'for' }),
      C('p2b', 'Paso 2: suma los números del 1 al 10 y muestra el total (55).', 'local total = 0\n', ['55'], ['Recorre 1 a 10.', 'total = total + i'], 'local total = 0\nfor i = 1, 10 do\n  total = total + i\nend\nprint(total)', 25, 'proyecto', { re: 'for' }),
      C('p2c', 'Paso 3: cuenta los múltiplos de 3 entre 1 y 20 y muestra la cantidad (6).', 'local c = 0\n', ['6'], ['Un múltiplo cumple i % 3 == 0.', 'Suma 1 a c cuando se cumpla.'], 'local c = 0\nfor i = 1, 20 do\n  if i % 3 == 0 then c = c + 1 end\nend\nprint(c)', 30, 'proyecto', { re: '%' }),
    ],
  },
  {
    id: 'p3',
    lv: 6,
    title: 'Proyecto 3 · Inventario',
    goal: 'Tablas, funciones y recorridos combinados',
    explain: 'Crearás un inventario: una lista de objetos, una función para contar un objeto concreto y un cálculo de precios con un diccionario.',
    code: 'local inv = {"espada"}\nprint(#inv)',
    why: 'Las listas guardan objetos; los diccionarios, datos con nombre.',
    ex: [
      C('p3a', 'Paso 1: crea la lista inv con espada, pocion y pocion, y muestra cuántos objetos tiene (3).', '', ['3'], ['Una lista usa llaves.', '# da el tamaño.'], 'local inv = {"espada", "pocion", "pocion"}\nprint(#inv)', 25, 'proyecto', { re: '#' }),
      C('p3b', 'Paso 2: crea contar(lista, nombre) que devuelva cuántas veces aparece nombre.', 'local inv = {"espada", "pocion", "pocion"}\n', ['2\t0'], ['Recorre la lista con ipairs.', 'Compara cada elemento con nombre.'], 'local inv = {"espada", "pocion", "pocion"}\nlocal function contar(lista, nombre)\n  local c = 0\n  for i, v in ipairs(lista) do\n    if v == nombre then c = c + 1 end\n  end\n  return c\nend', 30, 'proyecto', { test: 'print(contar(inv, "pocion"), contar(inv, "arco"))' }),
      C('p3c', 'Paso 3: con el diccionario precios, muestra el costo de 1 espada y 3 pociones (80).', 'local precios = {espada = 50, pocion = 10}\n', ['80'], ['Lee los precios con precios.espada.', '50 + 3 * 10'], 'local precios = {espada = 50, pocion = 10}\nprint(precios.espada + 3 * precios.pocion)', 30, 'proyecto', { re: 'precios\\.espada|precios\\[|precios\\.pocion' }),
    ],
  },
];

// Exams
export const EXAMS_DATA: Record<number, ExamItem[]> = {
  1: [
    { id: 'x1a', t: 'mc', q: '¿Qué muestra print(10 - 4)?', opts: ['6', '14', '104', 'Error'], ans: 0 },
    { id: 'x1b', t: 'mc', q: '¿Qué muestra print("10 - 4")?', opts: ['6', '10 - 4', 'Error', 'nil'], ans: 1 },
    { id: 'x1c', t: 'mc', q: 'Una línea que empieza con -- es:', opts: ['Un error', 'Un comentario', 'Una función', 'Un texto'], ans: 1 },
    { id: 'x1d', t: 'code', q: 'Muestra exactamente: Examen 1', start: '', out: ['Examen 1'] },
  ],
  2: [
    { id: 'x2a', t: 'mc', q: 'local a = 3  a = a * 2  print(a)', opts: ['3', '5', '6', 'Error'], ans: 2 },
    { id: 'x2b', t: 'mc', q: 'print("Hi " .. "Ana") muestra:', opts: ['Hi Ana', 'Hi  Ana', 'Error', 'Hi .. Ana'], ans: 0 },
    { id: 'x2c', t: 'mc', q: 'type(false) devuelve:', opts: ['number', 'string', 'boolean', 'nil'], ans: 2 },
    { id: 'x2d', t: 'code', q: 'Crea local x = 8 y muestra x * 2 (16).', start: '', out: ['16'], re: 'local\\s+x' },
  ],
  3: [
    { id: 'x3a', t: 'mc', q: 'local n = 5  if n > 5 then print("A") else print("B") end', opts: ['A', 'B', 'AB', 'Nada'], ans: 1 },
    { id: 'x3b', t: 'mc', q: 'true and false es:', opts: ['true', 'false', 'nil', 'Error'], ans: 1 },
    { id: 'x3c', t: 'mc', q: 'false or true es:', opts: ['true', 'false', 'nil', 'Error'], ans: 0 },
    { id: 'x3d', t: 'code', q: 'Con local n = 7 muestra Impar si n % 2 == 1.', start: 'local n = 7\n', out: ['Impar'], re: '\\bif\\b' },
  ],
  4: [
    { id: 'x4a', t: 'mc', q: 'for i = 1, 3 do print(i * 2) end muestra:', opts: ['1, 2, 3', '2, 4, 6', '2, 4, 6, 8', '6'], ans: 1 },
    { id: 'x4b', t: 'mc', q: 'for i = 3, 1, -1 do print(i) end muestra:', opts: ['3, 2, 1', '1, 2, 3', 'Nada', 'Error'], ans: 0 },
    { id: 'x4c', t: 'mc', q: 'while false do print(1) end ejecuta el bloque:', opts: ['Una vez', 'Nunca', 'Siempre', 'Error'], ans: 1 },
    { id: 'x4d', t: 'code', q: 'Muestra la suma de 1 a 5 (15) usando un for.', start: 'local t = 0\n', out: ['15'], re: 'for' },
  ],
  5: [
    { id: 'x5a', t: 'mc', q: 'local function f(a) return a + 1 end  print(f(f(1)))', opts: ['1', '2', '3', 'Error'], ans: 2 },
    { id: 'x5b', t: 'mc', q: 'Una función sin return devuelve:', opts: ['0', 'nil (nada)', 'false', 'Error'], ans: 1 },
    { id: 'x5c', t: 'mc', q: 'Una variable local dentro de una función se ve:', opts: ['En todo el script', 'Solo dentro de esa función', 'En otros scripts', 'Nunca'], ans: 1 },
    { id: 'x5d', t: 'code', q: 'Crea triple(n) que devuelva n por 3.', start: '', out: ['9'], test: 'print(triple(3))' },
  ],
  6: [
    { id: 'x6a', t: 'mc', q: 'local t = {"a", "b"}  print(t[2])', opts: ['a', 'b', 'nil', 'Error'], ans: 1 },
    { id: 'x6b', t: 'mc', q: '#{5, 6, 7} vale:', opts: ['2', '3', '4', '0'], ans: 1 },
    { id: 'x6c', t: 'mc', q: 'Para añadir al final de una lista se usa:', opts: ['table.add', 'table.insert', 't.push', 'append'], ans: 1 },
    { id: 'x6d', t: 'code', q: 'Suma 5 a hp y muestra el resultado (15).', start: 'local d = {hp = 10}\n', out: ['15'], re: 'hp' },
  ],
  7: [
    { id: 'x7a', t: 'mc', q: 'pcall(f) devuelve primero:', opts: ['El resultado', 'true o false', 'El error', 'Nada'], ans: 1 },
    { id: 'x7b', t: 'mc', q: 'string.upper("ab") es:', opts: ['ab', 'AB', 'Ab', 'Error'], ans: 1 },
    { id: 'x7c', t: 'mc', q: 'Una función que recuerda variables de su entorno se llama:', opts: ['closure', 'bucle', 'módulo', 'evento'], ans: 0 },
    { id: 'x7d', t: 'mc', q: 'string.format("%d items", 3) es:', opts: ['3 items', '%d items', 'Error', 'items 3'], ans: 0 },
  ],
  8: [
    { id: 'x8a', t: 'mc', q: '¿Dónde va un Script que debe ejecutarse en el servidor?', opts: ['StarterGui', 'ServerScriptService', 'StarterPlayerScripts', 'ReplicatedStorage'], ans: 1 },
    { id: 'x8b', t: 'mc', q: 'Los LocalScripts se ejecutan en:', opts: ['El servidor', 'El cliente (jugador)', 'Ambos', 'Ninguno'], ans: 1 },
    { id: 'x8c', t: 'mc', q: 'Para obtener un servicio se usa:', opts: ['game.Players', 'game:GetService(...)', 'new Service', 'require'], ans: 1 },
    { id: 'x8d', t: 'mc', q: '¿Quién debe decidir cuántas monedas gana un jugador?', opts: ['El cliente', 'El servidor', 'El jugador', 'Da igual'], ans: 1 },
  ],
};

// Error warnings
export const ERROR_TIPS: Record<string, string> = {
  l1: 'Olvidar las comillas del texto o escribir Print con mayúscula (Lua distingue mayúsculas).',
  l2: 'Poner comillas a un número y esperar que se calcule.',
  l3: 'Escribir un solo guion (-) en vez de dos.',
  l4: 'Dejar un paréntesis o comilla sin cerrar; leer solo la primera palabra del error y no la línea.',
  l5: 'Usar una variable antes de crearla (vale nil) o escribir su nombre distinto (Vidas y vidas no son iguales).',
  l6: 'Unir texto con + en vez de ..',
  l7: 'Creer que "5" es un número: entre comillas es string.',
  l8: 'Usar = (asignar) en vez de == (comparar), o olvidar then y end.',
  l9: 'Escribir 5 < x < 10 en vez de x > 5 and x < 10.',
  l10: 'Pensar que el último número no se incluye: for i = 1, 5 incluye el 5.',
  l11: 'Olvidar cambiar la variable de la condición: bucle infinito.',
  l12: 'Olvidar return: la función devuelve nil.',
  l13: 'Usar = en vez de == dentro de la función al comparar.',
  l14: 'Empezar a contar en 0: en Lua el primer índice es 1.',
  l15: 'Confundir t.nivel (clave) con t[nivel] (variable nivel).',
  l16: 'Imprimir el mensaje de error tal cual al jugador; registra el error y muestra algo claro.',
  l17: 'Declarar n dentro de la función interna: se reinicia en cada llamada.',
  l18: 'Recordar mal los índices de string.sub: empiezan en 1.',
  r1: 'Poner un Script de servidor en StarterGui o usar ServerStorage desde un LocalScript.',
  r2: 'Olvidar asignar Parent o usar Touched sin un debounce (se dispara muchas veces).',
  r3: 'Dejar que el cliente envíe cuántas monedas gana, o no comprobar el tipo del valor.',
};

export const TRACKS_DATA = [
  ['Fundamentos de Lua', 'Disponible', 'Niveles 1 a 6: salida, variables, decisiones, bucles, funciones y tablas.'],
  ['Lua intermedio', 'Disponible', 'Nivel 7: pcall, closures y cadenas.'],
  ['Roblox Studio: fundamentos', 'Disponible (misiones en Studio)', 'Nivel 8: Explorer, servicios, eventos y RemoteEvents seguros. Los quizzes se evalúan aquí; las misiones las compruebas tú en Roblox Studio.'],
  ['Interfaces (GUI)', 'Disponible próximamente', 'ScreenGui, layouts, escalado para móvil y menús reactivos.'],
  ['Cliente-servidor y seguridad', 'Disponible próximamente', 'Validación, anti-exploits y compras seguras.'],
  ['Sistemas de juego', 'Disponible próximamente', 'Tiendas, inventario, niveles y DataStore.'],
  ['Arquitectura y optimización', 'Disponible próximamente', 'Módulos, pruebas, depuración y rendimiento.'],
  ['Avanzado: NPCs, vehículos y multijugador', 'Disponible próximamente', 'Proyectos finales de nivel experto.'],
];

// Motivational quotes and mascot lines
export const MASCOT_QUOTES = {
  OK: [
    '¡Muy bien! Eso estuvo genial.',
    '¡Lo lograste! Cada ejercicio te hace más fuerte.',
    '¡Perfecto! Sigue así.',
    '¡Bien hecho! ¿Vamos con el siguiente?',
  ],
  BAD: [
    'Casi. Equivocarse es parte de programar. ¡Inténtalo otra vez!',
    'No pasa nada. Mira el Output: ahí está la pista.',
    'Todos los programadores se equivocan muchas veces. Tú puedes.',
    'Respira y lee el error con calma. Estoy contigo.',
  ],
  STUCK: 'Llevas varios intentos y eso es perseverancia. Usa el botón Pista o consulta al Tutor IA. ¡No te rindas!',
  MOTIVATIONAL: [
    'Todos los expertos empezaron sin saber nada.',
    'Un error no es un fracaso: es información para mejorar.',
    'Pasos pequeños cada día ganan a saltos grandes de vez en cuando.',
    'Hoy ya sabes algo que ayer no sabías.',
    'Si te cansas, descansa un poco. Aquí te espero.',
  ],
  FUNNY: [
    'Chiste: ¿por qué los programadores confunden Halloween con Navidad? Porque 31 Oct = 25 Dec.',
    'Dato: Lua significa «luna» en portugués. Nació en Brasil en 1993.',
    'Chiste: un programador va al súper. Su pareja le dice: «Compra leche y, si hay huevos, trae 6». Volvió con 6 leches.',
    'Dato: Luau es el lenguaje derivado de Lua que Roblox optimizó con tipado estricto.',
    'Dato: el primer «bug» informático famoso fue una polilla real atrapada en una computadora en 1947.',
  ],
};
