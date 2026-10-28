<template>
  <div class="mocoinAdminPage">
    <!-- 统计 -->
    <div class="statCards" v-if="stats">
      <div class="statCard">
        <div class="num">{{ formatCoin(stats.total_supply) }}</div>
        <div class="label">MoeCoin 总发行量</div>
      </div>
      <div class="statCard">
        <div class="num">{{ stats.wallets }}</div>
        <div class="label">钱包数</div>
      </div>
      <div class="statCard">
        <div class="num">{{ stats.checkins_today }}</div>
        <div class="label">今日签到</div>
      </div>
      <div class="statCard">
        <div class="num">{{ formatCoin(stats.tips_today) }}</div>
        <div class="label">今日打赏额</div>
      </div>
      <div class="statCard">
        <div class="num">{{ formatCoin(stats.transfers_today) }}</div>
        <div class="label">今日转账额</div>
      </div>
    </div>

    <div class="panes">
      <!-- 参数设置 -->
      <div class="card settingsCard">
        <h2>签到与限额参数</h2>
        <div class="settingRow" v-for="s in settingDefs" :key="s.key">
          <label :for="s.key">{{ s.label }}</label>
          <InputNumber :inputId="s.key" v-model="settingsForm[s.key]" :min="s.min" :max="s.max"
            :useGrouping="false" />
        </div>
        <div class="settingHint">{{ settingsHint }}</div>
        <Button label="保存参数" icon="pi pi-save" :loading="savingSettings" @click="saveSettings" />
      </div>

      <!-- 发放/扣减 -->
      <div class="card grantCard">
        <h2>发放 / 扣减 MoeCoin</h2>
        <p class="cardDesc">管理员操作不受任何限额约束；金额为负数即扣减（余额不足会失败）。</p>
        <div class="settingRow">
          <label for="grantUid">目标用户 UID</label>
          <InputNumber inputId="grantUid" v-model="grantForm.to_uid" :useGrouping="false" placeholder="UID" />
        </div>
        <div class="settingRow">
          <label for="grantAmount">金额（可负）</label>
          <InputNumber inputId="grantAmount" v-model="grantForm.amount" :useGrouping="false" />
        </div>
        <div class="settingRow">
          <label for="grantNote">备注</label>
          <InputText inputId="grantNote" v-model="grantForm.note" maxlength="200" placeholder="操作原因（可选）" />
        </div>
        <Button :label="grantLabel" icon="pi pi-plus-circle" :loading="granting"
          :disabled="!grantForm.to_uid || !grantForm.amount" @click="doGrant" />
      </div>
    </div>

    <!-- 最近流水 -->
    <div class="card txCard">
      <h2>最近流水（全部用户）</h2>
      <DataTable :value="tx" :loading="loadingTx" dataKey="id">
        <Column header="时间" style="width: 110px">
          <template #body="{ data }">{{ formatTime(data.created_at) }}</template>
        </Column>
        <Column header="用户" style="width: 80px">
          <template #body="{ data }">UID {{ data.user_uid }}</template>
        </Column>
        <Column header="类型" style="width: 110px">
          <template #body="{ data }">
            <Tag :value="txMeta(data.type).label" :severity="txMeta(data.type).severity" />
          </template>
        </Column>
        <Column header="金额" style="width: 90px">
          <template #body="{ data }">
            <b :class="data.amount >= 0 ? 'in' : 'out'">
              {{ data.amount >= 0 ? '+' : '' }}{{ formatCoin(data.amount) }}
            </b>
          </template>
        </Column>
        <Column header="余额" style="width: 90px">
          <template #body="{ data }">{{ formatCoin(data.balance_after) }}</template>
        </Column>
        <Column header="对方" style="width: 80px">
          <template #body="{ data }">{{ data.counterparty_uid ? 'UID ' + data.counterparty_uid : '—' }}</template>
        </Column>
        <Column header="备注" style="min-width: 160px">
          <template #body="{ data }">{{ data.note || '—' }}</template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { GetApi, GetToken } from '@/utils'
import { formatCoin, formatTime, txMeta } from '../wallet/shared'

