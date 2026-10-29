<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Data source

Requests come from a Google Sheet (filled by n8n) exposed as an Apps Script web
app; its URL lives in the `GOOGLE_SHEET_WEBAPP_URL` secret. The UI only talks to
`requestsRepository` (`src/data/requests-repository.ts`), so the source can be
swapped without touching components. Sheet HTTP calls are server-only
(`src/lib/sheets.server.ts`, exposed through `src/lib/sheets.functions.ts`) so
the script URL never reaches the browser. Status updates are sent as GET query
params because Apps Script drops POST bodies across its redirect.
- Requests are read/written in the external Supabase table `registre` (server-only, key in APISUPABASE, calls gated by requireSupabaseAuth) via src/lib/registre.*; why: n8n writes there and data must stay behind sales-rep login. DB statuts nouveau/validee/bloquee map to Nouvelle/Acceptée/Refusée.
