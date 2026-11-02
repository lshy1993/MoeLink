<template>
  <div class="stockDetailPage">
    <router-link class="backLink" to="/stocks">← 返回模拟股市</router-link>

    <template v-if="stock">
      <div class="detailHead">
        <div class="stockIdentity">
          <span class="bigEmoji">{{ stock.emoji }}</span>
          <div>
            <h1>{{ stock.name }} <small>{{ stock.symbol }}</small></h1>
            <p class="desc">{{ stock.description }}</p>
          </div>
        </div>
        <div class="quoteBlock" :class="changeClass(stock.change)">
          <div class="bigPrice">{{ formatCoin(stock.price) }}</div>
          <div class="bigChange">{{ signed(stock.change) }} · {{ signedPct(stock.change_pct) }}</div>
          <div class="quoteHint">MoeCoin / 股 · {{ updatedText }}</div>
        </div>
      </div>

      <div class="statGrid">
        <div><span>昨收</span><b>{{ formatCoin(stock.prev_close) }}</b></div>
        <div><span>今开</span><b>{{ formatCoin(stock.open_price) }}</b></div>
        <div><span>最高</span><b>{{ formatCoin(stock.high) }}</b></div>
        <div><span>最低</span><b>{{ formatCoin(stock.low) }}</b></div>
        <div><span>成交量</span><b>{{ formatVolume(stock.volume) }} 股</b></div>
        <div><span>做市深度</span><b>{{ formatCoin(stock.liquidity) }}</b></div>
        <div><span>状态</span><b>{{ statusLabel }}</b></div>
      </div>

      <div class="mainGrid">
        <!-- 走势图 -->
        <section class="panel chartPanel">
          <div class="panelHead">
            <h2><i class="pi pi-chart-line"></i> 走势</h2>
            <div class="rangeTabs">
              <button
                v-for="opt in ranges"
                :key="opt.value"
                :class="{ active: range === opt.value }"
                @click="setRange(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <VChart v-if="points.length" class="chart" :option="chartOption" autoresize />
          <div v-else class="chartEmpty">暂无走势数据</div>
        </section>

        <!-- 交易面板 -->
        <section class="panel tradePanel">
          <div class="panelHead">
            <h2><i class="pi pi-arrow-right-arrow-left"></i> 交易</h2>
          </div>

          <template v-if="logined">
            <div class="sideSwitch">
              <button :class="{ active: side === 'buy' }" @click="setSide('buy')">买入</button>
              <button :class="{ active: side === 'sell' }" @click="setSide('sell')">卖出</button>
            </div>

            <div class="tradeInfo">
              <div><span>现价</span><b>{{ formatCoin(stock.price) }} MoeCoin</b></div>
              <div><span>证券账户</span><b>{{ formatCoin(accountBalance) }}</b></div>
              <div><span>我的持仓</span><b>{{ holdingShares }} 股</b></div>
            </div>

            <div class="cashRow">
              <button class="cashLink" @click="transferOpen = true">
                <i class="pi pi-arrow-right-arrow-left"></i> 入金 / 出金
              </button>
              <span>钱包 {{ formatCoin(walletBalance) }}</span>
            </div>

            <div class="qtyRow">
              <label for="tradeShares">数量（股）</label>
              <InputNumber
                v-model="shares"
                :min="1"
                :max="maxShares"
                :useGrouping="false"
                inputId="tradeShares"
                class="qtyInput"
              />
            </div>

            <div class="quickRow">
              <button v-for="q in quickAmounts" :key="q.label" @click="applyQuick(q.ratio)">
                {{ q.label }}
              </button>
            </div>

            <div class="estimateRow">
              <span>{{ side === 'buy' ? '预计花费' : '预计到手' }}</span>
              <b>{{ formatCoin(estimated) }} MoeCoin</b>
            </div>
            <div v-if="stock && estimatedPrice !== stock.price" class="execHint">
              预计成交价 {{ formatCoin(stock.price) }} → {{ formatCoin(estimatedPrice) }}
            </div>

            <Button
              :label="side === 'buy' ? '确认买入' : '确认卖出'"
              :icon="side === 'buy' ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
              :severity="side === 'buy' ? 'danger' : 'success'"
              :loading="submitting"
              :disabled="!canTrade"
              class="tradeBtn"
              @click="submit"
            />

            <p v-if="stock.status !== 'active'" class="tradeHint">该股票已停牌，暂停交易</p>
            <p v-else-if="side === 'sell' && holdingShares === 0" class="tradeHint">
              当前没有持仓，无法卖出
            </p>
            <p v-else-if="side === 'buy' && estimated > accountBalance" class="tradeHint">
              证券账户余额不足，请先入金
            </p>
            <p class="ruleHint">成交价含买卖冲击（单笔最多 ±5%）· 买贵卖便宜 · 暂不收手续费</p>
          </template>

          <div v-else class="tradeLocked">
            <i class="pi pi-lock"></i>
            <p>请点击右上角「登录 / 注册」后交易</p>
          </div>
        </section>
      </div>

      <!-- 我的持仓 -->
      <section v-if="logined && position" class="panel holdingPanel">
        <div class="panelHead">
          <h2><i class="pi pi-briefcase"></i> 我的持仓</h2>
        </div>
        <div class="holdingRow">
          <div><span>持有</span><b>{{ position.shares }} 股</b></div>
          <div><span>成本价</span><b>{{ position.avg_cost }}</b></div>
          <div><span>市值</span><b>{{ formatCoin(position.shares * stock.price) }}</b></div>
          <div>
            <span>浮动盈亏</span>
            <b :class="changeClass(position.shares * stock.price - position.cost_basis)">
              {{ signed(position.shares * stock.price - position.cost_basis) }}
            </b>
          </div>
        </div>
      </section>
    </template>

    <div v-else-if="!loading" class="notFound">
      <i class="pi pi-exclamation-circle"></i>
      <p>股票不存在或已退市</p>
      <router-link to="/stocks">返回行情</router-link>
    </div>

    <cash-transfer-dialog
      v-model:visible="transferOpen"
      :account-balance="accountBalance"
      :wallet-balance="walletBalance"
      @done="load"
    />
  </div>
