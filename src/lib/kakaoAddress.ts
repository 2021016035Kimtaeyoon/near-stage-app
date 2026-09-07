/**
 * 주소 검색과 좌표 변환.
 *
 * 두 개를 조합합니다.
 *  - 다음 우편번호 서비스: 주소를 고르게 해줍니다. 키가 필요 없습니다.
 *  - 카카오 지도 SDK(services): 고른 주소를 좌표로 바꿉니다. JavaScript 키를 씁니다.
 *
 * ★ 왜 REST API 를 쓰지 않는가
 *   카카오 로컬 REST API 는 REST 키가 필요하고, 그 키는 브라우저에 노출되면 안 됩니다.
 *   JavaScript 키는 애초에 브라우저용으로 설계됐고 콘솔의 사이트 도메인 제한으로
 *   보호됩니다. 그래서 지오코딩만 SDK 로 처리합니다.
 *
 * ★ 왜 지도는 카카오가 아니라 Leaflet 인가
 *   앱 전체가 이미 Leaflet/OSM 을 씁니다. 핀 위치 조정 하나 때문에 지도 라이브러리를
 *   두 개 태우지 않습니다. 카카오 SDK 는 좌표 변환에만 쓰고, 등록 폼에 들어올 때만
 *   지연 로딩합니다.
 */

const POSTCODE_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
const SDK_SRC = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_JS_KEY}&libraries=services&autoload=false`

export const isKakaoMapConfigured = Boolean(import.meta.env.VITE_KAKAO_JS_KEY)

/** 고른 주소 */
export interface PickedAddress {
  /** 도로명 주소 (없으면 지번 주소) */
  address: string
  /** 사용자가 직접 적는 상세 주소는 별도로 받습니다 */
  roadAddress: string
  jibunAddress: string
  zonecode: string
  /** 행정동 (필터·표기용) */
  bname: string
  sido: string
  sigungu: string
}

interface DaumPostcodeData {
  roadAddress: string
  jibunAddress: string
  zonecode: string
  bname: string
  sido: string
  sigungu: string
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: DaumPostcodeData) => void
        onclose?: () => void
      }) => { open: () => void }
    }
    kakao?: {
      maps: {
        load: (cb: () => void) => void
        services: {
          Geocoder: new () => {
            addressSearch: (
              addr: string,
              cb: (result: Array<{ x: string; y: string }>, status: string) => void,
            ) => void
          }
          Status: { OK: string }
        }
      }
    }
  }
}

const loaded = new Map<string, Promise<void>>()

/** 같은 스크립트를 두 번 넣지 않습니다 */
function loadScript(src: string): Promise<void> {
  const cached = loaded.get(src)
  if (cached) return cached
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`스크립트를 불러오지 못했습니다: ${src}`))
    document.head.appendChild(el)
  })
  loaded.set(src, p)
  return p
}

/**
 * 주소 검색 창을 띄웁니다.
 * 사용자가 고르면 그 주소를, 닫으면 null 을 돌려줍니다.
 */
export async function openAddressSearch(): Promise<PickedAddress | null> {
  await loadScript(POSTCODE_SRC)
  if (!window.daum?.Postcode) throw new Error('주소 검색을 불러오지 못했습니다')

  return new Promise<PickedAddress | null>((resolve) => {
    let picked = false
    const postcode = new window.daum!.Postcode({
      oncomplete: (data) => {
        picked = true
        resolve({
          address: data.roadAddress || data.jibunAddress,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          zonecode: data.zonecode,
          bname: data.bname,
          sido: data.sido,
          sigungu: data.sigungu,
        })
      },
      onclose: () => {
        // 주소를 고르고 닫히는 경우에도 onclose 가 불립니다 — 중복 resolve 를 막습니다
        if (!picked) resolve(null)
      },
    })
    postcode.open()
  })
}

let sdkReady: Promise<void> | null = null

/** 카카오 지도 SDK 를 지연 로딩합니다 (좌표 변환에만 씁니다) */
function ensureSdk(): Promise<void> {
  if (sdkReady) return sdkReady
  sdkReady = loadScript(SDK_SRC).then(
    () =>
      new Promise<void>((resolve, reject) => {
        if (!window.kakao?.maps) {
          reject(new Error('카카오 지도 SDK 를 불러오지 못했습니다'))
          return
        }
        window.kakao.maps.load(() => resolve())
      }),
  )
  return sdkReady
}

/**
 * 주소 → 좌표.
 * 변환에 실패하면 null 을 돌려줍니다. 그때는 사용자가 지도에서 직접 핀을 찍게 합니다.
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!isKakaoMapConfigured) return null
  await ensureSdk()
  const geocoder = new window.kakao!.maps.services.Geocoder()
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (result, status) => {
      if (status !== window.kakao!.maps.services.Status.OK || result.length === 0) {
        resolve(null)
        return
      }
      // 카카오는 x=경도, y=위도 순서입니다
      resolve({ lat: Number(result[0].y), lng: Number(result[0].x) })
    })
  })
}
