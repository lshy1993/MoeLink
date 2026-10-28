<template>
  <div class="shopPage">
    <header class="pageHead">
      <div>
        <h1>EC 商城</h1>
        <p>浏览商城商品与拼团商品，用 MoeCoin 购买心仪好物</p>
      </div>
      <div class="headActions">
        <router-link v-if="logined" class="myOrdersLink publishLink" to="/shop/groups/new">
          <i class="pi pi-plus"></i>发布拼团商品
        </router-link>
        <router-link v-if="logined" class="myOrdersLink" to="/shop/orders">
          <i class="pi pi-list"></i>我的订单
        </router-link>
      </div>
    </header>

    <form class="searchBar" @submit.prevent="searchProducts">
      <label class="searchInput">
        <i class="pi pi-search"></i>
        <input v-model="searchInput" type="search" maxlength="100" placeholder="搜索商品名称或介绍">
      </label>
      <Button type="submit" label="搜索" icon="pi pi-search" :loading="loading" />
      <Button v-if="search" label="清除" severity="secondary" outlined @click="clearSearch" />
    </form>

    <div v-if="products.length" class="productGrid">
      <router-link
        v-for="p in products"
        :key="`${p.item_type || 'product'}-${p.id}`"
        class="productCard"
        :class="{ pendingReviewCard: p.item_type === 'group_buy' && p.status === 'pending_review' }"
        :to="productLink(p)"
      >
        <div class="productCover">
          <img v-if="p.image_url" :src="p.image_url" :alt="p.title">
          <span v-else class="productEmoji">{{ p.emoji || '🛍️' }}</span>
          <span v-if="p.item_type === 'group_buy'" class="typeBadge">
            {{ p.status === 'pending_review' ? '等待审核' : '拼团商品' }}
          </span>
        </div>
        <h2 class="productTitle">{{ p.title }}</h2>
        <div v-if="p.item_type === 'group_buy'" class="groupPrice">
          <span class="groupPriceLabel">{{ groupPriceLabel(p) }}</span>
          <strong>{{ formatCoin(groupPrice(p)) }} <small>MoeCoin / 人</small></strong>
          <span class="groupTotal">拼团总价 {{ formatCoin(p.price_moecoin) }} MoeCoin</span>
        </div>
        <div v-if="p.item_type !== 'group_buy'" class="productMeta">
          <span class="priceChip">
            <i class="pi pi-wallet"></i>{{ priceLabel(p) }}
          </span>
          <span class="stockInfo">{{ stockLabel(p) }}</span>
        </div>
        <div v-if="p.item_type === 'group_buy'" class="groupProgress">
          <span>{{ p.member_count }}/{{ p.target_count }} 人</span>
          <ProgressBar :value="progress(p)" :showValue="false" />
          <span>{{ groupStatusLabel(p) }}</span>
        </div>
        <div v-else class="productSold">已售 {{ p.sold }}</div>
      </router-link>
    </div>

    <div v-else-if="!loading" class="emptyBox">
      <i class="pi pi-search emptyIcon"></i>
      <p>{{ search ? '没有找到匹配的商品' : '货架空空如也，商品上架中' }}</p>
    </div>

    <div v-if="total > pageSize" class="pager">
      <Button label="上一页" icon="pi pi-chevron-left" severity="secondary" outlined
        :disabled="page === 1 || loading" @click="changePage(page - 1)" />
      <span>第 {{ page }} / {{ pageCount }} 页 · 共 {{ total }} 件商品</span>
      <Button label="下一页" icon="pi pi-chevron-right" iconPos="right" severity="secondary" outlined
        :disabled="page >= pageCount || loading" @click="changePage(page + 1)" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

const PAGE_SIZE = 24