export default {
  name: 'AdminMocoin',
  components: { DataTable, Column, Button, Tag, InputText, InputNumber },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      stats: null,
      settingsForm: {
        checkin_base_reward: 10,
        checkin_streak_bonus: 2,
        checkin_streak_cap: 6,
        transfer_daily_limit: 500,
        transfer_monthly_limit: 5000,
        transfer_min: 1,
        tip_min: 1,
        bounty_min: 5,
        initial_bonus: 50,
      },
      settingDefs: [
        {
          key: 'checkin_base_reward',
          label: '签到基础奖励',
          min: 0,
          max: 100000,
        },
        {
          key: 'checkin_streak_bonus',
          label: '连击每天额外奖励',
          min: 0,
          max: 100000,
        },
        {
          key: 'checkin_streak_cap',
          label: '连击加成封顶天数',
          min: 0,
          max: 365,
        },
        {
          key: 'transfer_daily_limit',
          label: '每日转出上限（0=不限）',
          min: 0,
          max: 10000000,
        },
        {
          key: 'transfer_monthly_limit',
          label: '每月转出上限（0=不限）',
          min: 0,
          max: 100000000,
        },
        { key: 'transfer_min', label: '单笔转账最小值', min: 1, max: 1000000 },
        { key: 'tip_min', label: '单次打赏最小值', min: 1, max: 1000000 },
        { key: 'bounty_min', label: '悬赏发帖下限', min: 0, max: 1000000 },
        { key: 'initial_bonus', label: '新用户钱包礼包', min: 0, max: 1000000 },
      ],
      grantForm: {
        to_uid: null,
        amount: null,
        note: '',
      },
      tx: [],
      loadingTx: false,
      savingSettings: false,
      granting: false,
    }
  },
  computed: {
    grantLabel() {
      const amt = Number(this.grantForm.amount)
      if (!amt) return '确认操作'
      return amt > 0 ? '确认发放' : '确认扣减'
    },
    settingsHint() {
      const f = this.settingsForm
      const maxReward =
        Number(f.checkin_base_reward) +
        Math.min(Number(f.checkin_streak_cap), 999) *
          Number(f.checkin_streak_bonus)
      return `当前签到最大单日收益约 ${maxReward} MoeCoin；普通用户每日最多转出 ${f.transfer_daily_limit || '不限'}、每月 ${f.transfer_monthly_limit || '不限'}（管理员不受限）。`
    },
  },
  mounted() {
    this.loadSettings()
    this.loadStats()
    this.loadTx()
  },
  methods: {
    txMeta,
    formatCoin,
    formatTime,
    headers() {
      return { Authorization: `Bearer ${GetToken()}` }
    },
    async loadSettings() {
      try {
        const res = await axios.get(GetApi('/mocoin/admin/settings'), {
          headers: this.headers(),
        })
        if (res.data) {
          for (const key of Object.keys(this.settingsForm)) {
            if (res.data[key] !== undefined && res.data[key] !== null) {
              this.settingsForm[key] = res.data[key]
            }
          }
        }
      } catch (_err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: '参数加载失败',
          life: 3000,
        })
      }
    },
    async loadStats() {
      try {
        const res = await axios.get(GetApi('/mocoin/admin/stats'), {
          headers: this.headers(),
        })
        this.stats = res.data
      } catch (_err) {
        /* 统计失败不提示 */
      }
    },
    async loadTx() {
      this.loadingTx = true
      try {
        const res = await axios.get(GetApi('/mocoin/admin/tx'), {
          headers: this.headers(),
          params: { limit: 50 },
        })
        this.tx = res.data.tx || []
      } catch (_err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: '流水加载失败',
          life: 3000,
        })
      }
      this.loadingTx = false
    },
    async saveSettings() {
      this.savingSettings = true
      try {
        const res = await axios.put(
          GetApi('/mocoin/admin/settings'),
          this.settingsForm,
          { headers: this.headers() },
        )
        this.toast.add({
          severity: 'success',
          summary: '参数已保存',
          life: 2000,
        })
        if (res.data.settings) {
          for (const key of Object.keys(this.settingsForm)) {
            if (res.data.settings[key] !== undefined)
              this.settingsForm[key] = res.data.settings[key]
          }
        }
      } catch (err) {
        const msg = err.response?.data?.error || '保存失败'
        this.toast.add({
          severity: 'error',
          summary: '保存失败',
          detail: msg,
          life: 3000,
        })
      }
      this.savingSettings = false
    },
    async doGrant() {
      this.granting = true
      try {
        const res = await axios.post(
          GetApi('/mocoin/admin/grant'),
          {
            to_uid: this.grantForm.to_uid,
            amount: this.grantForm.amount,
            note: this.grantForm.note || undefined,
          },
          { headers: this.headers() },
        )
        this.toast.add({
          severity: 'success',
          summary: `操作成功`,
          detail: `UID ${res.data.to_uid} 余额现为 ${res.data.balance} MoeCoin`,
          life: 3000,
        })
        this.grantForm = { to_uid: null, amount: null, note: '' }
        this.loadStats()
        this.loadTx()
      } catch (err) {
        const msg = err.response?.data?.error || '操作失败'
        this.toast.add({
          severity: 'error',
          summary: '操作失败',
          detail: msg,
          life: 3000,
        })
      }
      this.granting = false
    },
  },
}
</script>

<style lang="scss" scoped>
.mocoinAdminPage {
  max-width: 1150px;
}

.statCards {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.statCard {
  background: #f7f9ff;
  border: 1px solid #e3e9ff;
  border-radius: 10px;
  padding: 12px 22px;
  text-align: center;
  min-width: 110px;

  .num {
    font-size: 22px;
    font-weight: 700;
    color: #2c3e77;
  }

  .label {
    font-size: 12px;
    color: #8892b8;
  }
}

.panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}

.card {
  background: #fff;
  border: 1px solid #e6e9f5;
  border-radius: 10px;
  padding: 16px 18px;

  h2 {
    margin: 0 0 14px;
    font-size: 16px;
    color: #2c3e77;
  }
}

.cardDesc {
  margin: 0 0 12px;
  font-size: 12.5px;
  color: #8892b8;
}

.settingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;

  label {
    font-size: 13px;
    color: #45507a;
  }
}

.settingHint {
  margin: 10px 0 14px;
  font-size: 12px;
  color: #9aa2c5;
}

.in { color: #1e9e63; }
.out { color: #d64c4c; }

@media (max-width: 900px) {
  .panes { grid-template-columns: 1fr; }
}
</style>
