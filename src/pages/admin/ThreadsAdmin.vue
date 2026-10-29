<template>
  <div class="threadsAdminPage">
    <section class="catSection">
      <div class="catHead">
        <h3>分区与版主</h3>
        <Button label="新建分区" icon="pi pi-plus" size="small" @click="openCategory()" />
      </div>
      <DataTable :value="categories" dataKey="slug" size="small">
        <Column header="分区" style="width: 160px">
          <template #body="{ data }">
            <Tag :value="data.name" :severity="data.severity" />
            <code class="slug">{{ data.slug }}</code>
          </template>
        </Column>
        <Column header="版主" style="min-width: 220px">
          <template #body="{ data }">
            <span v-if="!data.moderators.length" class="dim">暂无</span>
            <Tag v-for="m in data.moderators" :key="m.uid" :value="m.name" severity="secondary"
              class="modTag" :title="m.email" />
          </template>
        </Column>
        <Column header="状态" style="width: 80px">
          <template #body="{ data }">
            <Tag :value="data.is_active ? '启用' : '已停用'" :severity="data.is_active ? 'success' : 'danger'" />
          </template>
        </Column>
        <Column header="操作" style="width: 270px">
          <template #body="{ data }">
            <Button label="版主" icon="pi pi-users" size="small" severity="secondary" outlined
              @click="openModerators(data)" />
            <Button label="编辑" icon="pi pi-pencil" size="small" severity="secondary" text
              @click="openCategory(data)" />
            <Button :label="data.is_active ? '停用' : '启用'" size="small" severity="secondary" text
              @click="toggleCategory(data)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="catOn" :header="catForm.editing ? '编辑分区' : '新建分区'" modal
      :style="{ width: '420px' }">
      <div class="formStack">
        <label>标识（slug，创建后不可改）
          <InputText v-model="catForm.slug" :disabled="catForm.editing" maxlength="20" placeholder="如 guide" />
        </label>
        <label>名称
          <InputText v-model="catForm.name" maxlength="30" placeholder="如 攻略" />
        </label>
        <label>颜色
          <Select v-model="catForm.severity" :options="severityOptions" optionLabel="label"
            optionValue="value" />
        </label>
        <label>说明（可选）
          <InputText v-model="catForm.description" maxlength="200" />
        </label>
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" text @click="catOn = false" />
        <Button label="保存" icon="pi pi-check" :loading="catSaving"
          :disabled="!catForm.name.trim() || (!catForm.editing && !catForm.slug.trim())" @click="saveCategory" />
      </template>
    </Dialog>

    <Dialog v-model:visible="modOn" :header="`「${modCategory?.name || ''}」版主`" modal :style="{ width: '440px' }">
      <p class="modHint">版主只能管理本分区内的帖子和回复（删除、置顶、锁定）。</p>
      <div class="modList">
        <div v-for="m in modCategory?.moderators || []" :key="m.uid" class="modRow">
          <span><b>{{ m.name }}</b> <span class="dim">{{ m.email }}</span></span>
          <Button icon="pi pi-times" severity="danger" text size="small" @click="removeModerator(m)" />
        </div>
        <div v-if="!(modCategory?.moderators || []).length" class="dim">还没有版主</div>
      </div>
      <div class="modAdd">
        <InputText v-model="modInput" placeholder="用户邮箱或用户 ID" @keyup.enter="addModerator" />
        <Button label="任命" icon="pi pi-user-plus" :loading="modSaving" :disabled="!modInput.trim()"
          @click="addModerator" />
      </div>
    </Dialog>

    <div class="statCards" v-if="stats">
      <div class="statCard">
        <div class="num">{{ stats.threads }}</div>
        <div class="label">主题</div>
      </div>
      <div class="statCard">
        <div class="num">{{ stats.replies }}</div>
        <div class="label">回复</div>
      </div>
      <div class="statCard muted">
        <div class="num">{{ stats.hidden_threads }}</div>
        <div class="label">已隐藏主题</div>
      </div>
      <div class="statCard muted">
        <div class="num">{{ stats.hidden_replies }}</div>
        <div class="label">已隐藏回复</div>
      </div>
    </div>

    <div class="toolbar">
      <div class="filterToggle">
        <Checkbox v-model="includeDeleted" :binary="true" inputId="inclDel" @change="load" />
        <label for="inclDel">包含已隐藏内容</label>
      </div>
      <Button label="刷新" icon="pi pi-refresh" size="small" severity="secondary" outlined @click="load" />
    </div>

    <DataTable :value="threads" :loading="loading" dataKey="id" class="threadTable">
      <Column field="id" header="ID" style="width: 60px" />
      <Column header="分类" style="width: 80px">
        <template #body="{ data }">
          <Tag :value="categoryMeta(data.category).label" :severity="categoryMeta(data.category).severity" />
        </template>
      </Column>
      <Column header="标题" style="min-width: 260px">
        <template #body="{ data }">
          <router-link v-if="!data.deleted_at" :to="'/threads/' + data.id" class="threadLink">
            {{ data.title }}
          </router-link>
          <span v-else class="threadLink hidden" :title="data.deleted_at">{{ data.title }}</span>
        </template>
      </Column>
      <Column header="作者" style="width: 120px">
        <template #body="{ data }">{{ data.author_name }}</template>
      </Column>
      <Column header="回复" style="width: 70px">
        <template #body="{ data }">{{ data.reply_count }}</template>
      </Column>
      <Column header="状态" style="width: 90px">
        <template #body="{ data }">
          <Tag v-if="data.deleted_at" value="已隐藏" severity="danger" />
          <Tag v-else value="正常" severity="success" />
        </template>
      </Column>
      <Column header="最后活动" style="width: 110px">
        <template #body="{ data }">{{ formatTime(data.last_reply_at || data.created_at) }}</template>
      </Column>
      <Column header="操作" style="width: 150px">
        <template #body="{ data }">
          <Button v-if="!data.deleted_at" label="隐藏" icon="pi pi-eye-slash" size="small"
            severity="danger" outlined @click="hideThread(data)" />
          <Button v-else label="恢复" icon="pi pi-eye" size="small" severity="success" outlined
            @click="restoreThread(data)" />
        </template>
      </Column>
    </DataTable>

    <div class="footHint">
      软删除说明：被隐藏的主题及其回复不会出现在前台，数据仍保留在库中，可随时恢复。
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { GetApi, GetToken } from '@/utils';
import { categoryMeta, formatTime, loadThreadCategories } from '../threads/shared';

