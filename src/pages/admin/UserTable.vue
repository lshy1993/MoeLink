<template>
  <div class="userTablePage">
    <div class="statCards" v-if="stats">
      <div class="statCard">
        <div class="num">{{ stats.total }}</div>
        <div class="label">注册用户</div>
      </div>
      <div class="statCard">
        <div class="num">+{{ stats.new_week }}</div>
        <div class="label">本周新增</div>
      </div>
      <div class="statCard">
        <div class="num">{{ stats.admin_count }}</div>
        <div class="label">管理员</div>
      </div>
    </div>

    <div class="toolbar">
      <InputText v-model="search" placeholder="搜索邮箱 / 昵称" style="width: 260px"
        @keyup.enter="reload" />
      <Button label="搜索" severity="secondary" outlined size="small" @click="reload" />
      <Button label="刷新" size="small" @click="load" />
    </div>

    <DataTable :value="users" :loading="loading" dataKey="id" scrollable class="userTable">
      <Column field="id" header="ID" style="width: 56px" />
      <Column header="邮箱" style="min-width: 240px">
        <template #body="{ data }">
          <span class="copyCell">
            <span class="cellText" :title="data.email">{{ data.email }}</span>
            <button class="copyBtn" title="复制邮箱" @click="copyText(data.email, '邮箱')">
              <i class="pi pi-copy"></i>
            </button>
          </span>
        </template>
      </Column>
      <Column header="昵称" style="min-width: 110px">
        <template #body="{ data }">{{ data.display_name || data.nickname || '—' }}</template>
      </Column>
      <Column header="UUID" style="width: 180px">
        <template #body="{ data }">
          <span class="copyCell">
            <span class="uuid" :title="data.user_uuid">{{ shortUuid(data.user_uuid) }}</span>
            <button class="copyBtn" title="复制完整 UUID" @click="copyText(data.user_uuid, 'UUID')">
              <i class="pi pi-copy"></i>
            </button>
          </span>
        </template>
      </Column>
      <Column header="角色" style="width: 130px">
        <template #body="{ data }">
          <Select :modelValue="data.user_role" :options="roleOptions" optionLabel="label"
            optionValue="value" :disabled="data.id === myUid" size="small" class="roleSelect"
            :title="data.id === myUid ? '不能修改自己的角色' : ''" @update:modelValue="(v) => onRoleChange(data, v)" />
        </template>
      </Column>
      <Column header="MoeCoin" style="width: 110px">
        <template #body="{ data }">
          <span v-if="wallets[data.id] !== undefined" class="coinNum">{{ wallets[data.id] }}</span>
          <span v-else class="coinLoading">…</span>
          <button class="coinGrantBtn" title="发放 MoeCoin 奖励" @click="openGrant(data)">
            <i class="pi pi-plus"></i>
          </button>
        </template>
      </Column>
      <Column header="答题" style="width: 100px">
        <template #body="{ data }">{{ data.correct_submissions }}/{{ data.total_submissions }}</template>
      </Column>
      <Column field="questions_created" header="出题" style="width: 64px" />
      <Column field="total_votes" header="投票" style="width: 64px" />
      <Column header="注册时间" style="width: 100px">
        <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
      </Column>
      <Column header="最近登录" style="width: 150px">
        <template #body="{ data }">
          <template v-if="data.last_login_at">
            {{ formatDate(data.last_login_at) }}
            <div class="ip">{{ data.last_login_ip || '' }}</div>
          </template>
          <template v-else>—</template>
        </template>
      </Column>
    </DataTable>

    <div class="pager" v-if="users.length && users.length < total">
      <button @click="loadMore">加载更多（{{ users.length }}/{{ total }}）</button>
    </div>

    <!-- MoeCoin 奖励弹窗 -->
    <Dialog v-model:visible="grantOn" header="发放 MoeCoin 奖励 🪙" modal :style="{ width: '380px' }">
      <div class="grantBody" v-if="grantTarget">
        <div class="grantTarget">
          <b>{{ grantTarget.display_name || grantTarget.email }}</b>
          <span class="grantUid">UID {{ grantTarget.id }}</span>
        </div>
        <InputNumber v-model="grantForm.amount" :min="-1000000" :max="1000000" :useGrouping="false"
          placeholder="数量（负数为扣减）" class="grantAmount" />
        <InputText v-model="grantForm.note" maxlength="200" placeholder="备注（可选）" />
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" text @click="grantOn = false" />
        <Button :label="grantLabel" icon="pi pi-gift" :loading="granting"
          :disabled="!grantForm.amount" @click="doGrant" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { userInstance as User } from '@/types/User'
