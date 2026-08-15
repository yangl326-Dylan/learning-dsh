/**
 * @module @dylan/learning-dsh
 *
 * Cordis plugin for DeepSeek Harness: mounts a versioned, bilingual
 * source-code learning page under a configurable prefix route on the
 * dsh webserver (`ctx.httpServer`, published API).
 *
 * The page is a static Vite build provided by the `@learning-dsh/web`
 * package; this plugin resolves its dist directory and serves it with
 * SPA fallback semantics (any miss inside the mount path serves
 * index.html), mirroring `dsh-host-frontend-static` behavior while
 * staying on its own prefix route (the webserver's fallback seat is
 * single-owner and already claimed by the dsh web app).
 */

import { createRequire } from 'node:module'
import { readFile, stat } from 'node:fs/promises'
import { dirname, join, normalize, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'

export const name = 'learning-dsh'

/**
 * The dsh webserver service name differs between the published package and
 * master source: `@deepseek-ai/dsh-host-webserver` (npm, 0.0.1-rc.1) provides
 * `ctx.httpServer` / `HttpServerService`, while the master-source spelling is
 * `ctx.webServer` / `WebServer`. The plugin therefore declares NO static
 * inject (Cordis treats an inject list as AND — waiting for one name would
 * deadlock on the other) and instead resolves whichever service the host
 * provides at activation time; see {@link waitForWebServer}.
 */
export const inject: string[] = []
/** Minimal surface the plugin needs from either webserver variant. */
export interface WebServerLike {
  register(route: WebRoute): () => void
}

const WEB_SERVER_NAMES = ['httpServer', 'webServer'] as const

/**
 * Resolve the host's webserver service, waiting if it is not yet provided.
 * Activated with an empty inject, the plugin may run before the webserver
 * fiber; the `internal/service` event (global: true, so no context-filter
 * surprises) resolves the promise as soon as either name is provided.
 */
function waitForWebServer(ctx: Context): Promise<WebServerLike> {
  return new Promise((resolve) => {
    for (const name of WEB_SERVER_NAMES) {
      const impl = ctx.reflect.get(name) as WebServerLike | undefined
      if (impl) {
        resolve(impl)
        return
      }
    }
    const disposers: Array<() => void> = []
    for (const name of WEB_SERVER_NAMES) {
      disposers.push(
        ctx.on(
          'internal/service',
          (serviceName: string, value: unknown) => {
            if (serviceName !== name) return
            for (const dispose of disposers) dispose()
            resolve(value as WebServerLike)
          },
          { global: true },
        ),
      )
    }
  })
}

/** Plugin configuration. */
export interface Config {
  /** Prefix path under which the learning page is served. Must be unique. */
  mountPath: string
  /** Page title baked into served index.html. */
  title: string
}

/** Schemastery configuration schema (patchable via cordis.patch.yml). */
export const Config: z<Config> = z.object({
  mountPath: z.string().default('/learning'),
  title: z.string().default('Learning dsh'),
})

const require = createRequire(import.meta.url)

/** MIME types for the asset classes the Vite build emits. */
const MIME: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
}

/** Resolve the web package's dist directory, failing loud when unbuilt. */
function resolveDist(): string {
  const entry: string = require.resolve('@learning-dsh/web')
  return dirname(entry)
}

/**
 * Serve one request against the static dist root with SPA fallback.
 * Any path that normalizes outside the root or fails to resolve to a
 * real file serves index.html (hash-based SPA routing keeps all app
 * routes on the index document).
 */
function staticHandler(dist: string, config: Config) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    let pathname = decodeURIComponent(url.pathname)

    // Strip the mount prefix; anything left is relative to dist.
    if (config.mountPath !== '/') {
      if (!pathname.startsWith(config.mountPath)) {
        res.writeHead(404).end('not found')
        return
      }
      // Without a trailing slash the document base drops the prefix, so
      // relative ./assets URLs resolve against / and hit the web app's
      // SPA fallback (text/html) instead of this dist. Redirect to the
      // slash form to keep the base inside the mount path.
      if (pathname === config.mountPath) {
        res.writeHead(308, { location: `${config.mountPath}/${url.search}` }).end()
        return
      }
      pathname = pathname.slice(config.mountPath.length)
    }
    if (pathname === '') pathname = '/'

    // Reject parent-directory segments before normalize() can mask them
    // (normalize collapses '/../../etc' to '/etc', re-rooting the path).
    if (pathname.split('/').includes('..')) {
      res.writeHead(403).end('forbidden')
      return
    }

    const filePath = join(dist, normalize(pathname).replace(/^([/\\])+/, ''))
    // Traversal guard: the resolved path must stay inside dist.
    if (filePath !== dist && !filePath.startsWith(dist + sep)) {
      res.writeHead(403).end('forbidden')
      return
    }

    try {
      const info = await stat(filePath)
      if (info.isFile()) {
        const body = await readFile(filePath)
        const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
        res.writeHead(200, {
          'content-type': MIME[ext] ?? 'application/octet-stream',
          'content-length': body.length,
          'cache-control': 'no-cache',
        })
        res.end(body)
        return
      }
    } catch {
      // fall through to SPA fallback
    }

    const index = join(dist, 'index.html')
    try {
      let html = await readFile(index, 'utf8')
      html = html.replace(/<title>.*?<\/title>/, () => `<title>${config.title}</title>`)
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(html)
    } catch (err) {
      res.writeHead(500).end('learning-dsh: frontend dist missing — build @learning-dsh/web first')
      void err
    }
  }
}

/**
 * Mount the plugin: register the learning page route on the dsh webserver.
 *
 * NOTE: exported as a plain named function (no `export default`). The Cordis
 * Loader (`unwrapExports`) keeps the full module namespace only when no
 * default export exists — a default export would swallow the sibling
 * `inject`/`Config`/`name` exports and break dependency injection.
 */
export async function apply(ctx: Context, config: Config) {
  const server = await waitForWebServer(ctx)
  const dist = resolveDist()
  const route: WebRoute = {
    kind: 'prefix',
    path: config.mountPath,
    handler: staticHandler(dist, config),
  }
  const dispose = server.register(route)
  ctx.logger.info('learning-dsh mounted at %s (dist %s)', config.mountPath, dist)
  return dispose
}
