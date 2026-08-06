<template>
<div class="section grid-container identity-category">
    <h2 class="title">
        <i aria-hidden="true" class="fas fa-chevron-right"></i>MIAO's Game
    </h2>
    <div class="clearfixbox">
        <ul class="identities grid-50 clearfix">
            <li class="identity">
                <a href="http://steamcommunity.com/id/lshy1993">
                    <i aria-hidden="true" class="fab fa-steam-symbol"></i>
                    <span class="where">steam</span>
                    <span class="link">MIAO</span>
                </a>
            </li>
            <li class="identity">
                <a href="#">
                    <i aria-hidden="true" class="fas fa-registered"></i>
                    <span class="where">Uplay</span>
                    <span class="link">MIAO</span>
                </a>
            </li>
            <li class="identity">
                <a href="#">
                    <i aria-hidden="true" class="fas fa-bicycle"></i>
                    <span class="where">Battle.net</span>
                    <span class="link">幸运的路奇</span>
                </a>
            </li>
            <li class="identity">
                <a href="https://osu.ppy.sh/users/3749208">
                    <i aria-hidden="true" class="fab fa-accessible-icon"></i>
                    <span class="where">osu!</span>
                    <span class="link">lshy1993</span>
                </a>
            </li>
        </ul>
        <ul class="identities grid-50 clearfix">
            <li class="identity" v-for="(ele,key) in gameList2" :key="key">
                <a>
                    <i aria-hidden="true" class="fab fa-steam-symbol"></i>
                    <span class="where">{{ele.where}}</span>
                    <span class="link">{{ele.link}} {{ele.id}}</span>
                </a>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
export default {
    name: 'AboutGame',
    data(){
        return {
            gameList2: this.Common.gameIdList
        }
    }
}
</script>

<style>

</style>
