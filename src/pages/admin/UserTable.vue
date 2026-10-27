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
      <el-input v-model="search" placeholder="搜索邮箱 / 昵称" clearable style="width: 260px"
        @keyup.enter="reload" />
      <el-button @click="reload">搜索</el-button>
      <el-button type="primary" plain @click="load">刷新</el-button>
    </div>

    <el-table :data="users" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="邮箱" min-width="200">
        <template #default="{ row }">
          {{ row.email }}
          <el-tag v-if="row.user_role === 1" type="danger" size="small" style="margin-left:6px">管理员</el-tag>
          <el-tag v-else-if="row.user_role === 2" type="warning" size="small" style="margin-left:6px">版主</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="昵称" min-width="120">
        <template #default="{ row }">{{ row.display_name || row.nickname || '—' }}</template>
      </el-table-column>
      <el-table-column label="UUID" width="140">
        <template #default="{ row }">
          <span class="uuid" :title="row.user_uuid">{{ shortUuid(row.user_uuid) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="答题" width="110">
        <template #default="{ row }">
          {{ row.correct_submissions }}/{{ row.total_submissions }}
        </template>
      </el-table-column>
      <el-table-column prop="questions_created" label="出题" width="70" />
      <el-table-column prop="total_votes" label="投票" width="70" />
      <el-table-column label="注册时间" width="110">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="最近登录" width="150">
        <template #default="{ row }">
          <template v-if="row.last_login_at">
            {{ formatDate(row.last_login_at) }}<br />
            <span class="ip">{{ row.last_login_ip || '' }}</span>
          </template>
          <template v-else>—</template>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager" v-if="users.length && users.length < total">
      <button @click="loadMore">加载更多（{{ users.length }}/{{ total }}）</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { GetApi, GetToken } from '@/utils';

const PAGE_SIZE = 50;

export default {
  name: 'AdminUserTable',
  props: ['user'],
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
        this.$message && this.$message.error('用户列表加载失败：' + (err.response?.data?.error || err.message));
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

    &:hover { background: #eef1fd; }
  }
}
</style>
