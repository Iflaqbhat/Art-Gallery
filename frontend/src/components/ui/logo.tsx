import React from "react";
import { BRAND_MARK } from "@/lib/brand";

interface LogoProps {
  className?: string;
  onClick?: () => void;
  title?: string;
  /** When true, renders the compact admin variant */
  variant?: "default" | "admin";
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  onClick,
  title = "Canvaso",
  variant = "default",
}) => {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer select-none ${className}`}
      title={title}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mini-frame mark — a tiny gilded picture frame */}
        <svg
          viewBox="0 0 32 32"
          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 transition-opacity group-hover:opacity-80"
          aria-hidden
        >
          <rect
            x="6"
            y="3"
            width="20"
            height="26"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            fill="none"
          />
          <rect
            x="9"
            y="6"
            width="14"
            height="20"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.5"
          />
          <text
            x="16"
            y="20"
            textAnchor="middle"
            fontSize="9"
            fontStyle="italic"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fill="hsl(var(--primary))"
            fontWeight="500"
            letterSpacing="-0.5"
          >
            CV
          </text>
        </svg>

        <div className="flex flex-col leading-none">
          <span
            className="font-display text-lg sm:text-xl tracking-[0.22em] text-ivory"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif" }}
          >
            {BRAND_MARK}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.42em] uppercase text-champagne/80 mt-1">
            {variant === "admin" ? "Curator" : "Atelier"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