export default {
  name: 'ShopPage',
  components: { Button, ProgressBar },
  data() {
    return {
      products: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      search: '',
      searchInput: '',
      loading: false,
      logined: !!GetToken(),
    }
  },
  computed: {
    pageCount() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
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
          params: {
            limit: this.pageSize,
            offset: (this.page - 1) * this.pageSize,
            search: this.search || undefined,
          },
        })
        this.products = res.data.products || []
        this.total = res.data.total || 0
      } catch (err) {
        console.error('商品列表加载失败', err)
      }
      this.loading = false
    },
    searchProducts() {
      this.search = this.searchInput.trim()
      this.page = 1
      this.load()
    },
    clearSearch() {
      this.searchInput = ''
      this.search = ''
      this.page = 1
      this.load()
    },
    changePage(page) {
      this.page = page
      this.load()
    },
    productLink(product) {
      return product.item_type === 'group_buy'
        ? `/shop/groups/${product.id}`
        : `/shop/${product.id}`
    },
    priceLabel(product) {
      return product.price_moecoin === 0
        ? '免费'
        : formatCoin(product.price_moecoin)
    },
    groupPrice(product) {
      if (product.status === 'successful') return Number(product.late_price)
      return Math.ceil(
        Number(product.price_moecoin) / Number(product.target_count),
      )
    },
    groupPriceLabel(product) {
      return product.status === 'successful'
        ? '当前单独购入价'
        : '当前预付购入价'
    },
    groupStatusLabel(product) {
      if (product.status === 'pending_review') return '等待审核'
      if (product.status === 'successful') return '已成团'
      return `截止 ${this.formatDate(product.expires_at)}`
    },
    progress(product) {
      return Math.min(
        100,
        Math.round(
          (Number(product.member_count) / Number(product.target_count)) * 100,
        ),
      )
    },
    formatDate(value) {
      return new Date(value).toLocaleString('zh-CN', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
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

.headActions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.publishLink {
  border-color: #4a6fe3;
  background: #4a6fe3;
  color: #fff;

  &:hover {
    border-color: #3658c6;
    background: #3658c6;
  }
}

.searchBar {
  display: flex;
  gap: 9px;
  margin-bottom: 20px;
}

.searchInput {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 0 12px;
  border: 1px solid #e3e9f8;
  border-radius: 9px;
  background: #fff;
  color: #929bbc;

  input {
    width: 100%;
    min-width: 0;
    padding: 10px 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #45507a;
    font: inherit;
    font-size: 13px;
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

.pendingReviewCard {
  border: 2px dashed #e2a23b;
  background: #fffaf0;
  box-shadow: 0 3px 14px rgba(160, 112, 31, 0.1);
}

.pendingReviewCard:hover {
  box-shadow: 0 8px 22px rgba(160, 112, 31, 0.18);
}

.productCover {
  position: relative;
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

  img {
    width: 100%;
    height: 100%;
    border-radius: 9px;
    object-fit: cover;
  }
}

.typeBadge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(91, 87, 190, 0.9);
  color: #fff;
  font-size: 11px;
}

.groupPrice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  margin: 0 0 10px;
  padding: 9px 11px;
  border: 1px solid #dfe5ff;
  border-radius: 9px;
  background: linear-gradient(120deg, #f0f3ff, #f7f2ff);

  .groupPriceLabel {
    color: #6875a7;
    font-size: 11px;
    font-weight: 600;
  }

  strong {
    color: #354fc1;
    font-size: 22px;
    line-height: 1.15;
  }

  strong small {
    color: #6471a3;
    font-size: 11px;
    font-weight: 500;
  }

  .groupTotal {
    margin-top: 2px;
    color: #8791b5;
    font-size: 11px;
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

.groupProgress {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  margin-top: 11px;
  color: #8993b5;
  font-size: 10.5px;

  :deep(.p-progressbar) {
    height: 6px;
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 18px 0;

  span {
    color: #7882a4;
    font-size: 12px;
  }
}

@media (max-width: 600px) {
  .pageHead {
    align-items: flex-start;
    flex-direction: column;
  }

  .searchBar {
    flex-wrap: wrap;
  }

  .searchInput {
    flex-basis: 100%;
  }

  .pager {
    gap: 7px;

    :deep(.p-button-label) {
      font-size: 11px;
    }

    span {
      font-size: 10.5px;
      text-align: center;
    }
  }
}
</style>
