import { createApp } from "vue";
import App from "./App.vue";

import router from "./router";

import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import ToastService from "primevue/toastservice";
import "primeicons/primeicons.css";

import moment from "moment";
import axios from "axios";

import UserClass, { userInstance } from "./types/User";
import * as func from "./utils";

import "./style/animation.scss";
import "./style/common.scss";
import "./style/wiki.scss";
import "./style/user.scss";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    Func: any;
    $http: any;
    User: UserClass;
    $moment: typeof moment;
  }
}

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
  theme: { preset: Aura },
  ripple: true,
  license: import.meta.env.VITE_PRIMEUI_LICENSE_KEY || undefined,
});
app.use(ToastService);

// 挂载全局属性
app.config.globalProperties.Func = func;
app.config.globalProperties.$http = axios;
app.config.globalProperties.User = userInstance;
app.config.globalProperties.$moment = moment;

app.mount("#app");
