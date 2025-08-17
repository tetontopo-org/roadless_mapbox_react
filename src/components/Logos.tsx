import React from "react";

type LogoItem = {
  src: string;
  alt: string;
  href?: string;
  height?: number;
  card?: boolean;
};

type Props = {
  items: LogoItem[];
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";
  gap?: number;
  className?: string;
};

export default function Logos({
  items,
  position = "top-left",
  gap = 12,
  className = "",
}: Props) {
  const style: React.CSSProperties = {
    position: "absolute",
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    gap,
    pointerEvents: "none",
  };

  // reset all edges first to avoid leftovers
  Object.assign(style, { top: "auto", right: "auto", bottom: "auto", left: "auto", transform: "none" });

  switch (position) {
    case "top-left":
      Object.assign(style, { top: 12, left: 12 });
      break;
    case "top-right":
      Object.assign(style, { top: 12, right: 12 });
      break;
    case "bottom-left":
      Object.assign(style, { bottom: 12, left: 12 });
      break;
    case "bottom-right":
      Object.assign(style, { bottom: 12, right: 12 });
      break;
    case "bottom-center":
      Object.assign(style, { bottom: 12, left: "50%", transform: "translateX(-50%)" });
      break;
  }

  return (
    <div className={`logos ${className}`} style={style}>
      {items.map((it, i) => {
  const img = (
    <img
      key={i}
      src={it.src}
      alt={it.alt}
      style={{
        height: (it.height ?? 40) + "px",
        width: "auto",
        objectFit: "contain",
        pointerEvents: "auto",
      }}
    />
  );

  const content = it.href ? (
    <a
      key={i}
      href={it.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ pointerEvents: "auto" }}
    >
      {img}
    </a>
  ) : (
    img
  );

  return it.card ? (
    <div key={i} className="logo-card">
      {content}
    </div>
  ) : (
    content
  );
})}
    </div>
  );
}
