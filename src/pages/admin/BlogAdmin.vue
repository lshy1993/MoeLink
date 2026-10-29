<template>
  <div class="blogAdminPage">
    <!-- 编辑器 -->
    <div v-if="form.id || (allowCreate && !createInModal)" class="editorCard">
      <h2>{{ form.id ? '编辑' + heading + ' #' + form.id : '新建' + heading }}</h2>
      <div class="formRow">
        <InputText v-model="form.title" placeholder="标题" maxlength="200" class="titleInput" />
        <Select v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value"
          style="width: 120px" />
        <Select v-if="withCategory" v-model="form.category" :options="categoryOptions" optionLabel="label"
          optionValue="value" style="width: 100px" />
        <Button label="保存" :disabled="!form.title || !form.content" @click="save" />
        <Button v-if="form.id && allowCreate" label="新建" severity="secondary" outlined @click="startNew" />
      </div>
      <div style="margin-top: 10px">
        <InputText v-model="form.summary" placeholder="摘要（留空自动截取正文）" maxlength="500" class="w-full" />
      </div>
      <div class="editorPane">
        <div class="editorCol">
          <div class="paneLabel">Markdown 正文</div>
          <Textarea v-model="form.content" autoResize
            placeholder="# 标题&#10;支持 Markdown 语法" class="mdInput" />
        </div>
        <div class="editorCol">
          <div class="paneLabel">预览</div>
          <div class="mdPreview" v-html="editorPreviewHtml"></div>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="listCard">
      <div class="listHeader">
        <h2>{{ scope === 'mine' ? '我的' + heading : '全部' + heading }}</h2>
        <Button v-if="allowCreate && createInModal" :label="'新建' + heading" icon="pi pi-plus" @click="openCreateDialog" />
      </div>
      <DataTable :value="posts" :loading="loading" dataKey="id">
        <Column field="id" header="ID" style="width: 56px" />
        <Column header="标题" style="min-width: 200px">
          <template #body="{ data }">
            <span v-if="quickPreviewEnabled" class="postTitleText">
              {{ data.title }}
            </span>
            <a v-else class="postTitleLink" :href="`${base}/${data.id}`" target="_blank" rel="noopener noreferrer">
              {{ data.title }}
            </a>
            <Tag v-if="withCategory" :value="data.category === 'works' ? '作品' : '消息'" severity="info" style="margin-left: 4px" />
            <Tag v-if="data.status === 'published'" value="已发布" severity="success" style="margin-left: 4px" />
            <Tag v-else value="草稿" severity="secondary" style="margin-left: 4px" />
          </template>
        </Column>
        <Column header="作者" style="width: 70px">
          <template #body="{ data }">{{ data.author_uid || '—' }}</template>
        </Column>
        <Column header="更新时间" style="width: 100px">
          <template #body="{ data }">{{ formatDate(data.updated_at) }}</template>
        </Column>
        <Column header="操作" style="width: 260px">
          <template #body="{ data }">
            <Button label="编辑" size="small" outlined @click="editPost(data)" />
            <Button v-if="quickPreviewEnabled" label="快速浏览" size="small" text @click="previewPost(data)" />
            <Button label="删除" size="small" severity="danger" outlined style="margin-left: 8px" @click="deletePost(data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-if="createInModal" v-model:visible="editorDialogVisible" modal
      :header="'新建' + heading" :style="{ width: 'min(900px, 94vw)' }">
      <div class="editorCard dialogEditor">
        <div class="formRow">
          <InputText v-model="form.title" placeholder="标题" maxlength="200" class="titleInput" />
          <Select v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value"
            style="width: 120px" />
          <Select v-if="withCategory" v-model="form.category" :options="categoryOptions" optionLabel="label"
            optionValue="value" style="width: 100px" />
        </div>
        <div style="margin-top: 10px">
          <InputText v-model="form.summary" placeholder="摘要（留空自动截取正文）" maxlength="500" class="w-full" />
        </div>
        <div class="editorPane">
          <div class="editorCol">
            <div class="paneLabel">Markdown 正文</div>
            <Textarea v-model="form.content" autoResize
              placeholder="# 标题&#10;支持 Markdown 语法" class="mdInput" />
          </div>
          <div class="editorCol">
            <div class="paneLabel">预览</div>
            <div class="mdPreview" v-html="editorPreviewHtml"></div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" text @click="closeCreateDialog" />
        <Button label="创建文章" icon="pi pi-check" :disabled="!form.title || !form.content" @click="save" />
      </template>
    </Dialog>

    <Dialog v-model:visible="previewVisible" modal header="快速浏览文章" :style="{ width: 'min(820px, 92vw)' }">
      <div v-if="previewPostData" class="quickPreview">
        <h1>{{ previewPostData.title }}</h1>
        <div class="previewMeta">
          作者 {{ previewPostData.author_uid || '—' }} · 更新于 {{ formatDate(previewPostData.updated_at) }}
        </div>
        <div v-if="previewLoading" class="previewLoading">正在加载文章内容...</div>
        <div v-else class="previewContent" v-html="previewHtml"></div>
      </div>
    </Dialog>
  </div>
