<template>
    <div :class="['charaplate', hovered ? 'color-' + colorclass : '']" @mouseover="hovered = true" @mouseleave="hovered = false"
        @click="clickevent">
        <div :class="['iconBorder', 'border-' + colorclass]">
            <img class="iconImg" style="width:100%" :src="iconurl" />
        </div>
        <div class="pixelBorder">
            <img class="pixelImg" :src="pixelurl" />
        </div>
        <!--img class="pixel" style="width:100%" :src="pixelurl" /-->
        <div id="stardiv">
            {{ ['★', '★★', '★★★', '★★★★', '★★★★★'][charaData.rare - 1] }}
        </div>
        <div id="charanamediv">
            {{ charaData.jname }}
        </div>
    </div>
</template>

<script>
/* eslint-disable */
export default {
    name: 'CharaPlateImg',
    props: ['charaData'],
    data() {
        return {
            hovered: false
        }
    },
    computed: {
        iconurl: function () {
            var fname = this.charaData.url;
            return '/static/icon/' + fname + '.png';
        },
        pixelurl: function () {
            var fname = this.charaData.url;
            return '/static/gif/' + fname + (this.hovered ? '_special.gif' : '.gif');
        },
        colorclass: function () {
            var tt = { '火': 'red', '雷': 'yellow', '水': 'blue', '风': 'green', '暗': 'dark', '光': 'light' };
            return tt[this.charaData.type];
        },
        charaName: function () {
            return this.charaData.jname;
        },
    },
    methods: {
        clickevent() {
            console.log('click');
            this.$emit('fatherclick', this.charaData.jname);
        },
    }


}
</script>

<style lang="scss">
.charaplate {
    //display: flex;
    position: relative;

    justify-content: space-around;
    align-items: center;
    overflow: hidden;
    margin-bottom: 10px;

    width: 120px;

    font-size: 16px;
    font-weight: bolder;
    text-shadow: #000 -1px 0 0, #763c12 0 -1px 0, #5d2b08 1px 0 0, #1d1515 0 1px 0;
    text-align: center;
    color: white;
    transition: all 0.2s;
    z-index: 1000;

    &:hover {
        .iconBorder {
            width: 80px;
            height: 80px;
            margin: 0 auto;
        }
    }

    .iconBorder {
        width: 64px;
        height: 64px;
        margin: 8px auto;
        border: 3px solid;
        border-radius: 10px;
        box-sizing: border-box;
        transition: all 0.2s;
        overflow: hidden;
    }

    .pixelBorder {
        display: block;
        //width: 50px;
        height: 50px;
        //margin: auto;
        //overflow: hidden;
        z-index: 999;

        .pixelImg {
            position: absolute;
            width: 512px;
            height: 512px;
            bottom: -200px;
            left: -198px;
        }
    }

    #stardiv {
        display: block;
    }

    #charanamediv {
        display: block;
    }

}
</style>