// MoeCoin 共享常量与展示工具

export interface TxMeta {
  label: string
  severity?: 'success' | 'warn' | 'danger' | 'info' | 'secondary'
}

export const MOCOIN_TX_TYPES: Record<string, TxMeta> = {
  initial: { label: '新手礼包', severity: 'success' },
  checkin: { label: '签到奖励', severity: 'success' },
  tip_sent: { label: '打赏支出', severity: 'warn' },
  tip_received: { label: '获得打赏', severity: 'success' },
  transfer_sent: { label: '转账支出', severity: 'warn' },
  transfer_received: { label: '转账收入', severity: 'success' },
  bounty_escrow: { label: '悬赏托管', severity: 'warn' },
  bounty_received: { label: '获得悬赏', severity: 'success' },
  bounty_refund: { label: '悬赏退回', severity: 'info' },
  admin_grant: { label: '管理员发放', severity: 'info' },
  admin_deduct: { label: '管理员扣减', severity: 'danger' },
}

export function txMeta(type: string): TxMeta {
  return (
    MOCOIN_TX_TYPES[type] || { label: type || '其他', severity: 'secondary' }
  )
}

export function formatCoin(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '0'
  return Number(n).toLocaleString('zh-CN')
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