</template>

<script>
import axios from 'axios'
import { LineChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import VChart from 'vue-echarts'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'
import CashTransferDialog from './CashTransferDialog.vue'
import {
  RANGE_OPTIONS,
  changeClass,
  estimateExecPrice,
  formatVolume,
  signed,
  signedPct,
  stockStatusLabel,
} from './shared'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, MarkLineComponent])

const REFRESH_MS = 12000
const MAX_ORDER_SHARES = 100000

export default {
  name: 'StockDetailPage',
  components: { Button, CashTransferDialog, InputNumber, VChart },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      stock: null,
      position: null,
      points: [],
      range: '1d',
      side: 'buy',
      shares: 1,
      accountBalance: 0,
      walletBalance: 0,
      transferOpen: false,
      logined: !!GetToken(),
      loading: true,
      refreshing: false,
      loadSeq: 0,
      submitting: false,
      timer: null,
      quickAmounts: [
        { label: '25%', ratio: 0.25 },
        { label: '50%', ratio: 0.5 },
        { label: '全部', ratio: 1 },
      ],
    }
  },
  computed: {
    stockId() {
      return this.$route.params.id
    },
    ranges() {
      return RANGE_OPTIONS
    },
    holdingShares() {
      return this.position?.shares || 0
    },
    maxShares() {
      if (this.side === 'sell') return Math.max(1, this.holdingShares)
      const price = this.stock?.price || 0
      const affordable = price > 0 ? Math.floor(this.accountBalance / price) : 0
      return Math.max(1, Math.min(MAX_ORDER_SHARES, affordable))
    },
    estimated() {
      return this.estimatedPrice * (Number(this.shares) || 0)
    },
    estimatedPrice() {
      return estimateExecPrice(this.stock, Number(this.shares) || 0, this.side)
    },
    canTrade() {
      if (!this.stock || this.stock.status !== 'active') return false
      const n = Number(this.shares) || 0
      if (n < 1) return false
      if (this.side === 'buy') return this.estimated <= this.accountBalance
      return n <= this.holdingShares
    },
    statusLabel() {
      return stockStatusLabel(this.stock?.status)
    },
    updatedText() {
      return this.stock?.last_tick_at
        ? `更新于 ${new Date(this.stock.last_tick_at).toLocaleTimeString('zh-CN', { hour12: false })}`
        : ''
    },
    chartOption() {
      const up = (this.stock?.change || 0) >= 0
      const color = up ? '#e0575b' : '#2f9e6e'
      const prevClose = this.stock?.prev_close
      return {
        animation: false,
        grid: { left: 10, right: 18, top: 18, bottom: 8, containLabel: true },
        tooltip: {
          trigger: 'axis',
          borderColor: '#e3e9f8',
          textStyle: { color: '#45507a', fontSize: 12 },
          formatter: (params) => {
            const item = Array.isArray(params) ? params[0] : params
            if (!item) return ''
            const d = new Date(item.value[0])
            return `${d.toLocaleString('zh-CN', { hour12: false })}<br/>价格 <b>${formatCoin(item.value[1])}</b> MoeCoin`
          },
        },
        xAxis: {
          type: 'time',
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#e3e9f8' } },
          axisTick: { show: false },
          axisLabel: {
            color: '#9aa2c5',
            fontSize: 10,
            formatter: (value) => {
              const d = new Date(value)
              if (this.range === '7d') return `${d.getMonth() + 1}/${d.getDate()}`
              return d.toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              })
            },
          },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          scale: true,
          axisLabel: {
            color: '#9aa2c5',
            fontSize: 10,
            formatter: (value) => formatCoin(Math.round(value)),
          },
          splitLine: { lineStyle: { color: '#f0f3fa' } },
        },
        series: [
          {
            type: 'line',
            data: this.points.map((p) => [p.ts, p.price]),
            showSymbol: false,
            smooth: 0.18,
            lineStyle: { width: 2, color },
            itemStyle: { color },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: up ? 'rgba(224, 87, 91, 0.22)' : 'rgba(47, 158, 110, 0.22)',
                  },
                  { offset: 1, color: 'rgba(255, 255, 255, 0)' },
                ],
              },
            },
            markLine: prevClose
              ? {
                  silent: true,
                  symbol: 'none',
                  label: {
                    formatter: `昨收 ${formatCoin(prevClose)}`,
                    color: '#9aa2c5',
                    fontSize: 10,
                    position: 'insideEndTop',
                  },
                  lineStyle: { color: '#c9d0e6', type: 'dashed', width: 1 },
                  data: [{ yAxis: prevClose }],
                }
              : undefined,
          },
        ],
      }
    },
  },
  watch: {
    '$route.params.id'() {
      this.load()
    },
  },
  mounted() {
    this.load()
    this.timer = setInterval(this.load, REFRESH_MS)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    formatCoin,
    changeClass,
    formatVolume,
    signed,
    signedPct,
    setRange(value) {
      if (this.range === value) return
      this.range = value
      this.load()
    },
    setSide(value) {
      this.side = value
      this.shares = 1
    },
    applyQuick(ratio) {
      this.shares = Math.max(1, Math.floor(this.maxShares * ratio))
    },
    async load() {
      const seq = this.loadSeq + 1
      this.loadSeq = seq
      this.refreshing = true
      const token = GetToken()
      this.logined = !!token
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const [detailRes, historyRes] = await Promise.all([
          axios.get(GetApi(`/stock-market/stocks/${this.stockId}`), { headers }),
          axios.get(GetApi(`/stock-market/stocks/${this.stockId}/history`), {
            params: { range: this.range },
          }),
        ])
        if (seq !== this.loadSeq) return
        this.stock = detailRes.data.stock || null
        this.position = detailRes.data.position || null
        this.points = historyRes.data.points || []

        if (this.logined) {
          const pfRes = await axios.get(GetApi('/stock-market/portfolio'), { headers })
          if (seq !== this.loadSeq) return
          this.accountBalance = pfRes.data.account_balance || 0
          this.walletBalance = pfRes.data.wallet_balance || 0
        }
      } catch (err) {
        if (seq !== this.loadSeq) return
        if (err.response?.status === 401) {
          this.logined = false
        } else if (err.response?.status !== 404) {
          console.error('股票详情加载失败', err)
        }
      } finally {
        if (seq === this.loadSeq) {
          this.loading = false
          this.refreshing = false
        }
      }
    },
    async submit() {
      if (!this.canTrade || this.submitting) return
      this.submitting = true
      const token = GetToken()
      try {
        const res = await axios.post(
          GetApi(`/stock-market/${this.side}`),
          { stock_id: Number(this.stockId), shares: Number(this.shares) },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        const data = res.data
        const detail =
          data.price_before && data.price_before !== data.price
            ? `${formatCoin(data.price_before)} → ${formatCoin(data.price)} MoeCoin · ${data.shares} 股`
            : `${data.shares} 股 @ ${formatCoin(data.price)} MoeCoin`
        this.toast.add({
          severity: 'success',
          summary: this.side === 'buy' ? '买入成功' : '卖出成功',
          detail,
          life: 3000,
        })
        this.shares = 1
        await this.load()
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '交易失败',
          detail: err.response?.data?.error || err.message,
          life: 4000,
        })
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.stockDetailPage {
  max-width: 1020px;
  margin: 0 auto;
  padding: 34px 20px 60px;
}

.backLink {
  display: inline-block;
  margin-bottom: 16px;
  color: #7a86b6;
  font-size: 13px;
  text-decoration: none;

  &:hover {
    color: #4a6fe3;
  }
}

.detailHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.stockIdentity {
  display: flex;
  gap: 14px;
  min-width: 0;

  .bigEmoji {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    border-radius: 14px;
    background: linear-gradient(135deg, #f2f5ff, #f7f1ff);
    font-size: 30px;
    flex: none;
  }

  h1 {
    margin: 2px 0 6px;
    color: #2c3e77;
    font-size: 27px;
    line-height: 1.2;

    small {
      margin-left: 6px;
      color: #9aa2c5;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  }

  .desc {
    margin: 0;
    max-width: 520px;
    color: #8892b8;
    font-size: 12.5px;
    line-height: 1.6;
  }
}

.quoteBlock {
  text-align: right;
  flex: none;

  .bigPrice {
    color: #2c3e77;
    font-size: 36px;
    font-weight: 800;
    line-height: 1.05;
  }

  .bigChange {
    margin-top: 3px;
    font-size: 13.5px;
    font-weight: 700;
  }

  .quoteHint {
    margin-top: 4px;
    color: #a0a8c8;
    font-size: 10.5px;
  }

  &.up .bigPrice,
  &.up .bigChange {
    color: #e0575b;
  }

  &.down .bigPrice,
  &.down .bigChange {
    color: #2f9e6e;
  }

  &.flat .bigChange {
    color: #9aa2c5;
  }
}

.statGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  margin-bottom: 18px;

  > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 11px 14px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 2px 10px rgba(30, 40, 90, 0.07);
  }

  span {
    color: #9aa2c5;
    font-size: 10.5px;
  }

  b {
    color: #45507a;
    font-size: 14px;
  }
}

.mainGrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: start;
}

.panel {
  margin-bottom: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.09);
}

.panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: #2c3e77;
    font-size: 16px;

    i {
      color: #7c5fe3;
      font-size: 14px;
    }
  }
}

.chart {
  width: 100%;
  height: 340px;
}

.chartEmpty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 340px;
  color: #a0a8c8;
  font-size: 13px;
}

.rangeTabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: #f4f6fd;

  button {
    padding: 4px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #7a86b6;
    font-size: 11.5px;
    cursor: pointer;
    transition: all 0.14s;

    &.active {
      background: #fff;
      color: #2c3e77;
      font-weight: 700;
      box-shadow: 0 1px 4px rgba(30, 40, 90, 0.12);
    }
  }
}

.sideSwitch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 13px;
  padding: 4px;
  border-radius: 9px;
  background: #f4f6fd;

  button {
    padding: 8px 0;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #7a86b6;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.14s;

    &.active:first-child {
      background: #e0575b;
      color: #fff;
      box-shadow: 0 2px 8px rgba(224, 87, 91, 0.3);
    }

    &.active:last-child {
      background: #2f9e6e;
      color: #fff;
      box-shadow: 0 2px 8px rgba(47, 158, 110, 0.3);
    }
  }
}

.tradeInfo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 13px;
  padding: 11px 13px;
  border-radius: 9px;
  background: #fafbff;

  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }

  span {
    color: #8892b8;
  }

  b {
    color: #45507a;
  }
}

.cashRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: -4px 0 12px;
  color: #a0a8c8;
  font-size: 10.5px;
}

.cashLink {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border: 1px solid #dfe5ff;
  border-radius: 7px;
  background: #f7f9ff;
  color: #4a6fe3;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: #b9c8f2;
    background: #eef3ff;
  }

  i {
    font-size: 10px;
  }
}

.qtyRow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  label {
    flex: none;
    color: #6f7aa3;
    font-size: 12.5px;
  }

  .qtyInput {
    flex: 1;
    width: 100%;
  }
}

.quickRow {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;

  button {
    flex: 1;
    padding: 5px 0;
    border: 1px solid #e3e9f8;
    border-radius: 7px;
    background: #fff;
    color: #6f7aa3;
    font-size: 11px;
    cursor: pointer;

    &:hover {
      border-color: #b9c8f2;
      color: #4a6fe3;
    }
  }
}

.estimateRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
  color: #6f7aa3;
  font-size: 12.5px;

  b {
    color: #2c53c9;
    font-size: 19px;
  }
}

.execHint {
  margin-bottom: 10px;
  color: #a0a8c8;
  font-size: 10.5px;
  text-align: right;
}

.tradeBtn {
  width: 100%;
}

.tradeHint {
  margin: 9px 0 0;
  color: #d94b50;
  font-size: 11.5px;
  text-align: center;
}

