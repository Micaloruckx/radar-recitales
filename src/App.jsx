import { useState, useEffect, useCallback } from "react";

const USD_TO_ARS = 1399;
const LAST_UPDATED = "17 feb 2026";

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

const fmtARS = (n) => "$" + n.toLocaleString("es-AR");
const fmtUSD = (ars) => "US$" + Math.round(ars / USD_TO_ARS).toLocaleString("en-US");

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
      background: "#1c1c1e", border: "1px solid #ff6b3566",
      borderRadius: 16, padding: "14px 18px",
      boxShadow: "0 20px 60px rgba(0,0,0,.9)",
      animation: "toastIn .4s cubic-bezier(.34,1.56,.64,1)",
      fontFamily: "inherit", maxWidth: 340, margin: "0 auto",
    }}>
      <div style={{ fontSize: 10, color: "#ff6b35", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>🔔 Alerta activada</div>
      <div style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>{concert.artist}</div>
      <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>{concert.venue} · {formatDate(concert.date)}</div>
      <div style={{ fontSize: 11, color: "#ff6b35", marginTop: 4 }}>Te avisaremos si salen nuevas entradas</div>
    </div>
  );
}

export default function App() {
  const [concerts, setConcerts]   = useState(CONCERTS_DATA);
  const [genre, setGenre]         = useState("Todos");
  const [origen, setOrigen]       = useState("Todos");
  const [sort, setSort]           = useState("demand");
  const [search, setSearch]       = useState("");
  const [showUSD, setShowUSD]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [animKey, setAnimKey]     = useState(0);
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleNotify = (id) => {
    setConcerts(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, notified: !c.notified };
      if (updated.notified) setToast(updated);
      return updated;
    }));
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setConcerts(prev => prev.map(c => ({
        ...c,
        demand:  c.demand  < 100 ? Math.min(100, c.demand  + Math.floor(Math.random() * 4)) : 100,
        soldPct: c.soldPct < 100 ? Math.min(100, c.soldPct + Math.floor(Math.random() * 3)) : 100,
      })));
      setAnimKey(k => k + 1);
      setLoading(false);
    }, 1400);
  }, []);

  const filtered = concerts
    .filter(c => genre  === "Todos" || c.genre  === genre)
    .filter(c => origen === "Todos" || c.origen === origen)
    .filter(c => search === "" ||
      c.artist.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.venue.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "demand") return b.demand - a.demand;
      if (sort === "date")   return new Date(a.date) - new Date(b.date);
      if (sort === "price")  return a.priceARS - b.priceARS;
      return 0;
    });

  const notifiedCount = concerts.filter(c => c.notified).length;
  const nacionales    = concerts.filter(c => c.origen === "Nacional").length;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#e8e4d9", fontFamily: "'Georgia', serif", paddingBottom: 80 }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(16px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .card-item {
          animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .card-item:hover { transform:translateY(-2px); box-shadow:0 18px 48px rgba(0,0,0,.7) !important; }
        .pill { transition: all .15s ease; cursor: pointer; }
        .pill:hover { opacity: .75; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:99px; }
        select option { background:#1c1c1e; }
        input { outline:none; }
        input::placeholder { color:#48484a; }
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
        background: "rgba(0,0,0,0.93)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid #1c1c1e",
        padding: isMobile ? "16px 16px 12px" : "20px 20px 16px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 8, letterSpacing: 5, color: "#ff6b35", textTransform: "uppercase", marginBottom: 5 }}>
          ◆ ARGENTINA ◆ 2026 ◆
        </div>
        <h1 style={{
          margin: 0,
          fontSize: isMobile ? "clamp(22px, 7vw, 30px)" : "clamp(28px, 5vw, 42px)",
          fontWeight: 900, letterSpacing: -1.2,
          background: "linear-gradient(135deg, #fff 0%, #ff6b35 55%, #ff2d55 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1,
        }}>RADAR DE RECITALES</h1>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 7, flexWrap: "wrap" }}>
          {[
            { label: `${notifiedCount} alerta${notifiedCount !== 1 ? "s" : ""}`, color: "#ff6b35" },
            { label: `🇦🇷 ${nacionales} nacionales`, color: "#ffd60a" },
            { label: `${concerts.length} shows`, color: "#48484a" },
          ].map(({ label, color }) => (
            <span key={label} style={{ fontSize: 10, color, letterSpacing: 0.4 }}>{label}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: isMobile ? "16px 12px 0" : "22px 16px 0" }}>

        {/* ───── BANNER ───── */}
        <div style={{
          background: "#0d0d0d", border: "1px solid #1c1c1e", borderRadius: 14,
          padding: "10px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7 }}>
            📡 <span style={{ color: "#aaa" }}>{LAST_UPDATED}</span>
            {"  ·  "}
            💱 USD/ARS: <span style={{ color: "#30d158" }}>${USD_TO_ARS.toLocaleString("es-AR")}</span>
            {"  ·  "}
            <span style={{ color: "#444" }}>Actualización semanal</span>
          </div>
          <button onClick={handleRefresh} className="pill" style={{
            padding: "5px 13px", borderRadius: 99,
            background: loading ? "#1c1c1e" : "rgba(255,107,53,0.1)",
            border: "1px solid rgba(255,107,53,0.3)",
            color: loading ? "#555" : "#ff6b35",
            fontSize: 11, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
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
              background: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: 12,
              padding: "9px 13px", color: "#e8e4d9", fontSize: 13, fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 7, width: isMobile ? "100%" : "auto" }}>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              flex: isMobile ? 1 : "unset",
              background: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: 12,
              padding: "9px 10px", color: "#e8e4d9", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
            }}>
              <option value="demand">↓ Demanda</option>
              <option value="date">↑ Fecha</option>
              <option value="price">↑ Precio</option>
            </select>
            <button onClick={() => setShowUSD(s => !s)} className="pill" style={{
              flex: isMobile ? 1 : "unset",
              padding: "9px 12px", borderRadius: 12,
              background: showUSD ? "rgba(48,209,88,0.12)" : "#1c1c1e",
              border: showUSD ? "1px solid #30d15866" : "1px solid #3a3a3c",
              color: showUSD ? "#30d158" : "#8e8e93",
              fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap",
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
              border: origen === o ? "1px solid #ffd60a" : "1px solid #2c2c2e",
              background: origen === o ? "rgba(255,214,10,0.12)" : "transparent",
              color: origen === o ? "#ffd60a" : "#48484a",
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
              border: genre === g ? "1px solid #ff6b35" : "1px solid #2c2c2e",
              background: genre === g ? "rgba(255,107,53,0.12)" : "transparent",
              color: genre === g ? "#ff6b35" : "#48484a",
              fontSize: 10, letterSpacing: 0.3, fontFamily: "inherit",
            }}>
              {g}
            </button>
          ))}
        </div>

        {/* ───── CARDS ───── */}
        <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#48484a", padding: "52px 0", fontSize: 14 }}>
              No se encontraron recitales con ese filtro.
            </div>
          )}
          {filtered.map((c, i) => {
            const { color, glow } = getDemandInfo(c.demand);
            const isSoldOut = c.demand === 100;
            const ringSize = isMobile ? 42 : 48;

            return (
              <div key={c.id} className="card-item" style={{
                animationDelay: `${i * 0.05}s`,
                background: c.origen === "Nacional" ? "#0d0d12" : "#0d0d0d",
                border: c.notified
                  ? "1px solid rgba(255,107,53,0.4)"
                  : c.origen === "Nacional" ? "1px solid #252530" : "1px solid #1c1c1e",
                borderRadius: 18,
                padding: isMobile ? "13px 13px" : "16px 18px",
                position: "relative", overflow: "hidden",
                boxShadow: c.notified ? `0 0 24px ${glow}` : "0 3px 16px rgba(0,0,0,.3)",
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
                        fontSize: isMobile ? 14 : 16,
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
                    <div style={{ fontSize: isMobile ? 10 : 11, color: "#555", marginBottom: c.nota ? 3 : 8 }}>
                      📍 {c.venue}
                      <span style={{ margin: "0 4px", color: "#2c2c2e" }}>·</span>
                      🗓️ {formatDate(c.date)}
                      {!isMobile && (
                        <span style={{
                          marginLeft: 6, fontSize: 9, color: "#48484a",
                          background: "#1c1c1e", padding: "1px 6px", borderRadius: 5,
                        }}>{c.genre}</span>
                      )}
                    </div>

                    {/* Nota */}
                    {c.nota && (
                      <div style={{
                        fontSize: isMobile ? 9 : 10,
                        color: "#ffd60a77", marginBottom: 7, fontStyle: "italic",
                        lineHeight: 1.4,
                      }}>✦ {c.nota}</div>
                    )}

                    {/* Demand bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: "#3a3a3c", letterSpacing: 0.7, textTransform: "uppercase" }}>Demanda</span>
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
                          {showUSD ? fmtUSD(c.priceARS) : fmtARS(c.priceARS)}
                          <span style={{ fontSize: 9, color: "#48484a", fontWeight: 400, marginLeft: 3 }}>
                            {showUSD ? "USD" : "ARS"}
                          </span>
                        </div>
                        {showUSD && (
                          <div style={{ fontSize: 9, color: "#48484a" }}>{fmtARS(c.priceARS)} ARS</div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {!isSoldOut && (
                          <a href="https://allaccess.com.ar" target="_blank" rel="noopener noreferrer" style={{
                            padding: isMobile ? "6px 10px" : "6px 12px",
                            borderRadius: 99,
                            background: "rgba(255,255,255,0.05)", border: "1px solid #3a3a3c",
                            color: "#8e8e93", fontSize: 10, textDecoration: "none", fontFamily: "inherit",
                            whiteSpace: "nowrap",
                          }}>🎟️{!isMobile && " Comprar"}</a>
                        )}
                        <button onClick={() => toggleNotify(c.id)} className="pill" style={{
                          padding: isMobile ? "6px 10px" : "6px 13px",
                          borderRadius: 99,
                          border: c.notified ? "1px solid #ff6b35" : "1px solid #3a3a3c",
                          background: c.notified ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.03)",
                          color: c.notified ? "#ff6b35" : "#636366",
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
          background: "#0d0d0d", border: "1px solid #1c1c1e", borderRadius: 13,
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
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#555" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 9, color: "#2a2a2a", letterSpacing: 1 }}>
          Datos orientativos · Precios sujetos a variación · Comprá siempre en boletería oficial
        </div>
      </div>

      {toast && <Toast concert={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
