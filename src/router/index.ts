import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { userInstance as User } from '../types/User'

// 扩展路由记录类型
declare module 'vue-router' {
  interface RouteMeta {
    requiresAdmin?: boolean
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/Home.vue'),
  },
  {
    path: '/blog',
    name: 'blog',
    component: () => import('../pages/blog/BlogList.vue'),
  },
  {
    path: '/blog/:id(\\d+)',
    name: 'blog-detail',
    component: () => import('../pages/blog/BlogDetail.vue'),
  },
  {
    path: '/threads',
    name: 'threads',
    component: () => import('../pages/threads/Threads.vue'),
  },
  {
    path: '/threads/new',
    name: 'thread-new',
    component: () => import('../pages/threads/ThreadNew.vue'),
  },
  {
    path: '/wallet',
    name: 'wallet',
    component: () => import('../pages/wallet/Wallet.vue'),
  },
  {
    path: '/threads/:id(\\d+)',
    name: 'thread-detail',
    component: () => import('../pages/threads/ThreadDetail.vue'),
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('../pages/shop/Shop.vue'),
  },
  {
    path: '/alphasoul',
    name: 'alphasoul',
    component: () => import('../pages/alphasoul/App.vue'),
    children: [
      {
        path: '',
        name: 'alphasoul-home',
        component: () => import('../pages/alphasoul/Index.vue'),
      },
      {
        path: 'game',
        name: 'alphasoul-game',
        component: () => import('../pages/alphasoul/NetGame.vue'),
      },
      {
        path: 'auto',
        name: 'alphasoul-auto',
        component: () => import('../pages/alphasoul/NetWatcher.vue'),
      },
      {
        path: 'tool',
        name: 'alphasoul-tool',
        component: () => import('../pages/alphasoul/MajTool.vue'),
      },
      {
        path: 'test',
        name: 'alphasoul-test',
        component: () => import('../pages/alphasoul/MajCanvas.vue'),
      },
    ],
  },
  {
    path: '/miao',
    name: 'miao',
    component: () => import('../pages/home/Miao.vue'),
    children: [
      {
        path: '',
        name: 'miao-home',
        component: () => import('../pages/home/views/Index.vue'),
      },
      {
        path: 'about',
        name: 'miao-about',
        component: () => import('../pages/home/views/About.vue'),
      },
      {
        path: 'intro',
        name: 'miao-intro',
        component: () => import('../pages/home/views/SiteIntro.vue'),
      },
      {
        path: 'member',
        name: 'miao-member',
        component: () => import('../pages/home/views/Member.vue'),
      },
      {
        path: 'download',
        name: 'miao-download',
        component: () => import('../pages/home/views/Download.vue'),
      },
      {
        path: 'danmu',
        name: 'miao-danmu',
        component: () => import('../pages/home/views/Danmaku.vue'),
      },
      {
        path: 'news',
        name: 'miao-news',
        component: () => import('../pages/home/views/News.vue'),
      },
      {
        path: 'works',
        name: 'miao-works',
        component: () => import('../pages/home/views/Works.vue'),
      },
      {
        path: 'dev',
        name: 'miao-dev',
        component: () => import('../pages/home/views/Plan.vue'),
      },
      {
        path: 'dev/:id',
        name: 'miao-devpage',
        component: () => import('../pages/home/views/dev/PlanPage.vue'),
      },
      {
        path: 'goods',
        name: 'miao-goods',
        component: () => import('../pages/home/views/Goods.vue'),
      },
      {
        path: 'link',
        name: 'miao-link',
        component: () => import('../pages/home/views/Link.vue'),
      },
      {
        path: 'status',
        name: 'miao-status',
        component: () => import('../pages/home/views/Status.vue'),
      },
    ],
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../pages/admin/Admin.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-home',
        redirect: '/admin/users',
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../pages/admin/UserTable.vue'),
      },
      {
        path: 'blog',
        name: 'admin-blog',
        component: () => import('../pages/admin/BlogAdmin.vue'),
      },
      {
        path: 'threads',
        name: 'admin-threads',
        component: () => import('../pages/admin/ThreadsAdmin.vue'),
      },
      {
        path: 'mocoin',
        name: 'admin-mocoin',
        component: () => import('../pages/admin/MocoinAdmin.vue'),
      },
      {
        path: 'shop',
        name: 'admin-shop',
        component: () => import('../pages/admin/ShopAdmin.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫：admin 页需要登录且 group >= 100
router.beforeEach((to) => {
  if (to.meta.requiresAdmin) {
    if (!(User.logined && User.isAdmin())) {
      return { path: '/', query: { redirect: to.fullPath } }
    }
  }
  return true
})

export default router
