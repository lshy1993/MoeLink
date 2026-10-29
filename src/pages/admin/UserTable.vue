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
      <Column field="id" header="ID" style="width: 60px" />
      <Column header="邮箱 / UUID" style="width: 250px">
        <template #body="{ data }">
          <div class="acctWrap">
            <Avatar :image="data.avatar_url || undefined"
              :label="data.avatar_url ? undefined : (nickOf(data) || data.email || '?').slice(0, 1).toUpperCase()"
              shape="circle" />
            <div class="acctCell">
            <span class="copyCell">
              <span class="acctEmail">{{ data.email }}</span>
              <button class="copyBtn" title="复制邮箱" @click="copyText(data.email, '邮箱')">
                <i class="pi pi-copy"></i>
              </button>
            </span>
            <span class="copyCell">
              <span class="acctUid" :title="data.user_uuid">{{ data.user_uuid }}</span>
              <button v-if="data.user_uuid" class="copyBtn" title="复制 UUID" @click="copyText(data.user_uuid, 'UUID')">
                <i class="pi pi-copy"></i>
              </button>
            </span>
          </div>
          </div>
        </template>
      </Column>
      <Column header="昵称" style="width: 180px">
        <template #body="{ data }">
          <span class="nickCell" :title="nickOf(data)">{{ nickOf(data) }}</span>
        </template>
      </Column>
      <Column header="权限" style="width: 130px">
        <template #body="{ data }">
          <Tag :severity="data.user_role === 1 ? 'danger' : 'secondary'"
            :value="data.user_role === 1 ? '管理员' : '普通用户'" class="roleTag"
            :class="{ roleTagDisabled: data.id === myUid }" v-tooltip.top="data.id === myUid ? '不能修改自己的权限' : '点击修改权限'"
            @click="openRole(data)" />
          <Tag v-if="data.user_role !== 1 && data.moderated.length" severity="info" class="roleTag modTag"
            :value="'版主 ' + data.moderated.length" @click="openRole(data)" />
        </template>
      </Column>
      <Column header="状态" style="width: 190px">
        <template #body="{ data }">
          <div class="statusCell">
            <Tag v-if="data.ban" severity="danger" :value="'封号 ' + untilText(data.ban)"
              v-tooltip.top="data.ban.reason || '无理由'" />
            <Tag v-if="data.mute" severity="warn" :value="'禁言 ' + untilText(data.mute)"
              v-tooltip.top="data.mute.reason || '无理由'" />
            <span v-if="!data.ban && !data.mute" class="okText">正常</span>
            <button v-if="data.id !== myUid && data.user_role !== 1" class="coinGrantBtn" title="禁言 / 封号"
              @click="openSanction(data)">
              <i class="pi pi-ban"></i>
            </button>
          </div>
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
      <Column header="发帖 / 回复" style="width: 110px">
        <template #body="{ data }">{{ data.thread_count }} / {{ data.reply_count }}</template>
      </Column>
      <Column header="注册 / 登录" style="width: 130px">
        <template #body="{ data }">
          <div class="timeCell">
            <span v-tooltip.top="'注册于 ' + formatMinute(data.created_at)">{{ formatDate(data.created_at) }}</span>
            <span class="timeLogin" v-tooltip.top="data.last_login_at ? '登录于 ' + formatMinute(data.last_login_at) + (data.last_login_ip ? ' · ' + data.last_login_ip : '') : '从未登录'">
              {{ data.last_login_at ? formatDate(data.last_login_at) : '—' }}
            </span>
          </div>
        </template>
      </Column>
    </DataTable>

    <div class="pager" v-if="users.length && users.length < total">
      <button @click="loadMore">加载更多（{{ users.length }}/{{ total }}）</button>
    </div>

    <!-- 修改权限弹窗 -->
    <Dialog v-model:visible="roleOn" header="权限" modal :style="{ width: '380px' }">
      <div v-if="roleTarget">
        <div class="roleHead">
          <Chip :label="String(roleTarget.id)" class="idChip" />
          <b>{{ nickOf(roleTarget) || roleTarget.email }}</b>
        </div>
        <div class="roleChoices">
          <button v-for="r in roleOptions" :key="r.value" type="button" class="roleChoice"
            :class="{ active: roleDraft === r.value }" @click="roleDraft = r.value">
            <Tag :severity="r.value === 1 ? 'danger' : 'secondary'" :value="r.label" />
            <small>{{ r.value === 1 ? '可访问全部管理后台' : '无后台权限' }}</small>
          </button>
        </div>
        <Divider />
        <div class="modSection">
          <div class="modIntro">版主分区</div>
          <div v-if="roleTarget.user_role === 1" class="modIntro">管理员拥有全部分区的管理权限。</div>
          <div v-else-if="roleTarget.moderated.length" class="modTags">
            <Tag v-for="c in roleTarget.moderated" :key="c.slug" :value="c.name" severity="info" />
          </div>
          <div v-else class="modIntro">未担任任何分区的版主。</div>
          <small class="sanctionHint">任命或移除请在「讨论区」后台的分区管理中操作。</small>
        </div>
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" text @click="roleOn = false" />
        <Button label="保存" :disabled="!roleTarget || roleDraft === roleTarget.user_role" @click="saveRole" />
      </template>
    </Dialog>

    <!-- 禁言 / 封号弹窗 -->
    <Dialog v-model:visible="sanctionOn" header="用户处罚" modal :style="{ width: '420px' }">
      <div class="sanctionBody" v-if="sanctionTarget">
        <div class="grantTarget">
          <b>{{ sanctionTarget.display_name || sanctionTarget.email }}</b>
          <span class="grantUid">UID {{ sanctionTarget.id }}</span>
        </div>
        <div class="sanctionNow" v-if="sanctionTarget.ban || sanctionTarget.mute">
          <div v-if="sanctionTarget.ban">
            <Tag severity="danger" :value="'封号 ' + untilText(sanctionTarget.ban)" />
            <Button label="解封" size="small" text severity="success" :loading="sanctioning"
              @click="revokeSanction('ban')" />
          </div>
          <div v-if="sanctionTarget.mute">
            <Tag severity="warn" :value="'禁言 ' + untilText(sanctionTarget.mute)" />
            <Button label="解除禁言" size="small" text severity="success" :loading="sanctioning"
              @click="revokeSanction('mute')" />
          </div>
        </div>
        <label>类型
          <Select v-model="sanctionForm.type" :options="sanctionTypes" optionLabel="label" optionValue="value" />
        </label>
        <label>时长
          <Select v-model="sanctionForm.hours" :options="durationOptions" optionLabel="label" optionValue="value" />
        </label>
        <InputNumber v-if="sanctionForm.hours === -1" v-model="sanctionForm.customHours" :min="1" :max="87600"
          suffix=" 小时" :useGrouping="false" placeholder="自定义小时数" />
        <InputText v-model="sanctionForm.reason" maxlength="200" placeholder="理由（会通知用户，可选）" />
        <small class="sanctionHint">
          禁言：不能发帖、回复、发布博客；封号：无法使用 MoeLink 的所有需登录功能。同类型处罚会被新设置覆盖。
        </small>
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" text @click="sanctionOn = false" />
        <Button :label="sanctionForm.type === 'ban' ? '确认封号' : '确认禁言'" icon="pi pi-ban"
          :severity="sanctionForm.type === 'ban' ? 'danger' : 'warn'" :loading="sanctioning"
          :disabled="sanctionForm.hours === -1 && !sanctionForm.customHours" @click="applySanction" />
      </template>
    </Dialog>

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
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Divider from 'primevue/divider'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Tooltip from 'primevue/tooltip'
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
    Tag,
    Avatar,
    Divider,
    Chip,
  },
  directives: { tooltip: Tooltip },
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
        { label: '管理员', value: 1 },
      ],
      roleOn: false,
      roleTarget: null,
      roleDraft: 0,
      sanctionOn: false,
      sanctionTarget: null,
      sanctioning: false,
      sanctionForm: { type: 'mute', hours: 24, customHours: null, reason: '' },
      sanctionTypes: [
        { label: '禁言', value: 'mute' },
        { label: '封号', value: 'ban' },
      ],
      durationOptions: [
        { label: '1 小时', value: 1 },
        { label: '1 天', value: 24 },
        { label: '3 天', value: 72 },
        { label: '7 天', value: 168 },
        { label: '30 天', value: 720 },
        { label: '永久', value: 0 },
        { label: '自定义…', value: -1 },
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
    untilText(s) {
      if (!s.expires_at) return '永久'
      const d = new Date(s.expires_at)
      const p = (n) => String(n).padStart(2, '0')
      return `至 ${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
    },
    openSanction(row) {
      this.sanctionTarget = row
      this.sanctionForm = { type: 'mute', hours: 24, customHours: null, reason: '' }
      this.sanctionOn = true
    },
    sanctionError(err, summary) {
      this.toast.add({
        severity: 'error',
        summary,
        detail: err.response?.data?.error || '请稍后重试',
        life: 3000,
      })
    },
    async applySanction() {
      const f = this.sanctionForm
      const hours = f.hours === -1 ? f.customHours : f.hours
      this.sanctioning = true
      try {
        await axios.post(
          GetApi(`/admin/unified-users/${this.sanctionTarget.id}/sanction`),
          { type: f.type, hours, reason: f.reason || undefined },
          { headers: this.headers() },
        )
        this.toast.add({
          severity: 'success',
          summary: f.type === 'ban' ? '已封号' : '已禁言',
          life: 2000,
        })
        this.sanctionOn = false
        this.reload()
      } catch (err) {
        this.sanctionError(err, '操作失败')
      }
      this.sanctioning = false
    },
    async revokeSanction(type) {
      this.sanctioning = true
      try {
        await axios.delete(
          GetApi(`/admin/unified-users/${this.sanctionTarget.id}/sanction/${type}`),
          { headers: this.headers() },
        )
        this.toast.add({
          severity: 'success',
          summary: type === 'ban' ? '已解封' : '已解除禁言',
          life: 2000,
        })
        this.sanctionOn = false
        this.reload()
      } catch (err) {
        this.sanctionError(err, '操作失败')
      }
      this.sanctioning = false
    },
    openRole(row) {
      if (row.id === this.myUid) return
      this.roleTarget = row
      this.roleDraft = row.user_role
      this.roleOn = true
    },
    async saveRole() {
      const row = this.roleTarget
      if (!row || this.roleDraft === row.user_role) return
      try {
        await axios.put(
          GetApi(`/admin/unified-users/${row.id}/role`),
          { role: this.roleDraft },
          { headers: this.headers() },
        )
        this.toast.add({ severity: 'success', summary: '权限已更新', detail: row.email, life: 2000 })
        this.roleOn = false
        this.load()
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '修改失败',
          detail: err.response?.data?.error || '修改失败',
          life: 3000,
        })
      }
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
    formatMinute(v) {
      if (!v) return ''
      const d = new Date(v)
      const p = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    },
    nickOf(row) {
      return row.display_name || row.nickname || ''
    },
  },
}
</script>

<style lang="scss" scoped>
.acctWrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.acctCell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.acctEmail {
  white-space: nowrap;
}

.acctUid {
  font-family: monospace;
  font-size: 10.5px;
  letter-spacing: -0.2px;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8892b8;
}

.nickCell {
  display: block;
  max-width: 165px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.statusCell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.modTag {
  margin-left: 4px;
}

.modSection {
  margin-top: 0;
}

.idChip {
  border-radius: 6px;
}

.roleHead {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modLink {
  padding: 0;
  border: 0;
  background: none;
  color: #4a6fe3;
  font-size: 13px;
  cursor: pointer;

  &:hover { text-decoration: underline; }
}

.modIntro {
  margin: 12px 0 8px;
  font-size: 13px;
  color: #56608a;
}

.modTags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.okText {
  font-size: 12px;
  color: #9aa2c5;
}

.sanctionBody {
  display: flex;
  flex-direction: column;
  gap: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: #56608a;
  }
}

.sanctionNow {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff7f5;
}

.sanctionHint {
  font-size: 12px;
  color: #8892b8;
  line-height: 1.5;
}

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

.timeCell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeLogin {
  font-size: 12px;
  color: #8892b8;
}

.roleTag {
  cursor: pointer;
}

.roleTagDisabled {
  cursor: not-allowed;
  opacity: .7;
}

.roleChoices {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.roleChoice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #d9def0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;

  &.active {
    border-color: #4a6fe3;
    background: #f1f4ff;
  }
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
