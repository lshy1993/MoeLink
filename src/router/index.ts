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
    path: '/blog/manage',
    name: 'blog-manage',
    component: () => import('../pages/blog/BlogManage.vue'),
  },
  {
    path: '/blog/:id(\\d+)',
    name: 'blog-detail',
    component: () => import('../pages/blog/BlogDetail.vue'),
  },
  {
    path: '/miao',
    name: 'miao',
    component: () => import('../pages/miao/MiaoList.vue'),
  },
  {
    path: '/miao/:id(\\d+)',
    name: 'miao-detail',
    component: () => import('../pages/miao/MiaoDetail.vue'),
  },
  {
    path: '/links',
    name: 'links',
    component: () => import('../pages/links/Link.vue'),
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
    path: '/shop/orders',
    name: 'shop-orders',
    component: () => import('../pages/shop/MyOrders.vue'),
  },
  {
    path: '/shop/groups',
    redirect: '/shop',
  },
  {
    path: '/shop/groups/new',
    name: 'shop-group-new',
    component: () => import('../pages/shop/GroupBuyCreate.vue'),
  },
  {
    path: '/shop/groups/:id(\\d+)',
    name: 'shop-group-detail',
    component: () => import('../pages/shop/GroupBuyDetail.vue'),
  },
  {
    path: '/shop/my-groups',
    name: 'shop-my-groups',
    component: () => import('../pages/shop/MyGroupBuys.vue'),
  },
  {
    path: '/shop/:id(\\d+)',
    name: 'shop-detail',
    component: () => import('../pages/shop/ProductDetail.vue'),
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
        path: 'miao',
        name: 'admin-miao',
        component: () => import('../pages/admin/BlogAdmin.vue'),
        props: { base: '/miao', withCategory: true, heading: '小屋文章' },
      },
      {
        path: 'threads',
        name: 'admin-threads',
        component: () => import('../pages/admin/ThreadsAdmin.vue'),
      },
      {
        path: 'moecoin',
        name: 'admin-moecoin',
        component: () => import('../pages/admin/MoecoinAdmin.vue'),
      },
      {
        path: 'shop',
        name: 'admin-shop',
        component: () => import('../pages/admin/ShopAdmin.vue'),
      },
      {
        path: 'shop/group-buys',
        name: 'admin-shop-group-buys',
        component: () => import('../pages/admin/ShopGroupBuys.vue'),
      },
      {
        path: 'announcements',
        name: 'admin-announcements',
        component: () => import('../pages/admin/AnnouncementAdmin.vue'),
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
