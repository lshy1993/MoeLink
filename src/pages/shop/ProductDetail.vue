<template>
  <div class="productDetailPage">
    <router-link class="backLink" to="/shop">← 返回萌购</router-link>

    <template v-if="product">
      <div class="detailCard">
        <div class="detailHead">
          <div class="cover">
            <span class="emoji">{{ product.emoji || '🛍️' }}</span>
          </div>
          <div class="headInfo">
            <h1 class="title">{{ product.title }}</h1>
            <div class="priceRow">
              <span class="priceChip">
                <i class="pi pi-wallet"></i>
                {{ product.price_moecoin === 0 ? '免费' : formatCoin(product.price_moecoin) + ' MoeCoin' }}
              </span>
              <span class="stockInfo">{{ stockLabel }}</span>
              <span class="soldInfo">已售 {{ product.sold }}</span>
            </div>
            <Button label="立即购买" icon="pi pi-shopping-cart" class="buyBtn"
              :disabled="!canBuy" @click="openBuy" />
            <div v-if="!logined" class="buyHint">登录后即可购买</div>
            <div v-else-if="!canBuy" class="buyHint">该商品暂时无法购买（已售罄或已下架）</div>
          </div>
        </div>

        <div class="sectionTitle">商品详情</div>
        <div class="markdownBody" v-html="html"></div>
      </div>

      <!-- 购买弹窗 -->
      <Dialog v-model:visible="buyOn" header="确认购买 🛒" modal :style="{ width: '420px' }">
        <div class="buyBody">
          <div class="buyProduct">
            <span class="buyEmoji">{{ product.emoji }}</span>
            <div class="buyInfo">
              <b>{{ product.title }}</b>
              <span class="buyUnit">{{ product.price_moecoin === 0 ? '免费' : formatCoin(product.price_moecoin) + ' MoeCoin / 件' }}</span>
            </div>
          </div>
          <div class="formRow">
            <label>数量</label>
            <InputNumber v-model="buyForm.quantity" :min="1" :max="maxQty" :useGrouping="false" />
          </div>
          <div class="formRow">
            <label>支付方式</label>
            <Select v-model="buyForm.payment_method" :options="paymentOptions"
              optionLabel="label" optionValue="value" optionDisabled="disabled"
              class="paySelect" />
          </div>
          <div class="formRow">
            <label>联系方式 / 留言</label>
            <InputText v-model="buyForm.contact" maxlength="200"
              placeholder="收货信息或联系方式（虚拟商品可留空）" class="contactInput" />
          </div>
          <div class="totalRow">
            合计 <b>{{ formatCoin(totalPrice) }}</b> MoeCoin
            <span class="myBalance">（余额 {{ formatCoin(walletBalance) }}）</span>
          </div>
        </div>
        <template #footer>
          <Button label="取消" severity="secondary" text @click="buyOn = false" />
          <Button label="确认支付" icon="pi pi-check" :loading="buying"
            :disabled="!buyForm.quantity" @click="doBuy" />
        </template>
      </Dialog>
    </template>

    <div v-else-if="!loading" class="notFound">
      <i class="pi pi-exclamation-circle"></i>
      <p>商品不存在或已下架</p>
      <router-link to="/shop">返回萌购</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

