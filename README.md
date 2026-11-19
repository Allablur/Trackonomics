# Trackonomics

Live music industry catalogue explorer and illustrative analytics prototype: https://allablur.github.io/Trackonomics/.

## Live artist metrics

Search MusicBrainz artists, select up to 10 canonical artist IDs, compare total listens and unique listeners from ListenBrainz, explore top recordings and export a sourced CSV. These are ListenBrainz community counts, not Spotify streams, revenue, monthly listeners or market share. Missing counts are unavailable, not zero. The original simulated catalogue dashboard remains clearly labelled.

## Backend

The deployed Supabase Edge Function is `trackonomics-metrics` in the SoundLab project. It accepts a public project key, restricts browser origins, validates artist identifiers and uses fixed upstream endpoints. It shares the server-only cache and global rate gate installed by Sample Trail, stores normalized public aggregate metrics for six hours and does not read personal workspace records. Upstream MusicBrainz and ListenBrainz requests have an identifying User-Agent. For a new deployment, install Sample Trail's shared `supabase/schema.sql` first, then deploy the Edge Function with application-level publishable-key validation (legacy JWT verification off). No service-role key is exposed in the client.

## Tests

`node --test demo.test.mjs metrics.test.mjs` (Node.js 24). Verified live artist lookup, batch comparison for Kendrick Lamar and SZA, and top recordings for Kendrick Lamar.

## Remaining work

- Live release timeline, genre and catalogue analysis (currently simulated).
- Store dated historical metrics snapshots with retention controls.
- Spotify analytics are not used: the [Spotify Developer Policy](https://developer.spotify.com/policy) restricts deriving analytics from Spotify platform content.

Sources: [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API), [ListenBrainz popularity API](https://listenbrainz.readthedocs.io/en/latest/users/api/popularity.html), [MusicBrainz data license](https://musicbrainz.org/doc/About/Data_License).
