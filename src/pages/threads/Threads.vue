<template>
  <div class="threadsPage">
    <header class="pageHead">
      <div>
        <h1>讨论区</h1>
        <p>发帖提问、分享心得，和同好们聊聊</p>
      </div>
      <Button label="发新帖" icon="pi pi-plus" @click="goNew" />
    </header>

    <div class="filterBar">
      <button
        v-for="c in categoryFilters"
        :key="c.value"
        class="filterItem"
        :class="{ active: category === c.value }"
        @click="selectCategory(c.value)"
      >{{ c.label }}</button>
    </div>

    <div v-if="threads.length" class="threadList">
      <router-link v-for="t in threads" :key="t.id" class="threadRow" :to="'/threads/' + t.id">
        <div class="rowMain">
          <Tag :value="categoryMeta(t.category).label" :severity="categoryMeta(t.category).severity" class="catTag" />
          <h2 class="threadTitle">{{ t.title }}</h2>
          <i v-if="t.is_pinned" class="pi pi-bookmark pinIcon" title="置顶"></i>
          <span v-if="t.bounty > 0" class="bountyIcon" :class="{ awarded: t.bounty_awarded_to }">
            <i class="pi pi-gift"></i>{{ t.bounty_awarded_to ? '已采纳' : '+' + t.bounty }}
          </span>
        </div>
        <div class="rowMeta">
          <span class="metaItem"><i class="pi pi-user"></i>{{ t.author_name }}</span>
          <span class="metaItem"><i class="pi pi-comments"></i>{{ t.reply_count }}</span>
          <span class="metaItem"><i class="pi pi-clock"></i>{{ formatTime(t.last_reply_at || t.created_at) }}</span>
        </div>
      </router-link>
    </div>

    <div v-else-if="!loading" class="emptyBox">
      <i class="pi pi-comments emptyIcon"></i>
      <p>还没有帖子，来发第一帖吧</p>
    </div>

    <div class="pager" v-if="threads.length && threads.length < total">
      <Button label="加载更多" text :loading="loading" @click="loadMore" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { GetApi, GetToken } from '@/utils'
import { categoryMeta, formatTime, THREAD_CATEGORIES } from './shared'

const PAGE_SIZE = 20

export default {
  name: 'ThreadsPage',
  components: { Button, Tag },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      threads: [],
      total: 0,
      offset: 0,
      category: '',
      loading: false,
      categoryFilters: [{ value: '', label: '全部' }, ...THREAD_CATEGORIES],
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    categoryMeta,
    formatTime,
    async load() {
      this.loading = true
      try {
        const res = await axios.get(GetApi('/thread/list'), {
          params: {
            limit: PAGE_SIZE,
            offset: this.offset,
            category: this.category,
          },
        })
        this.threads =
          this.offset === 0
            ? res.data.threads || []
            : this.threads.concat(res.data.threads || [])
        this.total = res.data.total || 0
      } catch (_err) {
        this.toast.add({
          severity: 'error',
          summary: '加载失败',
          detail: '讨论区列表加载失败',
          life: 3000,
        })
      }
      this.loading = false
    },
    selectCategory(value) {
      if (this.category === value) return
      this.category = value
      this.offset = 0
      this.threads = []
      this.load()
    },
    loadMore() {
      this.offset += PAGE_SIZE
      this.load()
    },
    goNew() {
      if (!GetToken()) {
        this.toast.add({
          severity: 'warn',
          summary: '请先登录',
          detail: '登录后即可发帖',
          life: 3000,
        })
        return
      }
      this.$router.push('/threads/new')
    },
  },
}
</script>

<style lang="scss" scoped>
.threadsPage {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

.pageHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 32px;
    color: #2c3e77;
  }

  p {
    margin: 6px 0 0;
    color: #8892b8;
    font-size: 13.5px;
  }
}

.filterBar {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.filterItem {
  padding: 6px 16px;
  border: 1px solid #dfe4f5;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  font-size: 13px;
  color: #56608a;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    border-color: #aebcf0;
    color: #2c3e77;
  }

  &.active {
    background: #4a6fe3;
    border-color: #4a6fe3;
    color: #fff;
  }
}

.threadList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.threadRow {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 16px 20px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 10px rgba(30, 40, 90, 0.07);
  transition: transform .15s ease, box-shadow .15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(30, 40, 90, 0.12);

    .threadTitle {
      color: #2c53c9;
    }
  }
}

.rowMain {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.catTag {
  flex-shrink: 0;
  font-size: 11px;
}

.threadTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e77;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color .15s;
}

.pinIcon {
  color: #e6a23c;
  font-size: 12px;
}

.bountyIcon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: 12px;
  background: #fff4e8;
  color: #d97a2b;
  font-size: 11.5px;
  font-weight: 700;

  i { font-size: 11px; }

  &.awarded {
    background: #e8f8ef;
    color: #1e9e63;
  }
}

.rowMeta {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: #9aa2c5;
  padding-left: 2px;
}

.metaItem {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  i {
    font-size: 11px;
  }
}

.emptyBox {
  text-align: center;
  color: #8892b8;
  padding: 70px 0;

  .emptyIcon {
    font-size: 40px;
    opacity: 0.45;
    margin-bottom: 10px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.pager {
  text-align: center;
  padding: 18px 0;
}

@media (max-width: 640px) {
  .pageHead {
    align-items: center;
  }

  .rowMeta {
    gap: 12px;
  }
}
</style>
