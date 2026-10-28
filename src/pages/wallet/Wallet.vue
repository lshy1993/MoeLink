<template>
  <div class="walletPage">
    <router-link class="backLink" to="/">← 返回首页</router-link>

    <div v-if="!logined" class="loginPrompt">
      <i class="pi pi-wallet"></i>
      <h1>请先登录</h1>
      <p>登录后即可使用 MoeCoin 钱包</p>
      <router-link to="/threads">回到讨论区</router-link>
    </div>

    <template v-else>
      <h1 class="pageTitle">MoeCoin 钱包</h1>

      <!-- 余额 + 签到 -->
      <div class="topCards">
        <div class="balanceCard">
          <div class="coinIcon"><i class="pi pi-wallet"></i></div>
          <div class="balanceNum">{{ formatCoin(wallet.balance) }}</div>
          <div class="balanceLabel">MoeCoin 余额</div>
          <div v-if="wallet.settings" class="limitLine">
            今日已转出 {{ formatCoin(wallet.sent_today) }} / {{ wallet.settings.transfer_daily_limit || '不限' }}
            · 本月 {{ formatCoin(wallet.sent_month) }} / {{ wallet.settings.transfer_monthly_limit || '不限' }}
          </div>
        </div>

        <div class="checkinCard" :class="{ done: wallet.checked_today }">
          <h2><i class="pi pi-calendar-plus"></i> 每日签到</h2>
          <template v-if="!wallet.checked_today">
            <p>连续签到奖励更多</p>
            <Button label="立即签到" icon="pi pi-star" :loading="checkingIn" @click="doCheckin" />
          </template>
          <template v-else>
            <p class="doneText"><i class="pi pi-check-circle"></i> 今天已签到</p>
            <div class="streakBadge" v-if="wallet.last_streak">
              <i class="pi pi-fire"></i> 已连续 {{ wallet.last_streak }} 天
            </div>
          </template>
          <div v-if="wallet.settings" class="ruleLine">
            奖励 = {{ wallet.settings.checkin_base_reward }} + 连击加成
            （每天 +{{ wallet.settings.checkin_streak_bonus }}，封顶 {{ wallet.settings.checkin_streak_cap }} 天）
          </div>
        </div>
      </div>

      <!-- 转账 -->
      <div class="card transferCard">
        <h2><i class="pi pi-send"></i> 转账给其他用户</h2>
        <div class="formRow">
          <InputNumber v-model="transferForm.to_uid" placeholder="对方用户 UID" :useGrouping="false"
            class="uidInput" />
          <InputNumber v-model="transferForm.amount" placeholder="MoeCoin 数量" :min="1" class="amountInput" />
        </div>
        <InputText v-model="transferForm.message" class="msgInput" maxlength="200"
          placeholder="附言（可选，200 字以内）" />
        <div class="formActions">
          <span class="hint" v-if="myUid">我的 UID：{{ myUid }}（对方可在个人资料中查看 UID）</span>
          <Button label="确认转账" icon="pi pi-send" :loading="transferring"
            :disabled="!transferForm.to_uid || !transferForm.amount" @click="doTransfer" />
        </div>
      </div>

      <!-- 流水 -->
      <div class="card txCard">
        <h2><i class="pi pi-list"></i> 收支明细</h2>
        <div v-if="tx.length" class="txList">
          <div v-for="t in tx" :key="t.id" class="txRow">
            <div class="txMain">
              <Tag :value="txMeta(t.type).label" :severity="txMeta(t.type).severity" class="txTag" />
              <span class="txNote">{{ t.note || txMeta(t.type).label }}</span>
              <span v-if="t.counterparty_uid" class="txParty">对方 UID {{ t.counterparty_uid }}</span>
            </div>
            <div class="txSide">
              <b :class="t.amount >= 0 ? 'in' : 'out'">
                {{ t.amount >= 0 ? '+' : '' }}{{ formatCoin(t.amount) }}
              </b>
              <span class="txTime">{{ formatTime(t.created_at) }}</span>
            </div>
          </div>
        </div>
        <div v-else-if="!loading" class="txEmpty">还没有收支记录，去签到赚第一枚 MoeCoin 吧</div>
        <div class="pager" v-if="tx.length && tx.length < total">
          <Button label="加载更多" text :loading="loading" @click="loadMore" />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { userInstance as User } from '@/types/User'
