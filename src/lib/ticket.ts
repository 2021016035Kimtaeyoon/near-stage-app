const PREFIX = 'nearstage:ticket:'

/** attendances.id(UUID)를 QR 문자열로 인코딩합니다. 서명이 없는 건 의도입니다 —
 *  UUID 자체가 추측 불가능하고, 체크인 권한은 RLS(호스트·아티스트만 UPDATE)가 막습니다. */
export function encodeTicket(attendanceId: string): string {
  return PREFIX + attendanceId
}

/** QR에서 읽은 문자열이 우리 티켓 포맷이면 attendance id를, 아니면 null을 돌려줍니다 */
export function decodeTicket(raw: string): string | null {
  const text = raw.trim()
  if (!text.startsWith(PREFIX)) return null
  const id = text.slice(PREFIX.length)
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRe.test(id) ? id : null
}
