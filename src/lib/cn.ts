type ClassValue = string | number | null | undefined | false | ClassValue[]

/** 조건부 className 합치기 (외부 의존성 없음) */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  for (const v of values) {
    if (!v && v !== 0) continue
    if (Array.isArray(v)) {
      const nested = cn(...v)
      if (nested) out.push(nested)
    } else {
      out.push(String(v))
    }
  }
  return out.join(' ')
}
