/* eslint-disable */
import Vue from 'vue';
import Router from 'vue-router';
Vue.use(Router);
import User from './user.js';

var router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'navi',
      component: ()=> import('../pages/Navi.vue')
    },
    {
      path: '/alphasoul',
      name: 'alphasoul',
      component: ()=> import('../pages/alphasoul/AlphaSoul.vue'),
      beforeEnter(to, from, next) {
        window.location.href = "https://alphasoul.moelink.site";
      }
    },
    {
      path: '/wfwiki',
      name: 'worldflipper',
      component: ()=> import('../pages/wfwiki/WorldFlipper.vue'),
      children:[
        { path:'', component: ()=>import('../pages/wfwiki/Index.vue') },
        { path:'chara', component: ()=>import('../pages/wfwiki/chara/Character.vue') },
        { path:'chara/:id', name: 'chara', component: ()=>import('../pages/wfwiki/chara/CharacterDetail.vue') },
        { path:'equip', component: ()=>import('../pages/wfwiki/equip/Equipment.vue') },
        { path:'equip/:id', name: 'equip', component: ()=>import('../pages/wfwiki/equip/EquipmentDetail.vue') },
        { path:'simulator', component: ()=>import('../pages/wfwiki/simulator/Simulate.vue') },
        { path:'simulator/:id', name: 'simulator', component: ()=>import('../pages/wfwiki/simulator/Simulate.vue') },
        { path:'*', component: ()=>import('../pages/wfwiki/Building.vue') },
      ]
    },
    {
      path: '/evolve2',
      name: 'evolve',
      component: ()=> import('../pages/evolve/Evolve.vue')
    },
    {
      path: '/pcrwiki',
      name: 'pcrwiki',
      component: ()=> import('../pages/pcrwiki/PcrWiki.vue'),
      beforeEnter(to, from, next){
        window.location.href = "https://pcrwiki.moelink.site";
      }
    },
    {
      path: '/gbf',
      name: 'gbf',
      component: ()=> import('../pages/gbf/GranBlue.vue'),
      children:[
        { path: '', component: ()=>import('../pages/gbf/Index.vue') },
        // { path: 'about', component: ()=>import('../pages/gbf/About.vue') }
      ]
    },
    {
      path: '/admin',
      name: 'admin',
      component: ()=> import('../pages/admin/Admin.vue'),
      meta: { requiresAdmin: true },
      children:[
        { path: 'itemlist', component: ()=>import('../pages/admin/ItemList.vue') },
        { path: 'userlist', component: ()=>import('../pages/admin/UserList.vue') }
      ]
    },
    {
      path: '/home',
      name: 'home',
      component: ()=> import('../pages/forums/Forums.vue')
    },
    {
      path: '/res',
      name: 'result',
      component: () => import('../pages/forums/Result.vue')
    }
  ]
})

// router.beforeEach((to, from, next) => {
//   if (to.matched.some(record => record.meta.requiresAuth)) {
//     // 需要登录
//     if (!User.logined) {
//       console.log("need login");
//       next({
//         path: '/',
//         // query: { redirect: to.fullPath }
//       });
//     } else {
//       next();
//     }
//   } else if(to.matched.some(record => record.meta.requiresAdmin)){
//     if(!(User.logined && User.group >= 100)){
//       console.log("need admin login");
//       next({
//         path: '/',
//         // query: { redirect: to.fullPath }
//       })
//     }else{
//       next();
//     }
//   } else {
//     next();
//   }
// })

export default router;