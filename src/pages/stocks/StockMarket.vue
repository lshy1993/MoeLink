<template>
  <div class="stockPage">
    <header class="pageHead">
      <div>
        <h1>模拟股市 <small class="enName">MoeStock</small></h1>
        <p>用 MoeCoin 交易虚拟股票 · 你的买卖会真实推动股价 · 页面每 10 秒刷新</p>
      </div>
      <div v-if="logined" class="headActions">
        <button class="cashBtn" @click="transferOpen = true">
          <i class="pi pi-arrow-right-arrow-left"></i> 入金 / 出金
        </button>
        <router-link class="walletChip" to="/wallet">
          <i class="pi pi-wallet"></i>钱包 {{ formatCoin(portfolio.wallet_balance) }}
        </router-link>
      </div>
    </header>

    <!-- 资产总览 -->
    <div v-if="logined" class="summaryGrid">
      <div class="summaryCard">
        <span class="sLabel">证券总资产</span>
        <strong>{{ formatCoin(portfolio.securities_assets) }}</strong>
        <small>可用 + 持仓市值</small>
      </div>
      <div class="summaryCard">
        <span class="sLabel">账户可用</span>
        <strong>{{ formatCoin(portfolio.account_balance) }}</strong>
        <small>证券账户 MoeCoin</small>
      </div>
      <div class="summaryCard">
        <span class="sLabel">持仓市值</span>
        <strong>{{ formatCoin(portfolio.total_market_value) }}</strong>
        <small>MoeCoin</small>
      </div>
      <div class="summaryCard" :class="changeClass(portfolio.total_pnl)">
        <span class="sLabel">累计盈亏</span>
        <strong>{{ signed(portfolio.total_pnl) }}</strong>
        <small>
          浮动 {{ signed(portfolio.unrealized_pnl) }} · 已实现 {{ signed(portfolio.realized_pnl) }}
        </small>
      </div>
    </div>
    <p v-if="logined" class="cashNote">
      钱包余额 {{ formatCoin(portfolio.wallet_balance) }} MoeCoin · 点击「入金 / 出金」在钱包与证券账户之间划转
    </p>
    <div v-else class="loginHint">
      <i class="pi pi-lock"></i>
      <span>登录后即可入金、查看持仓并用 MoeCoin 买卖股票（点击右上角「登录 / 注册」）</span>
    </div>

    <!-- 行情 -->
    <section class="panel">
      <div class="panelHead">
        <h2><i class="pi pi-chart-line"></i> 行情</h2>
        <span class="refreshHint">{{ refreshing ? '刷新中…' : lastUpdated }}</span>
      </div>

      <div v-if="stocks.length" class="stockGrid">
        <router-link v-for="s in stocks" :key="s.id" class="stockCard" :to="`/stocks/${s.id}`">
          <div class="stockTop">
            <span class="stockEmoji">{{ s.emoji }}</span>
            <div class="stockName">
              <b>{{ s.name }}</b>
              <span class="symbol">{{ s.symbol }}</span>
            </div>
            <span v-if="holdingMap[s.id]" class="holdBadge">持 {{ holdingMap[s.id].shares }} 股</span>
          </div>
          <div class="quoteRow" :class="changeClass(s.change)">
            <strong>{{ formatCoin(s.price) }}</strong>
            <span class="change">{{ signed(s.change) }} · {{ signedPct(s.change_pct) }}</span>
          </div>
          <div class="stockMeta">
            <span>高 {{ formatCoin(s.high) }}</span>
            <span>低 {{ formatCoin(s.low) }}</span>
            <span>量 {{ formatVolume(s.volume) }}</span>
          </div>
        </router-link>
      </div>
      <div v-else class="emptyBox">
        <i class="pi pi-spin pi-spinner emptyIcon"></i>
        <p>行情加载中…</p>
      </div>
    </section>

    <!-- 我的持仓 -->
    <section v-if="logined" class="panel">
      <div class="panelHead">
        <h2><i class="pi pi-briefcase"></i> 我的持仓</h2>
        <span class="refreshHint">{{ portfolio.positions.length }} 只</span>
      </div>
      <div v-if="portfolio.positions.length" class="tableWrap">
        <table class="dataTable">
          <thead>
            <tr>
              <th>股票</th>
              <th>持有</th>
              <th>成本价</th>
              <th>现价</th>
              <th>市值</th>
              <th>浮动盈亏</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in portfolio.positions" :key="p.stock_id">
              <td>
                <router-link class="nameCell" :to="`/stocks/${p.stock_id}`">
                  <span class="cellEmoji">{{ p.emoji }}</span>
                  <b>{{ p.name }}</b>
                  <small>{{ p.symbol }}</small>
                </router-link>
              </td>
              <td>{{ p.shares }} 股</td>
              <td>{{ p.avg_cost }}</td>
              <td>{{ formatCoin(p.price) }}</td>
              <td>{{ formatCoin(p.market_value) }}</td>
              <td :class="changeClass(p.unrealized_pnl)">
                {{ signed(p.unrealized_pnl) }}
                <small>（{{ signedPct(p.unrealized_pct) }}）</small>
              </td>
              <td>
                <router-link class="tradeLink" :to="`/stocks/${p.stock_id}`">交易</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="emptyBox">
        <i class="pi pi-briefcase emptyIcon"></i>
        <p>还没有持仓，去上面的行情里挑一只吧</p>
      </div>
    </section>

    <!-- 最近成交 -->
    <section v-if="logined" class="panel">
      <div class="panelHead">
        <h2><i class="pi pi-history"></i> 最近成交</h2>
      </div>
      <div v-if="trades.length" class="tradeList">
        <div v-for="t in trades" :key="t.id" class="tradeRow">
          <span class="sideTag" :class="t.side">{{ t.side === 'buy' ? '买入' : '卖出' }}</span>
          <span class="tradeName">
            {{ t.stock_name }} <small>{{ t.stock_symbol }}</small>
          </span>
          <span class="tradeQty">{{ t.shares }} 股 @ {{ formatCoin(t.price) }}</span>
          <span class="tradeAmount" :class="t.side">
            {{ t.side === 'buy' ? '-' : '+' }}{{ formatCoin(t.total) }}
          </span>
          <span class="tradeTime">{{ formatTime(t.created_at) }}</span>
        </div>
      </div>
      <div v-else class="emptyBox">
        <i class="pi pi-history emptyIcon"></i>
        <p>还没有成交记录</p>
      </div>
    </section>

    <!-- 证券账户流水 -->
    <section v-if="logined" class="panel">
      <div class="panelHead">
        <h2><i class="pi pi-wallet"></i> 证券账户流水</h2>
      </div>
      <div v-if="accountTx.length" class="tradeList">
        <div v-for="t in accountTx" :key="t.id" class="tradeRow">
          <span class="sideTag" :class="accountTxClass(t.type)">{{ accountTxLabel(t.type) }}</span>
          <span class="tradeName">{{ t.note || accountTxLabel(t.type) }}</span>
          <span class="tradeQty">余额 {{ formatCoin(t.balance_after) }}</span>
          <span class="tradeAmount" :class="t.amount >= 0 ? 'sell' : 'buy'">
            {{ t.amount >= 0 ? '+' : '' }}{{ formatCoin(t.amount) }}
          </span>
          <span class="tradeTime">{{ formatTime(t.created_at) }}</span>
        </div>
      </div>
      <div v-else class="emptyBox">
        <i class="pi pi-wallet emptyIcon"></i>
        <p>暂无资金流水，先入金开始交易吧</p>
      </div>
    </section>

    <cash-transfer-dialog
      v-model:visible="transferOpen"
      :account-balance="portfolio.account_balance"
      :wallet-balance="portfolio.wallet_balance"
      @done="refresh"
    />
  </div>
