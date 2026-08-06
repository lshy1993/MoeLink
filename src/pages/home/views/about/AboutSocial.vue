<template>
<div class="section identity-category grid-container">
    <div class="grid-50">
        <h2 class="title">
            <i aria-hidden="true" class="fas fa-chevron-right"></i>MIAO
        </h2>
        <ul class="identities">
            <li class="identity" v-for="(ele,key) in snsList" :key="key">
                <a :href=ele.href>
                    <i aria-hidden="true" :class="['fab',ele.class]"></i>
                    <span class="where">{{ele.where}}</span>
                    <span class="link">{{ele.link}}</span>
                </a>
            </li> 
        </ul>
    </div>
</div>
</template>

<script>
export default {
    name: 'AboutSocial',
    data(){
        return{
            snsList: this.Common.snsList
        }
    }
}
</script>

<style lang="scss">

</style>

