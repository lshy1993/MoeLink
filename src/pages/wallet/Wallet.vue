<template>
  <div class="walletPage">

    <div v-if="!logined" class="loginPrompt">
      <i class="pi pi-wallet"></i>
      <h1>请先登录</h1>
      <p>登录后即可使用 MoeCoin 钱包</p>
      <router-link to="/threads">回到讨论区</router-link>
    </div>

    <template v-else>
      <div class="pageTitleRow">
        <h1 class="pageTitle">MoeCoin 钱包</h1>
        <Button label="转账" icon="pi pi-send" @click="transferDialogVisible = true" />
      </div>

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
          <div class="checkinInfo">
            <h2><i class="pi pi-calendar-plus"></i> 每日签到</h2>
            <template v-if="!wallet.checked_today">
              <p>连续签到奖励更多</p>
              <Button label="立即签到" icon="pi pi-star" :loading="checkingIn" @click="doCheckin" />
            </template>
            <template v-else>
              <Button
                :label="`今天已签到 · 连续 ${wallet.last_streak || 0} 天`"
                icon="pi pi-calendar"
                severity="success"
                outlined
                class="checkinHistoryButton"
                @click="checkinCalendarVisible = true"
              />
            </template>
            <div v-if="wallet.settings" class="ruleLine">
              奖励 = {{ wallet.settings.checkin_base_reward }} + 连击加成
              （每天 +{{ wallet.settings.checkin_streak_bonus }}，封顶 {{ wallet.settings.checkin_streak_cap }} 天）
            </div>
          </div>
        </div>
      </div>

      <Dialog v-model:visible="checkinCalendarVisible" modal
        :style="{ width: 'min(380px, 92vw)' }">
        <div class="checkinCalendar">
          <div class="calendarCaption"><i class="pi pi-check-circle"></i> 已签到日期</div>
          <DatePicker inline :manualInput="false" :modelValue="null" @month-change="loadCheckinDates">
            <template #date="{ date }">
              <span class="calendarDay" :class="{ checked: isCheckedIn(date) }">
                {{ date.day }}
                <i v-if="isCheckedIn(date)" class="pi pi-check"></i>
              </span>
            </template>
          </DatePicker>
          <div class="calendarLegend"><span class="checkedDot"></span>已签到</div>
        </div>
      </Dialog>

      <!-- 流水 -->
      <div class="card txCard">
        <h2><i class="pi pi-list"></i> 收支明细</h2>
        <div class="txSummary">
          <div class="summaryIncome"><span>{{ summaryPrefix }}收入</span><strong>+{{ formatCoin(txSummary.income) }}</strong></div>
          <div class="summaryExpense"><span>{{ summaryPrefix }}支出</span><strong>-{{ formatCoin(txSummary.expense) }}</strong></div>
        </div>
        <div class="txFilters" aria-label="按收支筛选">
          <Button v-for="filter in txFilters" :key="filter.value" :label="filter.label"
            :severity="txDirection === filter.value ? 'primary' : 'secondary'"
            :outlined="txDirection !== filter.value" size="small" @click="setTxDirection(filter.value)" />
          <Select v-model="timeGranularity" :options="timeGranularityOptions"
            optionLabel="label" optionValue="value" aria-label="时间范围" class="timeGranularity"
            @change="setTimeGranularity" />
          <Select v-if="timeGranularity !== 'all'" v-model="selectedYear"
            :options="yearOptions" optionLabel="label" optionValue="value"
            aria-label="年份" class="timeSelect" @change="setTimeFilter" />
          <Select v-if="timeGranularity === 'month'" v-model="selectedMonth"
            :options="monthOptions" optionLabel="label" optionValue="value"
            aria-label="月份" class="timeSelect" @change="setTimeFilter" />
        </div>
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
        <div v-else-if="!loading" class="txEmpty">
          {{ txDirection === 'all' ? '还没有收支记录，去签到赚第一枚 MoeCoin 吧' : '没有符合条件的收支记录' }}
        </div>
        <div class="pager" v-if="tx.length && tx.length < total">
          <Button label="加载更多" text :loading="loading" @click="loadMore" />
        </div>
      </div>

      <Dialog v-model:visible="transferDialogVisible" modal header="转账给其他用户 🪙"
        :style="{ width: 'min(460px, 92vw)' }">
        <div class="transferForm">
          <InputNumber v-model="transferForm.to_uid" placeholder="对方用户 UID" :useGrouping="false"
            class="w-full" />
          <InputNumber v-model="transferForm.amount" placeholder="MoeCoin 数量" :min="1"
            :useGrouping="false" class="w-full" />
          <InputText v-model="transferForm.message" class="w-full" maxlength="200"
            placeholder="附言（可选，200 字以内）" />
          <span v-if="myUid" class="transferHint">我的 UID：{{ myUid }}（对方可在个人资料中查看 UID）</span>
        </div>
        <template #footer>
          <Button label="取消" severity="secondary" text @click="transferDialogVisible = false" />
          <Button label="确认转账" icon="pi pi-send" :loading="transferring"
            :disabled="!transferForm.to_uid || !transferForm.amount" @click="doTransfer" />
        </template>
      </Dialog>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { userInstance as User } from '@/types/User'
import { GetApi, GetToken } from '@/utils'
import { formatCoin, formatTime, txMeta } from './shared'

const PAGE_SIZE = 20

