<template>
  <div class="myGroupsPage">
    <router-link class="backLink" to="/orders">← 我的订单</router-link>
    <h1>我的拼团</h1>
    <div v-if="groups.length" class="groupList">
      <article v-for="group in groups" :key="`${group.id}-${group.purchase_type}`" class="groupCard">
        <div>
          <h2>{{ group.emoji }} {{ group.title }}</h2>
          <p>{{ group.purchase_type === 'member' ? '拼团成员' : '截止后单独购买' }} · 已支付 {{ formatCoin(group.amount_paid) }} MoeCoin</p>
          <p v-if="group.purchase_type === 'member' && group.status === 'successful'">
            实际分摊 {{ formatCoin(group.amount_due) }} · 已退款 {{ formatCoin(group.amount_refunded) }} MoeCoin
          </p>
          <Tag :value="statusLabel(group)" :severity="group.status === 'open' ? 'success' : 'info'" />
        </div>
        <router-link :to="`/shop/groups/${group.id}`">查看拼团</router-link>
      </article>
    </div>
    <p v-else-if="!loading" class="empty">还没有参加或发起拼团。</p>
  </div>
</template>

<script>
import axios from 'axios'
import Tag from 'primevue/tag'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

export default {
  name: 'MyGroupBuys',
  components: { Tag },
  data() {
    return { groups: [], loading: true }
  },
  mounted() {
    this.load()
  },
  methods: {
    formatCoin,
    async load() {
      try {
        const res = await axios.get(GetApi('/shop/my-groups'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
        })
        this.groups = res.data.groups || []
      } catch (err) {
        console.error('我的拼团加载失败', err)
      } finally {
        this.loading = false
      }
    },
    statusLabel(group) {
      return (
        {
          pending_review: '审核中',
          open: '进行中',
          successful: '已成团',
          failed: '未成团并退款',
          cancelled: '已取消并退款',
          rejected: '审核未通过并退款',
          refunded: '已退款',
        }[group.status] || group.status
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.myGroupsPage { max-width: 850px; margin: 0 auto; padding: 32px 20px 60px; }
.backLink { display: inline-block; margin-bottom: 14px; color: #4a6fe3; text-decoration: none; }
h1 { margin: 0 0 18px; color: #2c3e77; font-size: 26px; }
.groupList { display: flex; flex-direction: column; gap: 10px; }
.groupCard { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; border-radius: 10px; background: #fff; box-shadow: 0 3px 14px #1e285a12; }
.groupCard h2 { margin: 0 0 7px; color: #2c3e77; font-size: 16px; }
.groupCard p { margin: 4px 0; color: #818bac; font-size: 12px; }
.groupCard a { flex-shrink: 0; color: #4a6fe3; font-size: 13px; text-decoration: none; }
.empty { padding: 60px 10px; color: #8892b8; text-align: center; }
</style>
