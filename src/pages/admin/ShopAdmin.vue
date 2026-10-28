<template>
  <div class="shopAdminPage">
    <!-- 统计 -->
    <div class="statCards" v-if="stats">
      <div class="statCard">
        <div class="num">{{ stats.products }}</div>
        <div class="label">商品（{{ stats.published }} 上架）</div>
      </div>
      <div class="statCard">
        <div class="num">{{ stats.orders }}</div>
        <div class="label">订单总数</div>
      </div>
      <div class="statCard warn">
        <div class="num">{{ stats.pending_ship }}</div>
        <div class="label">待发货</div>
      </div>
      <div class="statCard">
        <div class="num">{{ formatCoin(stats.revenue_total) }}</div>
        <div class="label">累计收入</div>
      </div>
      <div class="statCard">
        <div class="num">{{ formatCoin(stats.revenue_today) }}</div>
        <div class="label">今日收入</div>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="tabBar">
      <button v-for="t in tabs" :key="t.key" class="tabBtn" :class="{ active: tab === t.key }"
        @click="tab = t.key">{{ t.label }}</button>
    </div>

    <!-- 商品管理 -->
    <template v-if="tab === 'products'">
      <div class="listCard">
        <div class="productToolbar">
          <h2>全部商品</h2>
          <Button label="上架新商品" icon="pi pi-plus" @click="openCreateDialog" />
        </div>
        <DataTable :value="products" :loading="loadingProducts" dataKey="id">
          <Column field="id" header="ID" style="width: 52px" />
          <Column header="商品" style="min-width: 200px">
            <template #body="{ data }">
              <span class="prodEmoji">{{ data.emoji }}</span>
              <span class="prodTitle">{{ data.title }}</span>
              <router-link v-if="data.status === 'published'" class="viewLink"
                :to="'/shop/' + data.id" target="_blank">
                <i class="pi pi-external-link"></i>
              </router-link>
            </template>
          </Column>
          <Column header="价格" style="width: 90px">
            <template #body="{ data }">{{ formatCoin(data.price_moecoin) }}</template>
          </Column>
          <Column header="库存" style="width: 80px">
            <template #body="{ data }">
              <span :class="{ outOfStock: data.stock === 0 }">
                {{ data.stock === -1 ? '不限' : data.stock }}
              </span>
            </template>
          </Column>
          <Column header="已售" style="width: 66px">
            <template #body="{ data }">{{ data.sold }}</template>
          </Column>
          <Column header="状态" style="width: 84px">
            <template #body="{ data }">
              <Tag v-if="data.status === 'published'" value="已上架" severity="success" />
              <Tag v-else-if="data.status === 'draft'" value="草稿" severity="secondary" />
              <Tag v-else value="已下架" severity="warn" />
            </template>
          </Column>
          <Column header="操作" style="width: 190px">
            <template #body="{ data }">
              <Button label="编辑" size="small" outlined @click="editProduct(data)" />
              <Button v-if="data.status !== 'published'" label="上架" size="small" severity="success"
                outlined style="margin-left: 6px" @click="quickPublish(data)" />
              <Button v-else label="下架" size="small" severity="warn" outlined
                style="margin-left: 6px" @click="quickArchive(data)" />
              <Button label="删除" size="small" severity="danger" outlined
                style="margin-left: 6px" @click="deleteProduct(data)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <Dialog v-model:visible="productDialogVisible" modal
        :header="form.id ? `编辑商品 #${form.id}` : '上架新商品'"
        :style="{ width: 'min(900px, 94vw)' }"
        :breakpoints="{ '900px': '96vw' }">
        <div class="editorCard">
          <div class="formRow">
            <InputText v-model="form.title" placeholder="商品名称" maxlength="200" class="titleInput" />
            <InputText v-model="form.emoji" placeholder="封面 emoji" maxlength="8" class="emojiInput" />
            <InputNumber v-model="form.price_moecoin" placeholder="价格 MoeCoin" :min="0"
              :useGrouping="false" class="priceInput" />
            <InputNumber v-model="form.stock" placeholder="库存(-1不限)" :min="-1"
              :useGrouping="false" class="stockInput" />
            <Select v-model="form.status" :options="statusOptions" optionLabel="label"
              optionValue="value" style="width: 110px" />
          </div>
          <div style="margin-top: 10px">
            <InputText v-model="form.image_url" placeholder="图片链接（可选，缺省用 emoji 封面）"
              maxlength="500" class="w-full" />
          </div>
          <div class="editorPane">
            <div class="editorCol">
              <div class="paneLabel">商品详情（Markdown）</div>
              <Textarea v-model="form.content_md" autoResize
                placeholder="# 商品介绍&#10;&#10;**材质**、尺寸、发货说明等" class="mdInput" />
            </div>
            <div class="editorCol">
              <div class="paneLabel">预览</div>
              <div class="mdPreview" v-html="previewHtml"></div>
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="取消" severity="secondary" text @click="closeProductDialog" />
          <Button :label="form.id ? '保存修改' : '创建商品'" icon="pi pi-check"
            :disabled="!form.title || !canSave" @click="saveProduct" />
        </template>
      </Dialog>
    </template>

    <!-- 订单管理 -->
    <template v-else-if="tab === 'orders'">
      <div class="listCard">
        <div class="orderToolbar">
          <h2>订单列表</h2>
          <Select v-model="orderStatus" :options="orderStatusOptions" optionLabel="label"
            optionValue="value" size="small" style="width: 140px" @change="loadOrders" />
        </div>
        <DataTable :value="orders" :loading="loadingOrders" dataKey="id">
          <Column header="单号" style="width: 130px">
            <template #body="{ data }">
              <span class="orderNo">{{ data.order_no }}</span>
            </template>
          </Column>
          <Column header="买家" style="width: 76px">
            <template #body="{ data }">UID {{ data.user_uid }}</template>
          </Column>
          <Column header="商品" style="min-width: 180px">
            <template #body="{ data }">{{ data.product_title }} x{{ data.quantity }}</template>
          </Column>
          <Column header="金额" style="width: 90px">
            <template #body="{ data }">
              <b>{{ formatCoin(data.total_price) }}</b>
            </template>
          </Column>
          <Column header="支付" style="width: 84px">
            <template #body="{ data }">
              <Tag v-if="data.payment_status === 'paid'" value="已支付" severity="success" />
              <Tag v-else-if="data.payment_status === 'refunded'" value="已退款" severity="info" />
              <Tag v-else value="待支付" severity="warn" />
            </template>
          </Column>
          <Column header="履约" style="width: 84px">
            <template #body="{ data }">
              <Tag :value="fulfillLabel(data.fulfillment_status)"
                :severity="fulfillSeverity(data.fulfillment_status)" />
            </template>
          </Column>
          <Column header="下单时间" style="width: 110px">
            <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
          </Column>
          <Column header="操作" style="width: 200px">
            <template #body="{ data }">
              <template v-if="data.payment_status === 'paid' && data.fulfillment_status === 'pending_ship'">
                <Button label="发货" size="small" severity="success" outlined @click="shipOrder(data)" />
              </template>
              <template v-else-if="data.fulfillment_status === 'shipped'">
                <Button label="完成" size="small" outlined @click="completeOrder(data)" />
              </template>
              <Button v-if="data.payment_status === 'paid'" label="退款" size="small"
                severity="danger" outlined style="margin-left: 6px" @click="refundOrder(data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <!-- 设置 -->
    <template v-else>
      <div class="listCard settingsCard">
        <h2>商城设置</h2>
        <div class="settingRow">
          <label>销售收入入账账户 UID</label>
          <InputNumber v-model="settingsForm.revenue_uid" :min="1" :useGrouping="false" />
        </div>
        <p class="settingHint">
          所有商品销售收入（MoeCoin）将进入该账户钱包；退款时也从该账户扣回。
        </p>
        <Button label="保存设置" :loading="savingSettings" @click="saveSettings" />
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

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
  name: 'AdminShop',
  props: ['user'],
  components: {
    DataTable,
    Column,
    Dialog,
    InputText,
    InputNumber,
    Textarea,
    Select,
    Button,
    Tag,
  },
  setup() {
    return {
      toast: useToast(),
      confirmService: useConfirm(),
    }
  },
  data() {
    return {
      tab: 'products',
      tabs: [
        { key: 'products', label: '🛍️ 商品管理' },
        { key: 'orders', label: '📦 订单管理' },
        { key: 'settings', label: '⚙️ 设置' },
      ],
      stats: null,
      products: [],
      loadingProducts: false,
      productDialogVisible: false,
      orders: [],
      loadingOrders: false,
      orderStatus: '',
      orderStatusOptions: [
        { label: '全部状态', value: '' },
        { label: '待发货', value: 'pending_ship' },
        { label: '已发货', value: 'shipped' },
        { label: '已完成', value: 'done' },
        { label: '已取消', value: 'cancelled' },
      ],
      statusOptions: [
        { label: '草稿', value: 'draft' },
        { label: '上架', value: 'published' },
        { label: '下架', value: 'archived' },
      ],
      form: {
        id: null,
        title: '',
        emoji: '🛍️',
        image_url: '',
        price_moecoin: null,
        stock: 0,
        content_md: '',
        status: 'draft',
      },
      settingsForm: { revenue_uid: null },
      savingSettings: false,
    }
  },
  computed: {
    canSave() {
      return (
        this.form.price_moecoin !== null &&
        this.form.stock !== null &&
        this.form.emoji.trim().length > 0
      )
    },
    previewHtml() {
      if (!this.form.content_md)
        return '<p class="ph">输入 Markdown 即时预览</p>'
      return DOMPurify.sanitize(marked.parse(this.form.content_md))
    },
  },
  mounted() {
    this.loadProducts()
    this.loadOrders()
  },
  methods: {
    formatCoin,
    fulfillLabel(s) {
      return FULFILL_LABELS[s] || s
    },
    fulfillSeverity(s) {
      return FULFILL_SEV[s] || 'secondary'
    },
    headers() {
      return { Authorization: `Bearer ${GetToken()}` }
    },
    formatDate(d) {
      if (!d) return '—'
      return new Date(d).toLocaleDateString('zh-CN')
    },
    async loadProducts() {
      this.loadingProducts = true
      try {
        const res = await axios.get(GetApi('/shop/admin/products'), {
          headers: this.headers(),
          params: { limit: 200 },
        })
        this.products = res.data.products || []
        this.stats = res.data.stats || null
        if (res.data.settings) {
          this.settingsForm.revenue_uid = Number(res.data.settings.revenue_uid)
        }
      } catch (_err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: '商品列表加载失败',
          life: 3000,
        })
      }
      this.loadingProducts = false
    },
    async loadOrders() {
      this.loadingOrders = true
      try {
        const res = await axios.get(GetApi('/shop/admin/orders'), {
          headers: this.headers(),
          params: { limit: 100, status: this.orderStatus },
        })
        this.orders = res.data.orders || []
      } catch (_err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: '订单加载失败',
          life: 3000,
        })
      }
      this.loadingOrders = false
    },
    async saveProduct() {
      if (!this.canSave) return
      const payload = {
        title: this.form.title.trim(),
        emoji: this.form.emoji.trim() || '🛍️',
        image_url: this.form.image_url || undefined,
        price_moecoin: this.form.price_moecoin,
        stock: this.form.stock,
        content_md: this.form.content_md,
        status: this.form.status,
      }
      try {
        if (this.form.id) {
          await axios.put(
            GetApi(`/shop/admin/products/${this.form.id}`),
            payload,
            {
              headers: this.headers(),
            },
          )
          this.toast.add({
            severity: 'success',
            summary: '商品已更新',
            life: 2000,
          })
        } else {
          await axios.post(GetApi('/shop/admin/products'), payload, {
            headers: this.headers(),
          })
          this.toast.add({
            severity: 'success',
            summary: '商品已创建',
            life: 2000,
          })
        }
        this.resetForm()
        this.loadProducts()
      } catch (err) {
        const msg = err.response?.data?.error || '保存失败'
        this.toast.add({
          severity: 'error',
          summary: '保存失败',
          detail: msg,
          life: 3000,
        })
      }
    },
    editProduct(row) {
      // 列表接口（admin）已含 content_md，直接装载
      this.form = {
        id: row.id,
        title: row.title,
        emoji: row.emoji || '🛍️',
        image_url: row.image_url || '',
        price_moecoin: row.price_moecoin,
        stock: row.stock,
        content_md: row.content_md || '',
        status: row.status,
      }
      this.productDialogVisible = true
    },
    openCreateDialog() {
      this.resetForm()
      this.productDialogVisible = true
    },
    closeProductDialog() {
      this.productDialogVisible = false
      this.resetForm()
    },
    async quickPublish(row) {
      await this.updateStatus(row, 'published', '上架')
    },
    async quickArchive(row) {
      await this.updateStatus(row, 'archived', '下架')
    },
    async updateStatus(row, status, label) {
      // 状态快捷切换：先拉详情拿全文（公开接口拿不到草稿正文时仅保留已有字段）
      const payload = {
        title: row.title,
        emoji: row.emoji,
        image_url: row.image_url,
        price_moecoin: row.price_moecoin,
        stock: row.stock,
        content_md: row.content_md || '',
        status,
      }
      try {
        await axios.put(GetApi(`/shop/admin/products/${row.id}`), payload, {
          headers: this.headers(),
        })
        this.toast.add({
          severity: 'success',
          summary: `已${label}`,
          life: 2000,
        })
        this.loadProducts()
      } catch (err) {
        const msg = err.response?.data?.error || `${label}失败`
        this.toast.add({
          severity: 'error',
          summary: `${label}失败`,
          detail: msg,
          life: 3000,
        })
      }
    },
    deleteProduct(row) {
      this.confirmService.require({
        message: `彻底删除「${row.title}」？历史订单仍会保留该商品快照。`,
        header: '删除商品',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '删除',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.delete(GetApi(`/shop/admin/products/${row.id}`), {
              headers: this.headers(),
            })
            this.toast.add({
              severity: 'success',
              summary: '已删除',
              life: 2000,
            })
            if (this.form.id === row.id) this.resetForm()
            this.loadProducts()
          } catch (err) {
            const msg = err.response?.data?.error || '删除失败'
            this.toast.add({
              severity: 'error',
              summary: '删除失败',
              detail: msg,
              life: 3000,
            })
          }
        },
      })
    },
    async shipOrder(row) {
      try {
        await axios.post(
          GetApi(`/shop/admin/orders/${row.id}/ship`),
          {},
          {
            headers: this.headers(),
          },
        )
        this.toast.add({ severity: 'success', summary: '已发货', life: 2000 })
        this.loadOrders()
      } catch (err) {
        const msg = err.response?.data?.error || '操作失败'
        this.toast.add({
          severity: 'error',
          summary: '发货失败',
          detail: msg,
          life: 3000,
        })
      }
    },
    async completeOrder(row) {
      try {
        await axios.post(
          GetApi(`/shop/admin/orders/${row.id}/complete`),
          {},
          {
            headers: this.headers(),
          },
        )
        this.toast.add({
          severity: 'success',
          summary: '订单已完成',
          life: 2000,
        })
        this.loadOrders()
      } catch (err) {
        const msg = err.response?.data?.error || '操作失败'
        this.toast.add({
          severity: 'error',
          summary: '操作失败',
          detail: msg,
          life: 3000,
        })
      }
    },
    refundOrder(row) {
      this.confirmService.require({
        message: `退款订单 ${row.order_no}（${formatCoin(row.total_price)} MoeCoin 将退回买家 UID ${row.user_uid}，库存恢复）？`,
        header: '订单退款',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '确认退款',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.post(
              GetApi(`/shop/admin/orders/${row.id}/refund`),
              {},
              {
                headers: this.headers(),
              },
            )
            this.toast.add({
              severity: 'success',
              summary: '已退款',
              life: 2000,
            })
            this.loadOrders()
          } catch (err) {
            const msg = err.response?.data?.error || '退款失败'
            this.toast.add({
              severity: 'error',
              summary: '退款失败',
              detail: msg,
              life: 3000,
            })
          }
        },
      })
    },
    async saveSettings() {
      this.savingSettings = true
      try {
        await axios.put(
          GetApi('/shop/admin/settings'),
          { revenue_uid: this.settingsForm.revenue_uid },
          { headers: this.headers() },
        )
        this.toast.add({
          severity: 'success',
          summary: '设置已保存',
          life: 2000,
        })
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
    resetForm() {
      this.productDialogVisible = false
      this.form = {
        id: null,
        title: '',
        emoji: '🛍️',
        image_url: '',
        price_moecoin: null,
        stock: 0,
        content_md: '',
        status: 'draft',
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.shopAdminPage {
  max-width: 1150px;
  width: 100%;
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

  &.warn {
    background: #fff7f5;
    border-color: #ffe3da;
  }

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

.tabBar {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e6e9f5;
  padding-bottom: 0;
}

.tabBtn {
  padding: 9px 18px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #56608a;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #2c3e77;
  }

  &.active {
    color: #2c53c9;
    border-bottom-color: #2c53c9;
    font-weight: 600;
  }
}

.editorCard,
.listCard {
  background: #fff;
  border: 1px solid #e6e9f5;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 16px;

  h2 {
    margin: 0 0 12px;
    font-size: 17px;
    color: #2c3e77;
  }
}

.editorCard {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
}

.productToolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  h2 {
    margin: 0;
  }
}

.formRow {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;

  .titleInput {
    flex: 1;
    min-width: 180px;
  }

  .emojiInput {
    width: 110px;
    text-align: center;
  }

  .priceInput,
  .stockInput {
    width: 140px;
  }
}

.w-full {
  width: 100%;
  box-sizing: border-box;
}

.editorPane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.editorCol .paneLabel {
  font-size: 12px;
  color: #8892b8;
  margin-bottom: 6px;
}

.mdInput {
  width: 100%;
  min-height: 300px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.mdPreview {
  min-height: 300px;
  border: 1px solid #eef1fa;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  overflow: auto;
  background: #fbfcff;
  color: #333;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: #2c3e77;
    margin: 12px 0 8px;
  }

  :deep(code) {
    background: #f2f4fd;
    padding: 1px 4px;
    border-radius: 3px;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
  }

  :deep(.ph) {
    color: #b0b7d6;
  }
}

.prodEmoji {
  margin-right: 6px;
}

.prodTitle {
  color: #2c3e77;
}

.viewLink {
  margin-left: 8px;
  color: #9aa2c5;
  text-decoration: none;

  &:hover {
    color: #4a6fe3;
  }
}

.outOfStock {
  color: #d64c4c;
}

.orderToolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  h2 {
    margin: 0;
  }
}

.orderNo {
  font-family: monospace;
  font-size: 12px;
  color: #8892b8;
}

.settingsCard {
  max-width: 560px;
}

.settingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;

  label {
    font-size: 13.5px;
    color: #45507a;
  }
}

.settingHint {
  font-size: 12.5px;
  color: #9aa2c5;
  margin: 0 0 14px;
}

@media (max-width: 900px) {
  .editorPane {
    grid-template-columns: 1fr;
  }
}
</style>