</template>

<script>
import axios from 'axios'
import { formatCoin, formatTime } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'
import CashTransferDialog from './CashTransferDialog.vue'
import {
  accountTxLabel,
  changeClass,
  formatVolume,
  signed,
  signedPct,
} from './shared'

const REFRESH_MS = 10000

export default {
  name: 'StockMarketPage',
  components: { CashTransferDialog },
  data() {
    return {
      logined: !!GetToken(),
      stocks: [],
      portfolio: {
        account_balance: 0,
        wallet_balance: 0,
        securities_assets: 0,
        positions: [],
        total_market_value: 0,
        total_cost: 0,
        unrealized_pnl: 0,
        realized_pnl: 0,
        total_pnl: 0,
        total_assets: 0,
      },
      trades: [],
      accountTx: [],
      transferOpen: false,
      refreshing: false,
      lastUpdated: '',
      timer: null,
    }
  },
  computed: {
    holdingMap() {
      const map = {}
      for (const p of this.portfolio.positions || []) map[p.stock_id] = p
      return map
    },
  },
  mounted() {
    this.refresh()
    this.timer = setInterval(this.refresh, REFRESH_MS)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    formatCoin,
    formatTime,
    changeClass,
    formatVolume,
    signed,
    signedPct,
    accountTxLabel,
    accountTxClass(type) {
      return ['deposit', 'sell'].includes(type) ? 'sell' : 'buy'
    },
    async refresh() {
      if (this.refreshing) return
      this.refreshing = true
      const token = GetToken()
      this.logined = !!token
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const stockRes = await axios.get(GetApi('/stock-market/stocks'))
        this.stocks = stockRes.data.stocks || []

        if (this.logined) {
          const [pfRes, tradeRes, accountTxRes] = await Promise.all([
            axios.get(GetApi('/stock-market/portfolio'), { headers }),
            axios.get(GetApi('/stock-market/trades'), { headers, params: { limit: 8 } }),
            axios.get(GetApi('/stock-market/account/tx'), { headers, params: { limit: 8 } }),
          ])
          this.portfolio = { ...this.portfolio, ...pfRes.data }
          this.portfolio.positions = pfRes.data.positions || []
          this.trades = tradeRes.data.trades || []
          this.accountTx = accountTxRes.data.tx || []
        }

        this.lastUpdated = `更新于 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`
      } catch (err) {
        if (err.response?.status === 401) {
          this.logined = false
        } else {
          console.error('行情加载失败', err)
        }
      }
      this.refreshing = false
    },
  },
}
</script>

