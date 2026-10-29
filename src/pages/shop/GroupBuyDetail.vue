<template>
  <div class="detailPage">
    <router-link class="backLink" to="/shop">← 返回萌购</router-link>
    <div v-if="group" class="detailCard">
      <div class="hero">
        <img v-if="group.image_url" :src="group.image_url" :alt="group.title">
        <span v-else>{{ group.emoji || '🎁' }}</span>
      </div>
      <div class="content">
        <div class="titleRow">
          <h1>{{ group.title }}</h1>
          <Tag :value="statusLabel" :severity="statusSeverity" />
        </div>
        <p class="description">{{ group.description || '发起者尚未填写商品介绍。' }}</p>
        <div class="stats">
          <div><span>拼团总价</span><b>{{ formatCoin(group.total_price) }} MoeCoin</b></div>
          <div><span>目标人数（含发起者）</span><b>{{ group.member_count }} / {{ group.target_count }}</b></div>
          <div><span>截止时间</span><b>{{ formatDate(group.expires_at) }}</b></div>
          <div><span>截止后单独购买</span><b>{{ formatCoin(group.late_price) }} MoeCoin</b></div>
        </div>
        <ProgressBar :value="progress" :showValue="false" />
        <div class="explain">每位成员先预付 {{ formatCoin(contribution) }} MoeCoin；达标后按实际人数结算，未达标全额退款。</div>

        <div v-if="group.delivery_status === 'approved' && group.delivery_url && group.is_member" class="deliveryBox">
          <b>共用分发链接（仅拼团成员可见）</b>
          <a :href="group.delivery_url" target="_blank" rel="noopener noreferrer">{{ group.delivery_url }}</a>
        </div>
        <div v-else-if="group.status === 'successful'" class="deliveryBox pending">
          发起者尚未提交并通过管理员审核分发链接。
          <span v-if="group.delivery_deadline_at">提交期限：{{ formatDate(group.delivery_deadline_at) }}</span>
        </div>
        <div class="actions">
          <Button v-if="group.status === 'open' && new Date(group.expires_at) > new Date() && !group.is_member && !isCreator"
            label="参加拼团" icon="pi pi-users" :loading="busy" @click="join" />
          <Button v-if="group.status === 'successful' && !isCreator && !group.has_late_purchase"
            :label="`单独购买 · ${formatCoin(group.late_price)} MoeCoin`" icon="pi pi-shopping-cart"
            :loading="busy" @click="buyAfterDeadline" />
          <Button v-if="isCreator && ['pending_review', 'open'].includes(group.status)"
            label="取消拼团并退款" severity="danger" outlined :loading="busy" @click="cancel" />
        </div>

        <div v-if="isCreator && group.status === 'successful' && ['waiting_link', 'approved'].includes(group.delivery_status)" class="linkForm">
          <label>共用分发链接</label>
          <div class="linkRow">
            <InputText v-model="deliveryUrl" placeholder="https://..." maxlength="1000" />
            <Button label="提交管理员审核" :loading="busy" @click="submitLink" />
          </div>
          <small>审核通过后托管款才会发放；链接失效时可在此更新。</small>
        </div>

        <div v-if="group.is_member && group.status === 'successful'" class="reportForm">
          <label>分发问题举报</label>
          <div class="linkRow">
            <InputText v-model="reportReason" maxlength="2000" placeholder="说明链接失效或分发问题（至少 5 个字符）" />
            <Button label="提交举报" severity="warn" outlined :loading="busy" @click="report" />
          </div>
          <small>举报将交由管理员核实；待处理期间不会向发起者放款。</small>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="notFound">拼团不存在或暂不可见</div>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

