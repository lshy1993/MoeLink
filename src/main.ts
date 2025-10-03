import { createApp } from 'vue';
import App from './App.vue';

import router from './js/router';

import axios from 'axios';
import VueAxios from 'vue-axios';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import moment from 'vue-moment';

import data from './js/data.js';
import func from './js/func.js';
import User from './js/user.js';

import './style/animation.scss';
import './style/common.scss';
import './style/wiki.scss';
import './style/user.scss';

const app = createApp(App);

app.use(router);
app.use(VueAxios, axios);
app.use(ElementPlus);
app.use(moment);

// 挂载全局属性
app.config.globalProperties.Common = data;
app.config.globalProperties.Func = func;
app.config.globalProperties.User = new User();

app.mount('#app');