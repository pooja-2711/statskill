const parliamentFiles = import.meta.glob<string>("../../assets/parliament.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const mascotFiles = import.meta.glob<string>("../../assets/mascot.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const parliamentSrc = Object.values(parliamentFiles)[0] as string | undefined;
const mascotSrc = Object.values(mascotFiles)[0] as string | undefined;

const columns = Array.from({ length: 41 }, (_, i) => 62 + i * 10.8);

export function ParliamentArt() {
  if (parliamentSrc) {
    return <img className="db-art-img" src={parliamentSrc} alt="Indian Parliament building with the national flag" />;
  }
  return (
    <svg
      className="db-art-svg"
      viewBox="0 0 560 270"
      role="img"
      aria-label="Illustration of the Indian Parliament building with the national flag"
    >
      <defs>
        <linearGradient id="pStone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe0bd" />
          <stop offset="1" stopColor="#8d7b57" />
        </linearGradient>
        <radialGradient id="pGlow" cx="50%" cy="55%" r="55%">
          <stop offset="0" stopColor="#ffc928" stopOpacity="0.38" />
          <stop offset="1" stopColor="#ffc928" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="280" cy="170" rx="270" ry="120" fill="url(#pGlow)" />

      <g fill="#120f0a">
        <circle cx="22" cy="206" r="26" />
        <circle cx="48" cy="196" r="22" />
        <circle cx="540" cy="206" r="26" />
        <circle cx="514" cy="196" r="22" />
      </g>

      <rect x="36" y="232" width="488" height="14" rx="3" fill="#3b3223" />
      <rect x="48" y="224" width="464" height="10" fill="#6b5c40" />

      <rect x="60" y="128" width="440" height="98" fill="#241d13" />
      {columns.map((x) => (
        <rect key={x} x={x} y="128" width="5" height="98" fill="url(#pStone)" />
      ))}

      <rect x="52" y="112" width="456" height="18" fill="url(#pStone)" />
      <rect x="58" y="100" width="444" height="12" fill="#b9a67c" />
      <rect x="70" y="90" width="420" height="10" fill="url(#pStone)" />
      <path d="M205 90 Q280 28 355 90 Z" fill="url(#pStone)" />

      <rect x="279" y="8" width="2.5" height="62" fill="#d9cba5" />
      <g className="db-flag">
        <rect x="281.5" y="8" width="50" height="9" fill="#ff9933" />
        <rect x="281.5" y="17" width="50" height="9" fill="#ffffff" />
        <rect x="281.5" y="26" width="50" height="9" fill="#138808" />
        <circle cx="306.5" cy="21.5" r="3.4" fill="none" stroke="#1d2a8f" strokeWidth="1" />
      </g>
    </svg>
  );
}

export function Mascot() {
  if (mascotSrc) {
    return <img src={mascotSrc} alt="Statskill AI assistant" />;
  }
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Statskill AI assistant robot">
      <defs>
        <linearGradient id="mBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cdbdf2" />
        </linearGradient>
        <radialGradient id="mGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#852dff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#852dff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#mGlow)" />
      <line x1="100" y1="38" x2="100" y2="22" stroke="#cdbdf2" strokeWidth="3" />
      <circle cx="100" cy="18" r="5" fill="#ffc928" />
      <rect x="62" y="108" width="76" height="62" rx="30" fill="url(#mBody)" />
      <ellipse cx="54" cy="132" rx="12" ry="20" fill="url(#mBody)" />
      <ellipse cx="146" cy="132" rx="12" ry="20" fill="url(#mBody)" />
      <rect x="76" y="126" width="48" height="30" rx="4" fill="#ffc928" />
      <line x1="100" y1="126" x2="100" y2="156" stroke="#b98c00" strokeWidth="2" />
      <rect x="48" y="38" width="104" height="80" rx="38" fill="url(#mBody)" />
      <circle cx="44" cy="78" r="9" fill="#852dff" />
      <circle cx="156" cy="78" r="9" fill="#852dff" />
      <rect x="60" y="52" width="80" height="52" rx="24" fill="#120a24" />
      <g
        fill="none"
        stroke="#b57bff"
        strokeWidth="5"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px #b57bff)" }}
      >
        <path d="M78 80 q8 -11 16 0" />
        <path d="M106 80 q8 -11 16 0" />
      </g>
    </svg>
  );
}