const SEVERITY_OPTIONS = [
  { label: '灰', value: 'secondary' },
  { label: '蓝', value: 'info' },
  { label: '绿', value: 'success' },
  { label: '橙', value: 'warn' },
  { label: '红', value: 'danger' },
  { label: '黑', value: 'contrast' }
];
const emptyCatForm = () => ({ editing: false, slug: '', name: '', severity: 'secondary', description: '' });

export default {
  name: 'AdminThreads',
  components: { DataTable, Column, Button, Tag, Checkbox, Dialog, InputText, Select },
  setup() {
    return {
      toast: useToast(),
      confirmService: useConfirm()
    };
  },
  data() {
    return {
      threads: [],
      stats: null,
      loading: false,
      includeDeleted: true,
      categories: [],
      severityOptions: SEVERITY_OPTIONS,
      catOn: false,
      catSaving: false,
      catForm: emptyCatForm(),
      modOn: false,
      modSaving: false,
      modSlug: '',
      modInput: ''
    };
  },
  computed: {
    modCategory() {
      return this.categories.find((c) => c.slug === this.modSlug) || null;
    }
  },
  mounted() {
    this.load();
    this.loadCategories();
  },
  methods: {
    categoryMeta,
    formatTime,
    headers() {
      return { Authorization: `Bearer ${GetToken()}` };
    },
    errMsg(err, fallback) {
      return (err.response && err.response.data && err.response.data.error) || fallback;
    },
    async loadCategories() {
      try {
        const res = await axios.get(GetApi('/thread/admin/categories'), { headers: this.headers() });
        this.categories = res.data.categories || [];
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '分区加载失败', detail: this.errMsg(err, ''), life: 3000 });
      }
    },
    openCategory(row) {
      this.catForm = row
        ? { editing: true, slug: row.slug, name: row.name, severity: row.severity, description: row.description }
        : emptyCatForm();
      this.catOn = true;
    },
    async saveCategory() {
      this.catSaving = true;
      const f = this.catForm;
      try {
        if (f.editing) {
          await axios.put(
            GetApi(`/thread/admin/categories/${f.slug}`),
            { name: f.name, severity: f.severity, description: f.description },
            { headers: this.headers() }
          );
        } else {
          await axios.post(
            GetApi('/thread/admin/categories'),
            { slug: f.slug.trim(), name: f.name, severity: f.severity, description: f.description },
            { headers: this.headers() }
          );
        }
        this.catOn = false;
        this.toast.add({ severity: 'success', summary: '已保存', life: 2000 });
        await this.loadCategories();
        loadThreadCategories(true);
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '保存失败', detail: this.errMsg(err, ''), life: 3000 });
      }
      this.catSaving = false;
    },
    async toggleCategory(row) {
      try {
        await axios.put(
          GetApi(`/thread/admin/categories/${row.slug}`),
          { is_active: !row.is_active },
          { headers: this.headers() }
        );
        await this.loadCategories();
        loadThreadCategories(true);
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '操作失败', detail: this.errMsg(err, ''), life: 3000 });
      }
    },
    openModerators(row) {
      this.modSlug = row.slug;
      this.modInput = '';
      this.modOn = true;
    },
    async addModerator() {
      const v = this.modInput.trim();
      if (!v) return;
      this.modSaving = true;
      try {
        await axios.post(
          GetApi(`/thread/admin/categories/${this.modSlug}/moderators`),
          /^\d+$/.test(v) ? { uid: Number(v) } : { email: v },
          { headers: this.headers() }
        );
        this.modInput = '';
        this.toast.add({ severity: 'success', summary: '已任命', life: 2000 });
        await this.loadCategories();
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '任命失败', detail: this.errMsg(err, ''), life: 3000 });
      }
      this.modSaving = false;
    },
    async removeModerator(m) {
      try {
        await axios.delete(GetApi(`/thread/admin/categories/${this.modSlug}/moderators/${m.uid}`), {
          headers: this.headers()
        });
        await this.loadCategories();
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '操作失败', detail: this.errMsg(err, ''), life: 3000 });
      }
    },
    async load() {
      this.loading = true;
      try {
        const res = await axios.get(GetApi('/thread/admin/list'), {
          headers: this.headers(),
          params: { include_deleted: this.includeDeleted ? 1 : 0, limit: 200 }
        });
        this.threads = res.data.threads || [];
        this.stats = res.data.stats || null;
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '加载失败', detail: '讨论区数据加载失败', life: 3000 });
      }
      this.loading = false;
    },
    hideThread(row) {
      this.confirmService.require({
        message: `确认隐藏「${row.title}」？该主题及其回复将在前台消失（软删除）`,
        header: '隐藏主题',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '隐藏',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.delete(GetApi(`/thread/${row.id}`), { headers: this.headers() });
            this.toast.add({ severity: 'success', summary: '已隐藏', life: 2000 });
            this.load();
          } catch (err) {
            const msg = (err.response && err.response.data && err.response.data.error) || '操作失败';
            this.toast.add({ severity: 'error', summary: '操作失败', detail: msg, life: 3000 });
          }
        }
      });
    },
    async restoreThread(row) {
      try {
        await axios.post(GetApi(`/thread/admin/${row.id}/restore`), {}, { headers: this.headers() });
        this.toast.add({ severity: 'success', summary: '已恢复', life: 2000 });
        this.load();
      } catch (err) {
        const msg = (err.response && err.response.data && err.response.data.error) || '恢复失败';
        this.toast.add({ severity: 'error', summary: '恢复失败', detail: msg, life: 3000 });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.threadsAdminPage {
  max-width: 1150px;
}

.catSection {
  margin-bottom: 22px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e3e9ff;
  border-radius: 12px;
}

.catHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #2c3e77;
  }
}

.slug {
  margin-left: 8px;
  font-size: 12px;
  color: #9aa2c5;
}

.modTag {
  margin: 2px 4px 2px 0;
}

.dim {
  color: #9aa2c5;
  font-size: 12px;
}

.formStack {
  display: flex;
  flex-direction: column;
  gap: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: #56608a;
  }
}

.modHint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #8892b8;
}

.modList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.modRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 8px;
  background: #f7f9ff;
}

.modAdd {
  display: flex;
  gap: 8px;

  :deep(input) {
    flex: 1;
  }
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

  &.muted {
    background: #fff7f5;
    border-color: #ffe3da;
  }

  .num {
    font-size: 24px;
    font-weight: 700;
    color: #2c3e77;
  }

  .label {
    font-size: 12px;
    color: #8892b8;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.filterToggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #56608a;

  label {
    cursor: pointer;
  }
}

.threadLink {
  color: #2c3e77;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &.hidden {
    color: #b0b7d6;
    text-decoration: line-through;
  }
}

.footHint {
  margin-top: 14px;
  font-size: 12px;
  color: #9aa2c5;
}
</style>
