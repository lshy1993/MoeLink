<template>
  <div class="placeholderPage">
    <div class="placeholderCard">
      <span class="icon">🛒</span>
      <h1>EC 商城</h1>
      <p>周边与商品购买入口 —— 规划中，敬请期待。</p>
      <router-link class="backLink" to="/">← 返回首页</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShopPage'
}
</script>

<style lang="scss" scoped>
.placeholderPage {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.placeholderCard {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 14px;
  padding: 48px 60px;
  text-align: center;
  box-shadow: 0 3px 14px rgba(30, 40, 90, 0.10);

  .icon { font-size: 44px; }

  h1 {
    margin: 12px 0 8px;
    color: #2c3e77;
  }

  p { color: #666; margin: 0; }

  .backLink {
    display: inline-block;
    margin-top: 20px;
    color: #4a6fe3;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}
</style>
