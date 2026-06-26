import React from 'react';

interface AlFalahLogoProps {
  className?: string; // Standard React className support
  iconOnly?: boolean;  // Renders only the geometric emblem icon
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  isDarkMode?: boolean;
}

export const AlFalahLogo: React.FC<AlFalahLogoProps> = ({ 
  className = '', 
  iconOnly = false,
  size = 'md',
  isDarkMode = true
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
    <div className={`flex flex-col items-center justify-center ${iconOnly ? '' : 'space-y-4'}`}>
      {/* Real High-Fidelity 3D Golden Calligraphy Emblem */}
      <svg 
        viewBox="0 0 300 300" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={appliedClass}
      >
        <defs>
          {/* Ultra-luminous 3D Metallic Gold Gradient with high reflection lines */}
          <linearGradient id="gold-3d-reflection" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8c5f1b" />
            <stop offset="12%" stopColor="#dfba5b" />
            <stop offset="25%" stopColor="#fff7d6" />
            <stop offset="40%" stopColor="#c5993a" />
            <stop offset="55%" stopColor="#875713" />
            <stop offset="70%" stopColor="#e5c264" />
            <stop offset="85%" stopColor="#fff9de" />
            <stop offset="100%" stopColor="#a37628" />
          </linearGradient>

          {/* Luxury 3D Gunmetal Frame Gradient matching uploaded logo */}
          <linearGradient id="frame-metallic-3d" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c3042" />
            <stop offset="20%" stopColor="#5c627f" />
            <stop offset="40%" stopColor="#1e212f" />
            <stop offset="60%" stopColor="#8791b5" />
            <stop offset="80%" stopColor="#12141f" />
            <stop offset="100%" stopColor="#3d435e" />
          </linearGradient>

          {/* Luxury subtle drop shadow for realistic 3D depth */}
          <filter id="gold-bevel-3d" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow 
              dx="0" 
              dy="3" 
              stdDeviation="2" 
              floodColor="#000000" 
              floodOpacity={isDarkMode ? "0.85" : "0.35"} 
            />
            {/* Soft secondary ambient glow shadow */}
            <feDropShadow 
              dx="1.5" 
              dy="1.5" 
              stdDeviation="1" 
              floodColor="#aa7c11" 
              floodOpacity={isDarkMode ? "0.2" : "0.05"} 
            />
          </filter>

          {/* Specific 3D Dropshadow for the Metallic Frame */}
          <filter id="frame-shadow-3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow 
              dx="0" 
              dy="4" 
              stdDeviation="3.5" 
              floodColor="#000000" 
              floodOpacity={isDarkMode ? "0.9" : "0.4"} 
            />
          </filter>
        </defs>

        {/* 1. Outer 3D Gunmetal Rounded Frame Wrapper with Custom Elegant Open Bottom-Left Corner */}
        <g filter="url(#frame-shadow-3d)">
          <path 
            d="M 36,190 V 84 A 48,48 0 0 1 84,36 H 216 A 48,48 0 0 1 264,84 V 216 A 48,48 0 0 1 216,264 H 44" 
            stroke="url(#frame-metallic-3d)" 
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* 2. Perfectly Centered 3D Golden Calligraphy */}
        <g filter="url(#gold-bevel-3d)" transform="translate(5, 93)">
          {/* ==========================================
              ACTUAL "LOGO AL-FALAH 3D" GOLD VECTOR REPLICA
             ========================================== */}
          
          {/* Bottom flat foundation bar */}
          <rect 
            x="40" 
            y="98" 
            width="220" 
            height="5.5" 
            fill="url(#gold-3d-reflection)" 
            rx="0.5"
          />

          {/* Left Calligraphy Geometric Loop/Tunnel */}
          {/* Outer Box Top Horizontal Bar */}
          <rect 
            x="40" 
            y="64" 
            width="128" 
            height="5.5" 
            fill="url(#gold-3d-reflection)" 
          />
          
          {/* Outer Left Vertical Bar */}
          <rect 
            x="40" 
            y="64" 
            width="5.5" 
            height="34" 
            fill="url(#gold-3d-reflection)" 
          />

          {/* Inner concentric paths and meanders */}
          {/* Middle Horizontal Bar */}
          <rect 
            x="76" 
            y="75.5" 
            width="92" 
            height="5.5" 
            fill="url(#gold-3d-reflection)" 
          />
          {/* Middle Vertical Connector */}
          <rect 
            x="76" 
            y="75.5" 
            width="5.5" 
            height="17" 
            fill="url(#gold-3d-reflection)" 
          />
          {/* Bottom Inner Meander horizontal */}
          <rect 
            x="81.5" 
            y="87" 
            width="86.5" 
            height="5.5" 
            fill="url(#gold-3d-reflection)" 
          />

          {/* Right Vertical Pillars/Minarets */}
          {/* Tallest master pillar with 45-degree angle top cut (Minaret Peak) */}
          <path 
            d="M 174,22 L 182,14 L 182,98 L 174,98 Z" 
            fill="url(#gold-3d-reflection)" 
          />
          
          {/* Left sibling vertical pillar (Slightly shorter) */}
          <rect 
            x="162.5" 
            y="33" 
            width="6" 
            height="65" 
            fill="url(#gold-3d-reflection)" 
          />

          {/* Square Loop "Fa" shape attached to right main column */}
          {/* Right column */}
          <rect 
            x="207.5" 
            y="54.5" 
            width="6" 
            height="43.5" 
            fill="url(#gold-3d-reflection)" 
          />
          {/* "Fa" Top horizontal block connection */}
          <rect 
            x="189" 
            y="54.5" 
            width="18.5" 
            height="5.5" 
            fill="url(#gold-3d-reflection)" 
          />
          {/* "Fa" Left vertical border */}
          <rect 
            x="189" 
            y="54.5" 
            width="5.5" 
            height="27.5" 
            fill="url(#gold-3d-reflection)" 
          />
          {/* "Fa" Bottom connection */}
          <rect 
            x="189" 
            y="76.5" 
            width="18.5" 
            height="5.5" 
            fill="url(#gold-3d-reflection)" 
          />

          {/* Far-right tall single boundary vertical bar */}
          <rect 
            x="244" 
            y="22" 
            width="5.5" 
            height="76" 
            fill="url(#gold-3d-reflection)" 
          />
        </g>
      </svg>

      {/* Brand Typography matching the exact design uploaded */}
      {!iconOnly && (
        <div className="text-center select-none flex flex-col items-center">
          <h2 className={`text-xs md:text-[13.5px] font-black tracking-[0.25em] uppercase leading-none font-sans ${
            isDarkMode 
              ? 'text-[#dfba5b] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.7)]' 
              : 'text-amber-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]'
          }`}>
            MUSHOLLA AL-FALAH
          </h2>
          
          {/* Luxury gold separator line with centered diamond */}
          <div className="flex items-center justify-center my-3.5 space-x-2 w-full">
            <div className={`h-[0.75px] w-14 bg-gradient-to-r from-transparent ${
              isDarkMode ? 'to-amber-500/60' : 'to-amber-600/40'
            }`}></div>
            <div className={`w-1.5 h-1.5 rotate-45 ${
              isDarkMode ? 'bg-[#dfba5b]' : 'bg-amber-600'
            } shadow-sm`}></div>
            <div className={`h-[0.75px] w-14 bg-gradient-to-l from-transparent ${
              isDarkMode ? 'to-amber-500/60' : 'to-amber-600/40'
            }`}></div>
          </div>

          <p className={`text-[8.5px] font-extrabold tracking-[0.3em] uppercase leading-none font-sans ${
            isDarkMode 
              ? 'text-slate-400 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.65)]' 
              : 'text-slate-600'
          }`}>
            VICTORIA PERMAI
          </p>
        </div>
      )}
    </div>
  );
};
