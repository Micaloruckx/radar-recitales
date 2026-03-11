# Radar de Recitales

Web app en React + Vite para seguir recitales en Argentina con foco en **próximos shows** y actualización automática de datos.

## Actualización automática cada 12 horas

Este repo incluye el workflow [`.github/workflows/update-live-data.yml`](.github/workflows/update-live-data.yml), que corre cada 12 horas y:

1. Ejecuta `npm run update:data`
2. Actualiza `public/concerts.json`
3. Hace commit/push automático si hubo cambios

## Qué actualiza

- **USD/ARS**: intenta traer cotización desde API (por defecto `https://dolarapi.com/v1/dolares/oficial`)
- **Recitales nuevos/próximos**:
	- Si configurás `TICKETMASTER_API_KEY`, consulta eventos de música en Argentina
	- Además usa una fuente pública de respaldo (Songkick) sin API key para detectar shows nuevos
	- Si Ticketmaster no está configurado, igual incorpora nuevos recitales desde el respaldo cuando estén publicados

## Secrets de GitHub recomendados

En `Settings > Secrets and variables > Actions`, crear:

- `TICKETMASTER_API_KEY` (opcional, recomendado para nuevos recitales)
- `USD_API_URL` (opcional)
	- Si lo dejás vacío, usa el valor por defecto del script
	- Si querés usar otra API (ej: dolar.app), poné acá el endpoint exacto
- `USD_API_KEY` (opcional)
	- Solo si tu API de dólar exige autenticación
- `USD_API_HEADER` (opcional)
	- Header para enviar la key (default: `Authorization`)
	- Ejemplo para APIs que usan header custom: `X-API-KEY`
- `SONGKICK_URLS` (opcional)
	- Lista de URLs separadas por coma para ampliar scraping de eventos
	- Si no está definido, usa URLs por defecto de Argentina/Buenos Aires
- `WATCH_ARTISTS` (opcional)
	- Lista separada por coma de artistas para seguimiento específico en Songkick
	- Default incluye: Robbie Williams, Bad Bunny, Dua Lipa, Lali, Shakira, Coldplay

## Uso local

```bash
npm install
npm run update:data
npm run dev
```

## Notas

- El frontend lee directamente de `public/concerts.json` y refresca en polling.
- El campo `updatedAt` muestra la última sincronización de dataset.
- Para mejorar calidad de “nuevos recitales”, podés sumar más fuentes API en `scripts/update-concerts-data.js`.
- Si un show confirmado no aparece aún en APIs (ej: anuncio reciente), podés agregarlo en `public/manual-shows.json` y quedará incorporado en cada actualización automática.
