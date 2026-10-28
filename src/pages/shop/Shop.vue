<template>
  <div class="shopPage">
    <header class="pageHead">
      <div>
        <h1>EC 商城</h1>
        <p>用 MoeCoin 兑换心仪的周边与商品</p>
      </div>
      <div class="headActions">
        <router-link v-if="logined" class="myOrdersLink" to="/shop/orders">
          <i class="pi pi-list"></i>我的订单
        </router-link>
      </div>
    </header>

    <div v-if="products.length" class="productGrid">
      <router-link v-for="p in products" :key="p.id" class="productCard" :to="'/shop/' + p.id">
        <div class="productCover">
          <span class="productEmoji">{{ p.emoji || '🛍️' }}</span>
        </div>
        <h2 class="productTitle">{{ p.title }}</h2>
        <div class="productMeta">
          <span class="priceChip">
            <i class="pi pi-wallet"></i>{{ p.price_moecoin === 0 ? '免费' : formatCoin(p.price_moecoin) }}
          </span>
          <span class="stockInfo">{{ stockLabel(p) }}</span>
        </div>
        <div class="productSold">已售 {{ p.sold }}</div>
      </router-link>
    </div>

    <div v-else-if="!loading" class="emptyBox">
      <i class="pi pi-shopping-bag emptyIcon"></i>
      <p>货架空空如也，商品上架中</p>
    </div>

    <div class="pager" v-if="products.length && products.length < total">
      <Button label="加载更多" text :loading="loading" @click="loadMore" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

const PAGE_SIZE = 24

export default {
  name: 'ShopPage',
  components: { Button },
  data() {
    return {
      products: [],
      total: 0,
      offset: 0,
      loading: false,
      logined: !!GetToken(),
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    formatCoin,
    async load() {
      this.loading = true
      try {
        const res = await axios.get(GetApi('/shop/products'), {
          params: { limit: PAGE_SIZE, offset: this.offset },
        })
        this.products =
          this.offset === 0
            ? res.data.products || []
            : this.products.concat(res.data.products || [])
        this.total = res.data.total || 0
      } catch (err) {
        console.error('商品列表加载失败', err)
      }
      this.loading = false
    },
    loadMore() {
      this.offset += PAGE_SIZE
      this.load()
    },
    stockLabel(p) {
      if (p.stock === -1) return '库存充足'
      if (p.stock === 0) return '已售罄'
      return `剩 ${p.stock} 件`
    },
  },
}
</script>

<style lang="scss" scoped>
.shopPage {
  max-width: 1020px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

.pageHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;

  h1 {
    margin: 0;
    font-size: 32px;
    color: #2c3e77;
  }

  p {
    margin: 6px 0 0;
    color: #8892b8;
    font-size: 13.5px;
  }
}

.myOrdersLink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e3e9f8;
  color: #2c3e77;
  font-size: 13.5px;
  text-decoration: none;
  transition: all 0.15s;

  &:hover {
    border-color: #b9c8f2;
    box-shadow: 0 2px 8px rgba(30, 40, 90, 0.1);
  }
}

.productGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.productCard {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 18px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.09);
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(30, 40, 90, 0.15);
  }
}

.productCover {
  height: 110px;
  border-radius: 9px;
  background: linear-gradient(135deg, #f2f5ff, #f7f1ff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  .productEmoji {
    font-size: 52px;
    line-height: 1;
  }
}

.productTitle {
  margin: 0 0 10px;
  font-size: 15.5px;
  font-weight: 600;
  color: #2c3e77;
  line-height: 1.4;
  min-height: 2.8em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.productMeta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.priceChip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef3ff, #f3edff);
  color: #2c53c9;
  font-size: 13.5px;
  font-weight: 700;

  i {
    font-size: 12px;
    color: #7c5fe3;
  }
}

.stockInfo {
  font-size: 12px;
  color: #9aa2c5;
}

.productSold {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e8ecf8;
  font-size: 11.5px;
  color: #b0b7d6;
}

.emptyBox {
  text-align: center;
  color: #8892b8;
  padding: 70px 0;

  .emptyIcon {
    font-size: 40px;
    opacity: 0.45;
    margin-bottom: 10px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.pager {
  text-align: center;
  padding: 18px 0;
}
</style>
