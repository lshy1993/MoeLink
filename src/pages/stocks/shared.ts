// 模拟股市（MoeStock）共享类型与展示工具

export interface StockQuote {
  id: number
  symbol: string
  name: string
  emoji: string
  description: string
  price: number
  prev_close: number
  open_price: number
  high: number
  low: number
  volume: number
  change: number
  change_pct: number
  liquidity: number
  status: string
}

export interface StockPosition {
  shares: number
  cost_basis: number
  avg_cost: number
  realized_pnl: number
}

export interface PortfolioPosition {
  stock_id: number
  symbol: string
  name: string
  emoji: string
  price: number
  prev_close: number
  shares: number
  cost_basis: number
  avg_cost: number
  market_value: number
  unrealized_pnl: number
  unrealized_pct: number
  realized_pnl: number
}

export interface TradeRecord {
  id: number
  stock_id: number | null
  stock_symbol: string
  stock_name: string
  side: 'buy' | 'sell'
  shares: number
  price: number
  total: number
  fee: number
  realized_pnl: number | null
  created_at: string
}

export interface AccountTxRecord {
  id: number
  amount: number
  balance_after: number
  type: 'deposit' | 'withdraw' | 'buy' | 'sell'
  ref_type: string | null
  ref_id: number | null
  note: string | null
  created_at: string
}

export const RANGE_OPTIONS = [
  { label: '1小时', value: '1h' },
  { label: '1天', value: '1d' },
  { label: '7天', value: '7d' },
]

/** 涨跌配色：红涨绿跌（A 股习惯） */
export function changeClass(value: number | null | undefined): 'up' | 'down' | 'flat' {
  const n = Number(value) || 0
  if (n > 0) return 'up'
  if (n < 0) return 'down'
  return 'flat'
}

/** 带符号数字：+12 / -8 / 0 */
export function signed(value: number | null | undefined): string {
  const n = Number(value) || 0
  return n > 0 ? `+${n}` : String(n)
}

/** 带符号百分比：+1.23% / -0.45% */
export function signedPct(value: number | null | undefined): string {
  const n = Number(value) || 0
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
}

/** 成交量简写：1.23万 / 4.56亿 */
export function formatVolume(value: number | null | undefined): string {
  const n = Number(value) || 0
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)}亿`
  if (n >= 10000) return `${(n / 10000).toFixed(2)}万`
  return String(n)
}

export function stockStatusLabel(status: string): string {
  if (status === 'active') return '正常交易'
  if (status === 'halted') return '停牌中'
  if (status === 'delisted') return '已退市'
  return status || '未知'
}

export function accountTxLabel(type: string): string {
  if (type === 'deposit') return '入金'
  if (type === 'withdraw') return '出金'
  if (type === 'buy') return '买入股票'
  if (type === 'sell') return '卖出股票'
  return type || '其他'
}

// 与后端 service/stockMarket/trading.js 保持一致
const PRICE_IMPACT_K = 1.5
const MAX_IMPACT_PER_TRADE = 0.05

/**
 * 估算成交价：成交额占做市深度的比例 × 冲击系数，单笔最多 ±5%，
 * 且不突破昨收 ±10% 的日内限制。
 */
export function estimateExecPrice(
  stock: StockQuote | null | undefined,
  shares: number,
  side: 'buy' | 'sell',
): number {
  if (!stock) return 0
  const qty = Number(shares) || 0
  if (qty <= 0) return stock.price
  const market = stock.price
  const notional = market * qty
  const depth = Math.max(1, stock.liquidity || 1)
  const direction = side === 'buy' ? 1 : -1
  const rawRatio = (PRICE_IMPACT_K * notional * direction) / depth
  const ratio = Math.max(-MAX_IMPACT_PER_TRADE, Math.min(MAX_IMPACT_PER_TRADE, rawRatio))
  const prevClose = stock.prev_close || market
  const floor = Math.max(1, Math.round(prevClose * 0.9))
  const ceiling = Math.max(floor + 1, Math.round(prevClose * 1.1))
  return Math.min(ceiling, Math.max(floor, Math.round(market * (1 + ratio))))
}