import { GetApi, GetToken } from '@/utils'

const PAGE_SIZE = 50

export default {
  name: 'AdminUserTable',
  props: ['user'],
  components: {
    DataTable,
    Column,
    InputText,
    InputNumber,
    Button,
    Dialog,
    Select,
  },
  setup() {
    return {
      toast: useToast(),
      confirmService: useConfirm(),
    }
  },
  data() {
    return {
      users: [],
      total: 0,
      stats: null,
      offset: 0,
      search: '',
      loading: false,
      wallets: {},
      roleOptions: [
        { label: '普通用户', value: 0 },
        { label: '版主', value: 2 },
        { label: '管理员', value: 1 },
      ],
      grantOn: false,
      grantTarget: null,
      granting: false,
      grantForm: { amount: null, note: '' },
    }
  },
  computed: {
    myUid() {
      return User.logined ? Number(User.info.uid) : null
    },
    grantLabel() {
      const amt = Number(this.grantForm.amount)
      if (!amt) return '确认'
      return amt > 0 ? '确认发放' : '确认扣减'
    },
  },
  mounted() {
    this.load()
  },
  methods: {
    formatCoin,
    headers() {
      return { Authorization: `Bearer ${GetToken()}` }
    },
    async load() {
      this.loading = true
      try {
        const res = await axios.get(GetApi('/admin/unified-users'), {
          headers: this.headers(),
          params: {
            limit: PAGE_SIZE,
            offset: this.offset,
            search: this.search,
          },
        })
        if (this.offset === 0) this.users = []
        this.users = this.users.concat(res.data.users || [])
        this.total = res.data.total || 0
        this.stats = res.data.stats || null
        this.loadWallets()
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: err.response?.data?.error || err.message,
          life: 3000,
        })
      }
      this.loading = false
    },
    /**
     * 批量拉取列表内用户的 MoeCoin 余额（管理接口，逐个请求即可）
     */
    async loadWallets() {
      for (const u of this.users) {
        if (this.wallets[u.id] !== undefined) continue
        this.fetchWallet(u.id)
      }
    },
    async fetchWallet(uid) {
      try {
        const res = await axios.get(GetApi(`/moecoin/admin/wallet/${uid}`), {
          headers: this.headers(),
        })
        this.wallets = { ...this.wallets, [uid]: formatCoin(res.data.balance) }
      } catch (_err) {
        this.wallets = { ...this.wallets, [uid]: '—' }
      }
    },
    reload() {
      this.offset = 0
      this.load()
    },
    loadMore() {
      this.offset += PAGE_SIZE
      this.load()
    },
    async copyText(text, label) {
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
      } catch (_err) {
        // 非安全上下文降级方案
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      this.toast.add({
        severity: 'success',
        summary: '已复制',
        detail: label,
        life: 1500,
      })
    },
    onRoleChange(row, newRole) {
      const prevRole = row.user_role
      if (prevRole === newRole) return
      const target = this.roleOptions.find((r) => r.value === newRole)
      const prev = this.roleOptions.find((r) => r.value === prevRole)
      this.confirmService.require({
        message: `将「${row.email}」的角色从「${prev ? prev.label : prevRole}」变更为「${target ? target.label : newRole}」？`,
        header: '修改用户角色',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '确认修改',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.put(
              GetApi(`/admin/unified-users/${row.id}/role`),
              { role: newRole },
              { headers: this.headers() },
            )
            row.user_role = newRole
            this.toast.add({
              severity: 'success',
              summary: '角色已更新',
              detail: row.email,
              life: 2000,
            })
            this.load()
          } catch (err) {
            row.user_role = prevRole
            const msg = err.response?.data?.error || '修改失败'
            this.toast.add({
              severity: 'error',
              summary: '修改失败',
              detail: msg,
              life: 3000,
            })
          }
        },
        reject: () => {
          row.user_role = prevRole
        },
      })
    },
    openGrant(row) {
      this.grantTarget = row
      this.grantForm = { amount: null, note: '' }
      this.grantOn = true
    },
    async doGrant() {
      if (this.granting || !this.grantForm.amount || !this.grantTarget) return
      this.granting = true
      try {
        const res = await axios.post(
          GetApi('/moecoin/admin/grant'),
          {
            to_uid: this.grantTarget.id,
            amount: this.grantForm.amount,
            note: this.grantForm.note || undefined,
          },
          { headers: this.headers() },
        )
        this.toast.add({
          severity: 'success',
          summary: '操作成功',
          detail: `UID ${res.data.to_uid} 余额现为 ${res.data.balance} MoeCoin`,
          life: 3000,
        })
        this.wallets = {
          ...this.wallets,
          [this.grantTarget.id]: formatCoin(res.data.balance),
        }
        this.grantOn = false
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
    formatDate(d) {
      if (!d) return '—'
      return new Date(d).toLocaleDateString('zh-CN')
    },
    shortUuid(u) {
      return u ? `${u.slice(0, 8)}…` : ''
    },
  },
}
</script>

