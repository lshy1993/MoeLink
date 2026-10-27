<template>
  <div class="shopAdminPage">
    <el-empty description="EC 商城后台开发中（商品 / 订单管理将在此上线）" :image-size="120" />
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
  padding: 40px 0;
}
</style>
