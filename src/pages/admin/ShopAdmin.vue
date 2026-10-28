<template>
  <div class="shopAdminPage">
    <div class="emptyBox">
      <div class="emptyIcon">🛒</div>
      <p>EC 商城后台开发中（商品 / 订单管理将在此上线）</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminShop',
  props: ['user']
}
</script>

<style lang="scss" scoped>
.shopAdminPage {
  max-width: 1100px;
  background: white;
  border: 1px solid #e6e9f5;
  border-radius: 10px;
  padding: 60px 20px;
}

.emptyBox {
  text-align: center;
  color: #8892b8;

  .emptyIcon {
    font-size: 52px;
    margin-bottom: 14px;
    opacity: 0.6;
  }

  p {
    margin: 0;
  }
}
</style>