<style lang="scss" scoped>
.stockPage {
  max-width: 1020px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

.pageHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;

  h1 {
    margin: 0;
    font-size: 32px;
    color: #2c3e77;

    .enName {
      font-size: 16px;
      font-weight: 500;
      color: #7a86b6;
    }
  }

  p {
    margin: 6px 0 0;
    color: #8892b8;
    font-size: 13.5px;
  }
}

.walletChip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 22px;
  border: 1px solid #dfe5ff;
  background: linear-gradient(135deg, #eef3ff, #f3edff);
  color: #2c53c9;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;

  i {
    font-size: 12px;
    color: #7c5fe3;
  }
}

.headActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
}

.cashBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border: 1px solid #4a6fe3;
  border-radius: 22px;
  background: #4a6fe3;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #3658c6;
    background: #3658c6;
  }

  i {
    font-size: 12px;
  }
}

.cashNote {
  margin: -8px 0 22px;
  color: #a0a8c8;
  font-size: 11.5px;
}

.summaryGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.summaryCard {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.09);

  .sLabel {
    color: #8892b8;
    font-size: 12px;
  }

  strong {
    color: #2c3e77;
    font-size: 22px;
    line-height: 1.25;
  }

  small {
    color: #a0a8c8;
    font-size: 11px;
  }

  &.up strong {
    color: #e0575b;
  }

  &.down strong {
    color: #2f9e6e;
  }
}

.loginHint {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 22px;
  padding: 13px 16px;
  border: 1px dashed #dfe5ff;
  border-radius: 10px;
  background: #fafbff;
  color: #7a86b6;
  font-size: 13px;

  i {
    color: #7c5fe3;
  }
}

.panel {
  margin-bottom: 20px;
  padding: 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.09);
}

.panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: #2c3e77;
    font-size: 17px;

    i {
      color: #7c5fe3;
      font-size: 15px;
    }
  }
}

