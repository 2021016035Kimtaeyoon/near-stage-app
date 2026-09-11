const KEY = 'ns_landing_seen'

/**
 * 랜딩(커튼 개막)을 이미 본 적 있는지.
 *
 * ★ 처음 접속했을 때만 랜딩이 뜨고, 그다음부터는 바로 앱으로 들어가게 하기
 *   위한 기록입니다. 로그인 여부와 무관하게 이 브라우저에서 한 번이라도 랜딩을
 *   지나간 적이 있으면 true — 로그아웃해도 다시 뜨지 않습니다.
 */
export function hasSeenLanding(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    // 프라이빗 모드 등 저장소를 못 쓰면 매번 랜딩이 뜰 뿐, 기능은 그대로 동작합니다
    return false
  }
}

export function markLandingSeen(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // 저장 실패는 무시합니다 — 다음에도 랜딩이 한 번 더 뜨는 것뿐입니다
  }
}
