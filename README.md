# Itemforge — Angular client

The digital game items store, built with Angular 21: standalone components, signals, zoneless change
detection, lazy-loaded routes. It talks to the FastAPI backend in `../backend`, and the design comes from the
"Game Items Store Redesign" canvas.

## Run it

```bash
npm install          # .npmrc sets legacy-peer-deps; plain npm 10.9 fails to resolve the vitest peers
npm start            # http://localhost:8080
npm run build        # dist/frontend-angular/browser
npm test             # vitest unit tests
```

In development the app calls `/api/v1` on its own origin, and `ng serve` forwards it to
`http://localhost:8000` (`proxy.conf.json`). The browser never makes a cross-origin request, so CORS doesn't
apply and any dev port works. The default is 8080.

Requires Node ≥ 22.12. Angular 22 needs Node 22.22.3+, so this project stays on Angular 21 (LTS).

### API base URL

- `ng serve`: `src/environments/environment.development.ts` sets `/api/v1`, which goes through the proxy.
- `ng build`: `src/environments/environment.ts` sets `http://localhost:8000/api/v1`. That is a real
  cross-origin call, so the site's origin must be in the backend's `CORS_ORIGINS`.

### Docker

```bash
docker build --build-arg API_BASE_URL=http://localhost:8000/api/v1 -t itemforge-web .
docker run -p 8080:8080 itemforge-web
```

The URL is compiled into the bundle, so to change it you rebuild. nginx runs as a non-root user and falls back to
`index.html` for deep links. It caches hashed bundles forever and always revalidates `index.html`.

## Pages

| Route | Guard | What it does |
|---|---|---|
| `/login` | guest | Sign-in form with one generic "Invalid username or password" error; returns to `returnUrl` |
| `/products` | auth | Grid (1 → 2 → 3 → 4 columns), JO/SA filter, sort, pagination; all state in the query string |
| `/products/:id` | auth | Details, Buy → confirm dialog → `POST /orders` → receipt |
| `/receipt/:orderId` | auth | Order reference, buyer, item, unit price, quantity, total, date; print stylesheet |
| `**` | — | 404 |

Every page has a loading skeleton, an empty or not-found state, and an error state with Retry.

## How it's built

```
src/app/
  core/       models, api.service (the only HTTP caller), auth.interceptor, auth.service,
              auth.guards, token-storage, api-error, load-state, format
  shared/     navbar, product-card, pagination, confirm-dialog, error-state, skeleton-card, spinner
  layout/     shell (navbar + outlet for signed-in pages)
  pages/      login, products, product-details, receipt, not-found
```

- **Auth on every request.** `authInterceptor` adds `Authorization: Bearer <token>` to every call except
  `POST /auth/login`, which carries the `PUBLIC_ENDPOINT` context flag. A 401 from any other endpoint clears
  the token and emits on `SessionEvents`. `AuthService` then signs out and sends the user to `/login` with
  `returnUrl`.
- **Session restore.** `provideAppInitializer` calls `/auth/me` before the first guard runs, so a refresh keeps
  you signed in. User data comes from `/auth/me`, never from the JWT's claims.
- **Token storage.** The token is kept in `localStorage` (so it survives a refresh) and mirrored in memory. The
  trade-off: any script injected into the page can read `localStorage`, so this relies on the app having no
  XSS holes. Angular escapes template bindings by default, and no code uses `innerHTML` or bypasses
  sanitisation. The stricter option is an httpOnly cookie set by the backend. That would need
  `withCredentials`, a CORS allow-list with credentials, and CSRF protection on `POST /orders`.
- **No stale responses.** List and detail requests run through `switchMap`, so changing the URL cancels the
  in-flight HTTP request.
- **One click, one order.** A synchronous flag plus a disabled, spinning button blocks a second `POST /orders`
  while the first is in flight. The native `<dialog>` can't be dismissed during that time.
- **Money is a string.** Prices are formatted as strings (`formatMoney`) and never go through a JS number. The
  receipt shows the order's own `unit_price` / `total_price` / `currency`, not the product's current price.
