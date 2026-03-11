import { useState, useEffect, useCallback } from "react";

const USD_TO_ARS_DEFAULT = 1399;
const POLL_INTERVAL_MS = 30000;
const LIVE_DATA_URL = "/api/concerts-live";
const FALLBACK_DATA_URL = "/concerts.json";

const CONCERTS_DATA = [
  { id: 1, artist: "Bad Bunny", venue: "Estadio River Plate", city: "Buenos Aires", date: "2026-02-13", genre: "Urbano", demand: 100, priceARS: 207000, soldPct: 100, notified: false, emoji: "🐰", tag: "AGOTADO", origen: "Internacional" },
  { id: 2, artist: "Nicki Nicole", venue: "Teatro Colón", city: "Buenos Aires", date: "2026-02-19", genre: "Urbano / Trap", demand: 100, priceARS: 85000, soldPct: 100, notified: false, emoji: "🦋", tag: "AGOTADO", origen: "Nacional" },
  { id: 3, artist: "My Chemical Romance", venue: "Estadio Huracán", city: "Buenos Aires", date: "2026-03-01", genre: "Rock", demand: 100, priceARS: 180000, soldPct: 100, notified: false, emoji: "🖤", tag: "AGOTADO", origen: "Internacional" },
  { id: 4, artist: "Soda Stereo — ECOS", venue: "Movistar Arena", city: "Buenos Aires", date: "2026-03-21", genre: "Rock Nacional", demand: 100, priceARS: 220000, soldPct: 100, notified: false, emoji: "🔮", tag: "AGOTADO (11 fechas)", origen: "Nacional", nota: "Con recreación tecnológica de Gustavo Cerati" },
  { id: 5, artist: "Fito Páez", venue: "Movistar Arena", city: "Buenos Aires", date: "2026-03-19", genre: "Rock Nacional", demand: 88, priceARS: 95000, soldPct: 80, notified: false, emoji: "🎹", tag: "Alta demanda", origen: "Nacional", nota: "2 fechas: 19 y 20 de marzo" },
  { id: 6, artist: "AC/DC", venue: "Estadio River Plate", city: "Buenos Aires", date: "2026-03-23", genre: "Rock", demand: 100, priceARS: 207000, soldPct: 100, notified: false, emoji: "⚡", tag: "AGOTADO (3 fechas)", origen: "Internacional" },
  { id: 7, artist: "Lollapalooza Argentina", venue: "Hipódromo de San Isidro", city: "Buenos Aires", date: "2026-03-13", genre: "Festival", demand: 91, priceARS: 375000, soldPct: 88, notified: false, emoji: "🎪", tag: "Últimas entradas", origen: "Internacional", nota: "Sabrina Carpenter · Tyler The Creator · Lorde · Chappell Roan" },
  { id: 8, artist: "Babasónicos", venue: "Movistar Arena", city: "Buenos Aires", date: "2026-05-28", genre: "Rock Nacional", demand: 92, priceARS: 110000, soldPct: 90, notified: false, emoji: "🌀", tag: "Casi agotado", origen: "Nacional", nota: "Presentan nuevo álbum 'Escenas'" },
  { id: 9, artist: "Megadeth", venue: "Tecnópolis", city: "Buenos Aires", date: "2026-04-30", genre: "Metal", demand: 79, priceARS: 160000, soldPct: 65, notified: false, emoji: "💀", tag: "Alta demanda", origen: "Internacional", nota: "Gira de despedida THIS WAS OUR LIFE" },
  { id: 10, artist: "Lali", venue: "Estadio River Plate", city: "Buenos Aires", date: "2026-06-06", genre: "Pop Nacional", demand: 99, priceARS: 70000, soldPct: 98, notified: false, emoji: "👿", tag: "Casi agotado", origen: "Nacional" },
  { id: 11, artist: "Divididos", venue: "Cosquín Rock / Estadio Vélez", city: "Córdoba / Bs.As.", date: "2026-02-15", genre: "Rock Nacional", demand: 82, priceARS: 185000, soldPct: 72, notified: false, emoji: "🎸", tag: "Alta demanda", origen: "Nacional", nota: "Cosquín Rock día 2 + fecha en CABA" },
  { id: 12, artist: "Airbag", venue: "Estadio River Plate", city: "Buenos Aires", date: "2026-07-15", genre: "Rock Nacional", demand: 85, priceARS: 90000, soldPct: 70, notified: false, emoji: "✈️", tag: "Alta demanda", origen: "Nacional", nota: "Récord: 5 veces en River en el mismo año" },
  { id: 13, artist: "Rosalía — LUX TOUR", venue: "Movistar Arena", city: "Buenos Aires", date: "2026-08-01", genre: "Flamenco Pop", demand: 85, priceARS: 220000, soldPct: 76, notified: false, emoji: "🌹", tag: "Alta demanda", origen: "Internacional", nota: "2 fechas: 1 y 2 de agosto" },
  { id: 14, artist: "Iron Maiden", venue: "Estadio Huracán", city: "Buenos Aires", date: "2026-10-20", genre: "Metal", demand: 72, priceARS: 195000, soldPct: 58, notified: false, emoji: "🤘", tag: "Media demanda", origen: "Internacional" },
  { id: 15, artist: "Martin Garrix", venue: "Tecnópolis", city: "Buenos Aires", date: "2026-05-16", genre: "Electrónica", demand: 68, priceARS: 130000, soldPct: 54, notified: false, emoji: "🎛️", tag: "Media demanda", origen: "Internacional" },
];

