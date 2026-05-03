# CORS, Proxies, and How We Fixed the Quran API

---

## The Core Problem

When you open this app in a browser and JavaScript tries to call
`https://api.alquran.cloud/v1/surah/18/editions/ar.alafasy,en.asad`,
the browser blocks the response and you get an error like:

```
Access to fetch at 'https://api.alquran.cloud/...' from origin
'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Understanding why this happens — and why a proxy fixes it — requires understanding
three layered concepts: Same-Origin Policy, CORS, and where enforcement actually lives.

---

## 1. Same-Origin Policy

The browser enforces a rule called the **Same-Origin Policy (SOP)**:
JavaScript running on one origin cannot read responses from a different origin.

An **origin** is the combination of three things:

```
protocol  +  hostname      +  port
https        example.com     443
```

Two URLs are the **same origin** only if all three match exactly.

| Your app's origin | API origin | Same origin? |
|---|---|---|
| `http://localhost:5173` | `https://api.alquran.cloud` | No — different protocol, host, port |
| `https://myapp.vercel.app` | `https://api.alquran.cloud` | No — different host |
| `https://myapp.vercel.app` | `https://myapp.vercel.app` | Yes |

The SOP was designed to protect users. Without it, a malicious site could use your
browser (which carries your cookies and session tokens) to silently call your bank's API
and read back your account balance.

---

## 2. CORS — The Controlled Exception

**CORS (Cross-Origin Resource Sharing)** is how servers *opt in* to allowing
cross-origin requests. It works through HTTP headers.

### The Simple Case (GET requests)

When your JavaScript does `fetch("https://api.alquran.cloud/...")`:

1. Browser sends the request with an `Origin` header:
   ```
   GET /v1/surah/18/editions/ar.alafasy,en.asad
   Origin: http://localhost:5173
   ```

2. The server either includes the CORS header in its response or it doesn't:
   ```
   Access-Control-Allow-Origin: *          ← allows any origin
   Access-Control-Allow-Origin: https://myapp.com  ← allows only this origin
   ```

3. The browser inspects the response headers **before** giving the response body
   to your JavaScript. If the CORS header is missing or doesn't match, the browser
   **silently discards the response body** and throws the CORS error you saw.

**Critical insight:** The request *does* reach the server. The server *does* send a
response. The browser is the one blocking it. CORS enforcement is entirely in the
browser — it is not a server-side firewall.

### The alquran.cloud Situation

The alquran.cloud API was probably built to be consumed server-to-server or from
native apps. It either:
- Returns no `Access-Control-Allow-Origin` header, or
- Returns one that doesn't include `localhost` or your deployed domain

So the browser blocks the response — not because the API rejected your request,
but because the API didn't tell the browser it was okay to share the data.

You can verify this by running `curl` — it has no CORS restrictions:
```bash
curl "https://api.alquran.cloud/v1/surah/18/editions/ar.alafasy,en.asad"
# Returns full JSON just fine
```

---

## 3. Why Proxies Bypass CORS

The key insight: **CORS is enforced by browsers, not servers.**

If your JavaScript never makes a cross-origin request — if it only ever talks to its
own origin — the browser has nothing to enforce. A proxy moves the cross-origin
request from the browser to a server.

```
WITHOUT PROXY:
Browser → (blocked by browser CORS policy) → api.alquran.cloud

WITH PROXY:
Browser → (same origin, browser happy) → Your Server → (server-to-server, no CORS) → api.alquran.cloud
         └─ /quran-api/v1/surah/18/...                   └─ /v1/surah/18/...
```

The browser talks to your server. Your server talks to the API. The API responds to
your server. Your server relays that back to the browser. The browser only ever sees
a same-origin response — CORS never triggers.

---

## 4. Vite's Dev Proxy

Vite runs a local Node.js HTTP server at `http://localhost:5173`. The proxy config
in `vite.config.ts` adds a rewrite rule to that server:

```ts
server: {
  proxy: {
    "/quran-api": {
      target: "https://api.alquran.cloud",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/quran-api/, ""),
    },
  },
},
```