</template>

<script>
import axios from 'axios';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { GetApi, GetToken } from '@/utils';

export default {
  name: 'AdminBlog',
  props: {
    // 接口前缀与列表范围：admin 博客 /blog + all；用户自己的博客 /blog + mine；小屋 /miao + all
    base: { type: String, default: '/blog' },
    scope: { type: String, default: 'all' },
    withCategory: { type: Boolean, default: false },
    heading: { type: String, default: '文章' },
    allowCreate: { type: Boolean, default: true },
    quickPreviewEnabled: { type: Boolean, default: false },
    createInModal: { type: Boolean, default: false },
  },
  components: {
    DataTable,
    Column,
    InputText,
    Textarea,
    Select,
    Button,
    Tag,
    Dialog,
  },
  setup() {
    return {
      toast: useToast(),
      confirmService: useConfirm()
    }
  },
  data() {
    return {
      posts: [],
      loading: false,
      editorDialogVisible: false,
      previewVisible: false,
      previewLoading: false,
      previewPostData: null,
      previewHtml: '',
      statusOptions: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' }
      ],
      form: {
        id: null,
        title: '',
        summary: '',
        content: '',
        status: 'draft',
        category: 'news'
      },
      categoryOptions: [
        { label: '消息', value: 'news' },
        { label: '作品', value: 'works' }
      ],
    }
  },
  computed: {
    editorPreviewHtml() {
      if (!this.form.content) return '<p class="ph">输入 Markdown 即时预览</p>';
      return DOMPurify.sanitize(marked.parse(this.form.content));
    },
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
        const res = await axios.get(GetApi(`${this.base}/${this.scope}`), { headers: this.headers() });
        this.posts = res.data.posts || [];
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '加载失败', detail: '文章列表加载失败', life: 3000 });
      }
      this.loading = false;
    },
    async save() {
      if (!this.form.id && !this.allowCreate) return;
      const payload = {
        title: this.form.title,
        summary: this.form.summary || undefined,
        content: this.form.content,
        status: this.form.status
      };
      if (this.withCategory) payload.category = this.form.category;
      try {
        if (this.form.id) {
          await axios.put(GetApi(`${this.base}/${this.form.id}`), payload, { headers: this.headers() });
          this.toast.add({ severity: 'success', summary: '已保存', life: 2000 });
        } else {
          await axios.post(GetApi(this.base), payload, { headers: this.headers() });
          this.toast.add({ severity: 'success', summary: '已创建', life: 2000 });
        }
        this.resetForm();
        this.load();
      } catch (err) {
        const msg = (err.response && err.response.data && err.response.data.error) || '保存失败';
        this.toast.add({ severity: 'error', summary: '保存失败', detail: msg, life: 3000 });
      }
    },
    editPost(row) {
      this.editorDialogVisible = false;
      this.form.id = row.id;
      this.form.title = row.title;
      this.form.summary = row.summary || '';
      this.form.status = row.status;
      this.form.category = row.category || 'news';
      // 正文再从详情接口取
      axios.get(GetApi(`${this.base}/post/${row.id}`), { headers: this.headers() })
        .then((res) => {
          this.form.content = (res.data.post && res.data.post.content_md) || '';
        })
        .catch(() => {
          this.toast.add({ severity: 'error', summary: '加载失败', detail: '正文加载失败', life: 3000 });
        });
      (document.getElementById('appBody') || window).scrollTo({ top: 0, behavior: 'smooth' });
    },
    openCreateDialog() {
      this.resetForm();
      this.editorDialogVisible = true;
    },
    closeCreateDialog() {
      this.editorDialogVisible = false;
      this.resetForm();
    },
    startNew() {
      if (this.createInModal) {
        this.openCreateDialog();
        return;
      }
      this.resetForm();
    },
    async previewPost(row) {
      this.previewPostData = row;
      this.previewHtml = '';
      this.previewLoading = true;
      this.previewVisible = true;
      try {
        const res = await axios.get(GetApi(`${this.base}/post/${row.id}`), { headers: this.headers() });
        const content = res.data.post?.content_md || '';
        this.previewHtml = DOMPurify.sanitize(marked.parse(content));
      } catch (_err) {
        this.previewVisible = false;
        this.toast.add({ severity: 'error', summary: '加载失败', detail: '文章内容加载失败', life: 3000 });
      } finally {
        this.previewLoading = false;
      }
    },
    deletePost(row) {
      this.confirmService.require({
        message: `确认删除「${row.title}」?`,
        header: '删除文章',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '删除',
        rejectLabel: '取消',
        accept: () => {
          axios.delete(GetApi(`${this.base}/${row.id}`), { headers: this.headers() })
            .then(() => {
              this.toast.add({ severity: 'success', summary: '已删除', life: 2000 });
              if (this.form.id === row.id) this.resetForm();
              this.load();
            })
            .catch(() => {
              this.toast.add({ severity: 'error', summary: '删除失败', life: 3000 });
            });
        },
      });
    },
    resetForm() {
      this.editorDialogVisible = false;
      this.form = { id: null, title: '', summary: '', content: '', status: 'draft', category: 'news' };
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('zh-CN');
    }
  },
}
</script>

