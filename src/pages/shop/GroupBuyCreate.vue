<template>
  <div class="createPage">
    <router-link class="backLink" to="/shop">← 返回商城</router-link>
    <form class="createCard" @submit.prevent="create">
      <h1>发起拼团</h1>
      <p class="intro">提交后由管理员审核。预付款将暂存；审核通过后开放参团。</p>
      <label>商品名称</label>
      <InputText v-model="form.title" maxlength="200" required placeholder="例如：桌面手办一套" />
      <div class="twoCols">
        <div><label>封面 Emoji</label><InputText v-model="form.emoji" maxlength="16" /></div>
        <div><label>图片链接（可选）</label><InputText v-model="form.image_url" maxlength="1000" placeholder="https://..." /></div>
      </div>
      <label>商品介绍</label>
      <Textarea v-model="form.description" maxlength="10000" rows="5" autoResize placeholder="商品详情、购买说明等" />
      <div class="twoCols">
        <div><label>拼团总价（MoeCoin）</label><InputNumber v-model="form.total_price" :min="1" :max="1000000" :useGrouping="false" required /></div>
        <div><label>目标人数（包含发起者）</label><InputNumber v-model="form.target_count" :min="2" :max="1000" :useGrouping="false" required /></div>
      </div>
      <div class="twoCols">
        <div><label>截止后单独购买价（MoeCoin）</label><InputNumber v-model="form.late_price" :min="0" :max="1000000" :useGrouping="false" required /></div>
        <div><label>拼团截止时间</label><input v-model="form.expires_at" type="datetime-local" required></div>
      </div>
      <div class="holdNotice" v-if="form.total_price && form.target_count">
        创建时需预付 <b>{{ formatCoin(contribution) }} MoeCoin</b>（总价 ÷ 目标人数向上取整）。
        成团后按最终人数分摊并退回多付部分；失败则全额退款。
      </div>
      <div v-if="!logined" class="loginNotice">需要登录后才能发起拼团。</div>
      <Button type="submit" label="提交审核并预付" icon="pi pi-users" :loading="saving" :disabled="!logined" />
    </form>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'

export default {
  name: 'GroupBuyCreate',
  components: { Button, InputNumber, InputText, Textarea },
  setup() {
    return { toast: useToast() }
  },
  data() {
    const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return {
      logined: !!GetToken(),
      saving: false,
      form: {
        title: '',
        emoji: '🎁',
        image_url: '',
        description: '',
        total_price: null,
        target_count: 3,
        late_price: 0,
        expires_at: date.toISOString().slice(0, 16),
      },
    }
  },
  computed: {
    contribution() {
      if (!this.form.total_price || !this.form.target_count) return 0
      return Math.ceil(
        Number(this.form.total_price) / Number(this.form.target_count),
      )
    },
  },
  methods: {
    formatCoin,
    async create() {
      if (this.saving || !this.logined) return
      this.saving = true
      try {
        const res = await axios.post(
          GetApi('/shop/groups'),
          {
            ...this.form,
            expires_at: new Date(this.form.expires_at).toISOString(),
          },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )
        this.toast.add({
          severity: 'success',
          summary: '已提交审核',
          detail: '预付款已暂存，审核通过后将开放参团。',
          life: 3500,
        })
        this.$router.replace(`/shop/groups/${res.data.id}`)
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '发起失败',
          detail: err.response?.data?.error || '请稍后重试',
          life: 3500,
        })
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.createPage { max-width: 720px; margin: 0 auto; padding: 32px 20px 60px; }
.backLink { display: inline-block; margin-bottom: 14px; color: #4a6fe3; text-decoration: none; }
.createCard { display: flex; flex-direction: column; gap: 10px; padding: 24px; border: 1px solid #e6e9f5; border-radius: 14px; background: #fff; box-shadow: 0 3px 14px #1e285a12; }
h1 { margin: 0; color: #2c3e77; font-size: 26px; }
.intro { margin: -4px 0 8px; color: #8892b8; font-size: 13px; }
label { display: block; margin: 5px 0 2px; color: #45507a; font-size: 13px; font-weight: 600; }
.twoCols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.twoCols > div { min-width: 0; }
.twoCols :deep(.p-inputnumber), .twoCols :deep(.p-inputtext), .createCard > :deep(.p-inputtext), .createCard > :deep(.p-textarea) { width: 100%; box-sizing: border-box; }
.twoCols input[type="datetime-local"] { width: 100%; padding: 9px 10px; border: 1px solid #cbd2e3; border-radius: 6px; color: #45507a; font: inherit; }
.holdNotice { padding: 12px 14px; border-radius: 8px; background: #f3f6ff; color: #667196; font-size: 13px; line-height: 1.6; }
.holdNotice b { color: #2c53c9; }
.loginNotice { color: #b45309; font-size: 13px; }
@media (max-width: 620px) { .twoCols { grid-template-columns: 1fr; } .createCard { padding: 18px; } }
</style>
