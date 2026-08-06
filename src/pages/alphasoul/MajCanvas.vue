<template>
    <div id="animated-number-demo">
        <input v-model.number="number" type="number" step="20">
        <p>{{ animatedNumber }}</p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as TWEEN from '@tweenjs/tween.js';

export default defineComponent({
    name: 'majtest',
    data() {
        return {
            number: 0,
            tweenedNumber: 0
        }
    },
    methods: {
        foo() {
            console.log('foo');
        }
    },
    computed: {
        animatedNumber(): string {
            return this.tweenedNumber.toFixed(0);
        }
    },
    watch: {
        number(newValue: number) {
            const animate = () => {
                requestAnimationFrame(animate);
                TWEEN.update();
            };

            new TWEEN.Tween({ x: 0 })
                .to({ x: 200 }, 1000)
                .onUpdate((object: { x: number }) => {
                    console.log(object.x);
                    this.tweenedNumber = object.x;
                })
                .start();

            animate();
        }
    }
});
</script>

<style></style>
