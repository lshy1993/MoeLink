<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="证券账户 · 入金 / 出金"
    :style="{ width: 'min(440px, 92vw)' }"
  >
    <div class="transferBody">
      <div class="sideSwitch">
        <button :class="{ active: side === 'deposit' }" @click="setSide('deposit')">入金</button>
        <button :class="{ active: side === 'withdraw' }" @click="setSide('withdraw')">出金</button>
      </div>

      <div class="balanceGrid">
        <div>
          <span>MoeCoin 钱包</span>
          <b>{{ formatCoin(localWallet) }}</b>
        </div>
        <div>
          <span>证券账户</span>
          <b>{{ formatCoin(localAccount) }}</b>
        </div>
      </div>

      <div class="amountRow">
        <label for="cashAmount">金额（MoeCoin）</label>
        <InputNumber
          v-model="amount"
          :min="1"
          :max="maxAmount"
          :useGrouping="false"
          inputId="cashAmount"
          class="amountInput"
        />
      </div>

      <div class="quickRow">
        <button v-for="q in quickAmounts" :key="q.label" @click="applyQuick(q.ratio)">
          {{ q.label }}
        </button>
      </div>

      <p class="hint">
        {{
          side === 'deposit'
            ? '从 MoeCoin 钱包转入证券账户，用于买卖股票。'
            : '从证券账户转回 MoeCoin 钱包，卖出所得也可随时转出。'
        }}
        即时到账，暂不收费。
      </p>
    </div>

    <template #footer>
      <Button label="取消" severity="secondary" text @click="dialogVisible = false" />
      <Button
        :label="side === 'deposit' ? '确认入金' : '确认出金'"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

export default {
  name: 'CashTransferDialog',
  components: { Button, Dialog, InputNumber },
  props: {
    visible: { type: Boolean, default: false },
    accountBalance: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
  },
  emits: ['update:visible', 'done'],
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      side: 'deposit',
      amount: 1,
      submitting: false,
      loading: false,
      localAccount: 0,
      localWallet: 0,
      quickAmounts: [
        { label: '25%', ratio: 0.25 },
        { label: '50%', ratio: 0.5 },
        { label: '全部', ratio: 1 },
      ],
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      },
    },
    maxAmount() {
      const value = this.side === 'deposit' ? this.localWallet : this.localAccount
      return Math.max(1, Number(value) || 0)
    },
    canSubmit() {
      const available = this.side === 'deposit' ? this.localWallet : this.localAccount
      const n = Number(this.amount)
      return (
        available >= 1 && Number.isInteger(n) && n >= 1 && n <= available && !this.submitting
      )
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.amount = 1
        this.localAccount = this.accountBalance
        this.localWallet = this.walletBalance
        this.refreshBalances()
      }
    },
  },
  methods: {
    formatCoin,
    setSide(value) {
      this.side = value
      this.amount = 1
    },
    applyQuick(ratio) {
      this.amount = Math.max(1, Math.floor(this.maxAmount * ratio))
    },
    async refreshBalances() {
      if (!GetToken()) return
      this.loading = true
      try {
        const res = await axios.get(GetApi('/stock-market/portfolio'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
        })
        this.localAccount = res.data.account_balance || 0
        this.localWallet = res.data.wallet_balance || 0
      } catch (err) {
        console.error('证券账户余额加载失败', err)
      }
      this.loading = false
    },
    async submit() {
      if (!this.canSubmit) return
      this.submitting = true
      try {
        const url = this.side === 'deposit' ? '/stock-market/deposit' : '/stock-market/withdraw'
        const res = await axios.post(
          GetApi(url),
          { amount: Number(this.amount) },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )
        this.localAccount = res.data.account_balance || 0
        this.localWallet = res.data.wallet_balance || 0
        this.toast.add({
          severity: 'success',
          summary: this.side === 'deposit' ? '入金成功' : '出金成功',
          detail: `${formatCoin(res.data.amount)} MoeCoin`,
          life: 3000,
        })
        this.$emit('done')
        this.dialogVisible = false
        // 通知顶栏刷新 MoeCoin 钱包余额
        window.dispatchEvent(new CustomEvent('moecoin:refresh'))
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: this.side === 'deposit' ? '入金失败' : '出金失败',
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
.transferBody {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.sideSwitch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
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
      background: #4a6fe3;
      color: #fff;
      box-shadow: 0 2px 8px rgba(74, 111, 227, 0.3);
    }

    &.active:last-child {
      background: #2f9e6e;
      color: #fff;
      box-shadow: 0 2px 8px rgba(47, 158, 110, 0.3);
    }
  }
}

.balanceGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;

  > div {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 11px 13px;
    border-radius: 9px;
    background: #fafbff;
  }

  span {
    color: #9aa2c5;
    font-size: 10.5px;
  }

  b {
    color: #2c3e77;
    font-size: 17px;
  }
}

.amountRow {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    color: #6f7aa3;
    font-size: 12.5px;
  }

  .amountInput {
    width: 100%;
  }
}

.quickRow {
  display: flex;
  gap: 6px;

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

.hint {
  margin: 0;
  color: #a0a8c8;
  font-size: 11px;
  line-height: 1.6;
}
</style>
