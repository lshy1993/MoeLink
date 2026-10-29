// 讨论区共享常量与展示工具
import axios from 'axios'
import { ref } from 'vue'
import { GetApi } from '@/utils'

export interface ThreadCategoryItem {
  value: string
  label: string
  severity: string
  description: string
  active: boolean
}

// 分区由后台维护；接口返回前先用内置默认值占位，避免首屏空白
const DEFAULT_CATEGORIES: ThreadCategoryItem[] = [
  { value: 'general', label: '综合', severity: 'secondary', description: '', active: true },
  { value: 'qa', label: '求物', severity: 'info', description: '', active: true },
  { value: 'share', label: '分享', severity: 'success', description: '', active: true },
  { value: 'news', label: '公告', severity: 'warn', description: '', active: true },
]

export const threadCategories = ref<ThreadCategoryItem[]>(DEFAULT_CATEGORIES)

let loading: Promise<void> | null = null

export function loadThreadCategories(force = false) {
  if (loading && !force) return loading
  loading = axios
    .get(GetApi('/thread/categories'))
    .then((res) => {
      const list = res.data?.categories
      if (!Array.isArray(list) || !list.length) return
      threadCategories.value = list.map(
        (c: Record<string, unknown>): ThreadCategoryItem => ({
          value: String(c.slug),
          label: String(c.name),
          severity: String(c.severity || 'secondary'),
          description: String(c.description || ''),
          active: c.is_active !== false,
        }),
      )
    })
    .catch(() => {
      loading = null
    })
  return loading
}

export function categoryMeta(value: string) {
  return (
    threadCategories.value.find((c) => c.value === value) || {
      value,
      label: value,
      severity: 'secondary',
      description: '',
      active: false,
    }
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
