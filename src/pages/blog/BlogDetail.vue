<template>
  <div class="blogDetailPage">
    <div v-if="post" class="article">
      <h1 class="title">{{ post.title }}</h1>
      <div class="metaRow">
        <div class="meta">{{ formatDate(post.published_at) }}</div>
        <div class="metaRight">
          <span v-if="tips" class="tipsSummary" :title="`已有 ${tips.count} 次打赏`">
            <i class="pi pi-heart-fill"></i>{{ formatCoin(tips.total) }} MoeCoin
          </span>
          <Button v-if="canTip" label="打赏" icon="pi pi-heart" size="small" outlined
            severity="warn" @click="tipOn = true" />
        </div>
      </div>
      <div class="content" v-html="html"></div>

      <!-- 打赏弹窗 -->
      <Dialog v-model:visible="tipOn" header="打赏作者 🪙" modal :style="{ width: '360px' }">
        <div class="tipBody">
          <div class="tipHint">用 MoeCoin 支持作者：{{ post.title }}</div>
          <InputNumber v-model="tipForm.amount" :min="tipMin" :max="1000000" :useGrouping="false"
            placeholder="打赏数量" class="tipAmount" />
          <InputText v-model="tipForm.message" maxlength="200" placeholder="留句话（可选）" class="tipMsg" />
          <div class="tipBalance" v-if="walletBalance !== null">
            我的余额：<b>{{ formatCoin(walletBalance) }}</b> MoeCoin
          </div>
        </div>
        <template #footer>
          <Button label="取消" severity="secondary" text @click="tipOn = false" />
          <Button label="确认打赏" icon="pi pi-heart" :loading="tipping"
            :disabled="!tipForm.amount || tipForm.amount < tipMin" @click="doTip" />
        </template>
      </Dialog>
    </div>
    <div v-else-if="!loading" class="emptyBox">
      <p>文章不存在或尚未发布。</p>
      <router-link to="/blog">← 返回博客列表</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { marked } from 'marked'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { userInstance as User } from '@/types/User'
import { GetApi, GetToken } from '@/utils'

export default {
  name: 'BlogDetail',
  components: { Button, Dialog, InputText, InputNumber },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      post: null,
      loading: true,
      html: '',
      tips: null,
      tipOn: false,
      tipping: false,
      tipMin: 1,
      walletBalance: null,
      tipForm: {
        amount: null,
        message: '',
      },
    }
  },
  computed: {
    canTip() {
      if (!this.post?.author_uid) return false
      if (!GetToken()) return false
      const myUid = User.logined ? Number(User.info.uid) : null
      return myUid !== null && Number(this.post.author_uid) !== myUid
    },
  },
  mounted() {
    this.load()
    this.loadTips()
    if (GetToken()) this.loadWallet()
  },
  methods: {
    formatCoin,
    async load() {
      try {
        const res = await axios.get(GetApi(`/blog/${this.$route.params.id}`))
        this.post = res.data.post
        // Markdown 渲染（内容由站长 admin 编辑器产出）
        this.html = this.post ? marked.parse(this.post.content_md || '') : ''
      } catch (err) {
        console.error('文章加载失败', err)
      }
      this.loading = false
    },
    async loadTips() {
      try {
        const res = await axios.get(
          GetApi(`/mocoin/tips/${this.$route.params.id}`),
        )
        this.tips = res.data
      } catch (_err) {
        /* 打赏汇总加载失败不影响正文 */
      }
    },
    async loadWallet() {
      try {
        const res = await axios.get(GetApi('/mocoin/wallet'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
        })
        this.walletBalance = res.data.balance
        if (res.data.settings?.tip_min) this.tipMin = res.data.settings.tip_min
      } catch (_err) {
        /* 未登录等情况静默 */
      }
    },
    async doTip() {
      if (this.tipping || !this.tipForm.amount) return
      this.tipping = true
      try {
        const res = await axios.post(
          GetApi('/mocoin/tip'),
          {
            post_id: this.post.id,
            amount: this.tipForm.amount,
            message: this.tipForm.message || undefined,
          },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )
        this.toast.add({
          severity: 'success',
          summary: `打赏成功 +${this.tipForm.amount} MoeCoin`,
          detail: '感谢对作者的支持！',
          life: 3000,
        })
        this.tips = res.data.tips || this.tips
        this.walletBalance = res.data.balance
        this.tipOn = false
        this.tipForm = { amount: null, message: '' }
      } catch (err) {
        const msg = err.response?.data?.error || '打赏失败'
        this.toast.add({
          severity: 'error',
          summary: '打赏失败',
          detail: msg,
          life: 3000,
        })
      }
      this.tipping = false
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('zh-CN')
    },
  },
}
</script>

<style lang="scss" scoped>
.blogDetailPage {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

.article {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 32px 36px;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.10);
}

.title {
  margin: 0;
  font-size: 28px;
  color: #2c3e77;
}

.metaRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #9aa2c5;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf0fa;

  .metaRight {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tipsSummary {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    color: #d97a2b;
    background: #fff4e8;
    padding: 4px 10px;
    border-radius: 14px;

    i { font-size: 11px; }
  }
}

.tipBody {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .tipHint {
    font-size: 12.5px;
    color: #8892b8;
  }

  .tipBalance {
    font-size: 12.5px;
    color: #9aa2c5;

    b { color: #2c53c9; }
  }
}

.content {
  color: #333;
  line-height: 1.85;
  font-size: 14.5px;

  // 简易 markdown 排版
  :deep(h1), :deep(h2), :deep(h3) {
    color: #2c3e77;
    margin: 22px 0 10px;
  }

  :deep(code) {
    background: #f2f4fd;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 13px;
  }

  :deep(pre) {
    background: #2b3147;
    color: #dce4ff;
    padding: 14px 16px;
    border-radius: 8px;
    overflow: auto;

    code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
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
  }

  :deep(a) {
    color: #4a6fe3;
  }
}

.emptyBox {
  text-align: center;
  color: #8892b8;
  padding: 60px 0;

  a { color: #4a6fe3; }
}
</style>
