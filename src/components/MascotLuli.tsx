import React, { useState, useEffect, useRef } from 'react';
import { MASCOT_QUOTES } from '../data/academyData';

interface MascotLuliProps {
  message?: string;
  mood?: 'happy' | 'cheer' | 'think';
  onDismissMessage?: () => void;
}

export const MascotLuli: React.FC<MascotLuliProps> = ({
  message = '¡Hola! Soy Luli. Elige una lección y aprendamos Luau juntos paso a paso.',
  mood = 'happy',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentText, setCurrentText] = useState(message);
  const [currentMood, setCurrentMood] = useState<'happy' | 'cheer' | 'think'>(mood);
  const [pos, setPos] = useState({ x: window.innerWidth - 110, y: window.innerHeight - 130 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
    if (message) {
      setCurrentText(message);
      setIsOpen(true);
    }
  }, [message]);

  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // Keep within viewport on resize
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => ({
        x: Math.min(window.innerWidth - 100, Math.max(16, prev.x)),
        y: Math.min(window.innerHeight - 110, Math.max(16, prev.y)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = {
      x: pos.x,
      y: pos.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      hasMoved.current = true;
    }
    const newX = Math.min(window.innerWidth - 90, Math.max(10, dragStart.current.x + dx));
    const newY = Math.min(window.innerHeight - 90, Math.max(10, dragStart.current.y + dy));
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (!hasMoved.current) {
      setIsOpen((prev) => !prev);
    }
  };

  const giveCheer = () => {
    const quotes = MASCOT_QUOTES.MOTIVATIONAL;
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentText(q);
    setCurrentMood('cheer');
    setIsOpen(true);
  };

  const tellFun = () => {
    const jokes = MASCOT_QUOTES.FUNNY;
    const j = jokes[Math.floor(Math.random() * jokes.length)];
    setCurrentText(j);
    setCurrentMood('think');
    setIsOpen(true);
  };

  // Determine speech bubble placement
  const isNearTop = pos.y < 220;
  const isNearRight = pos.x > window.innerWidth - 260;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 60,
        touchAction: 'none',
      }}
      className="select-none"
    >
      {/* Speech Bubble */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: isNearTop ? 'auto' : '88px',
            top: isNearTop ? '88px' : 'auto',
            right: isNearRight ? '0px' : 'auto',
            left: isNearRight ? 'auto' : '0px',
            width: '240px',
          }}
          className="bg-[#14151a]/95 backdrop-blur-md border border-[#262832] rounded-2xl p-3 shadow-2xl text-xs text-[#dfe2f0] flex flex-col gap-2 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#262832] pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#ffb95f]">
              <span className="w-2 h-2 rounded-full bg-[#ffb95f] animate-pulse"></span>
              <span>Luli</span>
              <span className="text-[10px] text-[#8a8f9d] font-normal font-mono-code">(Mascota)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#8a8f9d] hover:text-white transition-colors"
              title="Cerrar mensaje"
            >
              ✕
            </button>
          </div>
          <p className="leading-relaxed font-sans-editorial text-[13px]">{currentText}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={giveCheer}
              className="flex-1 py-1 px-2 rounded-lg bg-[#1f2128] hover:bg-[#262832] text-[#ffb95f] font-semibold text-[11px] transition-all"
            >
              Ánimo
            </button>
            <button
              onClick={tellFun}
              className="flex-1 py-1 px-2 rounded-lg bg-[#1f2128] hover:bg-[#262832] text-[#4cd7f6] font-semibold text-[11px] transition-all"
            >
              Dato Curioso
            </button>
          </div>
        </div>
      )}

      {/* Interactive Mascot Avatar SVG */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        tabIndex={0}
        role="button"
        aria-label="Luli, tu mascota de la academia. Arrastra para mover o pulsa para interactuar."
        className={`w-20 h-20 cursor-grab active:cursor-grabbing transition-transform hover:scale-105 ${
          currentMood === 'cheer' ? 'animate-mascot-hop' : ''
        }`}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 96 96"
          role="img"
          aria-label="Luli"
          className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
        >
          {/* Antenna */}
          <line x1="48" y1="14" x2="48" y2="26" stroke="#a59d99" strokeWidth="3" />
          <circle cx="48" cy="11" r="5" fill="#f2b84b" className="animate-pulse" />

          {/* Ears with brand red accent */}
          <path d="M22 36 14 22l16 6zM74 36l8-14-16 6z" fill="#d6403a" />

          {/* Main Body with Pablito Studios brand warm red and cute shape */}
          <ellipse cx="48" cy="58" rx="34" ry="32" fill="#d6403a" />
          <ellipse cx="48" cy="67" rx="22" ry="19" fill="#f6e3d4" />

          {/* Eyes */}
          <circle cx="36" cy="50" r="5" fill="#2a1d1d" />
          <circle cx="60" cy="50" r="5" fill="#2a1d1d" />
          <circle cx="37.5" cy="48.5" r="1.7" fill="#fff" />
          <circle cx="61.5" cy="48.5" r="1.7" fill="#fff" />

          {/* Cheeks */}
          <circle cx="27" cy="60" r="4" fill="#f08a84" opacity=".75" />
          <circle cx="69" cy="60" r="4" fill="#f08a84" opacity=".75" />

          {/* Mouth according to mood */}
          {currentMood === 'cheer' ? (
            <path d="M40 60q8 10 16 0z" fill="#2a1d1d" />
          ) : currentMood === 'think' ? (
            <circle cx="48" cy="63" r="3" fill="#2a1d1d" />
          ) : (
            <path d="M41 61q7 7 14 0" stroke="#2a1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
        </svg>
      </div>
    </div>
  );
};
