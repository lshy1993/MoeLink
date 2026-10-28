<template>
  <div class="myOrdersPage">
    <router-link class="backLink" to="/shop">← 返回商城</router-link>

    <div v-if="!logined" class="loginPrompt">
      <i class="pi pi-lock"></i>
      <h1>请先登录</h1>
      <p>登录后即可查看订单</p>
      <router-link to="/shop">返回商城</router-link>
    </div>

    <template v-else>
      <header class="pageHead">
        <h1 class="pageTitle">我的订单</h1>
        <router-link class="groupOrdersLink" to="/shop/my-groups">我的拼团记录</router-link>
      </header>

      <div v-if="orders.length" class="orderList">
        <div v-for="o in orders" :key="o.id" class="orderCard">
          <div class="orderTop">
            <span class="orderNo">{{ o.order_no }}</span>
            <span class="orderTime">{{ formatTime(o.created_at) }}</span>
          </div>
          <div class="orderMain">
            <div class="orderProduct">
              <b>{{ o.product_title }}</b>
              <span class="qty">x{{ o.quantity }} · {{ formatCoin(o.product_price) }}/件</span>
            </div>
            <div class="orderSide">
              <b class="total">{{ formatCoin(o.total_price) }} MoeCoin</b>
              <div class="statusTags">
                <Tag :value="payLabel(o)" :severity="paySeverity(o)" />
                <Tag :value="fulfillLabel(o)" :severity="fulfillSeverity(o)" />
              </div>
            </div>
          </div>
          <div v-if="o.contact" class="orderContact">留言：{{ o.contact }}</div>
        </div>
      </div>
      <div v-else-if="!loading" class="emptyBox">
        <i class="pi pi-shopping-bag emptyIcon"></i>
        <p>还没有订单，去商城逛逛吧</p>
        <router-link to="/shop" class="goShop">进入商城 →</router-link>
      </div>

      <div class="pager" v-if="orders.length && orders.length < total">
        <Button label="加载更多" text :loading="loading" @click="loadMore" />
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { formatCoin, formatTime } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

const PAGE_SIZE = 20

const PAY_LABELS = { pending: '待支付', paid: '已支付', refunded: '已退款' }
const PAY_SEV = { pending: 'warn', paid: 'success', refunded: 'info' }
const FULFILL_LABELS = {
  pending_ship: '待发货',
  shipped: '已发货',
  done: '已完成',
  cancelled: '已取消',
}
const FULFILL_SEV = {
  pending_ship: 'warn',
  shipped: 'info',
  done: 'success',
  cancelled: 'secondary',
}

export default {
  name: 'MyOrdersPage',
  components: { Button, Tag },
  data() {
    return {
      logined: !!GetToken(),
      orders: [],
      total: 0,
      offset: 0,
      loading: false,
    }
  },
  mounted() {
    if (this.logined) this.load()
  },
  methods: {
    formatCoin,
    formatTime,
    payLabel(o) {
      return PAY_LABELS[o.payment_status] || o.payment_status
    },
    paySeverity(o) {
      return PAY_SEV[o.payment_status] || 'secondary'
    },
    fulfillLabel(o) {
      return FULFILL_LABELS[o.fulfillment_status] || o.fulfillment_status
    },
    fulfillSeverity(o) {
      return FULFILL_SEV[o.fulfillment_status] || 'secondary'
    },
    async load() {
      this.loading = true
      try {
        const res = await axios.get(GetApi('/shop/orders'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
          params: { limit: PAGE_SIZE, offset: this.offset },
        })
        this.orders =
          this.offset === 0
            ? res.data.orders || []
            : this.orders.concat(res.data.orders || [])
        this.total = res.data.total || 0
      } catch (err) {
        console.error('订单加载失败', err)
      }
      this.loading = false
    },
    loadMore() {
      this.offset += PAGE_SIZE
      this.load()
    },
  },
}
</script>

<style lang="scss" scoped>
.myOrdersPage {
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

  &:hover {
    text-decoration: underline;
  }
}

.pageTitle {
  margin: 0 0 16px;
  font-size: 26px;
  color: #2c3e77;
}

.pageHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.groupOrdersLink {
  color: #4a6fe3;
  font-size: 13px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.orderList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.orderCard {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.09);
}

.orderTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e8ecf8;
  margin-bottom: 12px;

  .orderNo {
    font-family: monospace;
    font-size: 12.5px;
    color: #8892b8;
  }

  .orderTime {
    font-size: 12px;
    color: #b0b7d6;
  }
}

.orderMain {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.orderProduct {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;

  b {
    color: #2c3e77;
    font-size: 15px;
  }

  .qty {
    font-size: 12.5px;
    color: #9aa2c5;
  }
}

.orderSide {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;

  .total {
    font-size: 15px;
    color: #2c53c9;
  }

  .statusTags {
    display: flex;
    gap: 6px;
  }
}

.orderContact {
  margin-top: 10px;
  font-size: 12.5px;
  color: #8892b8;
  background: #f8faff;
  border-radius: 7px;
  padding: 8px 12px;
}

.emptyBox {
  text-align: center;
  color: #8892b8;
  padding: 60px 0;

  .emptyIcon {
    font-size: 40px;
    opacity: 0.45;
    margin-bottom: 10px;
  }

  p {
    margin: 0 0 14px;
    font-size: 14px;
  }

  .goShop {
    color: #4a6fe3;
    text-decoration: none;
  }
}

.pager {
  text-align: center;
  padding: 18px 0;
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

  p {
    margin: 0 0 16px;
  }

  a {
    color: #4a6fe3;
    text-decoration: none;
  }
}
</style>
