<template>
  <div class="groupAdminPage">
    <header class="pageHead">
      <div>
        <h1>拼团审核与纠纷</h1>
        <p>新拼团审核通过后才开放；分发链接审核通过后发放托管款。举报需管理员核实。</p>
      </div>
      <Button label="刷新" icon="pi pi-refresh" text :loading="loading" @click="load" />
    </header>

    <div class="tabs">
      <button v-for="item in tabs" :key="item.key" :class="{ active: tab === item.key }" @click="tab = item.key">
        {{ item.label }} <span>{{ item.count }}</span>
      </button>
    </div>

    <section v-if="tab === 'groups'" class="cardList">
      <article v-for="group in groups" :key="group.id" class="reviewCard">
        <div class="cardHead">
          <div>
            <h2>{{ group.emoji }} {{ group.title }} <small>#{{ group.id }}</small></h2>
            <p>发起者 UID {{ group.creator_uid }} · {{ group.member_count }}/{{ group.target_count }} 人 · 总价 {{ formatCoin(group.total_price) }} MoeCoin</p>
            <p>状态：{{ statusLabel(group) }}<span v-if="group.open_case_count"> · 待处理举报 {{ group.open_case_count }}</span></p>
          </div>
          <router-link :to="`/shop/groups/${group.id}`" target="_blank">打开拼团</router-link>
        </div>
        <p class="description">{{ group.description || '（无商品描述）' }}</p>
        <div v-if="group.image_url" class="details">图片：<a :href="group.image_url" target="_blank" rel="noopener noreferrer">{{ group.image_url }}</a></div>
        <div v-if="group.delivery_url" class="details">分发链接：<a :href="group.delivery_url" target="_blank" rel="noopener noreferrer">{{ group.delivery_url }}</a></div>
        <div v-if="group.admin_note" class="adminNote">最近备注：{{ group.admin_note }}</div>
        <div class="details">截止 {{ formatDate(group.expires_at) }} · 截止后价格 {{ formatCoin(group.late_price) }} MoeCoin</div>
        <div class="actions">
          <template v-if="group.status === 'pending_review'">
            <Button label="审核通过" size="small" severity="success" @click="reviewGroup(group, 'approve')" />
            <Button label="拒绝并退款" size="small" severity="danger" outlined @click="reviewGroup(group, 'reject')" />
          </template>
          <template v-if="group.status === 'successful' && group.delivery_status === 'pending_review'">
            <Button label="审核链接并放款" size="small" severity="success" @click="reviewDelivery(group, 'approve')" />
            <Button label="拒绝链接，要求更新" size="small" severity="danger" outlined @click="reviewDelivery(group, 'reject')" />
          </template>
        </div>
      </article>
      <div v-if="!loading && !groups.length" class="empty">暂无拼团记录</div>
    </section>

    <section v-else class="cardList">
      <article v-for="item in cases" :key="item.id" class="reviewCard" :class="{ resolved: item.status !== 'open' }">
        <div class="cardHead">
          <div>
            <h2>{{ item.kind === 'delivery_timeout' ? '⏰ 分发超时' : '🚩 成员举报' }} · {{ item.group_title }} <small>#{{ item.group_id }}</small></h2>
            <p>发起者 UID {{ item.creator_uid }} · 举报者 {{ item.reporter_uid ? `UID ${item.reporter_uid}` : '系统' }} · {{ formatDate(item.created_at) }}</p>
          </div>
          <Tag :value="item.status === 'open' ? '待处理' : item.status === 'refunded' ? '已退款' : '已驳回'" :severity="item.status === 'open' ? 'warn' : 'secondary'" />
        </div>
        <p class="reason">{{ item.reason }}</p>
        <div v-if="item.delivery_url" class="details">当前链接：<a :href="item.delivery_url" target="_blank" rel="noopener noreferrer">{{ item.delivery_url }}</a></div>
        <div v-if="item.resolution" class="details">处理记录：{{ item.resolution }}</div>
        <div v-if="item.status === 'open'" class="actions">
          <Button label="核实无误 / 驳回举报" size="small" severity="secondary" outlined @click="resolveCase(item, 'dismiss')" />
          <Button label="判定需退款并全额退款" size="small" severity="danger" @click="resolveCase(item, 'refund')" />
        </div>
      </article>
      <div v-if="!loading && !cases.length" class="empty">暂无举报或待处理事项</div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

