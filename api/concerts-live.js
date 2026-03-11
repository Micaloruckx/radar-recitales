import fs from "fs/promises";
import path from "path";

const DEFAULT_USD_API_URL = "https://dolarapi.com/v1/dolares/oficial";
const DEFAULT_USD_TO_ARS = 1400;
const MAX_CONCERTS = 120;
const SONGKICK_FALLBACK_URLS = [
  "https://www.songkick.com/metro-areas/26730-argentina-buenos-aires",
];
const WATCH_ARTISTS_DEFAULT = [
  "Bad Bunny",
  "Dua Lipa",
  "Lali",
  "Shakira",
  "Coldplay",
  "Robbie Williams",
];

const CONCERTS_FILE = path.join(process.cwd(), "public", "concerts.json");
const MANUAL_SHOWS_FILE = path.join(process.cwd(), "public", "manual-shows.json");

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOnly(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value) {
  return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function computeStableId(artist, date, venue) {
  const str = `${normalizeText(artist)}|${date}|${normalizeText(venue)}`;
  let hash = 0;
  for (let index = 0; index < str.length; index += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeConcert(raw) {
  const date = toDateOnly(raw.date);
  if (!raw.artist || !raw.venue || !date) return null;

  const demand = Math.max(0, Math.min(100, safeNumber(raw.demand) ?? 70));
  const soldPct = Math.max(0, Math.min(100, safeNumber(raw.soldPct) ?? demand));
  const priceARS = Math.max(0, safeNumber(raw.priceARS) ?? 0);

  return {
    id: safeNumber(raw.id) ?? computeStableId(raw.artist, date, raw.venue),
    artist: raw.artist,
    venue: raw.venue,
    city: raw.city || "Argentina",
    date,
    genre: raw.genre || "General",
    demand,
    priceARS,
    soldPct,
    emoji: raw.emoji || "🎵",
    tag: raw.tag || (demand >= 90 ? "Alta demanda" : "Disponible"),
    origen: raw.origen || "Internacional",
    ...(raw.nota ? { nota: raw.nota } : {}),
  };
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const file = await fs.readFile(filePath, "utf8");
    return JSON.parse(file);
  } catch {
    return fallbackValue;
  }
}

async function readCurrentData() {
  const parsed = await readJsonFile(CONCERTS_FILE, {
    updatedAt: null,
    usdToArs: DEFAULT_USD_TO_ARS,
    concerts: [],
  });

  return {
    updatedAt: parsed.updatedAt || null,
    usdToArs: safeNumber(parsed.usdToArs) ?? DEFAULT_USD_TO_ARS,
    concerts: Array.isArray(parsed.concerts) ? parsed.concerts : [],
  };
}

async function readManualShows() {
  const parsed = await readJsonFile(MANUAL_SHOWS_FILE, { shows: [] });
  return Array.isArray(parsed.shows) ? parsed.shows : [];
}

function parseUsdRate(payload) {
  if (!payload || typeof payload !== "object") return null;

  const directCandidates = [
    payload.venta,
    payload.sell,
    payload.price,
    payload.usdToArs,
    payload.usd_ars,
    payload.oficial,
    payload.oficial?.venta,
    payload.oficial?.sell,
    payload.data?.venta,
    payload.data?.sell,
    payload.data?.price,
  ];

  for (const candidate of directCandidates) {
    const value = safeNumber(candidate);
    if (value && value > 100) return Math.round(value);
  }

  return null;
}

async function fetchUsdToArs() {
  const url = process.env.USD_API_URL || DEFAULT_USD_API_URL;
  const usdApiKey = process.env.USD_API_KEY;
  const usdApiHeader = process.env.USD_API_HEADER || "Authorization";

  const headers = { Accept: "application/json" };
  if (usdApiKey) {
    headers[usdApiHeader] = usdApiHeader.toLowerCase() === "authorization"
      ? `Bearer ${usdApiKey}`
      : usdApiKey;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const rate = parseUsdRate(payload);
    if (!rate) throw new Error("No se pudo parsear cotización USD/ARS");

    return { rate, source: url };
  } catch (error) {
    return { rate: null, source: url, error: error.message };
  }
}

function mapTicketmasterToConcert(event) {
  const start = event?.dates?.start?.localDate;
  const date = toDateOnly(start);
  const artist = event?.name;
  const venue = event?._embedded?.venues?.[0]?.name;

  if (!date || !artist || !venue) return null;

  const city = event?._embedded?.venues?.[0]?.city?.name || "Argentina";
  const genre = event?.classifications?.[0]?.genre?.name || "General";

  const lowest = safeNumber(event?.priceRanges?.[0]?.min);
  const highest = safeNumber(event?.priceRanges?.[0]?.max);
  const currency = event?.priceRanges?.[0]?.currency;

  const priceARS = currency === "USD"
    ? 0
    : Math.round((lowest ?? highest ?? 0) * 1000);

  return normalizeConcert({
    artist,
    venue,
    city,
    date,
    genre,
    demand: 72,
    soldPct: 60,
    priceARS,
    emoji: "🎤",
    tag: "Próximo",
    origen: "Internacional",
    nota: "Fuente: Ticketmaster",
  });
}

async function fetchTicketmasterConcerts() {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return { concerts: [], source: "ticketmaster", skipped: true };

  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("countryCode", "AR");
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", "200");
  url.searchParams.set("startDateTime", startDate);
  url.searchParams.set("endDateTime", endDate);

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const events = payload?._embedded?.events || [];

    const concerts = events.map(mapTicketmasterToConcert).filter(Boolean);
    return { concerts, source: "ticketmaster", skipped: false };
  } catch (error) {
    return { concerts: [], source: "ticketmaster", skipped: false, error: error.message };
  }
}

function extractJsonLdBlocks(html) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return matches
    .map((match) => match[1])
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
}

