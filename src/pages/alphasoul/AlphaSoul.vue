<template>
<div class="fullScreen">
    <iframe ref="iframe" frameborder="no" border="0" marginwidth="0"
    marginheight="0" scrolling="no" width="100%" height="100%" :src="evolvegit"></iframe>
</div>
</template>

<script>
export default {
    name: 'Alphasoul',
    props: ['user'],
    data(){
        return {
            evolvegit: 'https://alphasoul.moelink.site/',
        }
    }
}
</script>

<style>

</style>