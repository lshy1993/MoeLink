<template>
  <div class="threadDetailPage">
    <router-link class="backLink" to="/threads">← 返回讨论区</router-link>

    <template v-if="thread">
      <article class="threadCard">
        <div class="threadHead">
          <div class="headTop">
            <div class="headTags">
              <Tag :value="categoryMeta(thread.category).label" :severity="categoryMeta(thread.category).severity" />
              <span v-if="thread.bounty > 0" class="bountyBadge" :class="{ awarded: thread.bounty_awarded_to }">
                <i class="pi pi-gift"></i>
                {{ thread.bounty_awarded_to ? `悬赏已采纳 +${thread.bounty}` : `悬赏 ${thread.bounty} MoeCoin` }}
              </span>
            </div>
            <div class="headActions">
              <template v-if="canModerate">
                <Button :label="thread.is_pinned ? '取消置顶' : '置顶'" icon="pi pi-bookmark" severity="secondary"
                  text size="small" @click="toggleFlag('pin')" />
                <Button :label="thread.is_locked ? '解除锁定' : '锁定'" :icon="thread.is_locked ? 'pi pi-lock-open' : 'pi pi-lock'"
                  severity="secondary" text size="small" @click="toggleFlag('lock')" />
              </template>
              <Button v-if="canDelete(thread)" label="删除帖子" icon="pi pi-trash" severity="danger"
                text size="small" @click="removeThread" />
            </div>
          </div>
          <h1 class="title">
            {{ thread.title }}
            <i v-if="thread.is_locked" class="pi pi-lock lockedIcon" title="已锁定"></i>
          </h1>
          <div class="meta">
            <span><i class="pi pi-user"></i>{{ thread.author_name }}</span>
            <span><i class="pi pi-clock"></i>{{ formatTime(thread.created_at) }}</span>
            <span><i class="pi pi-comments"></i>{{ thread.reply_count }} 条回复</span>
          </div>
        </div>
        <div class="markdownBody" v-html="threadHtml"></div>
      </article>

      <section class="replySection">
        <h2 class="sectionTitle">回复（{{ replies.length }}）</h2>

        <div v-if="replies.length" class="replyList">
          <div v-for="(r, i) in replies" :key="r.id" class="replyItem" :class="{ bountyWinner: isWinner(r) }">
            <div class="replyMeta">
              <span class="floor">#{{ i + 1 }}</span>
              <b class="replyAuthor">{{ r.author_name }}</b>
              <span class="replyTime">{{ formatTime(r.created_at) }}</span>
              <span v-if="isWinner(r)" class="winnerBadge"><i class="pi pi-verified"></i>悬赏采纳</span>
              <span v-if="replyTips[r.id]" class="replyTips" :title="`${replyTips[r.id].count} 次打赏`">
                <i class="pi pi-heart-fill"></i>{{ replyTips[r.id].total }}
              </span>
              <span class="metaActions">
                <Button v-if="canTipReply(r)" label="打赏" icon="pi pi-heart" severity="warn"
                  text size="small" @click="openReplyTip(r)" />
                <Button v-if="canAward(r)" label="采纳悬赏" icon="pi pi-gift" severity="success"
                  text size="small" @click="awardBounty(r)" />
                <Button v-if="canDelete(r)" label="删除" icon="pi pi-trash" severity="danger" text
                  size="small" @click="removeReply(r)" />
              </span>
            </div>
            <div class="markdownBody replyBody" v-html="render(r.content_md)"></div>
          </div>
        </div>
        <div v-else class="replyEmpty">还没有回复，来抢沙发吧</div>

        <!-- 回复打赏弹窗 -->
        <Dialog v-model:visible="tipOn" header="打赏回复 🪙" modal :style="{ width: '360px' }">
          <div class="tipBody">
            <div class="tipHint">用 MoeCoin 感谢 <b>{{ tipTarget && tipTarget.author_name }}</b> 的回复</div>
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
              :disabled="!tipForm.amount || tipForm.amount < tipMin" @click="doReplyTip" />
          </template>
        </Dialog>

        <div v-if="logined" class="replyComposer">
          <div class="replyEditorTabs">
            <Button label="编辑" size="small" text :severity="replyPreview ? 'secondary' : 'primary'"
              :outlined="!replyPreview" @click="replyPreview = false" />
            <Button label="预览" size="small" text :severity="replyPreview ? 'primary' : 'secondary'"
              :outlined="replyPreview" @click="replyPreview = true" />
          </div>
          <Textarea v-if="!replyPreview" v-model="replyContent" class="replyInput" rows="4" autoResize
            placeholder="写下你的回复（支持 Markdown）" />
          <div v-else class="replyMarkdownPreview markdownBody">
            <div v-if="replyContent.trim()" v-html="render(replyContent)"></div>
            <span v-else class="previewPlaceholder">输入回复内容后可在此预览 Markdown 效果</span>
          </div>
          <div class="composerActions">
            <span class="hint">Enter 换行，点击按钮发送</span>
            <Button label="发表回复" icon="pi pi-send" :loading="submitting"
              :disabled="!replyContent.trim()" @click="submitReply" />
          </div>
        </div>
        <div v-else class="loginHint">
          <i class="pi pi-lock"></i> 登录后即可回复
        </div>
      </section>
    </template>

    <div v-else-if="!loading" class="notFound">
      <i class="pi pi-exclamation-circle"></i>
      <p>帖子不存在或已被删除</p>
      <router-link to="/threads">返回讨论区</router-link>
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
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken } from '@/utils'
import { categoryMeta, formatTime, loadThreadCategories } from './shared'