import { GetApi, GetToken } from '@/utils'
import { formatCoin, formatTime, txMeta } from './shared'

const PAGE_SIZE = 20

export default {
  name: 'WalletPage',
  components: { Button, Tag, InputText, InputNumber },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      logined: !!GetToken(),
      wallet: {
        balance: 0,
        checked_today: false,
        last_streak: 0,
        sent_today: 0,
        sent_month: 0,
        settings: null,
      },
      tx: [],
      total: 0,
      offset: 0,
      loading: false,
      checkingIn: false,
      transferring: false,
      transferForm: {
        to_uid: null,
        amount: null,
        message: '',
      },
    }
  },
  computed: {
    myUid() {
      return User.logined ? User.info.uid : null
    },
  },
  mounted() {
    if (this.logined) {
      this.loadWallet()
      this.load()
    }
  },
  methods: {
    txMeta,
    formatCoin,
    formatTime,
    headers() {
      return { Authorization: `Bearer ${GetToken()}` }
    },
    async loadWallet() {
      try {
        const res = await axios.get(GetApi('/moecoin/wallet'), {
          headers: this.headers(),
        })
        this.wallet = res.data
      } catch (err) {
        const status = err.response?.status
        if (status === 401) {
          this.logined = false
          return
        }
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: '钱包信息加载失败',
          life: 3000,
        })
      }
    },
    async load() {
      this.loading = true
      try {
        const res = await axios.get(GetApi('/moecoin/tx'), {
          headers: this.headers(),
          params: { limit: PAGE_SIZE, offset: this.offset },
        })
        this.tx =
          this.offset === 0
            ? res.data.tx || []
            : this.tx.concat(res.data.tx || [])
        this.total = res.data.total || 0
      } catch (err) {
        if (!(err.response && err.response.status === 401)) {
          this.toast.add({
            severity: 'error',
            summary: '加载失败',
            detail: '收支明细加载失败',
            life: 3000,
          })
        }
      }
      this.loading = false
    },
    loadMore() {
      this.offset += PAGE_SIZE
      this.load()
    },
    async doCheckin() {
      if (this.checkingIn) return
      this.checkingIn = true
      try {
        const res = await axios.post(
          GetApi('/moecoin/checkin'),
          {},
          { headers: this.headers() },
        )
        const { reward, streak, balance } = res.data
        this.toast.add({
          severity: 'success',
          summary: `签到成功 +${reward} MoeCoin`,
          detail: `已连续签到 ${streak} 天`,
          life: 3000,
        })
        this.wallet.balance = balance
        this.wallet.checked_today = true
        this.wallet.last_streak = streak
        this.offset = 0
        this.load()
      } catch (err) {
        if (err.response && err.response.status === 409) {
          this.wallet.checked_today = true
          this.toast.add({
            severity: 'info',
            summary: '今天已经签到过了',
            life: 3000,
          })
        } else {
          const msg = err.response?.data?.error || '签到失败'
          this.toast.add({
            severity: 'error',
            summary: '签到失败',
            detail: msg,
            life: 3000,
          })
        }
      }
      this.checkingIn = false
    },
    async doTransfer() {
      if (this.transferring) return
      this.transferring = true
      try {
        const res = await axios.post(
          GetApi('/moecoin/transfer'),
          {
            to_uid: this.transferForm.to_uid,
            amount: this.transferForm.amount,
            message: this.transferForm.message || undefined,
          },
          { headers: this.headers() },
        )
        this.toast.add({
          severity: 'success',
          summary: `已转账 ${this.transferForm.amount} MoeCoin`,
          detail: `对方余额已到账，当前余额 ${res.data.balance}`,
          life: 3000,
        })
        this.transferForm = { to_uid: null, amount: null, message: '' }
        this.loadWallet()
        this.offset = 0
        this.load()
      } catch (err) {
        const msg = err.response?.data?.error || '转账失败'
        this.toast.add({
          severity: 'error',
          summary: '转账失败',
          detail: msg,
          life: 4000,
        })
      }
      this.transferring = false
    },
  },
}
</script>