export default {
  name: 'ProductDetail',
  components: { Button, Dialog, InputText, InputNumber, Select },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      product: null,
      loading: true,
      logined: !!GetToken(),
      walletBalance: null,
      buyOn: false,
      buying: false,
      buyForm: {
        quantity: 1,
        payment_method: 'moecoin',
        contact: '',
      },
      paymentOptions: [],
    }
  },
  computed: {
    html() {
      return this.product
        ? DOMPurify.sanitize(marked.parse(this.product.content_md || ''))
        : ''
    },
    stockLabel() {
      if (!this.product) return ''
      if (this.product.stock === -1) return '库存充足'
      if (this.product.stock === 0) return '已售罄'
      return `剩 ${this.product.stock} 件`
    },
    maxQty() {
      if (!this.product) return 1
      if (this.product.stock === -1) return 99
      return Math.max(this.product.stock, 1)
    },
    canBuy() {
      return (
        this.product &&
        this.product.status === 'published' &&
        this.product.stock !== 0
      )
    },
    totalPrice() {
      if (!this.product) return 0
      return (
        Number(this.product.price_moecoin) *
        (Number(this.buyForm.quantity) || 0)
      )
    },
  },
  mounted() {
    this.load()
    this.loadPaymentMethods()
    if (this.logined) this.loadWallet()
  },
  methods: {
    formatCoin,
    async load() {
      this.loading = true
      try {
        const res = await axios.get(
          GetApi(`/shop/products/${this.$route.params.id}`),
        )
        this.product = res.data.product
      } catch (_err) {
        this.product = null
      }
      this.loading = false
    },
    /**
     * 支付方式来自后端注册表：已开通可用，未开通禁用显示「即将上线」
     */
    async loadPaymentMethods() {
      try {
        const res = await axios.get(GetApi('/shop/payment-methods'))
        this.paymentOptions = (res.data.methods || []).map((m) => ({
          label: m.enabled ? m.label : `${m.label}（即将上线）`,
          value: m.value,
          disabled: !m.enabled,
        }))
      } catch (_err) {
        this.paymentOptions = [
          { label: 'MoeCoin 余额支付', value: 'moecoin', disabled: false },
        ]
      }
    },
    async loadWallet() {
      try {
        const res = await axios.get(GetApi('/moecoin/wallet'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
        })
        this.walletBalance = res.data.balance
      } catch (_err) {
        /* 静默 */
      }
    },
    openBuy() {
      if (!this.logined) {
        this.toast.add({
          severity: 'warn',
          summary: '请先登录',
          detail: '登录后即可购买',
          life: 3000,
        })
        return
      }
      this.buyForm = { quantity: 1, payment_method: 'moecoin', contact: '' }
      this.buyOn = true
    },
    async doBuy() {
      if (this.buying || !this.buyForm.quantity) return
      this.buying = true
      try {
        const res = await axios.post(
          GetApi('/shop/orders'),
          {
            product_id: this.product.id,
            quantity: this.buyForm.quantity,
            payment_method: this.buyForm.payment_method,
            contact: this.buyForm.contact || undefined,
          },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )
        this.toast.add({
          severity: 'success',
          summary: '购买成功',
          detail: `订单 ${res.data.order_no} 已支付 ${formatCoin(res.data.total)} MoeCoin`,
          life: 4000,
        })
        this.walletBalance = res.data.balance
        this.buyOn = false
        this.load()
        this.$router.push('/orders')
      } catch (err) {
        const msg = err.response?.data?.error || '购买失败'
        this.toast.add({
          severity: 'error',
          summary: '购买失败',
          detail: msg,
          life: 3000,
        })
      }
      this.buying = false
    },
  },
}
</script>

<style lang="scss" scoped>
.productDetailPage {
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

.detailCard {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 26px 28px;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.1);
}

.detailHead {
  display: flex;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #edf0fa;
  margin-bottom: 18px;
}

.cover {
  width: 170px;
  height: 170px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #f2f5ff, #f7f1ff);
  display: flex;
  align-items: center;
  justify-content: center;

  .emoji {
    font-size: 78px;
    line-height: 1;
  }
}

.headInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 26px;
  color: #2c3e77;
  line-height: 1.4;
}

.priceRow {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.priceChip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef3ff, #f3edff);
  color: #2c53c9;
  font-size: 17px;
  font-weight: 800;

  i {
    font-size: 14px;
    color: #7c5fe3;
  }
}

.stockInfo {
  font-size: 13px;
  color: #d97a2b;
  background: #fff4e8;
  padding: 4px 10px;
  border-radius: 12px;
}

.soldInfo {
  font-size: 12.5px;
  color: #9aa2c5;
}

.buyBtn {
  margin-top: 4px;
}

.buyHint {
  font-size: 12px;
  color: #9aa2c5;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e77;
  margin-bottom: 12px;
}

.markdownBody {
  color: #333;
  line-height: 1.85;
  font-size: 14.5px;
  overflow-wrap: anywhere;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: #2c3e77;
    margin: 20px 0 10px;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 22px;
    margin: 8px 0;
  }
  :deep(code) {
    background: #f2f4fd;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 13px;
  }
  :deep(blockquote) {
    margin: 12px 0;
    padding: 6px 14px;
    border-left: 3px solid #b9c4ef;
    background: #f6f8ff;
    color: #556;
  }
  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
  }
  :deep(a) {
    color: #4a6fe3;
  }
}

.notFound {
  text-align: center;
  color: #8892b8;
  padding: 70px 0;

  i {
    font-size: 40px;
    opacity: 0.45;
  }

  p {
    margin: 12px 0;
  }

  a {
    color: #4a6fe3;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.buyBody {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.buyProduct {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8faff;
  border-radius: 9px;

  .buyEmoji {
    font-size: 34px;
    line-height: 1;
  }

  .buyInfo {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    b {
      color: #2c3e77;
      font-size: 14.5px;
    }

    .buyUnit {
      font-size: 12px;
      color: #8892b8;
    }
  }
}

.formRow {
  display: flex;
  flex-direction: column;
  gap: 5px;

  label {
    font-size: 12.5px;
    color: #56608a;
    font-weight: 600;
  }
}

.paySelect,
.contactInput {
  width: 100%;
}

.totalRow {
  padding-top: 10px;
  border-top: 1px dashed #e8ecf8;
  font-size: 14px;
  color: #45507a;

  b {
    font-size: 18px;
    color: #2c53c9;
  }

  .myBalance {
    font-size: 12px;
    color: #9aa2c5;
  }
}

@media (max-width: 640px) {
  .detailHead {
    flex-direction: column;

    .cover {
      width: 100%;
      height: 140px;
    }
  }
}
</style>