export default {
  name: 'ThreadDetail',
  components: { Tag, Button, Textarea, Dialog, InputText, InputNumber },
  setup() {
    return {
      toast: useToast(),
      confirmService: useConfirm(),
    }
  },
  data() {
    return {
      thread: null,
      replies: [],
      replyTips: {},
      loading: true,
      logined: !!GetToken(),
      myUid: null,
      myGroup: 0,
      modAdmin: false,
      modCategories: [],
      replyContent: '',
      replyPreview: false,
      submitting: false,
      // 回复打赏
      tipOn: false,
      tipping: false,
      tipTarget: null,
      tipMin: 1,
      walletBalance: null,
      tipForm: { amount: null, message: '' },
    }
  },
  computed: {
    canModerate() {
      if (!this.logined || !this.thread) return false
      return this.modAdmin || this.modCategories.includes(this.thread.category)
    },
    threadHtml() {
      return this.thread ? this.render(this.thread.content_md) : ''
    },
  },
  mounted() {
    loadThreadCategories()
    this.loadMe()
    this.loadModeration()
    this.load()
    if (this.logined) this.loadWallet()
  },
  methods: {
    categoryMeta,
    formatTime,
    formatCoin,
    render(md) {
      return DOMPurify.sanitize(marked.parse(md || ''))
    },
    async loadMe() {
      if (!this.logined) return
      try {
        const res = await axios.post(
          GetApi('/user/session'),
          {},
          {
            headers: { Authorization: `Bearer ${GetToken()}` },
          },
        )
        const u = res.data.userInfo || {}
        this.myUid = Number(u.uid)
        this.myGroup = Number(u.group) || 0
      } catch (_err) {
        // 会话失效按未登录处理
        this.logined = false
      }
    },
    async loadWallet() {
      try {
        const res = await axios.get(GetApi('/moecoin/wallet'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
        })
        this.walletBalance = res.data.balance
        if (res.data.settings?.tip_min) this.tipMin = res.data.settings.tip_min
      } catch (_err) {
        /* 静默 */
      }
    },
    async load() {
      this.loading = true
      try {
        const res = await axios.get(GetApi(`/thread/${this.$route.params.id}`))
        this.thread = res.data.thread
        this.replies = res.data.replies || []
        this.replyTips = res.data.reply_tips || {}
      } catch (_err) {
        this.thread = null
      }
      this.loading = false
    },
    isWinner(reply) {
      return (
        this.thread &&
        this.thread.bounty_awarded_reply != null &&
        Number(this.thread.bounty_awarded_reply) === Number(reply.id)
      )
    },
    canAward(reply) {
      return (
        this.logined &&
        this.thread &&
        this.thread.bounty > 0 &&
        this.thread.bounty_awarded_to == null &&
        this.myUid !== null &&
        Number(this.thread.author_uid) === this.myUid &&
        Number(reply.author_uid) !== this.myUid
      )
    },
    canTipReply(reply) {
      return (
        this.logined &&
        this.myUid !== null &&
        Number(reply.author_uid) !== this.myUid
      )
    },
    openReplyTip(reply) {
      this.tipTarget = reply
      this.tipForm = { amount: null, message: '' }
      this.tipOn = true
    },
    awardBounty(reply) {
      this.confirmService.require({
        message: `确认把 ${this.thread.bounty} MoeCoin 悬赏采纳给「${reply.author_name}」的回复？采纳后不可撤销`,
        header: '采纳悬赏',
        icon: 'pi pi-gift',
        acceptLabel: '采纳',
        rejectLabel: '取消',
        accept: async () => {
          try {
            const res = await axios.post(
              GetApi(`/thread/${this.thread.id}/award`),
              { reply_id: reply.id },
              { headers: { Authorization: `Bearer ${GetToken()}` } },
            )
            this.toast.add({
              severity: 'success',
              summary: `悬赏已发放 +${res.data.amount} MoeCoin`,
              detail: `已采纳「${reply.author_name}」的回复`,
              life: 3000,
            })
            this.load()
          } catch (err) {
            const msg = err.response?.data?.error || '采纳失败'
            this.toast.add({
              severity: 'error',
              summary: '采纳失败',
              detail: msg,
              life: 3000,
            })
          }
        },
      })
    },
    async doReplyTip() {
      if (this.tipping || !this.tipForm.amount || !this.tipTarget) return
      this.tipping = true
      try {
        const res = await axios.post(
          GetApi(`/thread/reply/${this.tipTarget.id}/tip`),
          {
            amount: this.tipForm.amount,
            message: this.tipForm.message || undefined,
          },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )
        this.toast.add({
          severity: 'success',
          summary: `打赏成功 +${this.tipForm.amount} MoeCoin`,
          detail: '感谢对回复作者的支持！',
          life: 3000,
        })
        this.replyTips = {
          ...this.replyTips,
          [this.tipTarget.id]: res.data.tips,
        }
        this.walletBalance = res.data.balance
        this.tipOn = false
        this.tipTarget = null
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
    /**
     * 作者本人或管理员可删除（软删除，前台隐藏）
     */
    canDelete(item) {
      if (!this.logined) return false
      if (this.canModerate) return true
      return this.myUid !== null && Number(item.author_uid) === this.myUid
    },
    async loadModeration() {
      if (!this.logined) return
      try {
        const res = await axios.get(GetApi('/thread/me/moderation'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
        })
        this.modAdmin = !!res.data.admin
        this.modCategories = res.data.categories || []
      } catch (_err) {
        /* 静默：按普通用户处理 */
      }
    },
    async toggleFlag(flag) {
      const key = flag === 'pin' ? 'is_pinned' : 'is_locked'
      try {
        const res = await axios.post(
          GetApi(`/thread/${this.thread.id}/${flag}`),
          { value: !this.thread[key] },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )
        this.thread.is_pinned = res.data.is_pinned
        this.thread.is_locked = res.data.is_locked
        this.toast.add({ severity: 'success', summary: '已更新', life: 1500 })
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: '操作失败',
          detail: err.response?.data?.error || '请稍后重试',
          life: 3000,
        })
      }
    },
    removeThread() {
      this.confirmService.require({
        message: '删除后该帖将从讨论区隐藏（软删除，不会物理清除）',
        header: '删除帖子',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '删除',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.delete(GetApi(`/thread/${this.thread.id}`), {
              headers: { Authorization: `Bearer ${GetToken()}` },
            })
            this.toast.add({
              severity: 'success',
              summary: '帖子已删除',
              life: 2000,
            })
            this.$router.push('/threads')
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
    removeReply(reply) {
      this.confirmService.require({
        message: '确认删除这条回复？（软删除，前台隐藏）',
        header: '删除回复',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '删除',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.delete(GetApi(`/thread/reply/${reply.id}`), {
              headers: { Authorization: `Bearer ${GetToken()}` },
            })
            this.toast.add({
              severity: 'success',
              summary: '回复已删除',
              life: 2000,
            })
            await this.load()
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
    async submitReply() {
      if (!this.replyContent.trim() || this.submitting) return
      this.submitting = true
      try {
        await axios.post(
          GetApi(`/thread/${this.thread.id}/reply`),
          {
            content: this.replyContent,
          },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )
        this.replyContent = ''
        this.toast.add({ severity: 'success', summary: '回复成功', life: 2000 })
        await this.load()
      } catch (err) {
        const msg = err.response?.data?.error || '回复失败'
        this.toast.add({
          severity: 'error',
          summary: '回复失败',
          detail: msg,
          life: 3000,
        })
      }
      this.submitting = false
    },
  },
}
</script>

<style lang="scss" scoped>
.threadDetailPage {
  max-width: 820px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

.backLink {
  display: inline-block;
  margin-bottom: 14px;
  color: #4a6fe3;
  font-size: 13px;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.threadCard {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 24px 28px;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.1);
}

.threadHead {
  border-bottom: 1px solid #edf0fa;
  padding-bottom: 14px;
  margin-bottom: 18px;
}

.headTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.headActions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.lockedIcon {
  margin-left: 6px;
  font-size: 16px;
  color: #9aa2c5;
}

.headTags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bountyBadge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  background: #fff4e8;
  color: #d97a2b;
  border: 1px solid #ffe3c2;

  i { font-size: 12px; }

  &.awarded {
    background: #e8f8ef;
    color: #1e9e63;
    border-color: #c4ecd5;
  }
}

.title {
  margin: 0 0 10px;
  font-size: 24px;
  color: #2c3e77;
  line-height: 1.4;
}

.meta {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #9aa2c5;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  i { font-size: 11px; }
}

.markdownBody {
  color: #333;
  line-height: 1.85;
  font-size: 14.5px;
  overflow-wrap: anywhere;

  :deep(h1), :deep(h2), :deep(h3) { color: #2c3e77; margin: 20px 0 10px; }
  :deep(code) { background: #f2f4fd; padding: 2px 5px; border-radius: 4px; font-size: 13px; }
  :deep(pre) {
    background: #2b3147;
    color: #dce4ff;
    padding: 14px 16px;
    border-radius: 8px;
    overflow: auto;

    code { background: transparent; color: inherit; padding: 0; }
  }
  :deep(blockquote) {
    margin: 12px 0;
    padding: 6px 14px;
    border-left: 3px solid #b9c4ef;
    background: #f6f8ff;
    color: #556;
  }
  :deep(img) { max-width: 100%; }
  :deep(a) { color: #4a6fe3; }
}

.replySection {
  margin-top: 22px;
}

.sectionTitle {
  margin: 0 0 12px;
  font-size: 17px;
  color: #2c3e77;
}

.replyList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.replyItem {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 2px 8px rgba(30, 40, 90, 0.06);

  &.bountyWinner {
    border: 1px solid #ffd9b3;
    background: #fffdf7;
  }
}

.replyMeta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12.5px;
  color: #9aa2c5;

  .floor {
    color: #b0b7d6;
    font-family: monospace;
  }

  .replyAuthor {
    color: #45507a;
  }

  .winnerBadge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 9px;
    border-radius: 12px;
    background: #e8f8ef;
    color: #1e9e63;
    font-size: 11.5px;
    font-weight: 700;

    i { font-size: 11px; }
  }

  .replyTips {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #d97a2b;
    font-weight: 700;
    font-size: 12px;

    i { font-size: 11px; }
  }

  .metaActions {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
}

.tipBody {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .tipHint {
    font-size: 12.5px;
    color: #8892b8;

    b { color: #2c3e77; }
  }

  .tipBalance {
    font-size: 12.5px;
    color: #9aa2c5;

    b { color: #2c53c9; }
  }
}

.replyBody {
  font-size: 14px;
  line-height: 1.75;
}

.replyEmpty {
  text-align: center;
  color: #9aa2c5;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 28px 0;
  font-size: 13.5px;
}

.replyComposer {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(30, 40, 90, 0.06);
}

.replyInput {
  width: 100%;
}

.replyEditorTabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e6e9f5;
}

.replyMarkdownPreview {
  min-height: 100px;
  padding: 10px 12px;
  border: 1px solid #dfe4f2;
  border-radius: 6px;
  background: #fbfcff;
}

.previewPlaceholder {
  color: #9aa2c5;
  font-size: 13px;
}

.composerActions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;

  .hint {
    font-size: 12px;
    color: #b0b7d6;
  }
}

.loginHint {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: #8892b8;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 18px 0;
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

    &:hover { text-decoration: underline; }
  }
}
</style>
