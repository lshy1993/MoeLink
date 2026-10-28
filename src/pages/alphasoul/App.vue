<template>
  <div id="app" class="alphasoulApp">
    <aside :class="['naviSide', sideOn ? 'wide' : '']">
      <div :class="['naviLogo', sideOn ? 'wide' : '']" @click="sideOn = !sideOn">
        <img alt="Vue logo" src="/img/xiangyuan_e.png" width="100%">
      </div>
      <div class="naviLine"></div>
      <router-link class="naviLink" to="/alphasoul">
        <div v-if="!sideOn">Home</div>
        <div v-if="sideOn" style="font-size: 24px;">主页</div>
      </router-link>
      <router-link class="naviLink" to="/alphasoul/game">
        <div v-if="!sideOn">Game</div>
        <div v-if="sideOn" style="font-size: 24px;">电脑对战</div>
      </router-link>
      <router-link class="naviLink" to="/alphasoul/auto">
        <div v-if="!sideOn">Auto</div>
        <div v-if="sideOn" style="font-size: 24px;">自动观战</div>
      </router-link>
      <router-link class="naviLink" to="/alphasoul/tool">
        <div v-if="!sideOn">Tool</div>
        <div v-if="sideOn" style="font-size: 24px;">牌效工具</div>
      </router-link>
      <router-link v-if="debug" class="naviLink" to="/alphasoul/test">Test</router-link>
    </aside>
    <router-view :class="['mainContent', sideOn ? 'wide' : '']"></router-view>
  </div>
</template>

<script>
import '@/assets/main.scss';
import '@/assets/tool.scss';
import '@/assets/game.scss';
import '@/assets/app.scss';

export default {
  name: 'app',
  data() {
    return {
      sideOn: false,
      debug: true
    }
  },
  created() {
    this.debug = process.env.NODE_ENV == 'development';
    console.log('debug mode:', this.debug);
  },
  components: {

  }
}
</script>

<style lang="scss"></style>
