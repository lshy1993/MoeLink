import { createApp } from 'vue';
import App from './App.vue';

import router from './router';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'

import moment from 'moment';

import data from './data';
import func from './utils';
import User from './types/User';

import './style/animation.scss';
import './style/common.scss';
import './style/wiki.scss';
import './style/user.scss';

const app = createApp(App);

app.use(router);
app.use(ElementPlus);
app.use(moment);

// 挂载全局属性
app.config.globalProperties.Common = data;
app.config.globalProperties.Func = func;
app.config.globalProperties.User = new User();

app.mount('#app');