export default {
  name: 'GroupBuyDetail',
  components: { Button, InputText, ProgressBar, Tag },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      group: null,
      loading: true,
      busy: false,
      deliveryUrl: '',
      reportReason: '',
    }
  },
  computed: {
    isCreator() {
      return !!this.group?.is_creator
    },
    contribution() {
      return this.group
        ? Math.ceil(
            Number(this.group.total_price) / Number(this.group.target_count),
          )
        : 0
    },
    progress() {
      return this.group
        ? Math.min(
            100,
            Math.round(
              (Number(this.group.member_count) /
                Number(this.group.target_count)) *
                100,
            ),
          )
        : 0
    },
    statusLabel() {
      if (!this.group) return ''
      return (
        {
          open: '进行中',
          successful: '已成团',
          failed: '未成团',
          cancelled: '已取消',
          rejected: '未通过审核',
          refunded: '已退款',
          pending_review: '待管理员审核',
        }[this.group.status] || this.group.status
      )
    },
    statusSeverity() {
      return this.group?.status === 'open'
        ? 'success'
        : this.group?.status === 'successful'
          ? 'info'
          : 'secondary'
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
      try {
        const res = await axios.get(
          GetApi(`/shop/groups/${this.$route.params.id}`),
          {
            headers: GetToken() ? this.headers() : {},
          },
        )
        this.group = res.data.group
        this.deliveryUrl = this.group.delivery_url || ''
      } catch (err) {
        console.error('拼团详情加载失败', err)
        this.group = null
      } finally {
        this.loading = false
      }
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('zh-CN') : '—'
    },
    async perform(action, message) {
      if (!GetToken()) {
        this.toast.add({
          severity: 'warn',
          summary: '请先登录',
          detail: '登录后才能操作拼团',
          life: 3000,
        })
        return
      }
      this.busy = true
      try {
        await action()
        this.toast.add({ severity: 'success', summary: message, life: 2500 })
        await this.load()
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '操作失败',
          detail: err.response?.data?.error || '请稍后重试',
          life: 3500,
        })
      } finally {
        this.busy = false
      }
    },
    join() {
      return this.perform(
        () =>
          axios.post(
            GetApi(`/shop/groups/${this.group.id}/join`),
            {},
            { headers: this.headers() },
          ),
        '已参加拼团',
      )
    },
    buyAfterDeadline() {
      return this.perform(
        () =>
          axios.post(
            GetApi(`/shop/groups/${this.group.id}/buy-after-deadline`),
            {},
            { headers: this.headers() },
          ),
        '已购买，款项暂存并等待分发审核',
      )
    },
    cancel() {
      return this.perform(
        () =>
          axios.post(
            GetApi(`/shop/groups/${this.group.id}/cancel`),
            {},
            { headers: this.headers() },
          ),
        '拼团已取消并退款',
      )
    },
    submitLink() {
      return this.perform(
        () =>
          axios.put(
            GetApi(`/shop/groups/${this.group.id}/delivery-link`),
            { delivery_url: this.deliveryUrl },
            { headers: this.headers() },
          ),
        '链接已提交管理员审核',
      )
    },
    report() {
      return this.perform(
        () =>
          axios.post(
            GetApi(`/shop/groups/${this.group.id}/reports`),
            { reason: this.reportReason },
            { headers: this.headers() },
          ),
        '举报已提交，等待管理员核实',
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.detailPage { max-width: 900px; margin: 0 auto; padding: 32px 20px 60px; }
.backLink { display: inline-block; margin-bottom: 14px; color: #4a6fe3; text-decoration: none; }
.detailCard { display: grid; grid-template-columns: 300px minmax(0, 1fr); overflow: hidden; border: 1px solid #e6e9f5; border-radius: 14px; background: #fff; box-shadow: 0 3px 14px #1e285a17; }
.hero { min-height: 300px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f2f5ff, #f7f1ff); font-size: 90px; }
.hero img { width: 100%; height: 100%; object-fit: cover; }
.content { min-width: 0; padding: 24px; }
.titleRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
h1 { margin: 0; color: #2c3e77; font-size: 25px; }
.description { white-space: pre-wrap; color: #667196; font-size: 14px; line-height: 1.65; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
.stats div { display: flex; flex-direction: column; gap: 4px; padding: 10px; border-radius: 8px; background: #f8faff; }
.stats span, small { color: #8993b5; font-size: 11px; }
.stats b { color: #2c53c9; font-size: 13px; }
.explain { margin: 10px 0; color: #7882a4; font-size: 12px; line-height: 1.55; }
.deliveryBox { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; padding: 13px; border: 1px solid #cdebd8; border-radius: 8px; background: #f2fbf5; color: #397250; font-size: 13px; }
.deliveryBox a { overflow-wrap: anywhere; color: #2c53c9; }
.deliveryBox.pending { border-color: #f6e5bb; background: #fffbef; color: #8d6a17; }
.adminNote { margin-top: 12px; color: #9c3d3d; font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.linkForm, .reportForm { margin-top: 18px; padding-top: 14px; border-top: 1px solid #edf0fa; }
.linkForm label, .reportForm label { display: block; margin-bottom: 8px; color: #45507a; font-size: 13px; font-weight: 600; }
.linkRow { display: flex; gap: 8px; }
.linkRow :deep(.p-inputtext) { flex: 1; min-width: 0; }
.linkForm small, .reportForm small { display: block; margin-top: 6px; }
.notFound { padding: 70px 10px; text-align: center; color: #8892b8; }
@media (max-width: 700px) { .detailCard { grid-template-columns: 1fr; } .hero { min-height: 200px; max-height: 280px; } .content { padding: 18px; } }
@media (max-width: 480px) { .stats { grid-template-columns: 1fr; } .linkRow { flex-direction: column; } }
</style>