.refreshHint {
  color: #a0a8c8;
  font-size: 11.5px;
}

.stockGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 13px;
}

.stockCard {
  display: block;
  padding: 15px 16px;
  border: 1px solid #eef1fa;
  border-radius: 11px;
  background: #fff;
  color: inherit;
  text-decoration: none;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #d7def8;
    box-shadow: 0 7px 18px rgba(30, 40, 90, 0.12);
  }
}

.stockTop {
  display: flex;
  align-items: center;
  gap: 9px;
}

.stockEmoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #f2f5ff, #f7f1ff);
  font-size: 19px;
  flex: none;
}

.stockName {
  display: flex;
  flex-direction: column;
  min-width: 0;

  b {
    overflow: hidden;
    color: #2c3e77;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .symbol {
    color: #9aa2c5;
    font-size: 10.5px;
    letter-spacing: 0.4px;
  }
}

.holdBadge {
  margin-left: auto;
  padding: 3px 7px;
  border-radius: 9px;
  background: #f0f3ff;
  color: #4a6fe3;
  font-size: 10.5px;
  white-space: nowrap;
}

.quoteRow {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 13px 0 9px;

  strong {
    color: #2c3e77;
    font-size: 25px;
    line-height: 1;
  }

  .change {
    font-size: 12px;
    font-weight: 600;
  }

  &.up {
    strong,
    .change {
      color: #e0575b;
    }
  }

  &.down {
    strong,
    .change {
      color: #2f9e6e;
    }
  }

  &.flat .change {
    color: #9aa2c5;
  }
}

.stockMeta {
  display: flex;
  gap: 12px;
  color: #a0a8c8;
  font-size: 11px;
}

.tableWrap {
  overflow-x: auto;
}

.dataTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    padding: 8px 10px;
    color: #8892b8;
    font-size: 11.5px;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
  }

  td {
    padding: 11px 10px;
    border-top: 1px solid #f0f3fa;
    color: #45507a;
    white-space: nowrap;

    small {
      font-size: 10.5px;
      opacity: 0.85;
    }
  }

  td.up {
    color: #e0575b;
  }

  td.down {
    color: #2f9e6e;
  }
}

.nameCell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #2c3e77;
  text-decoration: none;

  &:hover b {
    color: #4a6fe3;
  }

  .cellEmoji {
    font-size: 15px;
  }

  small {
    color: #9aa2c5;
    font-size: 10px;
  }
}

.tradeLink {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 7px;
  background: #4a6fe3;
  color: #fff;
  font-size: 11.5px;
  text-decoration: none;

  &:hover {
    background: #3658c6;
  }
}

.tradeList {
  display: flex;
  flex-direction: column;
}

.tradeRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-top: 1px solid #f0f3fa;
  font-size: 12.5px;

  &:first-child {
    border-top: 0;
  }
}

.sideTag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;

  &.buy {
    background: #fff0f0;
    color: #d94b50;
  }

  &.sell {
    background: #edf9f2;
    color: #2f9e6e;
  }
}

.tradeName {
  min-width: 120px;
  color: #2c3e77;
  font-weight: 600;

  small {
    color: #9aa2c5;
    font-size: 10px;
    font-weight: 400;
  }
}

.tradeQty {
  color: #7882a4;
}

.tradeAmount {
  margin-left: auto;
  font-weight: 700;

  &.buy {
    color: #d94b50;
  }

  &.sell {
    color: #2f9e6e;
  }
}

.tradeTime {
  width: 82px;
  color: #b0b7d6;
  font-size: 11px;
  text-align: right;
}

.emptyBox {
  padding: 34px 0;
  color: #8892b8;
  text-align: center;

  .emptyIcon {
    margin-bottom: 8px;
    font-size: 30px;
    opacity: 0.45;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
}

@media (max-width: 760px) {
  .pageHead {
    align-items: flex-start;
    flex-direction: column;
  }

  .headActions {
    justify-content: flex-start;
  }

  .summaryGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stockGrid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  .tradeName {
    min-width: 0;
  }

  .tradeTime {
    display: none;
  }
}
</style>
