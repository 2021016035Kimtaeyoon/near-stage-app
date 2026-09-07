/**
 * Supabase 적용 상태 점검.
 *
 * 테이블·뷰·함수가 올라왔는지, RLS가 실제로 익명 쓰기를 막는지 REST로 확인합니다.
 * .env.local 의 URL·publishable key 만 씁니다 (secret key 는 필요 없고, 쓰면 안 됩니다).
 */
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const BASE = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
if (!BASE || !KEY) {
  console.error('.env.local 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 필요합니다')
  process.exit(1)
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const TABLES = [
  'profiles',
  'venues',
  'artists',
  'shows',
  'venue_slots',
  'posts',
  'applications',
  'attendances',
  'likes',
  'follows',
  'reviews',
  'show_reports',
  'notifications',
  'threads',
  'messages',
  'v_public_shows',
]

let failed = 0
const line = (ok, label, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
}

console.log('\n── 테이블 · 뷰 ──')
for (const t of TABLES) {
  const r = await fetch(`${BASE}/rest/v1/${t}?select=*&limit=0`, { headers: H })
  line(r.ok, t, r.ok ? '' : `HTTP ${r.status}`)
}

console.log('\n── 함수 ──')
{
  const r = await fetch(`${BASE}/rest/v1/rpc/fn_accept_application`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      p_application_id: '00000000-0000-0000-0000-000000000000',
      p_slot_id: '00000000-0000-0000-0000-000000000000',
    }),
  })
  const j = await r.json().catch(() => ({}))
  // 함수가 없으면 PGRST202. 있으면 우리가 던진 P0002 가 돌아옵니다.
  line(j.code === 'P0002', 'fn_accept_application', j.code ?? '응답 없음')
}

console.log('\n── RLS (익명 쓰기가 막히는지) ──')
const denies = [
  [
    'venues',
    {
      owner_id: '00000000-0000-0000-0000-000000000000',
      name: 'x',
      category: '카페',
      address: 'x',
      lat: 37.5,
      lng: 127,
      capacity: 10,
    },
  ],
  ['notifications', { user_id: '00000000-0000-0000-0000-000000000000', type: 'x', title: 'x' }],
  [
    'artists',
    { owner_id: '00000000-0000-0000-0000-000000000000', team_name: 'x', genre: '밴드' },
  ],
]
for (const [t, body] of denies) {
  const r = await fetch(`${BASE}/rest/v1/${t}`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({}))
  line(j.code === '42501', `${t} 익명 INSERT 차단`, j.code ?? `HTTP ${r.status}`)
}

console.log(failed === 0 ? '\n전부 정상입니다.\n' : `\n${failed}건 실패.\n`)
process.exit(failed === 0 ? 0 : 1)
