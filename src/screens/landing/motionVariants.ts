/** StaggerGroup의 자식 카드에 공통으로 쓰는 등장 variant (별도 .ts 파일 — react-refresh가
 * 컴포넌트 파일에서 비-컴포넌트 export를 싫어해서 분리했습니다) */
export const staggerItem = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
