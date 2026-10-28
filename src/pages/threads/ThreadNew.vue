<template>
  <div class="threadNewPage">
    <router-link class="backLink" to="/threads">← 返回讨论区</router-link>

    <div v-if="!logined" class="loginPrompt">
      <i class="pi pi-lock"></i>
      <h1>请先登录</h1>
      <p>登录后即可发布新主题</p>
      <router-link to="/threads">回到讨论区</router-link>
    </div>

    <template v-else>
      <h1 class="pageTitle">发布新主题</h1>

      <div class="formCard">
        <div class="formRow">
          <Select v-model="form.category" :options="categories" optionLabel="label" optionValue="value"
            class="catSelect" placeholder="选择分类" />
          <InputText v-model="form.title" class="titleInput" maxlength="120"
            placeholder="标题（120 字以内）" />
        </div>

        <div class="bountyRow">
          <span class="bountyLabel"><i class="pi pi-gift"></i> 悬赏（可选）</span>
          <InputNumber v-model="form.bounty" :min="0" :max="1000000" :useGrouping="false"
            placeholder="0 = 不设悬赏" class="bountyInput" />
          <span class="bountyHint">悬赏 MoeCoin 会在发布时托管，采纳最佳回复后发放；删帖未采纳自动退回</span>
        </div>

        <div class="editorPane">
          <div class="editorCol">
            <div class="paneLabel">正文（支持 Markdown）</div>
            <Textarea v-model="form.content" class="mdInput"
              placeholder="# 标题&#10;&#10;支持 **粗体**、列表、代码块等 Markdown 语法" />
          </div>
          <div class="editorCol">
            <div class="paneLabel">预览</div>
            <div class="mdPreview" v-html="previewHtml"></div>
          </div>
        </div>

        <div class="formFooter">
          <span class="hint">发布后作者本人或管理员可删除（软删除，前台隐藏）</span>
          <div class="actions">
            <Button label="取消" severity="secondary" text @click="$router.push('/threads')" />
            <Button label="发布" icon="pi pi-send" :loading="submitting"
              :disabled="!canSubmit" @click="submit" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { GetApi, GetToken } from '@/utils'
import { THREAD_CATEGORIES } from './shared'

export default {
  name: 'ThreadNew',
  components: { InputText, Textarea, Select, Button },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      logined: !!GetToken(),
      submitting: false,
      categories: THREAD_CATEGORIES.map((c) => ({
        label: c.label,
        value: c.value,
      })),
      form: {
        category: 'general',
        title: '',
        content: '',
        bounty: null,
      },
    }
  },
  computed: {
    canSubmit() {
      return (
        this.form.title.trim().length > 0 && this.form.content.trim().length > 0
      )
    },
    previewHtml() {
      if (!this.form.content.trim()) return '<p class="ph">输入正文即时预览</p>'
      return DOMPurify.sanitize(marked.parse(this.form.content))
    },
  },
  methods: {
    async submit() {
      if (!this.canSubmit || this.submitting) return
      this.submitting = true
      try {
        const res = await axios.post(
          GetApi('/thread'),
          {
            category: this.form.category,
            title: this.form.title.trim(),
            content: this.form.content,
            bounty: this.form.bounty || 0,
          },
          { headers: { Authorization: `Bearer ${GetToken()}` } },
        )

        this.toast.add({ severity: 'success', summary: '发布成功', life: 2000 })
        this.$router.push(`/threads/${res.data.thread.id}`)
      } catch (err) {
        const msg = err.response?.data?.error || '发布失败'
        this.toast.add({
          severity: 'error',
          summary: '发布失败',
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
.threadNewPage {
  max-width: 960px;
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

.pageTitle {
  margin: 0 0 16px;
  font-size: 26px;
  color: #2c3e77;
}

.formCard {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 20px 22px;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.1);
}

.formRow {
  display: flex;
  gap: 10px;

  .catSelect {
    width: 130px;
    flex-shrink: 0;
  }

  .titleInput {
    flex: 1;
  }
}

.bountyRow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px dashed #d9e1f7;
  border-radius: 8px;
  background: #fbfcff;
  flex-wrap: wrap;

  .bountyLabel {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: #2c3e77;
    font-weight: 600;
    flex-shrink: 0;

    i {
      color: #d97a2b;
      font-size: 13px;
    }
  }

  .bountyInput {
    width: 150px;
  }

  .bountyHint {
    font-size: 11.5px;
    color: #9aa2c5;
    flex: 1;
    min-width: 200px;
  }
}

.editorPane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}

.paneLabel {
  font-size: 12px;
  color: #8892b8;
  margin-bottom: 6px;
}

.mdInput {
  width: 100%;
  min-height: 340px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.mdPreview {
  min-height: 340px;
  border: 1px solid #eef1fa;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13.5px;
  line-height: 1.75;
  overflow: auto;
  background: #fbfcff;
  color: #333;

  :deep(h1), :deep(h2), :deep(h3) { color: #2c3e77; margin: 12px 0 8px; }
  :deep(code) { background: #f2f4fd; padding: 1px 4px; border-radius: 3px; }
  :deep(pre) { background: #2b3147; color: #dce4ff; padding: 10px; border-radius: 6px; overflow: auto; }
  :deep(pre code) { background: transparent; color: inherit; }
  :deep(blockquote) { border-left: 3px solid #b9c4ef; margin: 8px 0; padding: 4px 10px; background: #f6f8ff; }
  :deep(img) { max-width: 100%; }
  :deep(.ph) { color: #b0b7d6; }
}

.formFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;

  .hint {
    font-size: 12px;
    color: #9aa2c5;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
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

  p { margin: 0 0 16px; }

  a {
    color: #4a6fe3;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}

@media (max-width: 860px) {
  .editorPane { grid-template-columns: 1fr; }
}
</style>
