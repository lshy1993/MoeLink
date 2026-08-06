<template>
    <div class="filterBox">
        <div @click="filteron = !filteron" class="filterHead">过滤器</div>
        <transition name="toggle">
            <div v-show="filteron" style="overflow:hidden">
                <div class="filterLine">
                    <span>初始星级</span>
                    <input type="checkbox" id="star_one" :value="1" v-model="filter.star[0]">
                    <label for="star_one">★</label>
                    <input type="checkbox" id="star_two" :value="2" v-model="filter.star[1]">
                    <label for="star_two">★★</label>
                    <input type="checkbox" id="star_three" :value="3" v-model="filter.star[2]">
                    <label for="star_three">★★★</label>
                    <input type="checkbox" id="star_four" :value="4" v-model="filter.star[3]">
                    <label for="star_four">★★★★</label>
                    <input type="checkbox" id="star_five" :value="5" v-model="filter.star[4]">
                    <label for="star_five">★★★★★</label>
                    <button @click="clearStar">ClearAll</button>
                </div>
                <div class="filterLine">
                    <span>属性</span>
                    <input type="checkbox" id="type_fire" value="1" v-model="filter.type[0]">
                    <label for="type_fire">火</label>
                    <input type="checkbox" id="type_water" value="2" v-model="filter.type[1]">
                    <label for="type_water">水</label>
                    <input type="checkbox" id="type_eletric" value="3" v-model="filter.type[2]">
                    <label for="type_eletric">电</label>
                    <input type="checkbox" id="type_wind" value="4" v-model="filter.type[3]">
                    <label for="type_wind">风</label>
                    <input type="checkbox" id="type_light" value="5" v-model="filter.type[4]">
                    <label for="type_light">光</label>
                    <input type="checkbox" id="type_dark" value="6" v-model="filter.type[5]">
                    <label for="type_dark">暗</label>
                    <button @click="clearType">ClearAll</button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
    name: 'EquipFilter',
    data() {
        return {
            filteron: true,
            filter: {
                star: [false, false, false, false, false],
                type: [false, false, false, false, false],
                //job: [false,false,false,false,false],
            }
        }
    },
    created() {
        this.$emit('filter', this.filter);
    },
    watch: {
        filter: function () {
            //console.log('aaa');
            this.$emit('filter', this.filter);
        }
    },
    methods: {
        clearStar() {
            this.filter.star = [false, false, false, false, false];
        },
        clearType() {
            this.filter.type = [false, false, false, false, false];
        },
        clearJob() {
            this.filter.job = [false, false, false, false, false];
        }
    }
}
</script>

<style lang="scss">
.filterBox {
    box-shadow: 0 0 0.15em 0.15em rgba(0, 0, 0, .125);
    margin-bottom: 10px;

    .filterHead {
        cursor: pointer;
        padding: 10px;
        height: 20px;
        //border-radius: 10px;
        background: white;
        transition: background-color 0.5s;

        &:hover {
            background: grey;
        }
    }

    .filterLine {
        padding: 10px;
    }

    .toggle-enter-active,
    .toggle-leave-active {
        transition: .5s;
    }

    .toggle-enter,
    .toggle-leave-to {
        max-height: 0;
    }

    .toggle-leave,
    .toggle-enter-to {
        max-height: 200px;
    }
}
</style>
