<template>
  <div class="blogAdminPage">
    <!-- 编辑器 -->
    <div class="editorCard">
      <h2>{{ form.id ? '编辑文章 #' + form.id : '新建文章' }}</h2>
      <div class="formRow">
        <el-input v-model="form.title" placeholder="标题" maxlength="200" />
        <el-select v-model="form.status" style="width: 120px">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
        </el-select>
        <el-button type="primary" :disabled="!form.title || !form.content" @click="save">
          保存
        </el-button>
        <el-button v-if="form.id" @click="resetForm">新建</el-button>
      </div>
      <el-input v-model="form.summary" placeholder="摘要（留空自动截取正文）" maxlength="500"
        style="margin-top: 10px" />
      <div class="editorPane">
        <div class="editorCol">
          <div class="paneLabel">Markdown 正文</div>
          <textarea v-model="form.content" class="mdInput" placeholder="# 标题&#10;支持 Markdown 语法"></textarea>
        </div>
        <div class="editorCol">
          <div class="paneLabel">预览</div>
          <div class="mdPreview" v-html="previewHtml"></div>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="listCard">
      <h2>全部文章</h2>
      <el-table :data="posts" v-loading="loading" stripe size="small" style="width: 100%">
        <el-table-column prop="id" label="ID" width="56" />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            {{ row.title }}
            <el-tag v-if="row.status === 'published'" type="success" size="small" style="margin-left:4px">已发布</el-tag>
            <el-tag v-else type="info" size="small" style="margin-left:4px">草稿</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author_uid" label="作者" width="70">
          <template #default="{ row }">{{ row.author_uid || '—' }}</template>
        </el-table-column>
        <el-table-column label="更新时间" width="100">
          <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="editPost(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="deletePost(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';
import { GetApi, GetToken } from '@/utils';

export default {
  name: 'AdminBlog',
  props: ['user'],
  data() {
    return {
      posts: [],
      loading: false,
      form: {
        id: null,
        title: '',
        summary: '',
        content: '',
        status: 'draft'
      }
    }
  },
  computed: {
    previewHtml() {
      if (!this.form.content) return '<p class="ph">输入 Markdown 即时预览</p>';
      return marked.parse(this.form.content);
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    headers() {
      return { Authorization: `Bearer ${GetToken()}` };
    },
    async load() {
      this.loading = true;
      try {
        const res = await axios.get(GetApi('/blog/all'), { headers: this.headers() });
        this.posts = res.data.posts || [];
      } catch (err) {
        this.$message && this.$message.error('文章列表加载失败');
      }
      this.loading = false;
    },
    async save() {
      const payload = {
        title: this.form.title,
        summary: this.form.summary || undefined,
        content: this.form.content,
        status: this.form.status
      };
      try {
        if (this.form.id) {
          await axios.put(GetApi(`/blog/${this.form.id}`), payload, { headers: this.headers() });
          this.$message.success('已保存');
        } else {
          await axios.post(GetApi('/blog'), payload, { headers: this.headers() });
          this.$message.success('已创建');
        }
        this.resetForm();
        this.load();
      } catch (err) {
        this.$message.error(err.response?.data?.error || '保存失败');
      }
    },
    editPost(row) {
      this.form.id = row.id;
      this.form.title = row.title;
      this.form.summary = row.summary || '';
      this.form.status = row.status;
      // 正文再从详情接口取
      axios.get(GetApi(`/blog/post/${row.id}`), { headers: this.headers() })
        .then((res) => {
          this.form.content = (res.data.post && res.data.post.content_md) || '';
        })
        .catch(() => {
          this.$message.error('正文加载失败');
        });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    async deletePost(row) {
      try {
        await this.$confirm(`确认删除「${row.title}」?`, '删除', { type: 'warning' });
      } catch (err) {
        return;
      }
      try {
        await axios.delete(GetApi(`/blog/${row.id}`), { headers: this.headers() });
        this.$message.success('已删除');
        if (this.form.id === row.id) this.resetForm();
        this.load();
      } catch (err) {
        this.$message.error('删除失败');
      }
    },
    resetForm() {
      this.form = { id: null, title: '', summary: '', content: '', status: 'draft' };
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('zh-CN');
    }
  }
}
</script>

<style lang="scss" scoped>
.blogAdminPage {
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.editorCard, .listCard {
  background: white;
  border: 1px solid #e6e9f5;
  border-radius: 10px;
  padding: 16px 18px;

  h2 {
    margin: 0 0 12px;
    font-size: 17px;
    color: #2c3e77;
  }
}

.formRow {
  display: flex;
  gap: 10px;
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
  min-height: 320px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 10px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  box-sizing: border-box;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #409eff;
  }
}

.mdPreview {
  min-height: 320px;
  border: 1px solid #eef1fa;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  overflow: auto;
  background: #fbfcff;

  :deep(h1), :deep(h2), :deep(h3) { color: #2c3e77; margin: 12px 0 8px; }
  :deep(code) { background: #f2f4fd; padding: 1px 4px; border-radius: 3px; }
  :deep(pre) { background: #2b3147; color: #dce4ff; padding: 10px; border-radius: 6px; overflow: auto; }
  :deep(pre code) { background: transparent; color: inherit; }
  :deep(blockquote) { border-left: 3px solid #b9c4ef; margin: 8px 0; padding: 4px 10px; background: #f6f8ff; }
  :deep(img) { max-width: 100%; }
  :deep(.ph) { color: #b0b7d6; }
}

@media (max-width: 900px) {
  .editorPane { grid-template-columns: 1fr; }
}
</style>
