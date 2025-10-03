<template>
  <el-main>
    <el-table :data="userData" v-loading="loading">
      <el-table-column prop="uid" label="uid" width="120">
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="160">
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" width="160">
      </el-table-column>
      <el-table-column prop="group" label="用户组" width="120">
      </el-table-column>
      <el-table-column prop="expiretime" label="会员有效期" width="140">
      </el-table-column>
      <el-table-column prop="logintime" label="最后登录" width="140">
      </el-table-column>
      <el-table-column prop="regtime" label="注册日期" width="140">
      </el-table-column>
      <el-table-column prop="code" label="邀请码">
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button size="mini">编辑</el-button>
          <el-button size="mini" type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChange" :current-page="currentPage"
      layout="total, prev, pager, next, jumper" :page-size="20" :total="totalNum">
    </el-pagination>
  </el-main>
</template>

<script>
export default {
  name: 'UserList',
  data() {
    return {
      loading: false,
      userData: [],
      currentPage: 1,
      totalNum: 0,
    }
  },
  created() {
    // 获取总条数
    this.getUserCount();
    // 获取第一页
    this.getUserData(this.currentPage);
  },
  methods: {
    async getUserCount() {
      this.loading = true;
      try {
        const url = this.Func.GetApi('/user/usercount');
        const response = await axios.get(url);
        this.totalNum = response.data;
      } catch (err) {
        this.totalNum = 0;
      } finally {
        this.loading = false;
      }
    },
    async getUserData(page) {
      this.loading = true;
      try {
        const url = this.Func.GetApi('/user/userlist');
        const response = await axios.get(url, {
          params: { page: page },
          timeout: 1000
        });
        this.userData = this.formatData(response.data);
      } catch (err) {
        this.userData = [];
      } finally {
        this.loading = false;
      }
    },
    formatData(list) {
      for (const data of list) {
        data['expiretime'] = this.checkTime(data['expiretime']);
        data['logintime'] = this.checkTime(data['logintime']);
        data['regtime'] = this.checkTime(data['regtime']);
      }
      return list;
    },
    checkTime(time) {
      const date = moment(time);
      if (date.isValid()) return date.format('YYYY-MM-DD hh:mm');
      else return "";
    },
    handleCurrentChange(page) {
      this.getUserData(page);
    }
  }
}
</script>

<style lang="scss"></style>
