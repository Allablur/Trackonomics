# Trackonomics

Standalone music catalogue analytics prototype. Open `index.html` in a browser. All scores are illustrative; they do not represent real Spotify popularity, revenue or streams. To publish, push this folder to a GitHub repository and configure Settings > Pages > Deploy from a branch > main > /(root).

## Build toward Spotify integration
1. Register a Spotify developer app and check currently accessible metadata endpoints and terms.
2. Implement authorization appropriate to the endpoints, keeping secrets server-side.
3. Model artist, album and track metadata in relational tables; optionally store dated snapshots where permitted.
4. Use Python, pandas and SQL to aggregate release counts, categories and available metrics.
5. Replace the illustrative catalogue in demo.js with authorized data returned by your backend.
6. Test comparison, filtering and exports; label missing or inaccessible metrics explicitly.

Files: index.html, demo.js, style.css. This is a working front-end prototype; Python/SQL backend work remains a planned iteration.
