import React from 'react';

// Morphing SVG Paths
// All paths share the exact same structure: M + 4 Cubic Bezier Curves (C) + Z
// Winding order: Clockwise starting from Top -> Right -> Bottom -> Left
// This identical structure ensures perfect 1:1 smooth morphing interpolation.
const PATHS = [
  // 0: Default shape - circular (symmetrical, soft edges)
  "M 50,8 C 73,8 92,27 92,50 C 92,73 73,92 50,92 C 27,92 8,73 8,50 C 8,27 27,8 50,8 Z",

  // 1: Student shape - rounded rhombus (diamond shape with rounded corners)
  "M 50,10 C 62,10 90,38 90,50 C 90,62 62,90 50,90 C 38,90 10,62 10,50 C 10,38 38,10 50,10 Z",

  // 2: Club shape - circular (symmetrical, soft edges)
  "M 50,8 C 73,8 92,27 92,50 C 92,73 73,92 50,92 C 27,92 8,73 8,50 C 8,27 27,8 50,8 Z",

  // 3: Department shape - structured shape (more geometric, squircle, squared edges but smooth)
  "M 50,10 C 85,10 90,15 90,50 C 90,85 85,90 50,90 C 15,90 10,85 10,50 C 10,15 15,10 50,10 Z"
];

export const MagneticEyesLogo: React.FC<{ className?: string; style?: React.CSSProperties; activeIndex?: number | null }> = ({ className = "", style, activeIndex = null }) => {
  // Map activeIndex to the corresponding path
  const targetPathIndex = activeIndex === null ? 0 : activeIndex + 1;
  const targetPath = PATHS[targetPathIndex] || PATHS[0];

  return (
    <div className={`relative flex items-center justify-center w-[200px] h-[200px] transition-all duration-300 hover:scale-105 ${className}`} style={style}>
      <div className="relative w-full h-full flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 m-auto w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {/* Outer Ring Background (Matches previous div ring) */}
          <path
            d={targetPath}
            fill="hsl(var(--background))"
            fillOpacity={0.4}
            stroke="hsl(var(--border))"
            strokeOpacity={0.8}
            strokeWidth="0.8"
            className="drop-shadow-sm"
            style={{
              transition: 'all 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: 'scale(1.15)',
              transformOrigin: '50px 50px'
            }}
          />

          {/* Inner Blob Shape */}
          <path
            d={targetPath}
            fill="currentColor"
            className="text-primary drop-shadow-md"
            style={{
              transition: 'all 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: 'scale(0.95)',
              transformOrigin: '50px 50px'
            }}
          />
        </svg>

        {/* Internal Logo */}
        <img
          src="/images/home-logo2.png"
          alt="Portal Logo"
          className="relative z-10 w-20 h-20 object-contain pointer-events-none drop-shadow-sm opacity-90 transition-opacity duration-300"
        />
      </div>
    </div>
  );
};

export default MagneticEyesLogo;
