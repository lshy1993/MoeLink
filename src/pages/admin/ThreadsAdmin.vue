<template>
  <div class="threadsAdminPage">
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
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { GetApi, GetToken } from '@/utils';
import { categoryMeta, formatTime } from '../threads/shared';

export default {
  name: 'AdminThreads',
  components: { DataTable, Column, Button, Tag, Checkbox },
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
      includeDeleted: true
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    categoryMeta,
    formatTime,
    headers() {
      return { Authorization: `Bearer ${GetToken()}` };
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
