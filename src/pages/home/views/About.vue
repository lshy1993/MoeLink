<template>
<div>
    <div class="inset-container">
        <about-header/>
        <about-social/>
        <about-game/>
    </div>
</div>
</template>

<script>
import AboutHeader from './about/AboutHeader.vue'
import AboutSocial from './about/AboutSocial.vue'
import AboutGame from './about/AboutGame.vue'

import '../style/about.scss';

export default {
    name: 'About',
    data(){
        return {

        }
    },
    components: {
        AboutHeader,
        AboutSocial,
        AboutGame
    }
}
</script>

<style lang="scss">
    
</style>

