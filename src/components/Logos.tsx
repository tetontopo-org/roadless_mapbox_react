import React from "react";

type LogoItem = {
  src: string;        // imported image module (URL string)
  alt: string;        // accessible alt text
  href?: string;      // optional link
  height?: number;    // px height for this logo (defaults to 40)
};

type Props = {
  items: LogoItem[];
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";
  gap?: number;       // px spacing between logos (defaults to 12)
  className?: string; // extra classes if needed
};

export default function Logos({
  items,
  position = "top-left",
  gap = 12,
  className = "",
}: Props) {
  // container classes for corner positioning
  const posClass =
    position === "top-left" ? "logos--tl" :
    position === "top-right" ? "logos--tr" :
    position === "bottom-left" ? "logos--bl" : "logos--br";
    position === "bottom-center" ? "logos--bc" : "logos--br";

  return (
    <div className={`logos ${posClass} ${className}`} style={{ gap }}>
      {items.map((it, i) => {
        const img = (
          <img
            key={i}
            src={it.src}
            alt={it.alt}
            style={{ height: (it.height ?? 40) + "px", width: "auto", objectFit: "contain" }}
          />
        );
        return it.href ? (
          <a key={i} href={it.href} target="_blank" rel="noopener noreferrer" className="logo-link">
            {img}
          </a>
        ) : (
          img
        );
      })}
    </div>
  );
}