<style lang="scss" scoped>
// 全宽：不再限制 max-width
.userTablePage {
  width: 100%;
}

.statCards {
  display: flex;
  gap: 16px;
  margin-bottom: 18px;
}

.statCard {
  background: #f7f9ff;
  border: 1px solid #e3e9ff;
  border-radius: 10px;
  padding: 12px 22px;
  text-align: center;

  .num {
    font-size: 24px;
    font-weight: 700;
    color: #2c3e77;
  }

  .label {
    font-size: 12px;
    color: #8892b8;
  }
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.copyCell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;

  .cellText {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.copyBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #9aa2c5;
  font-size: 12px;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    background: #e3ebff;
    color: #2c53c9;
  }

  &:active {
    transform: scale(.9);
  }
}

.uuid {
  font-family: monospace;
  font-size: 12px;
  color: #8892b8;
}

.roleSelect {
  width: 100%;
  min-width: 96px;
}

.coinNum {
  font-weight: 700;
  font-size: 13px;
  color: #2c3e77;
}

.coinLoading {
  color: #b0b7d6;
  font-size: 12px;
}

.coinGrantBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 7px;
  border: 1px dashed #c9b98f;
  border-radius: 50%;
  background: #fffaf0;
  color: #d97a2b;
  font-size: 10px;
  cursor: pointer;
  vertical-align: middle;
  transition: all .15s;

  &:hover {
    background: #d97a2b;
    border-color: #d97a2b;
    color: #fff;
    transform: scale(1.1);
  }
}

.ip {
  font-size: 11px;
  color: #b0b7d6;
}

.grantBody {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .grantTarget {
    display: flex;
    align-items: baseline;
    gap: 8px;

    b {
      color: #2c3e77;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .grantUid {
      font-size: 12px;
      color: #9aa2c5;
      flex-shrink: 0;
    }
  }
}

.pager {
  text-align: center;
  padding: 16px 0;

  button {
    padding: 7px 24px;
    border: 1px solid #b9c4ef;
    background: white;
    border-radius: 20px;
    color: #4a6fe3;
    cursor: pointer;

    &:hover {
      background: #eef1fd;
    }
  }
}
</style>
