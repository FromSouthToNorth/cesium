export const RootRoute = {
  path: '/',
  name: 'Root',
  redirect: '/index',
  meta: {
    title: 'Root',
  },
}

export const IndexRoute = {
  path: '/',
  name: 'Index',
  component: () => import('@/layouts/default/index.vue'),
  redirect: '/index',
  meta: {
    title: 'Index',
  },
  children: [
    {
      path: '/index',
      name: 'map',
      component: () => import('@/views/index.vue'),
      meta: {
        title: '主页',
      },
    }
  ],
}

export const basicRoutes = [
  RootRoute,
  IndexRoute,
]
