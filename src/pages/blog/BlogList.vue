<template>
  <div class="blogListPage">
    <header class="pageHead">
      <h1>博客</h1>
      <p>技术笔记 · 项目日志 · 日常</p>
    </header>

    <div v-if="posts.length" class="postCards">
      <router-link v-for="p in posts" :key="p.id" class="postCard" :to="'/blog/' + p.id">
        <h2 class="postTitle">{{ p.title }}</h2>
        <p class="postSummary">{{ p.summary }}</p>
        <div class="postMeta">
          <span>{{ formatDate(p.published_at) }}</span>
          <span class="readMore">阅读全文 →</span>
        </div>
      </router-link>
    </div>

    <div v-else-if="!loading" class="emptyBox">
      <p>还没有已发布的文章，敬请期待。</p>
    </div>

    <div class="pager" v-if="posts.length && total > posts.length">
      <button v-if="canLoadMore" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { GetApi } from '@/utils';

const PAGE_SIZE = 10;

export default {
  name: 'BlogList',
  data() {
    return {
      posts: [],
      total: 0,
      offset: 0,
      loading: true
    }
  },
  computed: {
    canLoadMore() {
      return this.posts.length < this.total;
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await axios.get(GetApi('/blog/list'),
          { params: { limit: PAGE_SIZE, offset: this.offset } });
        this.posts = this.posts.concat(res.data.posts || []);
        this.total = res.data.total || 0;
      } catch (err) {
        console.error('博客列表加载失败', err);
      }
      this.loading = false;
    },
    loadMore() {
      this.offset += PAGE_SIZE;
      this.load();
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('zh-CN');
    }
  }
}
</script>

<style lang="scss" scoped>
.blogListPage {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

.pageHead {
  text-align: center;
  margin-bottom: 30px;

  h1 { margin: 0; font-size: 34px; color: #2c3e77; }
  p { margin: 8px 0 0; color: #8892b8; }
}

.postCards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.postCard {
  display: block;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 12px;
  padding: 20px 24px;
  text-decoration: none;
  color: #333;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.10);
  transition: transform .18s ease, box-shadow .18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(30, 40, 90, 0.15);
  }

  .postTitle {
    margin: 0;
    font-size: 20px;
    color: #2c3e77;
  }

  .postSummary {
    margin: 8px 0 0;
    font-size: 13.5px;
    color: #666;
    line-height: 1.7;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .postMeta {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #9aa2c5;

    .readMore { color: #4a6fe3; }
  }
}

.emptyBox, .pager {
  text-align: center;
  color: #8892b8;
  padding: 30px 0;
}

.pager button {
  padding: 8px 28px;
  border: 1px solid #b9c4ef;
  background: white;
  border-radius: 20px;
  color: #4a6fe3;
  cursor: pointer;

  &:hover { background: #eef1fd; }
}
</style>
