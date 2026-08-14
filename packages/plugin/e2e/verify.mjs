/**
 * End-to-end verification — boots the real Cordis runtime with the real
 * @deepseek-ai/dsh-host-webserver service and the compiled learning-dsh
 * plugin, then asserts the /learning route serves the built frontend.
 *
 * Run (from packages/plugin): node e2e/verify.mjs
 * Requires: lib/ built (pnpm build in packages/plugin)
 *           packages/web dist/ built (pnpm --filter @learning-dsh/web build)
 */
import { Context } from '@deepseek-ai/cordis'
import HttpServerService from '@deepseek-ai/dsh-host-webserver'
import * as learningDsh from '../lib/index.js'

const BASE = 'http://127.0.0.1'
let failed = 0

function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  ok ${name}`)
  } else {
    failed++
    console.error(`  FAIL ${name} ${detail}`)
  }
}

async function get(port, path) {
  const res = await fetch(`${BASE}:${port}${path}`, { redirect: 'manual' })
  const body = await res.text()
  return { status: res.status, type: res.headers.get('content-type'), body }
}

const ctx = new Context()
await ctx.plugin(HttpServerService, { host: '127.0.0.1', port: 0 })
await ctx.plugin(learningDsh, { mountPath: '/learning', title: 'Learning dsh E2E' })

try {
  const port = ctx.httpServer.port
  console.log(`[boot] httpServer listening on :${port}, /learning mounted`)

  // 1. index document
  const home = await get(port, '/learning/')
  check('GET /learning/ -> 200 html', home.status === 200, `got ${home.status}`)
  check('content-type text/html', (home.type ?? '').includes('text/html'), home.type ?? '')
  check('title transform applied', home.body.includes('<title>Learning dsh E2E</title>'), 'title missing')

  // 2. compiled content data
  const idx = await get(port, '/learning/data/index.json')
  check('GET /learning/data/index.json -> 200 json', idx.status === 200, `got ${idx.status}`)
  let idxJson = null
  try {
    idxJson = JSON.parse(idx.body)
  } catch {
    /* not json */
  }
  check('index.json valid JSON', idxJson !== null)
  check(
    'index.json lists v0.1.0-rc.5',
    idxJson?.versions?.[0]?.id === 'v0.1.0-rc.5',
    JSON.stringify(idxJson?.versions?.[0]?.id),
  )

  const ch = await get(port, '/learning/data/chapters/v0.1.0-rc.5/ch01-everything-is-a-plugin.json')
  check('chapter JSON -> 200', ch.status === 200, `got ${ch.status}`)
  let chJson = null
  try {
    chJson = JSON.parse(ch.body)
  } catch {
    /* not json */
  }
  check(
    'chapter body split en/zh',
    (chJson?.body?.en?.length ?? 0) > 100 && (chJson?.body?.zh?.length ?? 0) > 100,
    'body blocks missing',
  )

  const dia = await get(port, '/learning/data/diagrams/plugin-tree.svg')
  check(
    'diagram SVG -> 200 image/svg+xml',
    dia.status === 200 && (dia.type ?? '').includes('image/svg+xml'),
    `${dia.status} ${dia.type}`,
  )

  // 3. SPA fallback
  const spa = await get(port, '/learning/ch01-everything-is-a-plugin')
  check(
    'SPA fallback (deep link) -> 200 html',
    spa.status === 200 && (spa.type ?? '').includes('text/html'),
    `got ${spa.status} ${spa.type}`,
  )

  // 4. traversal guard
  const evil = await get(port, '/learning/..%2f..%2fetc%2fpasswd')
  check('traversal blocked', evil.status !== 200 || !(evil.type ?? '').includes('text/html'), `got ${evil.status}`)

  // 5. outside mount path
  const outside = await get(port, '/other')
  check('outside mount path -> 404', outside.status === 404, `got ${outside.status}`)

  console.log(failed === 0 ? '\nE2E PASS — all checks green' : `\nE2E FAIL — ${failed} check(s) failed`)
} finally {
  process.exit(failed === 0 ? 0 : 1)
}