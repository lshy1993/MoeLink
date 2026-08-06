<template>
<div class="tag" :style="{background:bgcolor}">
    <div class="logo" v-if="text!=undefined">{{ text }}</div>
    <div class="version" v-if="ver!=undefined">{{ ver }}</div>
</div>
</template>

<script>
export default {
    name: 'Tag',
    props: ['text','bgcolor','ver'],
    data(){
        return {
            cc:{
                "black": "#555555",
                "pink": "#ff69b4",
                "brightgreen": "#4dc71f",
                "green": "#97c50f",
                "yellowgreen": "#a2a429",
                "yellow": "#d8b125",
                "orange": "#f27e40",
                "red": "#d7624b",
                "lightgrey": "#9e9e9e",
                "blue": "blue"
            }
        }
    }
}
</script>

<style lang="scss">
    .tag {
        display: inline-block;
        box-shadow: 0;
        border-radius: 5px;
        color: white;
        //padding: 0 5px;
        font-size: 12px;
        //line-height: 30px;

        .logo {
            display: inline-block;
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
            padding: 5px;
            background: #555555;
        }

        .version {
            display: inline-block;
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
            padding: 5px;
        }
    }
</style>
