import Vue from 'vue';
import App from './App.vue';

import router from './js/router';

import axios from 'axios';
import VueAxios from 'vue-axios';
Vue.use(VueAxios,axios);
// axios.defaults.withCredentials = true;

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

import moment from 'vue-moment';
Vue.use(moment);

import data from './js/data.js';
Vue.prototype.Common = data;
import func from './js/func.js';
Vue.prototype.Func = func;
import User from './js/user.js';
Vue.prototype.User = new User();
// Vue.use(user);

import './style/animation.scss';
import './style/common.scss';
import './style/wiki.scss';
import './style/user.scss';

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
