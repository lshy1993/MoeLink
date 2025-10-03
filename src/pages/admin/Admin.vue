<template>
<el-container style="position: fixed; height:100%; width:100%; border: 1px solid #eee;">
    <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
        <el-menu :default-openeds="['1','2']" @select="menuSelect">
            <el-submenu index="1">
                <template slot="title"><i class="el-icon-message"></i>用户管理</template>
                <el-menu-item-group>
                    <el-menu-item index="1-1">用户一览</el-menu-item>
                    <el-menu-item index="1-2">邀请码管理</el-menu-item>
                </el-menu-item-group>
            </el-submenu>
            <el-submenu index="2">
                <template slot="title"><i class="el-icon-message"></i>商城管理</template>
                <el-menu-item-group>
                    <el-menu-item index="2-1">商品一览</el-menu-item>
                    <el-menu-item index="2-2">订单管理</el-menu-item>
                </el-menu-item-group>
            </el-submenu>
            <el-submenu index="3">
                <template slot="title"><i class="el-icon-message"></i>文章管理</template>
                <el-menu-item-group>
                    <el-menu-item index="3-1">文章一览</el-menu-item>
                </el-menu-item-group>
            </el-submenu>
        </el-menu>
    </el-aside>
    <el-container>
        <el-header style="text-align: right; font-size: 12px">
            <el-dropdown>
                <i class="el-icon-setting" style="margin-right: 15px"></i>
                <el-dropdown-menu slot="dropdown">
                <el-dropdown-item>查看</el-dropdown-item>
                <el-dropdown-item>新增</el-dropdown-item>
                <el-dropdown-item>删除</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <span>{{ User.uid }}</span>
        </el-header>
        <component v-bind:is="currentTabComponent"></component>
    </el-container>
</el-container>
</template>

<script>
/* eslint-disable */
import UserList from './UserList';
import ItemList from './ItemList';
import CodeList from './CodeList';
import OrderList from './OrderList';
export default {
    name: 'Admin',
    data(){
        return {
            currentTab: 'user-list',
            tabs: ['user-list','code-list','item-list','order-list'],
        }
    },
    computed:{
        currentTabComponent: function () {
            return this.currentTab;
        }
    },
    created(){
        if(!this.User || !this.User.group>=100 ){
            console.log(this.User);
            console.log("need admin login");
            this.$router.push({ path: '/' });
        }
    },
    methods:{
        menuSelect(indexPath){
            let i = 0;
            switch(indexPath){
                case "1-1":
                    i = 0;
                    break;
                case "1-2":
                    i = 1;
                    break;
                case "2-1":
                    i = 2;
                    break;
                case "2-2":
                    i = 3;
                    break;
            }
            this.changeTab(i);
        },
        changeTab(i){
            this.currentTab = this.tabs[i];
            console.log(this.currentTab);
        }
    },
    components:{
        UserList,
        ItemList,
        CodeList,
        OrderList
    }
}
</script>

<style lang="scss">
.el-header {
    background-color: #B3C0D1;
    color: #333;
    line-height: 60px;
}

.el-aside {
    color: #333;
}

.el-main {
    background-color: #FFF;
}
</style>