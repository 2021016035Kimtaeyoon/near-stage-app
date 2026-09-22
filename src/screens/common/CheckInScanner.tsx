import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, ChevronLeft, TriangleAlert, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '@/components/shell/ScreenHeader'
import { IconButton } from '@/components/ui/Button'
import { decodeTicket } from '@/lib/ticket'
import { describeDbError, supabase } from '@/lib/supabase'

const SCANNER_ID = 'checkin-scanner'

type Result =
  | { kind: 'ok'; name: string; headcount: number; showTitle: string }
  | { kind: 'error'; message: string }

/**
 * 입장 체크인 스캐너 — 호스트·아티스트 공용 (§12 후속).
 *
 * QR에서 attendance id를 읽어 status를 'attended'로 바꿉니다. 그 이상의 검증은
 * 필요 없습니다 — RLS(attendances_update_self_or_host)가 이 공연의 호스트·
 * 아티스트가 아니면 애초에 행을 못 찾게 막습니다(0건 업데이트로 조용히 실패).
 */
export function CheckInScanner() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const busyRef = useRef(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner
    let cancelled = false

    const startPromise = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 240 },
      (decodedText) => {
        if (busyRef.current) return
        void handleScan(decodedText)
      },
      () => {
        // 프레임마다 못 읽는 건 정상입니다(QR이 화면 밖에 있을 때) — 무시합니다
      },
    )

    startPromise
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) setCamError('카메라를 열 수 없어요. 카메라 권한을 확인해 주세요.')
      })

    return () => {
      cancelled = true
      // start()의 성공/실패가 확정되기 전에 stop()을 부르면 html5-qrcode가
      // 동기적으로 throw합니다("not running or paused"). 결과가 확정된 뒤에만
      // 정리하도록 같은 프라미스 체인에 뒷정리를 겁니다.
      startPromise
        .then(() => scanner.stop().then(() => scanner.clear()))
        .catch(() => {
          try {
            scanner.clear()
          } catch {
            /* 이미 정리된 상태 — 무시 */
          }
        })
    }
  }, [])

  const handleScan = async (raw: string) => {
    const attendanceId = decodeTicket(raw)
    if (!attendanceId) {
      busyRef.current = true
      setResult({ kind: 'error', message: '이 앱의 입장 QR이 아니에요' })
      return
    }

    busyRef.current = true

    const { data: row, error: selErr } = await supabase
      .from('attendances')
      .select('id,status,headcount,shows(title),profiles(display_name)')
      .eq('id', attendanceId)
      .maybeSingle()

    if (selErr || !row) {
      setResult({
        kind: 'error',
        message: selErr ? describeDbError(selErr) : '이 공연의 담당자만 확인할 수 있어요',
      })
      return
    }

    const showTitle = one(row.shows as { title: string } | { title: string }[] | null)?.title ?? ''
    const name =
      one(row.profiles as { display_name: string } | { display_name: string }[] | null)
        ?.display_name || '이름 없음'

    if (row.status === 'canceled') {
      setResult({ kind: 'error', message: '취소된 참석 예정이에요' })
      return
    }
    if (row.status === 'attended') {
      setResult({ kind: 'ok', name, headcount: row.headcount, showTitle })
      return
    }

    const { error: updErr } = await supabase
      .from('attendances')
      .update({ status: 'attended' })
      .eq('id', attendanceId)

    if (updErr) {
      setResult({ kind: 'error', message: describeDbError(updErr) })
      return
    }
    setResult({ kind: 'ok', name, headcount: row.headcount, showTitle })
  }

  const resume = () => {
    setResult(null)
    busyRef.current = false
  }

  return (
    <Screen>
      <div className="absolute left-3 top-11 z-30">
        <IconButton label="뒤로" onClick={() => navigate(-1)} className="bg-black/35 text-white">
          <ChevronLeft size={22} />
        </IconButton>
      </div>

      <div className="relative flex h-full flex-col items-center justify-center bg-black">
        <div id={SCANNER_ID} className="w-full" />

        {!ready && !camError && (
          <p className="absolute text-sm text-white/70">카메라를 여는 중이에요…</p>
        )}
        {camError && (
          <div className="absolute inset-x-6 rounded-2xl bg-surface p-4 text-center">
            <TriangleAlert size={22} className="mx-auto mb-2 text-danger" />
            <p className="text-sm font-bold">{camError}</p>
          </div>
        )}

        {result && (
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-surface p-5 pb-[calc(var(--safe-bottom)+20px)]">
            {result.kind === 'ok' ? (
              <>
                <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-ok">
                  <CheckCircle2 size={18} />
                  입장 확인됐어요
                </p>
                <p className="mt-1.5 text-sm font-bold">{result.name}</p>
                <p className="tnum mt-0.5 flex items-center gap-1 text-2xs text-ink-2">
                  <Users size={12} />
                  {result.headcount}명 · {result.showTitle}
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-danger">
                  <TriangleAlert size={18} />
                  확인할 수 없어요
                </p>
                <p className="mt-1.5 text-sm text-ink-2">{result.message}</p>
              </>
            )}
            <button
              onClick={resume}
              className="mt-4 w-full rounded-xl bg-surface-2 py-3 text-sm font-bold"
            >
              다음 QR 스캔하기
            </button>
          </div>
        )}
      </div>
    </Screen>
  )
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v === undefined || v === null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}
