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
                <el-button size="mini" >编辑</el-button>
                <el-button size="mini" type="danger">删除</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        layout="total, prev, pager, next, jumper"
        :page-size="20"
        :total="totalNum">
    </el-pagination>
</el-main>
</template>

<script>
/* eslint-disable */
export default {
    name: 'UserList',
    data(){
        return {
            loading: false,
            userData: [],
            currentPage: 1,
            totalNum: 0,
        }
    },
    created(){
        // 获取总条数
        this.getUserCount();
        // 获取第一页
        this.getUserData(this.currentPage);
    },
    methods:{
        getUserCount(){
            this.loading = true;
            var _this = this;
            let url = this.Func.GetApi('/user/usercount');
            // 从api获取用户总
            this.$http.get(url).then((response)=>{
                // 成功登录
                _this.loading = false;
                _this.totalNum = response.data;
            },(err)=>{
                // 密码错误
                _this.loading = false;
                _this.totalNum = 0;
            });
        },
        getUserData(page){
            this.loading = true;
            var _this = this;
            let url = this.Func.GetApi('/user/userlist');
            // 从api获取用户数据
            this.$http.get(url, { params: {page: page} }, { timeout: 1000 }).then((response)=>{
                _this.loading = false;
                _this.userData = _this.formatData(response.data);
            },(err)=>{
                _this.loading = false;
                _this.userData = [];
            });
        },
        formatData(list){
            for(var data of list){
                data['expiretime'] = this.checkTime(data['expiretime']);
                data['logintime'] = this.checkTime(data['logintime']);
                data['regtime'] = this.checkTime(data['regtime']);
            }
            return list;
        },
        checkTime(time){
            var date = this.$moment(time);
            if(date.isValid()) return date.format('YYYY-MM-DD hh:mm');
            else return "";
        },
        handleCurrentChange(page){
            this.getUserData(page);
        }
    }
}
</script>

<style lang="scss">

</style>