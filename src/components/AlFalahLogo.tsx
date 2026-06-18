import React from 'react';

interface AlFalahLogoProps {
  className?: string; // Standard React className support
  iconOnly?: boolean;  // Renders only the geometric emblem icon
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
}

export const AlFalahLogo: React.FC<AlFalahLogoProps> = ({ 
  className = '', 
  iconOnly = false,
  size = 'md'
}) => {
  // Size preset mapping
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
    custom: '',
  };

  const appliedClass = size === 'custom' ? className : `${sizeClasses[size]} ${className}`;

  return (
    <div className={`flex flex-col items-center justify-center ${iconOnly ? '' : 'space-y-3'}`}>
      {/* Golden Geometric Calligraphy Logo Emblem */}
      <svg 
        viewBox="0 0 120 75" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={appliedClass}
      >
        {/* Glow behind the emblem */}
        <defs>
          <radialGradient id="gold-radial-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a555" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#d4a555" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="35" r="30" fill="url(#gold-radial-glow)" />

        {/* 3D-like gold lighting effects using precise lines */}
        <g stroke="#d4a555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          
          {/* 1. Left Horizontal Calligraphic Ribbon Block */}
          {/* Outer rectangular structure */}
          <path d="M 12 52 L 12 42 L 72 42 L 72 52 Z" strokeWidth="1.6" />
          {/* Inner decorative maze pathway representing AL-FALAH geometric writing */}
          <path d="M 24 52 L 24 46.5 L 64 46.5 L 64 50 L 32 50" strokeWidth="1.4" />

          {/* 2. Main Vertical Tower Structure (The high minaret with pitched crown) */}
          {/* Tall Tower Left Boundary */}
          <path d="M 75 52 L 75 14 L 81 9 L 81 52" strokeWidth="1.6" />
          {/* Center inner stripe of the dominant minaret */}
          <path d="M 78 17 L 78 52" strokeWidth="1.1" opacity="0.85" />

          {/* 3. Right Tower / High Minaret Spire Pole */}
          <path d="M 102 52 L 102 12" strokeWidth="2.0" />

          {/* 4. Center-Right "Alif" / Short towers and letter curves */}
          {/* An enclosing shape that represents letter loop */}
          <path d="M 85 36 L 98 36 L 98 52" strokeWidth="1.6" />
          {/* Nested inner letter loop column representing word curves */}
          <path d="M 90 38 L 94 38 L 94 52" strokeWidth="1.4" />
          
          {/* 5. Gold Double Horizontal Ground Foundation Rule */}
          <path d="M 12 56.5 L 102 56.5" strokeWidth="1.5" />
          <path d="M 12 59.5 L 102 59.5" strokeWidth="1.0" opacity="0.75" />

        </g>
      </svg>

      {/* Styled text labels matching the uploaded logo */}
      {!iconOnly && (
        <div className="text-center select-none">
          <h2 className="text-sm font-black tracking-[0.22em] text-[#d4a555] font-serif uppercase leading-tight">
            MUSHOLLA AL-FALAH
          </h2>
          {/* Thin horizontal gold separator rule with centered diamond */}
          <div className="flex items-center justify-center my-1.5 space-x-2">
            <div className="h-[0.5px] w-12 bg-[#d4a555]/40"></div>
            <div className="w-1 h-1 rotate-45 bg-[#d4a555]"></div>
            <div className="h-[0.5px] w-12 bg-[#d4a555]/40"></div>
          </div>
          <p className="text-[9px] font-bold tracking-[0.16em] text-slate-350 uppercase">
            VICTORIA PERMAI
          </p>
        </div>
      )}
    </div>
  );
};
