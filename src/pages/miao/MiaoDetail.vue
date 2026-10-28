<template>
  <div class="blogDetailPage">
    <div v-if="post" class="article">
      <h1 class="title">{{ post.title }}</h1>
      <div class="metaRow">
        <div class="meta">{{ catLabel }} · {{ formatDate(post.published_at) }}</div>
      </div>
      <div class="content" v-html="html"></div>
    </div>
    <div v-else-if="!loading" class="emptyBox">
      <p>文章不存在或尚未发布。</p>
      <router-link to="/miao">← 返回小屋</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { marked } from 'marked'
import { GetApi } from '@/utils'

export default {
  name: 'MiaoDetail',
  data() {
    return { post: null, loading: true, html: '' }
  },
  computed: {
    catLabel() {
      return this.post?.category === 'works' ? '作品' : '消息'
    },
  },
  async mounted() {
    try {
      const res = await axios.get(GetApi(`/miao/${this.$route.params.id}`))
      this.post = res.data.post
      this.html = this.post ? marked.parse(this.post.content_md || '') : ''
    } catch (err) {
      console.error('文章加载失败', err)
    }
    this.loading = false
  },
  methods: {
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('zh-CN') : ''
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
