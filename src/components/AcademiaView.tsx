import React, { useState, useEffect, useRef } from 'react';
import {
  LESSONS_DATA,
  PROJECTS_DATA,
  EXAMS_DATA,
  LEVELS_DICT,
  LEVEL_DESCRIPTIONS,
  TRACKS_DATA,
  ERROR_TIPS,
  REVIEW_INTERVALS,
  MASCOT_QUOTES,
} from '../data/academyData';
import {
  Lesson,
  ProjectLesson,
  Exercise,
  CodeExercise,
  MultipleChoiceExercise,
  ExamItem,
  AcademyProgress,
} from '../types';
import { executeLuau, RunResult } from '../utils/luaRunner';
import { MascotLuli } from './MascotLuli';

interface AcademiaViewProps {
  onOpenCopilotWithCode?: (code: string, filename: string) => void;
}

const STORAGE_KEY = 'studiocopilot_academy_v2';

export const AcademiaView: React.FC<AcademiaViewProps> = () => {
  // Load progress from localStorage
  const [progress, setProgress] = useState<AcademyProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      xp: 0,
      done: {},
      ex: {},
      due: {},
      exam: {},
      mis: {},
      streak: { cur: 0, best: 0, last: null },
      miss: {},
    };
  });

  // Current view modes: 'levels' | 'lesson' | 'practice' | 'review' | 'proj' | 'esp' | 'exam' | 'catalog'
  const [mode, setMode] = useState<string>('levels');
  const [currentLesson, setCurrentLesson] = useState<Lesson | ProjectLesson>(LESSONS_DATA[0]);
  const [exerciseIndex, setExerciseIndex] = useState<number>(0);
  const [codeValue, setCodeValue] = useState<string>('');
  const [outputResult, setOutputResult] = useState<RunResult | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string; xpAward?: number } | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [examState, setExamState] = useState<{ lv: number; i: number; score: number } | null>(null);

  // Mascot state
  const [mascotMsg, setMascotMsg] = useState<string>('¡Bienvenido a la Academia! Elige tu nivel y aprendamos Luau.');
  const [mascotMood, setMascotMood] = useState<'happy' | 'cheer' | 'think'>('happy');

  // AI Tutor Modal
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [tutorQuery, setTutorQuery] = useState<string>('');
  const [tutorReply, setTutorReply] = useState<string>('');
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);

  // Save progress helper
  const saveProgress = (newProg: AcademyProgress) => {
    setProgress(newProg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProg));
    } catch (e) {
      console.warn('Failed to save academy progress', e);
    }
  };

  const getToday = () => new Date().toISOString().slice(0, 10);
  const addDays = (base: string, days: number) =>
    new Date(Date.parse(base) + days * 864e5).toISOString().slice(0, 10);

  // Check streak
  const checkStreak = (prog: AcademyProgress): AcademyProgress => {
    const today = getToday();
    const last = prog.streak.last;
    if (last === today) return prog;

    const diffDays = last ? Math.round((Date.parse(today) - Date.parse(last)) / 864e5) : 99;
    const newCur = diffDays <= 2 ? prog.streak.cur + 1 : 1;
    const newBest = Math.max(prog.streak.best, newCur);

    return {
      ...prog,
      streak: { cur: newCur, best: newBest, last: today },
    };
  };

  // Check if a lesson is unlocked
  const isLessonUnlocked = (lessonIndex: number): boolean => {
    if (lessonIndex === 0) return true;
    const curr = LESSONS_DATA[lessonIndex];
    const prev = LESSONS_DATA[lessonIndex - 1];
    if (progress.exam[curr.lv]) return true;
    if (curr.lv === prev.lv) return !!progress.done[prev.id];
    return !!progress.exam[prev.lv];
  };

  // Check if project is unlocked
  const isProjectUnlocked = (proj: ProjectLesson): boolean => {
    if (progress.exam[proj.lv]) return true;
    return LESSONS_DATA.filter((l) => l.lv === proj.lv).every((l) => !!progress.done[l.id]);
  };

  // Get due reviews
  const getDueReviews = (): string[] => {
    const today = getToday();
    return Object.keys(progress.due).filter((id) => progress.due[id].d <= today);
  };

  // Open a lesson
  const startLesson = (lesson: Lesson | ProjectLesson) => {
    setCurrentLesson(lesson);
    setExerciseIndex(0);
    setMode('lesson');
    setFeedback(null);
    setAttempts(0);
    setHintsRevealed(0);
    setOutputResult(null);
    setMascotMsg(`Vamos a aprender: "${lesson.title}". Léelo con atención y luego practicamos.`);
    setMascotMood('happy');
  };

  // Start practice inside a lesson
  const startPractice = (idx = 0) => {
    setExerciseIndex(idx);
    setMode('practice');
    setFeedback(null);
    setAttempts(0);
    setHintsRevealed(0);
    setOutputResult(null);

    const currentEx = currentLesson.ex[idx];
    if (currentEx && currentEx.t === 'code') {
      setCodeValue(currentEx.start || '');
    }
    setMascotMsg(`Ejercicio ${idx + 1}: ${currentEx ? currentEx.q : ''}`);
    setMascotMood('happy');
  };

  // Handle Code Execution and Verification
  const handleRunCode = () => {
    const currentEx = currentLesson.ex[exerciseIndex] as CodeExercise;
    if (!currentEx || currentEx.t !== 'code') return;

    const fullCodeToRun = codeValue + (currentEx.test ? '\n' + currentEx.test : '');
    const result = executeLuau(fullCodeToRun);
    setOutputResult(result);

    const expectedStr = currentEx.out.join('\n');
    const gotStr = result.out.join('\n');
    const meetsRegex = !currentEx.re || new RegExp(currentEx.re).test(codeValue);
    const isCorrect = !result.err && gotStr === expectedStr && meetsRegex;

    if (isCorrect) {
      handlePassExercise(currentEx);
    } else {
      setAttempts((prev) => prev + 1);
      const newMissCount = (progress.miss[currentEx.c] || 0) + 1;
      let updated = {
        ...progress,
        miss: { ...progress.miss, [currentEx.c]: newMissCount },
      };
      if (progress.ex[currentEx.id]) {
        updated.due[currentEx.id] = { i: 0, d: getToday() };
      }
      saveProgress(updated);

      const badQuote = attempts >= 2 ? MASCOT_QUOTES.STUCK : MASCOT_QUOTES.BAD[Math.floor(Math.random() * MASCOT_QUOTES.BAD.length)];
      setMascotMsg(badQuote);
      setMascotMood('think');

      let errorExplanation = 'La salida generada no coincide con lo esperado.';
      if (result.err) {
        errorExplanation = `Hay un error en tu código Luau: ${result.err}`;
      } else if (!meetsRegex) {
        errorExplanation = 'La salida es similar, pero debes utilizar la estructura solicitada en la instrucción.';
      }

      setFeedback({
        ok: false,
        msg: errorExplanation,
      });
    }
  };

  // Handle Passing an Exercise
  const handlePassExercise = (ex: Exercise) => {
    let updated = checkStreak(progress);
    const prevAttempts = updated.ex[ex.id] || 0;
    const xpToAdd = prevAttempts > 0 ? Math.floor(ex.xp * 0.1) : ex.xp;

    const currentIntervalIdx = updated.due[ex.id]?.i ?? 0;
    const nextIntervalIdx = Math.min(currentIntervalIdx + 1, REVIEW_INTERVALS.length - 1);
    const nextDueDate = addDays(getToday(), REVIEW_INTERVALS[nextIntervalIdx]);

    updated.ex[ex.id] = prevAttempts + 1;
    updated.xp += xpToAdd;
    updated.due[ex.id] = { i: nextIntervalIdx, d: nextDueDate };

    // Check if entire lesson is done
    const allExDone = currentLesson.ex.every((e) => updated.ex[e.id] || e.id === ex.id);
    if (allExDone) {
      updated.done[currentLesson.id] = 1;
    }

    saveProgress(updated);

    const okQuote = MASCOT_QUOTES.OK[Math.floor(Math.random() * MASCOT_QUOTES.OK.length)];
    setMascotMsg(`${okQuote} ¡Sumas +${xpToAdd} XP!`);
    setMascotMood('cheer');

    setFeedback({
      ok: true,
      msg: '¡Excelente trabajo! Ejercicio superado.',
      xpAward: xpToAdd,
    });
  };

  // Handle Multiple Choice Answer
  const handleMultipleChoice = (optionIdx: number) => {
    const currentEx = currentLesson.ex[exerciseIndex] as MultipleChoiceExercise;
    if (!currentEx || currentEx.t !== 'mc') return;

    if (optionIdx === currentEx.ans) {
      handlePassExercise(currentEx);
    } else {
      setAttempts((prev) => prev + 1);
      const newMissCount = (progress.miss[currentEx.c] || 0) + 1;
      const updated = {
        ...progress,
        miss: { ...progress.miss, [currentEx.c]: newMissCount },
      };
      saveProgress(updated);
      setMascotMsg('No es esa opción. Revisa detenidamente el concepto y prueba otra vez.');
      setMascotMood('think');
      setFeedback({
        ok: false,
        msg: `Respuesta incorrecta. ${currentEx.why || 'Prueba de nuevo.'}`,
      });
    }
  };

  // Next exercise or finish
  const handleNextExercise = () => {
    setFeedback(null);
    setOutputResult(null);
    setAttempts(0);
    setHintsRevealed(0);

    if (mode === 'review') {
      const remaining = [...reviewQueue];
      remaining.shift();
      setReviewQueue(remaining);
      if (remaining.length === 0) {
        setMode('levels');
        setMascotMsg('¡Repasos del día terminados! Tu memoria a largo plazo está reforzada.');
      }
      return;
    }

    if (exerciseIndex < currentLesson.ex.length - 1) {
      startPractice(exerciseIndex + 1);
    } else {
      // Done with current lesson
      const currIdx = LESSONS_DATA.findIndex((l) => l.id === currentLesson.id);
      if (currIdx >= 0 && currIdx < LESSONS_DATA.length - 1) {
        startLesson(LESSONS_DATA[currIdx + 1]);
      } else {
        setMode('levels');
      }
    }
  };

  // Start Exam
  const startExam = (levelNum: number) => {
    setExamState({ lv: levelNum, i: 0, score: 0 });
    setMode('exam');
    setFeedback(null);
    setOutputResult(null);
    setMascotMsg(`Examen del ${LEVELS_DICT[levelNum]}. Sin pistas ni soluciones. ¡Tú puedes!`);
    setMascotMood('think');
  };

  // Handle Exam Answer
  const handleExamAnswer = (isCorrect: boolean) => {
    if (!examState) return;
    const questions = EXAMS_DATA[examState.lv] || [];
    const newScore = examState.score + (isCorrect ? 1 : 0);
    const nextQ = examState.i + 1;

    if (nextQ < questions.length) {
      setExamState({ ...examState, i: nextQ, score: newScore });
      setOutputResult(null);
    } else {
      // Exam finished
      const passed = newScore >= Math.ceil(questions.length * 0.75);
      if (passed && !progress.exam[examState.lv]) {
        let updated = checkStreak(progress);
        updated.exam[examState.lv] = 1;
        updated.xp += 20;
        saveProgress(updated);
        setMascotMsg('¡FELICIDADES! Aprobaste el examen. Se desbloquea el siguiente nivel (+20 XP).');
        setMascotMood('cheer');
      } else if (!passed) {
        setMascotMsg('Casi lo logras. Revisa las lecciones del nivel y vuelve a intentarlo cuando estés listo.');
        setMascotMood('think');
      }
      setExamState({ ...examState, i: nextQ, score: newScore });
    }
  };

  // AI Tutor Query
  const askAITutor = async () => {
    setIsTutorLoading(true);
    setTutorReply('');
    try {
      const currentEx = currentLesson.ex[exerciseIndex];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: tutorQuery || `Necesito una pista pedagógica y explicación para este ejercicio de Luau: "${currentEx?.q}". Mi código actual es: \n${codeValue}`,
          lessonContext: {
            title: currentLesson.title,
            goal: currentLesson.goal,
          },
        }),
      });
      const data = await res.json();
      setTutorReply(data.reply || 'Sin respuesta del tutor.');
    } catch {
      setTutorReply('No se pudo conectar con el servicio del tutor. Por favor intenta de nuevo.');
    } finally {
      setIsTutorLoading(false);
    }
  };

  // Calculate global user level
  const userLevel = Math.floor(progress.xp / 50) + 1;
  const completedLessonsCount = LESSONS_DATA.filter((l) => progress.done[l.id]).length;
  const dueReviewsCount = getDueReviews().length;

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 space-y-6 font-sans bg-[#0c0d10] text-[#dfe2f0]">
      {/* Floating Interactive Mascot Luli */}
      <MascotLuli message={mascotMsg} mood={mascotMood} />

      {/* Academy Subheader & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl bg-[#14151a] border border-[#262832] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d6403a]/15 border border-[#d6403a]/30 flex items-center justify-center text-[#d6403a]">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Academia Luau & Roblox Studio</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#d6403a]/15 text-[#ffb4ab] border border-[#d6403a]/30 font-mono-code">
                Pablito Studios
              </span>
            </div>
            <p className="text-xs text-[#8a8f9d]">Aprende Luau desde cero hasta arquitectura de universos y MCP</p>
          </div>
        </div>

        {/* Global Progress Metrics Strip */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code">
          <div className="flex items-center gap-3 bg-[#0c0d10] px-3.5 py-1.5 rounded-xl border border-[#262832]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#8a8f9d]">Nivel:</span>
              <span className="font-bold text-[#4cd7f6]">{userLevel}</span>
            </div>
            <div className="h-3 w-px bg-[#262832]"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#8a8f9d]">XP:</span>
              <span className="font-bold text-[#ffb95f]">{progress.xp}</span>
            </div>
            <div className="h-3 w-px bg-[#262832]"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#8a8f9d]">Racha:</span>
              <span className="font-bold text-[#5fb37c]">{progress.streak.cur} días</span>
            </div>
            <div className="h-3 w-px bg-[#262832]"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#8a8f9d]">Lecciones:</span>
              <span className="font-bold text-white">
                {completedLessonsCount} / {LESSONS_DATA.length}
              </span>
            </div>
          </div>

          {/* Mode Navigation Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMode('levels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'levels' || mode === 'lesson' || mode === 'practice'
                  ? 'bg-[#d6403a] text-white shadow-md shadow-[#d6403a]/25'
                  : 'bg-[#0c0d10] hover:bg-[#1a1c23] border border-[#262832] text-[#8a8f9d]'
              }`}
            >
              Ruta de Niveles
            </button>

            <button
              onClick={() => {
                const due = getDueReviews();
                setReviewQueue(due);
                setMode('review');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                mode === 'review'
                  ? 'bg-[#d6403a] text-white shadow-md'
                  : 'bg-[#0c0d10] hover:bg-[#1a1c23] border border-[#262832] text-[#8a8f9d]'
              }`}
            >
              Repaso ({dueReviewsCount})
              {dueReviewsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ffb95f] animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setMode('proj')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'proj'
                  ? 'bg-[#d6403a] text-white shadow-md'
                  : 'bg-[#0c0d10] hover:bg-[#1a1c23] border border-[#262832] text-[#8a8f9d]'
              }`}
            >
              Proyectos
            </button>
            <button
              onClick={() => setMode('esp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'esp'
                  ? 'bg-[#d6403a] text-white shadow-md'
                  : 'bg-[#0c0d10] hover:bg-[#1a1c23] border border-[#262832] text-[#8a8f9d]'
              }`}
            >
              Especializaciones
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <div className="w-full max-w-7xl mx-auto">
        {/* 1. LEVELS ROUTE SELECTION (Niveles 1 a 8) */}
        {mode === 'levels' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14151a] via-[#1a1c23] to-[#14151a] border border-[#262832] relative overflow-hidden shadow-xl">
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#d6403a]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono-code text-[#ffb95f] uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">stars</span>
                    <span>Tu Ruta Luau Completa</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1">Elige tu Nivel de Aprendizaje</h2>
                  <p className="text-sm text-[#8a8f9d] max-w-2xl mt-1">
                    Progresa desde las bases de salida y variables hasta la creación de servidores MCP y RemoteEvents seguros para Roblox Studio.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-[#8a8f9d] block">Progreso Total</span>
                    <span className="text-xl font-bold text-[#4cd7f6] font-mono-code">
                      {Math.round((completedLessonsCount / LESSONS_DATA.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-28 h-3 rounded-full bg-[#1f2128] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#d6403a] to-[#ffb95f] rounded-full transition-all duration-500"
                      style={{ width: `${(completedLessonsCount / LESSONS_DATA.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of 8 Levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(LEVELS_DICT).map((lvStr) => {
                const lvNum = parseInt(lvStr, 10);
                const lessonsOfLevel = LESSONS_DATA.filter((l) => l.lv === lvNum);
                const doneCount = lessonsOfLevel.filter((l) => progress.done[l.id]).length;
                const isExamPassed = !!progress.exam[lvNum];
                const firstLessonIndex = LESSONS_DATA.findIndex((l) => l.lv === lvNum);
                const isUnlocked = isLessonUnlocked(firstLessonIndex);

                return (
                  <div
                    key={lvNum}
                    className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                      isUnlocked
                        ? 'bg-[#14151a] border-[#262832] hover:border-[#d6403a]/60 hover:shadow-lg'
                        : 'bg-[#14151a]/60 border-[#262832]/40 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono-code font-bold text-[#ffb95f] uppercase">
                          Nivel {lvNum}
                        </span>
                        {isExamPassed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5fb37c]/20 text-[#5fb37c] border border-[#5fb37c]/40 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check</span> Aprobado
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6]">
                            {doneCount}/{lessonsOfLevel.length}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8a8f9d] flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">lock</span> Bloqueado
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white tracking-tight">{LEVELS_DICT[lvNum]}</h3>
                      <p className="text-xs text-[#8a8f9d] line-clamp-2 leading-relaxed">
                        {LEVEL_DESCRIPTIONS[lvNum]}
                      </p>

                      {/* Lesson Chips */}
                      <div className="flex flex-col gap-1.5 mt-2">
                        {lessonsOfLevel.map((les) => (
                          <button
                            key={les.id}
                            disabled={!isUnlocked}
                            onClick={() => startLesson(les)}
                            className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                              progress.done[les.id]
                                ? 'bg-[#1f2128]/70 text-[#5fb37c]'
                                : 'bg-[#14151a] text-[#dfe2f0] hover:bg-[#1a1c23]'
                            }`}
                          >
                            <span className="truncate">{les.title}</span>
                            {progress.done[les.id] ? (
                              <span className="material-symbols-outlined text-xs text-[#5fb37c]">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-xs text-[#8a8f9d]">arrow_forward</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Level Action Footer */}
                    <div className="mt-4 pt-3 border-t border-[#262832] flex items-center justify-between">
                      <button
                        disabled={!isUnlocked}
                        onClick={() => startExam(lvNum)}
                        className={`text-xs font-semibold hover:underline flex items-center gap-1 ${
                          isExamPassed ? 'text-[#5fb37c]' : 'text-[#ffb95f]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">quiz</span>
                        <span>{isExamPassed ? 'Repetir Examen' : 'Rendir Examen'}</span>
                      </button>
                      {lessonsOfLevel[0] && isUnlocked && (
                        <button
                          onClick={() => {
                            const nextUnfinished = lessonsOfLevel.find((l) => !progress.done[l.id]) || lessonsOfLevel[0];
                            startLesson(nextUnfinished);
                          }}
                          className="px-2.5 py-1 rounded bg-[#d6403a] hover:bg-[#e04e48] text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          Entrar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. LESSON DETAIL VIEW (Explicación, Ejemplos, Misiones) */}
        {mode === 'lesson' && currentLesson && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
            {/* Top Navigation bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMode('levels')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14151a] hover:bg-[#1a1c23] text-xs text-[#8a8f9d] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Volver a Niveles</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code text-[#ffb95f] font-semibold">
                  {LEVELS_DICT[currentLesson.lv]}
                </span>
                <span className="text-xs text-[#8a8f9d]">· {currentLesson.title}</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] flex flex-col gap-5 shadow-xl">
              <div>
                <span className="text-xs font-mono-code text-[#4cd7f6] uppercase tracking-wider font-semibold">
                  Objetivo: {currentLesson.goal}
                </span>
                <h2 className="text-2xl font-bold text-white mt-1 tracking-tight">{currentLesson.title}</h2>
              </div>

              {/* Definition Box */}
              {currentLesson.def && (
                <div className="p-4 rounded-xl bg-[#14151a] border-l-4 border-[#5fb37c] text-sm text-[#dfe2f0] leading-relaxed">
                  <div className="font-bold text-[#5fb37c] text-xs uppercase tracking-wider mb-1">¿Qué es?</div>
                  <div dangerouslySetInnerHTML={{ __html: currentLesson.def }} />
                </div>
              )}

              {/* Easy Explanation */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#8a8f9d]">Explicación Sencilla</h3>
                <div
                  className="text-sm text-[#dfe2f0] leading-relaxed space-y-2"
                  dangerouslySetInnerHTML={{ __html: currentLesson.explain }}
                />
              </div>

              {/* Code Example Block */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#8a8f9d]">Ejemplo de Código</h3>
                <div className="p-4 rounded-xl bg-[#090a0d] border border-[#262832] font-mono-code text-xs text-[#4cd7f6] overflow-x-auto leading-relaxed">
                  <pre>{currentLesson.code}</pre>
                </div>
                <p className="text-xs text-[#8a8f9d] italic">
                  <strong>Qué hace:</strong> {currentLesson.why}
                </p>
              </div>

              {/* Common Errors box */}
              {ERROR_TIPS[currentLesson.id] && (
                <div className="p-4 rounded-xl bg-[#14151a] border-l-4 border-[#d6403a] text-sm text-[#dfe2f0]">
                  <div className="font-bold text-[#ffb4ab] text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span> Errores Comunes
                  </div>
                  <p>{ERROR_TIPS[currentLesson.id]}</p>
                </div>
              )}

              {/* Studio Missions (if Level 8) */}
              {'mis' in currentLesson && currentLesson.mis && (
                <div className="p-4 rounded-xl bg-[#14151a] border border-[#262832] space-y-2">
                  <div className="font-bold text-[#ffb95f] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    <span>Misiones Prácticas en Roblox Studio</span>
                    <span className="text-[10px] text-[#8a8f9d] font-normal">(se prueban en Studio)</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {currentLesson.mis.map((mItem, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-xs text-[#dfe2f0] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!progress.mis[`${currentLesson.id}_${idx}`]}
                          onChange={(e) => {
                            const updated = {
                              ...progress,
                              mis: { ...progress.mis, [`${currentLesson.id}_${idx}`]: e.target.checked },
                            };
                            saveProgress(updated);
                          }}
                          className="rounded border-[#262832] text-[#d6403a] focus:ring-[#d6403a]"
                        />
                        <span>{mItem}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Action */}
              <div className="pt-2 flex items-center justify-between border-t border-[#262832]">
                <button
                  onClick={() => setIsTutorOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f2128] hover:bg-[#262832] text-xs text-[#4cd7f6] font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">neurology</span>
                  <span>Preguntar al Tutor IA</span>
                </button>
                <button
                  onClick={() => startPractice(0)}
                  className="px-5 py-2.5 rounded-lg bg-[#d6403a] hover:bg-[#e04e48] text-white text-xs font-bold shadow-lg shadow-[#d6403a]/25 flex items-center gap-2 transition-all"
                >
                  <span>Empezar Práctica ({currentLesson.ex.length} ejercicios)</span>
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRACTICE ARENA (Interactive Editor / Quizzes) */}
        {mode === 'practice' && currentLesson && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto animate-fade-in">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('lesson')}
                  className="px-2.5 py-1 rounded-lg bg-[#14151a] hover:bg-[#1a1c23] text-xs text-[#8a8f9d]"
                >
                  ← Releer Lección
                </button>
                <span className="text-xs font-mono-code text-white">
                  {currentLesson.title} · Ejercicio {exerciseIndex + 1} de {currentLesson.ex.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTutorOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4cd7f6]/10 text-[#4cd7f6] hover:bg-[#4cd7f6]/20 text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">smart_toy</span>
                  <span>Tutor IA</span>
                </button>
              </div>
            </div>

            {/* Exercise Card */}
            {(() => {
              const currentEx = currentLesson.ex[exerciseIndex];
              if (!currentEx) return null;

              return (
                <div className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] flex flex-col gap-4 shadow-xl">
                  {/* Question header */}
                  <div className="p-4 rounded-xl bg-[#14151a] border border-[#262832] space-y-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#ffb95f]">
                      Qué debes hacer:
                    </span>
                    <h3 className="text-sm font-semibold text-white leading-relaxed">{currentEx.q}</h3>
                  </div>

                  {/* Multiple Choice Mode */}
                  {currentEx.t === 'mc' && (
                    <div className="flex flex-col gap-2 pt-2">
                      {currentEx.opts.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleMultipleChoice(optIdx)}
                          className="w-full text-left p-3.5 rounded-xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] hover:border-[#d6403a]/60 text-xs text-white font-medium transition-all flex items-center justify-between"
                        >
                          <span>{opt}</span>
                          <span className="material-symbols-outlined text-xs text-[#8a8f9d]">chevron_right</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Code Editor Mode */}
                  {currentEx.t === 'code' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs text-[#8a8f9d]">
                        <span className="font-mono-code">Editor Luau (--!strict)</span>
                        <span className="font-mono-code text-[#4cd7f6]">
                          Salida esperada: {currentEx.out.join(' · ')}
                        </span>
                      </div>

                      {/* Code Area */}
                      <div className="relative rounded-xl bg-[#090a0d] border border-[#262832] overflow-hidden focus-within:border-[#d6403a]">
                        <textarea
                          value={codeValue}
                          onChange={(e) => setCodeValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const target = e.target as HTMLTextAreaElement;
                              const start = target.selectionStart;
                              const end = target.selectionEnd;
                              const newVal = codeValue.substring(0, start) + '  ' + codeValue.substring(end);
                              setCodeValue(newVal);
                            }
                          }}
                          rows={6}
                          spellCheck={false}
                          className="w-full bg-transparent text-[#dfe2f0] font-mono-code text-xs p-3.5 outline-none resize-y leading-relaxed"
                          placeholder="-- Escribe tu código Luau aquí"
                        />
                      </div>

                      {/* Editor Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleRunCode}
                            className="px-4 py-2 rounded-lg bg-[#d6403a] hover:bg-[#e04e48] text-white text-xs font-bold shadow-md shadow-[#d6403a]/25 flex items-center gap-1.5 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            <span>Ejecutar y comprobar</span>
                          </button>
                          <button
                            onClick={() => setCodeValue(currentEx.start || '')}
                            className="px-3 py-2 rounded-lg bg-[#14151a] hover:bg-[#1a1c23] text-xs text-[#8a8f9d] transition-colors"
                          >
                            Reiniciar
                          </button>
                          <button
                            onClick={() => {
                              const nextH = Math.min(hintsRevealed + 1, currentEx.hints.length);
                              setHintsRevealed(nextH);
                              setMascotMsg(`Pista ${nextH}: ${currentEx.hints[nextH - 1]}`);
                              setMascotMood('think');
                            }}
                            className="px-3 py-2 rounded-lg bg-[#14151a] hover:bg-[#1a1c23] text-xs text-[#ffb95f] transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">lightbulb</span>
                            <span>Pista ({hintsRevealed}/{currentEx.hints.length})</span>
                          </button>
                          <button
                            disabled={attempts < 2}
                            onClick={() => {
                              setCodeValue(currentEx.sol);
                              setMascotMsg('Solución cargada. Analiza por qué funciona y ejecútala.');
                            }}
                            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                              attempts >= 2
                                ? 'bg-[#14151a] hover:bg-[#1a1c23] text-[#4cd7f6]'
                                : 'bg-[#14151a]/40 text-[#3d494c] cursor-not-allowed'
                            }`}
                          >
                            Ver Solución
                          </button>
                        </div>
                      </div>

                      {/* Output Window */}
                      <div className="p-3.5 rounded-xl bg-[#090a0d] border border-[#262832] font-mono-code text-xs">
                        <div className="text-[10px] text-[#8a8f9d] uppercase tracking-wider font-bold mb-1">
                          Terminal Output:
                        </div>
                        {outputResult ? (
                          <div>
                            {outputResult.out.length > 0 ? (
                              <div className="text-[#5fb37c] whitespace-pre-wrap">
                                {outputResult.out.join('\n')}
                              </div>
                            ) : (
                              <div className="text-[#8a8f9d] italic">(sin salida impresa)</div>
                            )}
                            {outputResult.err && (
                              <div className="text-[#ffb4ab] mt-1 whitespace-pre-wrap">
                                Error: {outputResult.err}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[#3d494c] italic">(Aún no has ejecutado el código)</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hints Box */}
                  {hintsRevealed > 0 && currentEx.t === 'code' && (
                    <div className="p-3.5 rounded-xl bg-[#14151a] border-l-4 border-[#ffb95f] text-xs text-[#dfe2f0] space-y-1">
                      <div className="font-bold text-[#ffb95f]">Pistas desbloqueadas:</div>
                      {currentEx.hints.slice(0, hintsRevealed).map((h, i) => (
                        <div key={i} className="text-[#8a8f9d]">
                          • {h}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Feedback Notification Box */}
                  {feedback && (
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                        feedback.ok
                          ? 'bg-[#5fb37c]/10 border-[#5fb37c]/40 text-[#5fb37c]'
                          : 'bg-[#d6403a]/10 border-[#d6403a]/40 text-[#ffb4ab]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="material-symbols-outlined text-base">
                          {feedback.ok ? 'check_circle' : 'error'}
                        </span>
                        <span>{feedback.msg}</span>
                        {feedback.xpAward && (
                          <span className="font-bold text-[#ffb95f] font-mono-code">
                            +{feedback.xpAward} XP
                          </span>
                        )}
                      </div>
                      {feedback.ok && (
                        <button
                          onClick={handleNextExercise}
                          className="px-4 py-1.5 rounded-lg bg-[#5fb37c] text-[#0a0e17] font-bold text-xs shadow-md hover:brightness-110 flex items-center gap-1 transition-all"
                        >
                          <span>Siguiente</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 4. LEVEL EXAM ARENA */}
        {mode === 'exam' && examState && (
          <div className="flex flex-col gap-5 max-w-3xl mx-auto animate-fade-in">
            {(() => {
              const questions = EXAMS_DATA[examState.lv] || [];
              const currentQ = questions[examState.i];

              // If finished
              if (!currentQ) {
                const passed = examState.score >= Math.ceil(questions.length * 0.75);
                return (
                  <div className="p-8 rounded-2xl bg-[#14151a] border border-[#262832] text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#5fb37c]/20 text-[#5fb37c] flex items-center justify-center mx-auto text-3xl">
                      {passed ? '🏆' : '📚'}
                    </div>
                    <h2 className="text-2xl font-bold text-white">Resultado del Examen</h2>
                    <p className="text-lg font-mono-code font-bold text-[#4cd7f6]">
                      {examState.score} de {questions.length} respuestas correctas
                    </p>
                    <p className="text-sm text-[#8a8f9d] max-w-md mx-auto">
                      {passed
                        ? '¡Excelente! Has demostrado dominar los conceptos clave de este nivel. El siguiente nivel está listo.'
                        : 'No alcanzaste el mínimo requerido (75%). Puedes repasar las lecciones del nivel y volver a intentarlo.'}
                    </p>
                    <button
                      onClick={() => setMode('levels')}
                      className="px-6 py-2.5 rounded-lg bg-[#d6403a] text-white font-bold text-xs transition-all shadow-md"
                    >
                      Volver a Niveles
                    </button>
                  </div>
                );
              }

              return (
                <div className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#8a8f9d] border-b border-[#262832] pb-3">
                    <span className="font-bold text-[#ffb95f]">Examen · {LEVELS_DICT[examState.lv]}</span>
                    <span className="font-mono-code">
                      Pregunta {examState.i + 1} de {questions.length}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{currentQ.q}</h3>

                  {currentQ.t === 'mc' && currentQ.opts && (
                    <div className="flex flex-col gap-2 pt-2">
                      {currentQ.opts.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleExamAnswer(optIdx === currentQ.ans)}
                          className="w-full text-left p-3.5 rounded-xl bg-[#14151a] hover:bg-[#1a1c23] border border-[#262832] text-xs text-white transition-all flex items-center justify-between"
                        >
                          <span>{opt}</span>
                          <span className="material-symbols-outlined text-xs text-[#8a8f9d]">check_circle</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQ.t === 'code' && (
                    <div className="space-y-3 pt-2">
                      <div className="rounded-xl bg-[#090a0d] border border-[#262832] p-3">
                        <textarea
                          rows={4}
                          value={codeValue}
                          onChange={(e) => setCodeValue(e.target.value)}
                          className="w-full bg-transparent text-[#dfe2f0] font-mono-code text-xs outline-none resize-none"
                          placeholder="-- Escribe tu solución para el examen"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const res = executeLuau(codeValue + (currentQ.test ? '\n' + currentQ.test : ''));
                          const isOk = !res.err && res.out.join('\n') === (currentQ.out || []).join('\n');
                          handleExamAnswer(isOk);
                        }}
                        className="w-full py-2.5 rounded-lg bg-[#d6403a] hover:bg-[#e04e48] text-white text-xs font-bold transition-all shadow-md"
                      >
                        Entregar Respuesta
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. SPACED REPETITION REVIEW (Repasos) */}
        {mode === 'review' && (
          <div className="flex flex-col gap-6 max-w-3xl mx-auto animate-fade-in">
            <div className="p-6 rounded-2xl bg-[#14151a] border border-[#262832] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Sistema de Repaso Espaciado</h2>
                  <p className="text-xs text-[#8a8f9d]">
                    Refuerza tu memoria a largo plazo con intervalos de 1, 3, 7, 16 y 35 días.
                  </p>
                </div>
                <span className="text-xs font-mono-code font-bold text-[#ffb95f] px-3 py-1 rounded-lg bg-[#ffb95f]/10">
                  {reviewQueue.length} pendientes hoy
                </span>
              </div>

              {reviewQueue.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#8a8f9d] space-y-3 bg-[#14151a] rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-[#5fb37c]">verified</span>
                  <p>¡No tienes repasos pendientes para el día de hoy!</p>
                  <p className="text-xs text-[#3d494c]">
                    Los ejercicios que superes se programarán automáticamente para los próximos días.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-white">
                    Tienes ejercicios listos para repasar. Haz clic para comenzar la sesión:
                  </p>
                  <button
                    onClick={() => {
                      // Find lesson of first exercise
                      const firstExId = reviewQueue[0];
                      const targetLesson = LESSONS_DATA.find((l) => l.ex.some((e) => e.id === firstExId));
                      if (targetLesson) {
                        const exIdx = targetLesson.ex.findIndex((e) => e.id === firstExId);
                        setCurrentLesson(targetLesson);
                        startPractice(exIdx >= 0 ? exIdx : 0);
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#d6403a] hover:bg-[#e04e48] text-white text-xs font-bold transition-all shadow-md"
                  >
                    Iniciar Sesión de Repaso
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. PROJECTS TAB (Proyectos de Práctica P1, P2, P3) */}
        {mode === 'proj' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white">Proyectos Prácticos Guiados</h2>
              <p className="text-xs text-[#8a8f9d]">
                Sistemas completos desarrollados paso a paso para consolidar tus conocimientos en situaciones reales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PROJECTS_DATA.map((proj) => {
                const isUnlocked = isProjectUnlocked(proj);
                const isDone = !!progress.done[proj.id];

                return (
                  <div
                    key={proj.id}
                    className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                      isUnlocked
                        ? 'bg-[#14151a] border-[#262832] hover:border-[#ffb95f]/50 shadow-lg'
                        : 'bg-[#14151a]/60 border-[#262832]/40 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#ffb95f]/20 text-[#ffb95f]">
                          {LEVELS_DICT[proj.lv]}
                        </span>
                        {isDone && (
                          <span className="text-xs text-[#5fb37c] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check</span> Completado
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">{proj.title}</h3>
                      <p className="text-xs text-[#8a8f9d] leading-relaxed">{proj.goal}</p>
                      <div className="text-[11px] text-[#4cd7f6] font-mono-code">
                        {proj.ex.length} pasos prácticos
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#262832]">
                      <button
                        disabled={!isUnlocked}
                        onClick={() => startLesson(proj)}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
                          isUnlocked
                            ? 'bg-[#d6403a] hover:bg-[#e04e48] text-white shadow-md'
                            : 'bg-[#1f2128] text-[#3d494c] cursor-not-allowed'
                        }`}
                      >
                        {isUnlocked ? 'Comenzar Proyecto' : `Requiere el ${LEVELS_DICT[proj.lv]}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. TRACKS / ESPECIALIZACIONES */}
        {mode === 'esp' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white">Especializaciones & Rutas de Carrera</h2>
              <p className="text-xs text-[#8a8f9d]">Rutas avanzadas para convertirte en Lead Luau Developer y Arquitecto de Roblox.</p>
            </div>

            <div className="space-y-3">
              {TRACKS_DATA.map(([tTitle, tStatus, tDesc], idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#14151a] border border-[#262832] flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{tTitle}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tStatus.includes('Disponible')
                            ? 'bg-[#5fb37c]/20 text-[#5fb37c]'
                            : 'bg-[#ffb95f]/20 text-[#ffb95f]'
                        }`}
                      >
                        {tStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a8f9d] mt-1 leading-relaxed">{tDesc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>

      {/* MODAL: AI TUTOR ASISTENTE PEDAGÓGICO */}
      {isTutorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-[#14151a] border border-[#262832] rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262832] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#4cd7f6]/20 flex items-center justify-center text-[#4cd7f6]">
                  <span className="material-symbols-outlined text-lg">smart_toy</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tutor IA Pedagógico · Studio Copilot</h3>
                  <span className="text-[11px] text-[#8a8f9d]">Contexto: {currentLesson.title}</span>
                </div>
              </div>
              <button
                onClick={() => setIsTutorOpen(false)}
                className="text-[#8a8f9d] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#dfe2f0] leading-relaxed">
              ¿Tienes dudas sobre cómo resolver este ejercicio o necesitas que te explique el concepto con un ejemplo diferente?
            </p>

            <textarea
              value={tutorQuery}
              onChange={(e) => setTutorQuery(e.target.value)}
              placeholder="Ej: ¿Cómo uso el return en esta función? o ¿Por qué me da error de nil?"
              rows={3}
              className="w-full rounded-xl bg-[#090a0d] border border-[#262832] p-3 text-xs text-white placeholder:text-[#3d494c] outline-none focus:border-[#4cd7f6]"
            />

            {tutorReply && (
              <div className="p-4 rounded-xl bg-[#14151a] border border-[#262832] max-h-60 overflow-y-auto text-xs text-[#dfe2f0] whitespace-pre-wrap leading-relaxed">
                {tutorReply}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setIsTutorOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#1f2128] text-xs text-[#8a8f9d] hover:text-white"
              >
                Cerrar
              </button>
              <button
                disabled={isTutorLoading}
                onClick={askAITutor}
                className="px-5 py-2 rounded-lg bg-[#4cd7f6] hover:bg-[#acedff] text-[#003640] font-bold text-xs flex items-center gap-2 shadow-md"
              >
                {isTutorLoading ? (
                  <span>Consultando con Gemini...</span>
                ) : (
                  <>
                    <span>Consultar al Tutor</span>
                    <span className="material-symbols-outlined text-xs">send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
