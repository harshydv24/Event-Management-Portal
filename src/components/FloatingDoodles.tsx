import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Minimal event-themed SVG doodles (line art) ── */
const doodlePaths = [
  // Calendar
  `<rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.5"/>`,
  // Music note
  `<path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  // Microphone
  `<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  // Star
  `<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  // Trophy
  `<path d="M6 9H4a2 2 0 0 1 0-4h2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18 9h2a2 2 0 0 0 0-4h-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 22h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 19.24 17 20v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  // Lightning bolt
  `<polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  // Users / people
  `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  // Map pin
  `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  // Clock
  `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="12,6 12,12 16,14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Ticket
  `<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13 5v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 17v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 11v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  // Megaphone / speaker
  `<path d="M11 5L6 9H2v6h4l5 4V5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  // Heart
  `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
];

interface DoodleItem {
  id: number;
  pathIndex: number;
  x: number;      // percentage position
  y: number;
  size: number;    // px
  rotation: number;
  opacity: number;
}

// Fixed seed-based positions — edges only, avoiding center card region
const generateDoodles = (): DoodleItem[] => {
  const positions = [
    // Top edge
    { x: 3, y: 3 }, { x: 18, y: 5 }, { x: 82, y: 4 }, { x: 95, y: 3 },
    // Left edge
    { x: 3, y: 25 }, { x: 5, y: 50 }, { x: 2, y: 75 },
    // Right edge
    { x: 95, y: 28 }, { x: 97, y: 52 }, { x: 94, y: 78 },
    // Bottom edge
    { x: 4, y: 92 }, { x: 20, y: 95 }, { x: 50, y: 94 }, { x: 80, y: 93 }, { x: 96, y: 90 },
    // Corner accents
    { x: 10, y: 10 }, { x: 90, y: 12 }, { x: 8, y: 85 },
  ];

  return positions.map((pos, i) => ({
    id: i,
    pathIndex: i % doodlePaths.length,
    x: pos.x,
    y: pos.y,
    size: 20 + (i % 4) * 6,              // 20–38px
    rotation: (i * 37) % 360,             // deterministic spread
    opacity: 0.08 + (i % 3) * 0.03,      // 0.08–0.14
  }));
};

const DOODLES = generateDoodles();
const INFLUENCE_RADIUS = 150;  // px — cursor interaction range
const MAX_SHIFT = 50;          // px — max displacement toward cursor

const FloatingDoodles = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);
  const doodleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // Update transforms via rAF for smooth performance
  useEffect(() => {
    const update = () => {
      doodleRefs.current.forEach((el) => {
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = mousePos.x - cx;
        const dy = mousePos.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < INFLUENCE_RADIUS) {
          const factor = (1 - dist / INFLUENCE_RADIUS);
          const eased = factor * factor; // quadratic ease
          const shiftX = dx * eased * (MAX_SHIFT / INFLUENCE_RADIUS);
          const shiftY = dy * eased * (MAX_SHIFT / INFLUENCE_RADIUS);

          el.style.transform = `translate(${shiftX}px, ${shiftY}px) rotate(${el.dataset.rot}deg)`;
          el.style.opacity = String(Number(el.dataset.baseOpacity) + eased * 0.12);
        } else {
          el.style.transform = `translate(0px, 0px) rotate(${el.dataset.rot}deg)`;
          el.style.opacity = el.dataset.baseOpacity || '0.1';
        }
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mousePos]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-[1]"
      aria-hidden="true"
    >
      {DOODLES.map((doodle) => (
        <div
          key={doodle.id}
          ref={(el) => { doodleRefs.current[doodle.id] = el; }}
          data-rot={doodle.rotation}
          data-base-opacity={doodle.opacity}
          className="absolute text-foreground transition-[opacity] duration-500"
          style={{
            left: `${doodle.x}%`,
            top: `${doodle.y}%`,
            width: doodle.size,
            height: doodle.size,
            opacity: doodle.opacity,
            transform: `rotate(${doodle.rotation}deg)`,
            willChange: 'transform, opacity',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="100%"
            height="100%"
            dangerouslySetInnerHTML={{ __html: doodlePaths[doodle.pathIndex] }}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingDoodles;