<style lang="scss" scoped>
.walletPage {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

.backLink {
  display: inline-block;
  margin-bottom: 14px;
  color: #4a6fe3;
  font-size: 13px;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.pageTitle {
  margin: 0 0 16px;
  font-size: 26px;
  color: #2c3e77;
}

.topCards {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.balanceCard,
.checkinCard,
.card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 20px 22px;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.1);
}

.balanceCard {
  text-align: center;

  .coinIcon {
    width: 46px;
    height: 46px;
    margin: 0 auto 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4a6fe3, #7c5fe3);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .balanceNum {
    font-size: 34px;
    font-weight: 800;
    color: #2c3e77;
    line-height: 1.2;
  }

  .balanceLabel {
    font-size: 12.5px;
    color: #8892b8;
    margin-top: 4px;
  }

  .limitLine {
    margin-top: 12px;
    font-size: 11.5px;
    color: #9aa2c5;
  }
}

.checkinCard {
  h2 {
    margin: 0 0 8px;
    font-size: 16px;
    color: #2c3e77;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  p {
    margin: 0 0 12px;
    font-size: 13px;
    color: #8892b8;
  }

  .doneText {
    color: #1e9e63;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .streakBadge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    padding: 5px 12px;
    border-radius: 16px;
    background: #fff4e8;
    color: #d97a2b;
    font-size: 12.5px;
    font-weight: 600;
  }

  .ruleLine {
    margin-top: 12px;
    font-size: 11.5px;
    color: #9aa2c5;
  }
}

.card {
  margin-bottom: 14px;

  h2 {
    margin: 0 0 12px;
    font-size: 16px;
    color: #2c3e77;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.transferCard {
  .formRow {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .uidInput,
  .amountInput {
    flex: 1;
  }

  .msgInput {
    width: 100%;
  }

  .formActions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;

    .hint {
      font-size: 12px;
      color: #9aa2c5;
    }
  }
}

.txList {
  display: flex;
  flex-direction: column;
}

.txRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 2px;
  border-bottom: 1px dashed #e8ecf8;

  &:last-child { border-bottom: none; }
}

.txMain {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;

  .txTag { font-size: 11px; flex-shrink: 0; }

  .txNote {
    font-size: 13px;
    color: #45507a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .txParty {
    font-size: 11.5px;
    color: #b0b7d6;
  }
}

.txSide {
  text-align: right;
  flex-shrink: 0;

  b {
    display: block;
    font-size: 14px;

    &.in { color: #1e9e63; }
    &.out { color: #d64c4c; }
  }

  .txTime {
    font-size: 11.5px;
    color: #b0b7d6;
  }
}

.txEmpty {
  text-align: center;
  color: #9aa2c5;
  padding: 30px 0;
  font-size: 13.5px;
}

.pager {
  text-align: center;
  padding-top: 12px;
}

.loginPrompt {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 60px 20px;
  color: #8892b8;

  i {
    font-size: 40px;
    opacity: 0.5;
  }

  h1 {
    margin: 14px 0 6px;
    font-size: 22px;
    color: #2c3e77;
  }

  p { margin: 0 0 16px; }

  a {
    color: #4a6fe3;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}

@media (max-width: 720px) {
  .topCards { grid-template-columns: 1fr; }
}
</style>
