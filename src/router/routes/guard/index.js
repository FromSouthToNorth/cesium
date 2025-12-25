export function setupRouterGuard(router) {
  createPageLoadingGuard(router)
}

function createPageLoadingGuard(router) {
  router.beforeEach(async (to) => {
    if (to.meta.loading) return true
    return true
  })
  router.afterEach(async () => {
    return true
  })
}