export default {
  name: 'AdminShopGroupBuys',
  components: { Button, Tag },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      groups: [],
      cases: [],
      loading: false,
      tab: 'groups',
    }
  },
  computed: {
    tabs() {
      return [
        {
          key: 'groups',
          label: '拼团审核',
          count: this.groups.filter(
            (g) =>
              g.status === 'pending_review' ||
              g.delivery_status === 'pending_review',
          ).length,
        },
        {
          key: 'cases',
          label: '举报 / 超时',
          count: this.cases.filter((c) => c.status === 'open').length,
        },
      ]
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
        const [groups, cases] = await Promise.all([
          axios.get(GetApi('/shop/admin/groups'), { headers: this.headers() }),
          axios.get(GetApi('/shop/admin/group-cases'), {
            headers: this.headers(),
          }),
        ])
        this.groups = groups.data.groups || []
        this.cases = cases.data.cases || []
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: err.response?.data?.error || '拼团审核信息加载失败',
          life: 3500,
        })
      } finally {
        this.loading = false
      }
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('zh-CN') : '—'
    },
    statusLabel(group) {
      if (group.status === 'pending_review') return '待审核'
      if (group.status === 'open') return '进行中'
      if (group.status === 'successful')
        return `已成团 · ${group.delivery_status}`
      return (
        {
          failed: '未成团',
          cancelled: '已取消',
          rejected: '审核拒绝',
          refunded: '已退款',
        }[group.status] || group.status
      )
    },
    note() {
      return window.prompt('填写审核/处理备注（可选）') || ''
    },
    async action(url, payload, success) {
      try {
        await axios.post(GetApi(url), payload, { headers: this.headers() })
        this.toast.add({ severity: 'success', summary: success, life: 2500 })
        await this.load()
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '操作失败',
          detail: err.response?.data?.error || '请稍后重试',
          life: 3500,
        })
      }
    },
    reviewGroup(group, action) {
      if (
        action === 'reject' &&
        !window.confirm(`拒绝拼团「${group.title}」并退回发起者预付款？`)
      )
        return
      this.action(
        `/shop/admin/groups/${group.id}/review`,
        { action, note: this.note() },
        action === 'approve' ? '拼团已通过审核' : '已拒绝并退款',
      )
    },
    reviewDelivery(group, action) {
      if (
        action === 'approve' &&
        !window.confirm(
          `确认审核通过拼团「${group.title}」的分发链接并发放托管款？`,
        )
      )
        return
      this.action(
        `/shop/admin/groups/${group.id}/delivery-review`,
        { action, note: this.note() },
        action === 'approve' ? '分发已审核并放款' : '已拒绝链接，发起者需更新',
      )
    },
    resolveCase(item, action) {
      if (
        action === 'refund' &&
        !window.confirm(
          `确认处理拼团「${item.group_title}」的争议并对全体购买者全额退款？已放款部分将从发起者钱包扣回。`,
        )
      )
        return
      this.action(
        `/shop/admin/group-cases/${item.id}/resolve`,
        { action, resolution: this.note() },
        action === 'refund' ? '已全额退款' : '举报已驳回',
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.groupAdminPage { width: 100%; max-width: 1150px; }
.pageHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
h1 { margin: 0; color: #2c3e77; font-size: 24px; }
.pageHead p { margin: 6px 0 0; color: #8791b5; font-size: 12.5px; line-height: 1.5; }
.tabs { display: flex; gap: 6px; margin-bottom: 14px; border-bottom: 1px solid #e6e9f5; }
.tabs button { padding: 9px 14px; border: 0; border-bottom: 2px solid transparent; background: none; color: #56608a; cursor: pointer; }
.tabs button.active { border-bottom-color: #2c53c9; color: #2c53c9; font-weight: 600; }
.tabs span { margin-left: 4px; color: #8993b5; }
.cardList { display: flex; flex-direction: column; gap: 12px; }
.reviewCard { padding: 16px 18px; border: 1px solid #e6e9f5; border-radius: 10px; background: #fff; }
.reviewCard.resolved { opacity: .8; }
.cardHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.cardHead h2 { margin: 0 0 7px; color: #2c3e77; font-size: 16px; }
.cardHead h2 small { color: #9aa2c5; font-size: 11px; font-weight: 400; }
.cardHead p, .details { margin: 4px 0; color: #8791b5; font-size: 12px; }
.cardHead a, .details a { color: #4a6fe3; overflow-wrap: anywhere; }
.description, .reason { margin: 10px 0; color: #56608a; font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
.adminNote { margin-top: 8px; color: #986515; font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.empty { padding: 50px 10px; color: #8892b8; text-align: center; }
</style>
