<template>
<el-main>
    <el-table :data="codeData" v-loading="loading">
        <el-table-column prop="code" label="注册邀请码">
        </el-table-column>
        <el-table-column prop="send" label="已领取" width="140">
        </el-table-column>
        <el-table-column prop="username" label="所属用户" width="160">
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
    name: 'CodeList',
    data(){
        return {
            codeData: [],
            loading: false,
            currentPage: 1,
            totalNum: 1,
        }
    },
    mounted(){

    },
    methods:{
        getCodeList(){
            this.loading = true;
            let url = this.Func.GetApi('/user/codelist');
            // 从api获取用户总
            this.$http.get(url).then((response)=>{
                // 成功登录
                this.loading = false;
                this.totalNum = response.data;
            },(err)=>{
                // 密码错误
                this.loading = false;
                this.totalNum = 0;
            });
        }
    }
}
</script>

<style lang="scss">

</style>