What this does step by step:

| Step | What happens |
|------|-------------|
| Your code calls `fetch("/quran-api/v1/surah/18/...")` | Relative URL → same origin as the app (`localhost:5173`) |
| Browser sends request to `localhost:5173/quran-api/v1/...` | Same origin — no CORS check |
| Vite's dev server receives it, sees `/quran-api` prefix | Rule matches |
| `rewrite` strips `/quran-api` → `/v1/surah/18/...` | Path normalized |
| Vite's server makes server-to-server request to `https://api.alquran.cloud/v1/surah/18/...` | No browser involved — no CORS |
| alquran.cloud responds | Server receives it |
| Vite's server relays the response back to the browser | Browser receives a `localhost:5173` response |
| Browser is happy | Same origin, no CORS triggered |

**`changeOrigin: true`** tells Vite to set the `Host` header on the outgoing request
to match the target (`api.alquran.cloud`), not your localhost. Some servers reject
requests where `Host` doesn't match the domain they're serving.

**The catch:** This only works during development. `npm run build` produces static
files with no Node.js server — there's nothing left to run the proxy.

---

## 5. Vercel Rewrites (Production)

Vercel's rewrite rule in `vercel.json` does the same thing the Vite proxy does, but
at Vercel's infrastructure layer instead of your local dev server:

```json
{
  "rewrites": [
    {
      "source": "/quran-api/:path*",
      "destination": "https://api.alquran.cloud/:path*"
    }
  ]
}
```

When your deployed app at `https://yourapp.vercel.app` calls
`fetch("/quran-api/v1/surah/18/...")`:

```
Browser → yourapp.vercel.app/quran-api/v1/surah/18/...
              (same origin — no CORS)
              ↓
         Vercel's edge network matches the rewrite rule
              ↓
         Vercel server → api.alquran.cloud/v1/surah/18/...
              (server-to-server — no CORS)
              ↓
         Vercel relays response back to browser
              ↓
         Browser sees yourapp.vercel.app response — happy
```

`:path*` is Vercel's wildcard syntax — it captures everything after `/quran-api/`
and appends it verbatim to the destination URL.

**Important distinction: rewrite vs. redirect**

- A **redirect** (301/302) tells the browser "go fetch this other URL yourself."
  The browser would then make a cross-origin request to alquran.cloud — CORS triggers again.
- A **rewrite** is transparent: the browser never knows the upstream URL exists.
  The URL in the browser's address bar (and the request origin) never changes.

This is why rewrites fix CORS and redirects don't.

---

## 6. Netlify Redirects

Netlify uses a `_redirects` file in the `public/` folder:

```
/quran-api/*  https://api.alquran.cloud/:splat  200
```

- `/*` matches any path under `/quran-api/`
- `:splat` is Netlify's placeholder for the wildcard match (equivalent to Vercel's `:path*`)
- The trailing `200` is the key: it tells Netlify to **proxy** (return a 200 with the
  upstream body) rather than **redirect** (return a 301/302 pointing the browser elsewhere)

Without the `200`, Netlify would issue a redirect and the browser would make a
cross-origin request itself — breaking CORS again.

---

## 7. Summary

| Layer | Where request originates | CORS applies? |
|-------|--------------------------|---------------|
| Browser `fetch()` to cross-origin URL | Browser | Yes — blocked if no CORS headers |
| Browser `fetch()` to same-origin URL + proxy | Browser (same origin) → Server | No |
| `curl` / server-side code | Server | Never — CORS is browser-only |

**The rule:** Any time you need a browser to talk to a third-party API that doesn't
have CORS headers, you need a proxy — something that receives the request from the
browser on your own domain and forwards it to the API server-to-server.

In development that proxy is Vite's dev server. In production it's whatever your
hosting provider gives you: Vercel rewrites, Netlify proxied redirects, Cloudflare
Workers, an Express server, or an nginx `proxy_pass` directive — all are the same
concept, different implementations.
