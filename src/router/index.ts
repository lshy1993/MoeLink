import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
// import User from '../js/user.js';

// 扩展路由记录类型
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'navi',
    component: () => import('../pages/Navi.vue')
  },
  {
    path: '/alphasoul',
    name: 'alphasoul',
    component: () => import('../pages/alphasoul/App.vue'),
    children: [
      {
        path: '',
        name: 'alphasoul-home',
        component: () => import('../pages/alphasoul/Index.vue')
      },
      {
        path: 'game',
        name: 'alphasoul-game',
        component: () => import('../pages/alphasoul/NetGame.vue')
      },
      {
        path: 'auto',
        name: 'alphasoul-auto',
        component: () => import('../pages/alphasoul/NetWatcher.vue')
      },
      {
        path: 'tool',
        name: 'alphasoul-tool',
        component: () => import('../pages/alphasoul/MajTool.vue')
      },
      {
        path: 'test',
        name: 'alphasoul-test',
        component: () => import('../pages/alphasoul/MajCanvas.vue')
      }
    ]
  },
  {
    path: '/wfwiki',
    name: 'worldflipper',
    component: () => import('../pages/wfwiki/WorldFlipper.vue'),
    children: [
      {
        path: '',
        name: 'wfwiki-home',
        component: () => import('../pages/wfwiki/Index.vue')
      },
      {
        path: 'chara',
        name: 'charalist',
        component: () => import('../pages/wfwiki/chara/Character.vue')
      },
      {
        path: 'chara/:id',
        name: 'chara',
        component: () => import('../pages/wfwiki/chara/CharacterDetail.vue')
      },
      {
        path: 'equip',
        name: 'equiplist',
        component: () => import('../pages/wfwiki/equip/Equipment.vue')
      },
      {
        path: 'equip/:id',
        name: 'equip',
        component: () => import('../pages/wfwiki/equip/EquipmentDetail.vue')
      },
      {
        path: 'simulator',
        name: 'simulator-home',
        component: () => import('../pages/wfwiki/simulator/Simulate.vue')
      },
      {
        path: 'simulator/:id',
        name: 'simulator',
        component: () => import('../pages/wfwiki/simulator/Simulate.vue')
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'wfwiki-404',
        component: () => import('../pages/wfwiki/Building.vue')
      }
    ]
  },
  {
    path: '/evolve2',
    name: 'evolve',
    component: () => import('../pages/evolve/Evolve.vue')
  },
  {
    path: '/pcrwiki',
    name: 'pcrwiki',
    component: () => import('../pages/pcrwiki/PcrWiki.vue'),
    beforeEnter(to, from, next) {
      window.location.href = "https://pcrwiki.moelink.site";
    }
  },
  {
    path: '/gbf',
    name: 'gbf',
    component: () => import('../pages/gbf/GranBlue.vue'),
    children: [
      {
        path: '',
        name: 'gbf-home',
        component: () => import('../pages/gbf/Index.vue')
      }
      // { path: 'about', component: () => import('../pages/gbf/About.vue') }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../pages/admin/Admin.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: 'itemlist',
        component: () => import('../pages/admin/ItemList.vue')
      },
      {
        path: 'userlist',
        component: () => import('../pages/admin/UserList.vue')
      }
    ]
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../pages/forums/Forums.vue')
  },
  {
    path: '/res',
    name: 'result',
    component: () => import('../pages/forums/Result.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 路由守卫（目前注释掉，如需要可启用）
// router.beforeEach((to, from, next) => {
//   if (to.matched.some(record => record.meta?.requiresAuth)) {
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
//   } else if (to.matched.some(record => record.meta?.requiresAdmin)) {
//     if (!(User.logined && User.group >= 100)) {
//       console.log("need admin login");
//       next({
//         path: '/',
//         // query: { redirect: to.fullPath }
//       });
//     } else {
//       next();
//     }
//   } else {
//     next();
//   }
// });

export default router;