function mapSongkickJsonLdToConcert(item) {
  const type = item?.["@type"];
  if (type !== "MusicEvent" && type !== "Event") return null;

  const date = toDateOnly(item.startDate || item.endDate);
  const venue = item?.location?.name;
  const city = item?.location?.address?.addressLocality || "Argentina";
  const performerName = item?.performer?.[0]?.name;
  const artist = performerName || item?.name;
  const country = normalizeText(item?.location?.address?.addressCountry || "");

  if (!artist || !venue || !date) return null;
  if (country && country !== "argentina") return null;

  const rawGenre = item?.performer?.[0]?.genre;
  const genre = Array.isArray(rawGenre) ? (rawGenre[0] || "General") : (rawGenre || "General");

  return normalizeConcert({
    artist,
    venue,
    city,
    date,
    genre,
    demand: 72,
    soldPct: 58,
    priceARS: 0,
    emoji: "🎤",
    tag: "Nuevo",
    origen: "Internacional",
    nota: "Fuente: Songkick",
  });
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function findSongkickArtistPath(artistName) {
  const searchUrl = `https://www.songkick.com/search?query=${encodeURIComponent(artistName)}`;
  const html = await fetchText(searchUrl);
  const match = html.match(/\/artists\/(\d+-[^"'?#\s]+)/i);
  return match ? `/artists/${match[1]}` : null;
}

async function fetchSongkickConcertsForArtist(artistName) {
  try {
    const artistPath = await findSongkickArtistPath(artistName);
    if (!artistPath) return { concerts: [], artist: artistName };

    const calendarUrl = `https://www.songkick.com${artistPath}/calendar`;
    const html = await fetchText(calendarUrl);

    const blocks = extractJsonLdBlocks(html);
    const concerts = blocks
      .map(mapSongkickJsonLdToConcert)
      .filter(Boolean)
      .map((concert) => ({
        ...concert,
        tag: "Nuevo",
        nota: concert.nota ? `${concert.nota} · seguimiento artista` : "Fuente: Songkick · seguimiento artista",
      }));

    return { concerts, artist: artistName };
  } catch (error) {
    return { concerts: [], artist: artistName, error: error.message };
  }
}

async function fetchSongkickConcerts() {
  const urls = (process.env.SONGKICK_URLS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const targets = urls.length > 0 ? urls : SONGKICK_FALLBACK_URLS;
  const concerts = [];
  const errors = [];

  for (const url of targets) {
    try {
      const html = await fetchText(url);
      const blocks = extractJsonLdBlocks(html);
      const mapped = blocks.map(mapSongkickJsonLdToConcert).filter(Boolean);
      concerts.push(...mapped);
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  const watchArtists = (process.env.WATCH_ARTISTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const artistsToWatch = watchArtists.length > 0 ? watchArtists : WATCH_ARTISTS_DEFAULT;
  const artistResults = await Promise.all(artistsToWatch.map(fetchSongkickConcertsForArtist));

  for (const result of artistResults) {
    concerts.push(...result.concerts);
    if (result.error) errors.push(`artist:${result.artist}: ${result.error}`);
  }

  return {
    concerts,
    source: "songkick",
    skipped: false,
    watchedArtists: artistsToWatch,
    ...(errors.length ? { error: errors.join(" | ") } : {}),
  };
}

function mergeConcerts(currentConcerts, externalConcerts) {
  const currentNormalized = currentConcerts.map(normalizeConcert).filter(Boolean);
  const externalNormalized = externalConcerts.map(normalizeConcert).filter(Boolean);

  const byKey = new Map();

  for (const concert of currentNormalized) {
    const key = `${normalizeText(concert.artist)}|${concert.date}|${normalizeText(concert.venue)}`;
    byKey.set(key, concert);
  }

  let newCount = 0;

  for (const concert of externalNormalized) {
    const key = `${normalizeText(concert.artist)}|${concert.date}|${normalizeText(concert.venue)}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { ...concert, tag: concert.tag || "Nuevo" });
      newCount += 1;
      continue;
    }

    byKey.set(key, {
      ...existing,
      ...concert,
      demand: concert.demand ?? existing.demand,
      soldPct: concert.soldPct ?? existing.soldPct,
      priceARS: concert.priceARS ?? existing.priceARS,
      nota: concert.nota || existing.nota,
      tag: concert.tag || existing.tag,
    });
  }

  const upcoming = [...byKey.values()]
    .filter((concert) => concert.date >= todayDateOnly())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, MAX_CONCERTS);

  return { concerts: upcoming, newCount };
}

async function getLiveConcertData() {
  const current = await readCurrentData();
  const manualShows = await readManualShows();

  const [usdResult, ticketmasterResult, songkickResult] = await Promise.all([
    fetchUsdToArs(),
    fetchTicketmasterConcerts(),
    fetchSongkickConcerts(),
  ]);

  const merged = mergeConcerts(current.concerts, [
    ...ticketmasterResult.concerts,
    ...songkickResult.concerts,
    ...manualShows,
  ]);

  return {
    updatedAt: new Date().toISOString(),
    usdToArs: usdResult.rate ?? current.usdToArs ?? DEFAULT_USD_TO_ARS,
    concerts: merged.concerts,
    meta: {
      newConcertsDetected: merged.newCount,
      sources: {
        usd: usdResult.source,
        concerts: [ticketmasterResult.source, songkickResult.source],
      },
      ...(usdResult.error ? { usdError: usdResult.error } : {}),
      ...(ticketmasterResult.error ? { concertsError: ticketmasterResult.error } : {}),
      ...(songkickResult.error ? { concertsFallbackError: songkickResult.error } : {}),
      watchedArtists: songkickResult.watchedArtists || [],
      manualShowsCount: manualShows.length,
      ticketmasterSkipped: Boolean(ticketmasterResult.skipped),
    },
  };
}

export default async function handler(req, res) {
  try {
    const payload = await getLiveConcertData();
    res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=3600");
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar recitales", detail: error.message });
  }
}
