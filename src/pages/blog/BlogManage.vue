<template>
  <div class="manageWrap">
    <router-link to="/blog" class="back">← 返回博客</router-link>
    <div v-if="logined">
      <BlogAdmin base="/blog" scope="mine" heading="博客文章" />
    </div>
    <p v-else class="hint">请先登录后再写文章。</p>
  </div>
</template>

<script>
import { GetToken } from '@/utils'
import BlogAdmin from '../admin/BlogAdmin.vue'

export default {
  name: 'BlogManage',
  components: { BlogAdmin },
  computed: {
    logined() {
      return !!GetToken()
    },
  },
}
</script>

<style scoped>
.manageWrap { max-width: 1100px; margin: 0 auto; padding: 24px 20px 60px; }
.back { display: inline-block; margin-bottom: 12px; color: #2c53c9; text-decoration: none; }
.hint { text-align: center; color: #8892b8; padding: 40px 0; }
</style>
