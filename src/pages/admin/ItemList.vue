<template>
<el-main>
    <el-table :data="tableData">
        <el-table-column prop="uid" label="id" width="120">
        </el-table-column>
        <el-table-column prop="itemname" label="名称" width="160">
        </el-table-column>
        <el-table-column prop="circle" label="社团" width="120">
        </el-table-column>
        <el-table-column prop="date" label="发售日" width="140">
        </el-table-column>
        <el-table-column prop="price" label="定价" width="140">
        </el-table-column>
        <el-table-column prop="point" label="积分" width="140">
        </el-table-column>
        <el-table-column prop="editdate" label="最后修改" width="140">
        </el-table-column>
    </el-table>
</el-main>
</template>

<script>
/* eslint-disable */
export default {
    name: 'ItemList',
    data(){
        return {
            tableData:[]
        }
    },
    created(){
        const item = {
            uid: '100001',
            itemname: 'XXXXXXXXXXXXXXX',
            circle: 'YYYYYYYYYYYYYYY',
            date: '2016-05-02',
            price: 123,
            point: 2,
            editdate: '2016-05-02'
        };
        this.tableData = Array(20).fill(item);
    },
}
</script>

<style lang="scss">

</style>