.ruleHint {
  margin: 9px 0 0;
  color: #b0b7d6;
  font-size: 10.5px;
  text-align: center;
  line-height: 1.5;
}

.tradeLocked {
  padding: 36px 10px;
  color: #8892b8;
  text-align: center;

  i {
    margin-bottom: 9px;
    color: #b0b7d6;
    font-size: 26px;
  }

  p {
    margin: 0;
    font-size: 12.5px;
  }
}

.holdingRow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  > div {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 12px 14px;
    border-radius: 9px;
    background: #fafbff;
  }

  span {
    color: #9aa2c5;
    font-size: 10.5px;
  }

  b {
    color: #45507a;
    font-size: 16px;
  }

  b.up {
    color: #e0575b;
  }

  b.down {
    color: #2f9e6e;
  }
}

.notFound {
  padding: 70px 0;
  color: #8892b8;
  text-align: center;

  i {
    margin-bottom: 10px;
    font-size: 34px;
    opacity: 0.45;
  }

  p {
    margin: 0 0 12px;
    font-size: 14px;
  }

  a {
    color: #4a6fe3;
    font-size: 13px;
  }
}

@media (max-width: 860px) {
  .mainGrid {
    grid-template-columns: 1fr;
  }

  .statGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .detailHead {
    flex-direction: column;
  }

  .quoteBlock {
    text-align: left;
  }

  .statGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .holdingRow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart,
  .chartEmpty {
    height: 260px;
  }
}
</style>
