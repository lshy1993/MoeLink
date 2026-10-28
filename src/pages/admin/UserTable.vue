<template>
  <div class="userTablePage">
    <div class="statCards" v-if="stats">
      <div class="statCard">
        <div class="num">{{ stats.total }}</div>
        <div class="label">注册用户</div>
      </div>
      <div class="statCard">
        <div class="num">+{{ stats.new_week }}</div>
        <div class="label">本周新增</div>
      </div>
      <div class="statCard">
        <div class="num">{{ stats.admin_count }}</div>
        <div class="label">管理员</div>
      </div>
    </div>

    <div class="toolbar">
      <InputText v-model="search" placeholder="搜索邮箱 / 昵称" style="width: 260px"
        @keyup.enter="reload" />
      <Button label="搜索" severity="secondary" outlined size="small" @click="reload" />
      <Button label="刷新" size="small" @click="load" />
    </div>

    <DataTable :value="users" :loading="loading" dataKey="id" scrollable class="userTable">
      <Column field="id" header="ID" style="width: 60px" />
      <Column header="邮箱" style="min-width: 220px">
        <template #body="{ data }">
          {{ data.email }}
          <Tag v-if="data.user_role === 1" value="管理员" severity="danger" style="margin-left: 6px" />
          <Tag v-else-if="data.user_role === 2" value="版主" severity="warn" style="margin-left: 6px" />
        </template>
      </Column>
      <Column header="昵称" style="min-width: 120px">
        <template #body="{ data }">{{ data.display_name || data.nickname || '—' }}</template>
      </Column>
      <Column header="UUID" style="width: 150px">
        <template #body="{ data }">
          <span class="uuid" :title="data.user_uuid">{{ shortUuid(data.user_uuid) }}</span>
        </template>
      </Column>
      <Column header="答题" style="width: 110px">
        <template #body="{ data }">{{ data.correct_submissions }}/{{ data.total_submissions }}</template>
      </Column>
      <Column field="questions_created" header="出题" style="width: 70px" />
      <Column field="total_votes" header="投票" style="width: 70px" />
      <Column header="注册时间" style="width: 110px">
        <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
      </Column>
      <Column header="最近登录" style="width: 160px">
        <template #body="{ data }">
          <template v-if="data.last_login_at">
            {{ formatDate(data.last_login_at) }}
            <div class="ip">{{ data.last_login_ip || '' }}</div>
          </template>
          <template v-else>—</template>
        </template>
      </Column>
    </DataTable>

    <div class="pager" v-if="users.length && users.length < total">
      <button @click="loadMore">加载更多（{{ users.length }}/{{ total }}）</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { GetApi, GetToken } from '@/utils';

const PAGE_SIZE = 50;

export default {
  name: 'AdminUserTable',
  props: ['user'],
  components: {
    DataTable,
    Column,
    InputText,
    Button,
    Tag
  },
  setup() {
    return {
      toast: useToast()
    }
  },
  data() {
    return {
      users: [],
      total: 0,
      stats: null,
      offset: 0,
      search: '',
      loading: false
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
        const res = await axios.get(GetApi('/admin/unified-users'), {
          headers: this.headers(),
          params: { limit: PAGE_SIZE, offset: this.offset, search: this.search }
        });
        if (this.offset === 0) this.users = [];
        this.users = this.users.concat(res.data.users || []);
        this.total = res.data.total || 0;
        this.stats = res.data.stats || null;
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '加载失败',
          detail: (err.response && err.response.data && err.response.data.error) || err.message,
          life: 3000 });
      }
      this.loading = false;
    },
    reload() {
      this.offset = 0;
      this.load();
    },
    loadMore() {
      this.offset += PAGE_SIZE;
      this.load();
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('zh-CN');
    },
    shortUuid(u) {
      return u ? u.slice(0, 8) + '…' : '';
    }
  }
}
</script>

<style lang="scss" scoped>
.userTablePage {
  max-width: 1100px;
}

.statCards {
  display: flex;
  gap: 16px;
  margin-bottom: 18px;
}

.statCard {
  background: #f7f9ff;
  border: 1px solid #e3e9ff;
  border-radius: 10px;
  padding: 12px 22px;
  text-align: center;

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
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.uuid {
  font-family: monospace;
  font-size: 12px;
  color: #8892b8;
}

.ip {
  font-size: 11px;
  color: #b0b7d6;
}

.pager {
  text-align: center;
  padding: 16px 0;

  button {
    padding: 7px 24px;
    border: 1px solid #b9c4ef;
    background: white;
    border-radius: 20px;
    color: #4a6fe3;
    cursor: pointer;

    &:hover {
      background: #eef1fd;
    }
  }
}
</style>