<style lang="scss" scoped>
.blogAdminPage {
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.editorCard,
.listCard {
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

.dialogEditor {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
}

.listHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin-bottom: 12px;
  }
}

.formRow {
  display: flex;
  gap: 10px;
  align-items: center;

  .titleInput {
    flex: 1;
  }
}

.postTitleLink {
  color: #2c3e77;
  text-decoration: none;

  &:hover {
    color: #2c53c9;
    text-decoration: underline;
  }
}

.postTitleText {
  color: #2c3e77;
}

.quickPreview h1 {
  margin: 0;
  color: #2c3e77;
  font-size: 24px;
}

.previewMeta {
  margin: 8px 0 20px;
  color: #8892b8;
  font-size: 13px;
}

.previewContent {
  color: #333;
  line-height: 1.75;
  overflow-wrap: anywhere;

  :deep(img) {
    max-width: 100%;
  }

  :deep(pre) {
    overflow: auto;
  }
}

.previewLoading {
  padding: 32px 0;
  color: #8892b8;
  text-align: center;
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
  min-height: 320px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
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

  :deep(pre) {
    background: #2b3147;
    color: #dce4ff;
    padding: 10px;
    border-radius: 6px;
    overflow: auto;
  }

  :deep(pre code) {
    background: transparent;
    color: inherit;
  }

  :deep(blockquote) {
    border-left: 3px solid #b9c4ef;
    margin: 8px 0;
    padding: 4px 10px;
    background: #f6f8ff;
  }

  :deep(img) {
    max-width: 100%;
  }

  :deep(.ph) {
    color: #b0b7d6;
  }
}

@media (max-width: 900px) {
  .editorPane {
    grid-template-columns: 1fr;
  }
}
</style>
