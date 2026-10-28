<template>
  <div class="homePage">
    <section class="hero">
      <div class="heroInner">
        <h1 class="logo">MoeLink</h1>
        <p class="tagline">社区 · 博客 · 测试站 —— 由 Luckylee 运营的小站</p>
        <div class="heroStat" v-if="stats">
          <span>已注册用户 <b>{{ stats.total }}</b></span>
          <span>本周新增 <b>+{{ stats.new_week }}</b></span>
        </div>
      </div>
    </section>

    <section class="sectionGrid">
      <!-- 讨论区 -->
      <router-link class="card cardWide" to="/threads">
        <div class="cardHead"><span class="icon">💬</span><h2>讨论区</h2></div>
        <p>社区的建设原地 —— 话题、回复、投票。建设中，敬请期待。</p>
        <div class="cardTag">即将上线</div>
      </router-link>

      <!-- 博客 -->
      <router-link class="card cardWide" to="/blog">
        <div class="cardHead"><span class="icon">📝</span><h2>博客</h2></div>
        <template v-if="posts.length">
          <ul class="postLine">
            <li v-for="p in posts" :key="p.id">
              <router-link :to="'/blog/' + p.id">{{ p.title }}</router-link>
              <span class="postDate">{{ formatDate(p.published_at) }}</span>
            </li>
          </ul>
          <span class="cardTag">点此进入博客列表</span>
        </template>
        <template v-else>
          <p>站长Blog：技术笔记、日常与项目日志。</p>
          <span class="cardTag">敬请期待首篇博文</span>
        </template>
      </router-link>

      <!-- EC 商城 -->
      <router-link class="card" to="/shop">
        <div class="cardHead"><span class="icon">🛒</span><h2>EC 商城</h2></div>
        <p>用 MoeCoin 兑换周边与商品。</p>
        <div class="cardTag">进入</div>
      </router-link>

      <!-- genshin quiz -->
      <a class="card" :href="quizUrl" target="_blank" rel="noopener">
        <div class="cardHead"><span class="icon">🎯</span><h2>测试站</h2></div>
        <p>原神答题平台：题库、题集、答题记录与排行。</p>
        <div class="cardTag">立即体验 ↗</div>
      </a>

      <!-- AlphaSoul -->
      <router-link class="card" to="/alphasoul">
        <div class="cardHead"><span class="icon">🀄</span><h2>AlphaSoul</h2></div>
        <p>雀魂 online：人工智障点炮机与联机对战工具。</p>
        <div class="cardTag">进入</div>
      </router-link>
    </section>

    <nav class="quickNav" aria-label="更多内容">
      <router-link class="quickLink" to="/links">
        <span aria-hidden="true">🔗</span>友链
      </router-link>
      <router-link class="quickLink" to="/miao">
        <span aria-hidden="true">🏠</span>小屋
      </router-link>
    </nav>
  </div>
</template>

<script>
import axios from 'axios'
import { GetApi } from '@/utils'

export default {
  name: 'HomePage',
  data() {
    return {
      posts: [],
      stats: null,
      quizUrl: import.meta.env.DEV
        ? 'http://localhost:3000'
        : import.meta.env.VITE_QUIZ_URL || 'https://quiz.moelink.site',
    }
  },
  mounted() {
    this.loadBlog()
    this.loadStats()
  },
  methods: {
    async loadBlog() {
      try {
        const res = await axios.get(GetApi('/blog/list'), {
          params: { limit: 3 },
        })
        this.posts = res.data.posts || []
      } catch (err) {
        console.log('博客列表加载失败', err)
      }
    },
    async loadStats() {
      try {
        const res = await axios.get(GetApi('/blog/stats'))
        this.stats = res.data
      } catch (err) {
        console.log('站点统计加载失败', err)
      }
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('zh-CN')
    },
  },
}
</script>

<style lang="scss" scoped>
.homePage {
  min-height: 100%;
  padding: 0 24px 40px;
}

.hero {
  padding: 72px 0 44px;
  text-align: center;

  .logo {
    font-size: 60px;
    margin: 0;
    letter-spacing: 2px;
    font-weight: 800;
    // 品牌渐变文字（蓝 → 紫 → 青）
    background: linear-gradient(120deg, #4a6fe3 0%, #7c5fe3 55%, #38bdf8 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .tagline {
    margin-top: 10px;
    font-size: 16px;
    color: #56608a;
  }

  .heroStat {
    margin-top: 16px;
    display: flex;
    gap: 24px;
    justify-content: center;
    font-size: 13px;
    color: #7a86b8;

    b {
      font-size: 16px;
      margin: 0 2px;
      color: #2c53c9;
    }
  }
}

.sectionGrid {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.quickNav {
  max-width: 960px;
  margin: 16px auto 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.quickLink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(210, 218, 241, 0.9);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.78);
  color: #56608a;
  font-size: 13px;
  text-decoration: none;
  transition: background .15s, border-color .15s, color .15s;

  &:hover {
    border-color: #b9c8f2;
    background: #eef2ff;
    color: #2c53c9;
  }
}

.card {
  position: relative;
  display: block;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 20px 22px 46px;
  text-decoration: none;
  color: #333;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.10);
  transition: transform .18s ease, box-shadow .18s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(30, 40, 90, 0.16);
  }

  &.cardWide {
    grid-column: span 2;
  }

  .cardHead {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    .icon { font-size: 26px; }

    h2 {
      margin: 0;
      font-size: 20px;
      color: #2c3e77;
    }
  }

  p {
    margin: 0;
    font-size: 13.5px;
    color: #666;
    line-height: 1.7;
  }

  .cardTag {
    position: absolute;
    right: 14px;
    bottom: 12px;
    font-size: 12px;
    color: #7a86b8;
  }

  .postLine {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;

    li {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 7px 0;
      border-bottom: 1px dashed #e3e7f5;

      a {
        color: #2c3e77;
        text-decoration: none;

        &:hover { text-decoration: underline; }
      }

      .postDate {
        font-size: 12px;
        color: #9aa2c5;
        white-space: nowrap;
        margin-left: 12px;
      }
    }
  }
}

@media (max-width: 720px) {
  .sectionGrid {
    grid-template-columns: 1fr;

    .card.cardWide { grid-column: span 1; }
  }

  .quickNav {
    justify-content: center;
  }
}
</style>