const GENRES = ["Todos", "Rock Nacional", "Pop Nacional", "Urbano / Trap", "Rock", "Metal", "Festival", "Electrónica", "Flamenco Pop"];
const ORIGEN = ["Todos", "Nacional", "Internacional"];

function getDemandInfo(demand) {
  if (demand === 100) return { color: "#ff2d55", glow: "#ff2d5540" };
  if (demand >= 90)   return { color: "#ff6b35", glow: "#ff6b3540" };
  if (demand >= 75)   return { color: "#ffd60a", glow: "#ffd60a30" };
  if (demand >= 50)   return { color: "#30d158", glow: "#30d15830" };
  return { color: "#636366", glow: "transparent" };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function formatUpdatedDate(dateStr) {
  if (!dateStr) return "sin dato";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "sin dato";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function formatSyncTime(dateObj) {
  if (!dateObj) return "—";
  return dateObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const fmtARS = (n) => "$" + n.toLocaleString("es-AR");
const fmtUSD = (ars, rate) => "US$" + Math.round(ars / rate).toLocaleString("en-US");

function DemandRing({ value, size = 48 }) {
  const { color } = getDemandInfo(value);
  const cx = size / 2, r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

function Toast({ concert, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, left: 16, zIndex: 9999,
      background: "var(--color-surface-elevated)", border: "1px solid rgba(48,209,88,.45)",
      borderRadius: 16, padding: "14px 18px",
      boxShadow: "0 20px 60px rgba(0,0,0,.9)",
      animation: "toastIn .4s cubic-bezier(.34,1.56,.64,1)",
      fontFamily: "inherit", maxWidth: 340, margin: "0 auto",
    }}>
      <div style={{ fontSize: 10, color: "var(--color-success)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>🔔 Alerta activada</div>
      <div style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>{concert.artist}</div>
      <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>{concert.venue} · {formatDate(concert.date)}</div>
      <div style={{ fontSize: 11, color: "var(--color-success)", marginTop: 4 }}>Te avisaremos si salen nuevas entradas</div>
    </div>
  );
}

export default function App() {
  const [concerts, setConcerts]   = useState(CONCERTS_DATA);
  const [usdToArs, setUsdToArs]   = useState(USD_TO_ARS_DEFAULT);
  const [dataUpdatedAt, setDataUpdatedAt] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [syncError, setSyncError]   = useState(null);
  const [genre, setGenre]         = useState("Todos");
  const [origen, setOrigen]       = useState("Todos");
  const [sort, setSort]           = useState("demand");
  const [search, setSearch]       = useState("");
  const [showUSD, setShowUSD]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [animKey, setAnimKey]     = useState(0);
  const [isMobile, setIsMobile]   = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const threshold = isMobile ? 70 : 110;
      setIsHeaderCompact(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const fetchPayload = useCallback(async (url) => {
    const response = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, []);

  const loadConcerts = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) setLoading(true);

    try {
      let payload;
      try {
        payload = await fetchPayload(LIVE_DATA_URL);
      } catch {
        payload = await fetchPayload(FALLBACK_DATA_URL);
      }

      const remoteConcerts = Array.isArray(payload.concerts) ? payload.concerts : [];
      const remoteRate = Number(payload.usdToArs) || USD_TO_ARS_DEFAULT;

      setConcerts(prev => {
        const prevNotified = new Map(prev.map(c => [c.id, c.notified]));
        return remoteConcerts.map(c => ({
          ...c,
          notified: prevNotified.get(c.id) ?? false,
        }));
      });

      setUsdToArs(remoteRate);
      setDataUpdatedAt(payload.updatedAt || null);
        {isHeaderCompact ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            maxWidth: isMobile ? 220 : 280,
            margin: "0 auto",
            borderRadius: 12,
            background: "transparent",
            border: "none",
            padding: 0,
            boxShadow: "none",
            transition: "all .28s ease",
          }}>
            <img
              src="/logo-radar-recitales.png"
              alt="Radar de Recitales"
              style={{
                width: "100%",
                maxWidth: isMobile ? 170 : 220,
                height: "auto",
                objectFit: "contain",
                margin: 0,
                display: "block",
                transition: "max-width .28s ease",
              }}
            />
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 12,
            }}>
              {[
                { key: "Todos", color: "#b2b8c5", icon: "🌍" },
                { key: "Nacional", color: "#ffd60a", icon: "🇦🇷" },
                { key: "Internacional", color: "#30d158", icon: "🌍" },
              ].map(({ key, color, icon }) => (
                <button
                  key={key}
                  onClick={() => setOrigen(key)}
                  title={key}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 6px ${color}66`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    color: key === "Nacional" ? "#222" : "#fff",
                    fontWeight: 700,
                    border: origen === key ? "2px solid #fff" : "2px solid transparent",
                    outline: "none",
                    cursor: "pointer",
                    transition: "border .18s",
                  }}
                >{icon}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            maxWidth: isMobile ? 390 : 520,
            margin: "0 auto",
            borderRadius: 18,
            background: "linear-gradient(180deg, rgba(29,35,48,.95), rgba(23,27,35,.95))",
            border: "1px solid var(--color-border-soft)",
            padding: isMobile ? "12px 14px" : "14px 18px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
            transition: "all .28s ease",
          }}>
            <img
              src="/logo-radar-recitales.png"
              alt="Radar de Recitales"
              style={{
                width: "100%",
                maxWidth: isMobile ? 320 : 420,
                height: "auto",
                objectFit: "contain",
                margin: "0 auto",
                display: "block",
                transition: "max-width .28s ease",
              }}
            />
          </div>
        )}
        input::placeholder { color:var(--color-text-tertiary); }
        /* pill scroll row */
        .scroll-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 4px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scroll-row::-webkit-scrollbar { display: none; }
        .scroll-row > * { flex-shrink: 0; }
      `}</style>

      {/* ───── HEADER ───── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(14,17,23,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--color-border-soft)",
        padding: isHeaderCompact
          ? (isMobile ? "8px 12px 8px" : "10px 16px 10px")
          : (isMobile ? "16px 16px 14px" : "22px 20px 18px"),
        textAlign: "center",
        transition: "padding .28s ease, background .28s ease",
      }}>
        <div style={{
          fontSize: isHeaderCompact ? 8 : 10,
          letterSpacing: isHeaderCompact ? 2.5 : 4,
          color: "var(--color-success)",
          textTransform: "uppercase",
          marginBottom: isHeaderCompact ? 4 : 10,
          opacity: isHeaderCompact ? 0.8 : 1,
          transition: "all .28s ease",
        }}>
          ◆ ARGENTINA ◆ 2026 ◆
        </div>
        <div style={{
          maxWidth: isHeaderCompact
            ? (isMobile ? 220 : 280)
            : (isMobile ? 390 : 520),
          margin: "0 auto",
          borderRadius: isHeaderCompact ? 12 : 18,
          background: isHeaderCompact
            ? "transparent"
            : "linear-gradient(180deg, rgba(29,35,48,.95), rgba(23,27,35,.95))",
          border: isHeaderCompact ? "none" : "1px solid var(--color-border-soft)",
          padding: isHeaderCompact
            ? 0
            : (isMobile ? "12px 14px" : "14px 18px"),
          boxShadow: isHeaderCompact
            ? "none"
            : "0 16px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
          transition: "all .28s ease",
        }}>
          <img
            src="/logo-radar-recitales.png"
            alt="Radar de Recitales"
            style={{
              width: "100%",
              maxWidth: isHeaderCompact
                ? (isMobile ? 170 : 220)
                : (isMobile ? 320 : 420),
              height: "auto",
              objectFit: "contain",
              margin: "0 auto",
              display: "block",
              transition: "max-width .28s ease",
            }}
          />
        </div>
        {isHeaderCompact ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginTop: 0,
            marginBottom: 0,
          }}>
            <img
              src="/logo-radar-recitales.png"
              alt="Radar de Recitales"
              style={{
                width: "100%",
                maxWidth: isMobile ? 170 : 220,
                height: "auto",
                objectFit: "contain",
                display: "block",
                transition: "max-width .28s ease",
              }}
            />
            <div style={{
              display: "flex",
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
            }}>
              {[
                { key: "Todos", color: "#b2b8c5", icon: "🌍" },
                { key: "Nacional", color: "#ffd60a", icon: "🇦🇷" },
                { key: "Internacional", color: "#30d158", icon: "🌍" },
              ].map(({ key, color, icon }) => (
                <button
                  key={key}
                  onClick={() => setOrigen(key)}
                  title={key}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 6px ${color}66`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    color: key === "Nacional" ? "#222" : "#fff",
                    fontWeight: 700,
                    border: origen === key ? "2px solid #fff" : "2px solid transparent",
                    outline: "none",
                    cursor: "pointer",
                    transition: "border .18s",
                  }}
                >{icon}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 12,
            flexWrap: "wrap",
          }}>
            {[
              { label: `${notifiedCount} alerta${notifiedCount !== 1 ? "s" : ""}`, color: "var(--color-success)", bg: "rgba(48,209,88,.14)", border: "rgba(48,209,88,.35)" },
              { label: `🇦🇷 ${nacionales} nacionales`, color: "#ffd60a", bg: "rgba(255,214,10,.12)", border: "rgba(255,214,10,.34)" },
              { label: `${concerts.length} shows`, color: "var(--color-text-secondary)", bg: "rgba(178,184,197,.12)", border: "rgba(178,184,197,.32)" },
            ].map(({ label, color, bg, border }) => (
              <span key={label} style={{
                fontSize: 13,
                color,
                letterSpacing: 0.3,
                fontWeight: 700,
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 999,
                padding: "5px 10px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>{label}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: isMobile ? "16px 12px 0" : "22px 16px 0" }}>

        {/* ───── BANNER ───── */}
        <div style={{
          background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: 14,
          padding: "10px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
          boxShadow: "0 10px 28px rgba(0,0,0,.22)",
        }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            📡 <span style={{ color: "#aaa" }}>{formatUpdatedDate(dataUpdatedAt)}</span>
            {"  ·  "}
            <span style={{ color: syncError ? "#ff2d55" : "#30d158" }}>{syncError ? "Offline" : "En vivo"}</span>
            {"  ·  "}
            💱 USD/ARS: <span style={{ color: "#30d158" }}>${usdToArs.toLocaleString("es-AR")}</span>
            {"  ·  "}
            <span style={{ color: "var(--color-text-muted)" }}>dato: {formatUpdatedDate(dataUpdatedAt)} · sync: {formatSyncTime(lastSyncAt)}</span>
          </div>
          <button onClick={handleRefresh} className="pill" style={{
            padding: "5px 13px", borderRadius: 99,
            background: loading ? "var(--color-surface)" : "rgba(48,209,88,0.15)",
            border: "1px solid rgba(48,209,88,0.35)",
            color: loading ? "var(--color-text-secondary)" : "var(--color-success)",
            fontSize: 13, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
            boxShadow: loading ? "none" : "0 6px 16px rgba(48,209,88,0.18)",
          }}>
            <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>⟳</span>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        {/* ───── SEARCH ROW ───── */}
        <div style={{ display: "flex", gap: 7, marginBottom: 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Artista, lugar o ciudad…"
            style={{
              flex: 1, minWidth: 0, width: "100%",
              background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12,
              padding: "10px 13px", color: "var(--color-text-primary)", fontSize: 15, fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 7, width: isMobile ? "100%" : "auto" }}>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              flex: isMobile ? 1 : "unset",
              background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12,
              padding: "10px 10px", color: "var(--color-text-primary)", fontSize: 14, fontFamily: "inherit", cursor: "pointer",
            }}>
              <option value="demand">↓ Demanda</option>
              <option value="date">↑ Fecha</option>
              <option value="price">↑ Precio</option>
            </select>
            <button onClick={() => setShowUSD(s => !s)} className="pill" style={{
              flex: isMobile ? 1 : "unset",
              padding: "9px 12px", borderRadius: 12,
              background: showUSD ? "rgba(48,209,88,0.12)" : "var(--color-surface)",
              border: showUSD ? "1px solid #30d15866" : "1px solid var(--color-border)",
              color: showUSD ? "#30d158" : "var(--color-text-secondary)",
              fontSize: 13, fontFamily: "inherit", whiteSpace: "nowrap",
            }}>
              {showUSD ? "🟢 ARS" : "💵 USD"}
            </button>
          </div>
        </div>

        {/* ───── ORIGEN PILLS (scrollable) ───── */}
        <div className="scroll-row" style={{ marginBottom: 8 }}>
          {ORIGEN.map(o => (
            <button key={o} className="pill" onClick={() => setOrigen(o)} style={{
              padding: "5px 14px", borderRadius: 99,
              border: origen === o ? "1px solid #ffd60a" : "1px solid var(--color-border-soft)",
              background: origen === o ? "rgba(255,214,10,0.12)" : "transparent",
              color: origen === o ? "#ffd60a" : "var(--color-text-secondary)",
              fontSize: 11, letterSpacing: 0.4, fontFamily: "inherit",
            }}>
              {o === "Nacional" ? "🇦🇷 " : o === "Internacional" ? "🌍 " : ""}{o}
            </button>
          ))}
        </div>

        {/* ───── GENRE PILLS (scrollable) ───── */}
        <div className="scroll-row" style={{ marginBottom: 20 }}>
          {GENRES.map(g => (
            <button key={g} className="pill" onClick={() => setGenre(g)} style={{
              padding: "4px 11px", borderRadius: 99,
              border: genre === g ? "1px solid rgba(48,209,88,0.45)" : "1px solid var(--color-border-soft)",
              background: genre === g ? "rgba(48,209,88,0.14)" : "transparent",
              color: genre === g ? "var(--color-success)" : "var(--color-text-secondary)",
              fontSize: 10, letterSpacing: 0.3, fontFamily: "inherit",
            }}>
              {g}
            </button>
          ))}
        </div>

        {/* ───── CARDS ───── */}
        <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "52px 0", fontSize: 14 }}>
              No se encontraron recitales con ese filtro.
            </div>
          )}
          {filtered.map((c, i) => {
            const { color, glow } = getDemandInfo(c.demand);
            const isSoldOut = c.demand === 100;
            const hasKnownPrice = Number(c.priceARS) > 0;
            const ringSize = isMobile ? 42 : 48;

            return (
              <div key={c.id} className="card-item" style={{
                animationDelay: `${i * 0.05}s`,
                background: c.origen === "Nacional" ? "var(--color-surface-elevated)" : "var(--color-surface)",
                border: c.notified
                  ? "1px solid rgba(48,209,88,0.45)"
                  : c.origen === "Nacional" ? "1px solid var(--color-border)" : "1px solid var(--color-border-soft)",
                borderRadius: 18,
                padding: isMobile ? "13px 13px" : "16px 18px",
                position: "relative", overflow: "hidden",
                boxShadow: c.notified ? "0 0 0 1px rgba(48,209,88,.12), 0 10px 26px rgba(0,0,0,.32)" : "0 6px 20px rgba(0,0,0,.25)",
              }}>
                {/* glow accent */}
                {c.demand >= 90 && (
                  <div style={{
                    position: "absolute", top: -35, right: -35,
                    width: 110, height: 110, background: `${color}14`,
                    borderRadius: "50%", filter: "blur(28px)", pointerEvents: "none",
                  }} />
                )}

                {/* Nacional badge */}
                {c.origen === "Nacional" && !isMobile && (
                  <div style={{
                    position: "absolute", top: 12, right: 14,
                    fontSize: 8, color: "#ffd60a", letterSpacing: 1.5,
                    textTransform: "uppercase", opacity: 0.6,
                  }}>🇦🇷 Nacional</div>
                )}

                <div style={{ display: "flex", gap: isMobile ? 10 : 13, alignItems: "flex-start" }}>
                  {/* Ring + emoji */}
                  <div style={{ position: "relative", width: ringSize, height: ringSize, flexShrink: 0 }}>
                    <DemandRing value={c.demand} size={ringSize} />
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isMobile ? 16 : 18,
                    }}>{c.emoji}</div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Artist name + tag */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 2 }}>
                      <h2 style={{
                        margin: 0,
                        fontSize: isMobile ? 16 : 18,
                        fontWeight: 800, letterSpacing: -0.3, color: "#fff",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        maxWidth: isMobile ? "calc(100% - 10px)" : "calc(100% - 120px)",
                      }}>{c.artist}</h2>
                      {!isMobile && (
                        <span style={{
                          fontSize: 9, padding: "2px 7px", borderRadius: 99,
                          background: `${color}22`, color, border: `1px solid ${color}44`,
                          letterSpacing: 0.4, flexShrink: 0, fontFamily: "monospace",
                        }}>{c.tag}</span>
                      )}
                    </div>

                    {/* On mobile: show tag below name */}
                    {isMobile && (
                      <span style={{
                        display: "inline-block", marginBottom: 5,
                        fontSize: 9, padding: "2px 8px", borderRadius: 99,
                        background: `${color}22`, color, border: `1px solid ${color}44`,
                        letterSpacing: 0.4, fontFamily: "monospace",
                      }}>{c.tag}</span>
                    )}

                    {/* Venue + date */}
                    <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--color-text-secondary)", marginBottom: c.nota ? 3 : 8 }}>
                      📍 {c.venue}
                      <span style={{ margin: "0 4px", color: "var(--color-border-soft)" }}>·</span>
                      🗓️ {formatDate(c.date)}
                      {!isMobile && (
                        <span style={{
                          marginLeft: 6, fontSize: 9, color: "var(--color-text-muted)",
                          background: "var(--color-surface)", padding: "1px 6px", borderRadius: 5,
                        }}>{c.genre}</span>
                      )}
                    </div>

                    {/* Nota */}
                    {c.nota && (
                      <div style={{
                        fontSize: isMobile ? 11 : 12,
                        color: "#ffd60a77", marginBottom: 7, fontStyle: "italic",
                        lineHeight: 1.4,
                      }}>✦ {c.nota}</div>
                    )}

                    {/* Demand bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: "var(--color-text-muted)", letterSpacing: 0.7, textTransform: "uppercase" }}>Demanda</span>
                        <span style={{ fontSize: 9, color, fontFamily: "monospace" }}>{c.demand}% · {c.soldPct}% vendido</span>
                      </div>
                      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          width: `${c.demand}%`, height: "100%",
                          background: `linear-gradient(90deg, ${color}66, ${color})`,
                          borderRadius: 99, boxShadow: `0 0 5px ${color}66`,
                          transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
                        }} />
                      </div>
                    </div>

                    {/* Price + buttons */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}>
                      <div>
                        <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                          {hasKnownPrice ? (showUSD ? fmtUSD(c.priceARS, usdToArs) : fmtARS(c.priceARS)) : "Precio a confirmar"}
                          {hasKnownPrice && (
                            <span style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 400, marginLeft: 3 }}>
                              {showUSD ? "USD" : "ARS"}
                            </span>
                          )}
                        </div>
                        {showUSD && hasKnownPrice && (
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{fmtARS(c.priceARS)} ARS</div>
                        )}
                        {!hasKnownPrice && (
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Sin precio oficial publicado</div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {!isSoldOut && (
                          <a href="https://www.allaccess.com.ar" target="_blank" rel="noopener noreferrer" style={{
                            padding: isMobile ? "6px 10px" : "6px 12px",
                            borderRadius: 99,
                            background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)", fontSize: 10, textDecoration: "none", fontFamily: "inherit",
                            whiteSpace: "nowrap",
                          }}>🎟️{!isMobile && " Comprar"}</a>
                        )}
                        <button onClick={() => toggleNotify(c.id)} className="pill" style={{
                          padding: isMobile ? "6px 10px" : "6px 13px",
                          borderRadius: 99,
                          border: c.notified ? "1px solid rgba(48,209,88,0.45)" : "1px solid var(--color-border)",
                          background: c.notified ? "rgba(48,209,88,0.16)" : "rgba(255,255,255,0.03)",
                          color: c.notified ? "var(--color-success)" : "var(--color-text-muted)",
                          fontSize: 10, fontFamily: "inherit", letterSpacing: 0.3,
                          whiteSpace: "nowrap",
                        }}>
                          {c.notified
                            ? (isMobile ? "🔔" : "🔔 Activado")
                            : (isMobile ? "🔕" : "🔕 Notificar")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ───── LEYENDA ───── */}
        <div style={{
          marginTop: 24, padding: "13px 16px",
          background: "var(--color-surface)", border: "1px solid var(--color-border-soft)", borderRadius: 13,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 9,
        }}>
          {[
            { color: "#ff2d55", label: "100% — Agotado" },
            { color: "#ff6b35", label: "90–99% — Casi lleno" },
            { color: "#ffd60a", label: "75–89% — Alta" },
            { color: "#30d158", label: "50–74% — Media" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--color-text-secondary)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 9, color: "var(--color-text-tertiary)", letterSpacing: 1 }}>
          Datos orientativos · Precios sujetos a variación · Comprá siempre en boletería oficial
        </div>
      </div>

      {toast && <Toast concert={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
