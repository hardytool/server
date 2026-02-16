import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue') },
    { path: '/rules', component: () => import('@/views/RulesView.vue') },
    { path: '/inhouserules', component: () => import('@/views/InhouseRulesView.vue') },
    { path: '/seasons', component: () => import('@/views/SeasonsListView.vue') },
    { path: '/bracket', component: () => import('@/views/BracketView.vue') },
    {
      path: '/register',
      component: () => import('@/views/RegistrationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/seasons/:season_id/divisions/:division_id/register',
      component: () => import('@/views/RegistrationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/seasons/:season_id/divisions/:division_id/players',
      component: () => import('@/views/PlayersListView.vue'),
    },
    {
      path: '/seasons/:season_id/divisions/:division_id/captains',
      component: () => import('@/views/CaptainsListView.vue'),
    },
    {
      path: '/seasons/:season_id/divisions/:division_id/standins',
      component: () => import('@/views/StandinsListView.vue'),
    },
    {
      path: '/seasons/:season_id/divisions/:division_id/standings/:round?',
      component: () => import('@/views/StandingsView.vue'),
    },
    {
      path: '/seasons/:season_id/divisions/:division_id/matchups/:round?',
      component: () => import('@/views/MatchupsView.vue'),
    },
    {
      path: '/seasons/:season_id/divisions/:division_id/teams',
      component: () => import('@/views/TeamListView.vue'),
    },
    {
      path: '/teams/:team_id',
      component: () => import('@/views/RosterView.vue'),
    },
    { path: '/profile/:steam_id', component: () => import('@/views/ProfileView.vue') },
    {
      path: '/profile/:steam_id/edit',
      component: () => import('@/views/ProfileEditView.vue'),
      meta: { requiresAuth: true },
    },
    // Admin routes
    {
      path: '/admin/players',
      component: () => import('@/views/admin/PlayerManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/seasons',
      component: () => import('@/views/admin/SeasonManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/divisions',
      component: () => import('@/views/admin/DivisionManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/teams',
      component: () => import('@/views/admin/TeamManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/teams/:team_id/roster',
      component: () => import('@/views/admin/RosterManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/series',
      component: () => import('@/views/admin/SeriesManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/playoff-series',
      component: () => import('@/views/admin/PlayoffSeriesManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/roles',
      component: () => import('@/views/admin/RoleManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/admins',
      component: () => import('@/views/admin/AdminManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/admin-groups',
      component: () => import('@/views/admin/AdminGroupManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/banned-players',
      component: () => import('@/views/admin/BannedPlayerManageView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/ips',
      component: () => import('@/views/admin/IpsView.vue'),
      meta: { requiresAdmin: true },
    },
    // Catch-all 404
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.fetchMe()
  }
  if (to.meta.requiresAdmin && !auth.user?.isAdmin) {
    return '/'
  }
  if (to.meta.requiresAuth && !auth.user) {
    return { path: '/' }
  }
})

export default router
