import { AlertTriangle, Mail } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Screen, ScreenBody, ScreenHeader } from '@/components/shell/ScreenHeader'
import { TabBarSpacer } from '@/components/shell/TabBar'
import { SERVICE_NAME } from '@/config/brand'
import {
  LEGAL_UPDATED_AT,
  OPERATOR,
  PRIVACY,
  TERMS,
  type LegalSection,
} from '@/config/legal'

/**
 * 이용약관 · 개인정보처리방침 (§16).
 *
 * 내용은 config/legal.ts 에 있습니다. 문서는 앱이 실제로 하는 일과 어긋나면 안 되고,
 * 화면 코드와 섞여 있으면 기능을 바꿀 때 문서를 같이 고치기 어려워집니다.
 *
 * ★ 운영자 정보가 비어 있으면 맨 위에 경고를 띄웁니다. 연락처 없는 개인정보처리방침은
 *   법적으로 미비하고, 조용히 넘어가면 배포 후에야 알게 됩니다.
 */
export function LegalScreen() {
  const { doc } = useParams<{ doc: string }>()
  const isPrivacy = doc === 'privacy'
  const sections = isPrivacy ? PRIVACY : TERMS
  const title = isPrivacy ? '개인정보처리방침' : '이용약관'
  const missing = !OPERATOR.name || !OPERATOR.email

  return (
    <Screen>
      <ScreenHeader title={title} subtitle={`${SERVICE_NAME} · ${LEGAL_UPDATED_AT} 시행`} back />
      <ScreenBody>
        {missing && (
          <div className="mb-4 rounded-xl border border-warn/40 bg-warn/10 p-3.5">
            <p className="flex items-start gap-1.5 text-2xs font-bold leading-relaxed text-warn">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              운영자 이름과 연락처가 아직 비어 있습니다. 배포 전에
              src/config/legal.ts 의 OPERATOR 를 채워주세요. 연락처 없는
              개인정보처리방침은 법적으로 미비합니다.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {sections.map((s) => (
            <Section key={s.title} section={s} />
          ))}

          <div className="card p-4">
            <h2 className="text-[15px] font-bold">문의</h2>
            <p className="mt-1.5 text-2xs leading-relaxed text-ink-2">
              서비스 이용, 개인정보 열람·정정·삭제에 관한 문의는 아래로 연락해주세요.
            </p>
            <div className="mt-2.5 space-y-1 text-2xs text-ink-2">
              <p>운영자: {OPERATOR.name || '(미설정)'}</p>
              {isPrivacy && (
                <p>개인정보 보호책임자: {OPERATOR.privacyOfficer || OPERATOR.name || '(미설정)'}</p>
              )}
              {OPERATOR.email ? (
                <a
                  href={`mailto:${OPERATOR.email}`}
                  className="inline-flex items-center gap-1 font-semibold text-gold-text"
                >
                  <Mail size={11} />
                  {OPERATOR.email}
                </a>
              ) : (
                <p className="text-ink-3">이메일: (미설정)</p>
              )}
            </div>
            {isPrivacy && (
              <p className="mt-3 text-2xs leading-relaxed text-ink-3">
                개인정보 침해에 대한 상담이 필요하시면 개인정보침해신고센터(국번없이 118),
                개인정보 분쟁조정위원회(1833-6972)에 문의하실 수 있습니다.
              </p>
            )}
          </div>
        </div>

        <TabBarSpacer />
      </ScreenBody>
    </Screen>
  )
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section>
      <h2 className="text-[15px] font-bold">{section.title}</h2>
      {section.body.map((p) => (
        <p key={p} className="mt-2 text-[13px] leading-relaxed text-ink-2">
          {p}
        </p>
      ))}
      {section.list && (
        <ul className="mt-2 space-y-1.5">
          {section.list.map((li) => (
            <li key={li} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
              <span>{li}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