export default {
  name: 'WalletPage',
  components: {
    Button,
    DatePicker,
    Dialog,
    Select,
    Tag,
    InputText,
    InputNumber,
  },
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
      txDirection: 'all',
      timeGranularity: 'all',
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      timeGranularityOptions: [
        { label: '全部时间', value: 'all' },
        { label: '按月', value: 'month' },
        { label: '按年', value: 'year' },
      ],
      monthOptions: Array.from({ length: 12 }, (_, i) => ({
        label: `${i + 1}月`,
        value: i + 1,
      })),
      txSummary: { income: 0, expense: 0 },
      txFilters: [
        { label: '全部', value: 'all' },
        { label: '收入', value: 'income' },
        { label: '支出', value: 'expense' },
      ],
      loading: false,
      checkingIn: false,
      checkinCalendarVisible: false,
      checkedInDates: [],
      checkinDatesLoading: false,
      checkinCalendarYear: new Date().getFullYear(),
      checkinCalendarMonth: new Date().getMonth() + 1,
      transferring: false,
      transferDialogVisible: false,
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
    yearOptions() {
      const currentYear = new Date().getFullYear()
      return Array.from({ length: 20 }, (_, i) => ({
        label: `${currentYear - i}年`,
        value: currentYear - i,
      }))
    },
    summaryPrefix() {
      return this.timeGranularity === 'all' ? '累计' : '期间'
    },
  },
  mounted() {
    if (this.logined) {
      this.loadWallet()
      this.load()
      this.loadCheckinDates()
    }
  },
  methods: {
    txMeta,
    formatCoin,
    formatTime,
    isCheckedIn(date) {
      const month = String(date.month + 1).padStart(2, '0')
      const day = String(date.day).padStart(2, '0')
      return this.checkedInDates.includes(`${date.year}-${month}-${day}`)
    },
    async loadCheckinDates(event) {
      const year = event?.year || this.checkinCalendarYear
      const month = event?.month || this.checkinCalendarMonth
      this.checkinCalendarYear = year
      this.checkinCalendarMonth = month
      this.checkinDatesLoading = true
      try {
        const res = await axios.get(GetApi('/moecoin/checkins'), {
          headers: this.headers(),
          params: { year, month },
        })
        this.checkedInDates = res.data.dates || []
      } catch (_err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: '签到日历加载失败',
          life: 3000,
        })
      } finally {
        this.checkinDatesLoading = false
      }
    },
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
          params: {
            limit: PAGE_SIZE,
            offset: this.offset,
            direction: this.txDirection,
            year:
              this.timeGranularity === 'all' ? undefined : this.selectedYear,
            month:
              this.timeGranularity === 'month' ? this.selectedMonth : undefined,
          },
        })
        this.tx =
          this.offset === 0
            ? res.data.tx || []
            : this.tx.concat(res.data.tx || [])
        this.total = res.data.total || 0
        this.txSummary = res.data.summary || { income: 0, expense: 0 }
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
    setTxDirection(direction) {
      if (this.txDirection === direction) return
      this.txDirection = direction
      this.offset = 0
      this.load()
    },
    setTimeGranularity() {
      this.offset = 0
      this.load()
    },
    setTimeFilter() {
      this.offset = 0
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
        this.loadCheckinDates()
        this.offset = 0
        this.load()
      } catch (err) {
        if (err.response && err.response.status === 409) {
          this.wallet.checked_today = true
          this.loadCheckinDates()
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
        this.transferDialogVisible = false
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

.pageTitle {
  margin: 0 0 16px;
  font-size: 26px;
  color: #2c3e77;
}

.pageTitleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  .pageTitle {
    margin: 0;
  }
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

.checkinHistoryButton {
  margin: 0 0 4px -8px;
}

.checkinCalendar {
  min-width: 0;
  padding: 10px;
  border: 1px solid #e7ebf5;
  border-radius: 9px;
  background: #fbfcff;

  :deep(.p-datepicker) {
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
  }

  :deep(.p-datepicker-header) {
    padding: 0 0 6px;
    border-bottom: 0;
  }

  :deep(.p-datepicker-day-view) {
    margin: 0;
  }
}

.calendarCaption {
  margin-bottom: 5px;
  color: #667196;
  font-size: 11px;
  font-weight: 600;

  i {
    margin-right: 4px;
    color: #1e9e63;
  }
}

.calendarDay {
  position: relative;
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.calendarDay.checked {
  background: #daf4e5;
  color: #16834f;
  font-weight: 700;

  i {
    position: absolute;
    right: -2px;
    bottom: -1px;
    font-size: 8px;
    color: #16834f;
  }
}

.calendarLegend {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  color: #8892b8;
  font-size: 10px;
}

.checkedDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8bd1a6;
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

.transferForm {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.w-full {
  width: 100%;
}

.transferHint {
  color: #9aa2c5;
  font-size: 12px;
}

.txSummary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;

  > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 8px;
    font-size: 12px;
  }

  strong {
    font-size: 14px;
  }
}

.summaryIncome {
  background: #effaf4;
  color: #1e9e63;
}

.summaryExpense {
  background: #fff3f2;
  color: #d64c4c;
}

.txFilters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.timeGranularity {
  width: 110px;
  margin-left: auto;
}

.timeSelect {
  width: 100px;
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
  .txSummary { grid-template-columns: 1fr; }
}
</style>
