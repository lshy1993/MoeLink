// 讨论区共享常量与展示工具

export const THREAD_CATEGORIES = [
  { value: 'general', label: '综合', severity: 'secondary' },
  { value: 'qa', label: '问答', severity: 'info' },
  { value: 'share', label: '分享', severity: 'success' },
  { value: 'news', label: '公告', severity: 'warn' },
] as const

export type ThreadCategory = (typeof THREAD_CATEGORIES)[number]['value']

export function categoryMeta(value: string) {
  return (
    THREAD_CATEGORIES.find((c) => c.value === value) || THREAD_CATEGORIES[0]
  )
}

/**
 * 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前 / yyyy-mm-dd
 */
export function formatTime(raw: string | null | undefined): string {
  if (!raw) return ''
  const t = new Date(raw).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return new Date(raw).toLocaleDateString('zh-CN')
}
