// scripts/check-concerts.js
// Corre automáticamente cada 3 días via GitHub Actions
// Revisa recitales importantes y manda email si hay novedades

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── UMBRALES DE ALERTA ────────────────────────────────────────────────────
const DEMANDA_MINIMA  = 85;
const ARCHIVO_ESTADO  = path.join(__dirname, "last-state.json");

// ─── LISTA DE RECITALES ────────────────────────────────────────────────────
const CONCERTS = [
  { id: 1,  artist: "Bad Bunny",              date: "2026-02-13", demand: 100, tag: "AGOTADO",             origen: "Internacional" },
  { id: 2,  artist: "Nicki Nicole",           date: "2026-02-19", demand: 100, tag: "AGOTADO",             origen: "Nacional" },
  { id: 3,  artist: "My Chemical Romance",    date: "2026-03-01", demand: 100, tag: "AGOTADO",             origen: "Internacional" },
  { id: 4,  artist: "Soda Stereo - ECOS",     date: "2026-03-21", demand: 100, tag: "AGOTADO (11 fechas)", origen: "Nacional" },
  { id: 5,  artist: "Fito Paez",              date: "2026-03-19", demand: 88,  tag: "Alta demanda",        origen: "Nacional" },
  { id: 6,  artist: "AC/DC",                  date: "2026-03-23", demand: 100, tag: "AGOTADO (3 fechas)",  origen: "Internacional" },
  { id: 7,  artist: "Lollapalooza Argentina", date: "2026-03-13", demand: 91,  tag: "Ultimas entradas",    origen: "Internacional" },
  { id: 8,  artist: "Babasónicos",            date: "2026-05-28", demand: 92,  tag: "Casi agotado",        origen: "Nacional" },
  { id: 9,  artist: "Megadeth",               date: "2026-04-30", demand: 79,  tag: "Alta demanda",        origen: "Internacional" },
  { id: 10, artist: "Lali",                   date: "2026-06-06", demand: 99,  tag: "Casi agotado",        origen: "Nacional" },
  { id: 11, artist: "Divididos",              date: "2026-02-15", demand: 82,  tag: "Alta demanda",        origen: "Nacional" },
  { id: 12, artist: "Airbag",                 date: "2026-07-15", demand: 85,  tag: "Alta demanda",        origen: "Nacional" },
  { id: 13, artist: "Rosalia - LUX TOUR",     date: "2026-08-01", demand: 85,  tag: "Alta demanda",        origen: "Internacional" },
  { id: 14, artist: "Iron Maiden",            date: "2026-10-20", demand: 72,  tag: "Media demanda",       origen: "Internacional" },
  { id: 15, artist: "Martin Garrix",          date: "2026-05-16", demand: 68,  tag: "Media demanda",       origen: "Internacional" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────
function cargarEstadoAnterior() {
  try {
    if (fs.existsSync(ARCHIVO_ESTADO)) {
      return JSON.parse(fs.readFileSync(ARCHIVO_ESTADO, "utf8"));
    }
  } catch (e) {}
  return { ids_alertados: [], demandas: {} };
}

function guardarEstado(estado) {
  fs.writeFileSync(ARCHIVO_ESTADO, JSON.stringify(estado, null, 2));
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

function getDemandColor(demand) {
  if (demand === 100) return "#ff2d55";
  if (demand >= 90)   return "#ff6b35";
  if (demand >= 75)   return "#ffd60a";
  return "#30d158";
}

// ─── LÓGICA DE ALERTAS ────────────────────────────────────────────────────
function detectarAlertas(estadoAnterior) {
  const alertas    = [];
  const nuevoEstado = {
    ids_alertados: [...(estadoAnterior.ids_alertados || [])],
    demandas:      { ...estadoAnterior.demandas },
  };

  for (const c of CONCERTS) {
    const demandaAnterior = estadoAnterior.demandas[c.id] || 0;
    const yaAlertado      = nuevoEstado.ids_alertados.includes(c.id);
    const esImportante    = c.demand >= DEMANDA_MINIMA;

    if (esImportante && !yaAlertado) {
      alertas.push({ ...c, motivo: "nuevo_importante" });
      nuevoEstado.ids_alertados.push(c.id);
    } else if (c.demand >= DEMANDA_MINIMA && c.demand - demandaAnterior >= 10) {
      alertas.push({ ...c, motivo: "subio_demanda", demandaAnterior });
    }

    nuevoEstado.demandas[c.id] = c.demand;
  }

  return { alertas, nuevoEstado };
}

// ─── EMAIL HTML ───────────────────────────────────────────────────────────
function generarEmailHTML(alertas) {
  const fecha = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const filas = alertas.map(c => {
    const color  = getDemandColor(c.demand);
    const motivo = c.motivo === "subio_demanda"
      ? `Subio de ${c.demandaAnterior}% a ${c.demand}%`
      : c.demand === 100 ? "AGOTADO" : `${c.demand}% de demanda`;
    const bandera = c.origen === "Nacional" ? "AR " : "";

    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #1c1c1e;">
          <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:3px;">${bandera}${c.artist}</div>
          <div style="font-size:11px;color:#666;">${formatDate(c.date)}</div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #1c1c1e;text-align:center;">
          <span style="display:inline-block;padding:4px 10px;border-radius:99px;background:${color}22;color:${color};border:1px solid ${color}44;font-size:11px;font-family:monospace;">${c.tag}</span>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #1c1c1e;text-align:right;">
          <div style="font-size:12px;color:${color};font-weight:600;">${motivo}</div>
        </td>
      </tr>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:9px;letter-spacing:5px;color:#ff6b35;text-transform:uppercase;margin-bottom:8px;">ARGENTINA 2026</div>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#fff;">RADAR DE RECITALES</h1>
      <p style="margin:8px 0 0;font-size:12px;color:#555;">Actualizacion del ${fecha}</p>
    </div>
    <div style="background:#ff6b3515;border:1px solid #ff6b3544;border-radius:14px;padding:14px 18px;margin-bottom:24px;text-align:center;">
      <div style="font-size:13px;color:#ff6b35;font-weight:700;">
        ${alertas.length} novedad${alertas.length !== 1 ? "es" : ""} detectada${alertas.length !== 1 ? "s" : ""}
      </div>
      <div style="font-size:11px;color:#666;margin-top:4px;">Recitales con demanda mayor a ${DEMANDA_MINIMA}%</div>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#0d0d0d;border-radius:16px;overflow:hidden;border:1px solid #1c1c1e;">
      <thead>
        <tr style="background:#111;">
          <th style="padding:10px 16px;text-align:left;font-size:9px;letter-spacing:1.5px;color:#444;text-transform:uppercase;font-weight:400;">Artista</th>
          <th style="padding:10px 16px;text-align:center;font-size:9px;letter-spacing:1.5px;color:#444;text-transform:uppercase;font-weight:400;">Estado</th>
          <th style="padding:10px 16px;text-align:right;font-size:9px;letter-spacing:1.5px;color:#444;text-transform:uppercase;font-weight:400;">Demanda</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://radar-recitales.vercel.app" style="display:inline-block;padding:12px 28px;border-radius:99px;background:linear-gradient(135deg,#ff6b35,#ff2d55);color:#fff;text-decoration:none;font-size:13px;font-weight:700;">Ver app completa</a>
    </div>
    <div style="text-align:center;margin-top:20px;font-size:9px;color:#2a2a2a;letter-spacing:1px;">
      Datos orientativos - Precios sujetos a variacion - Compra siempre en boleteria oficial
    </div>
  </div>
</body>
</html>`;
}

// ─── ENVÍO EMAIL ──────────────────────────────────────────────────────────
async function enviarEmail(alertas) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from:    `"Radar de Recitales" <${process.env.GMAIL_USER}>`,
    to:      process.env.EMAIL_DESTINO,
    subject: `${alertas.length} novedad${alertas.length !== 1 ? "es" : ""} en el Radar de Recitales Argentina`,
    html:    generarEmailHTML(alertas),
  });

  console.log(`Email enviado con ${alertas.length} alerta(s).`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("Revisando recitales...");

  const estadoAnterior           = cargarEstadoAnterior();
  const { alertas, nuevoEstado } = detectarAlertas(estadoAnterior);

  if (alertas.length === 0) {
    console.log("Sin novedades importantes. No se envia email.");
    return;
  }

  console.log(`${alertas.length} alerta(s):`, alertas.map(a => a.artist).join(", "));
  await enviarEmail(alertas);
  guardarEstado(nuevoEstado);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
