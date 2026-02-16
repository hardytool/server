import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SeasonsView from '../views/SeasonsView.vue'
import DivisionsView from '../views/DivisionsView.vue'
import DivisionView from '../views/DivisionView.vue'
import PlayersView from '../views/PlayersView.vue'

// The SPA is mounted at /app, so the history base must match.
const router = createRouter({
  history: createWebHistory('/app/'),
  routes: [
    { path: '/', component: HomeView },
    { path: '/seasons', component: SeasonsView },
    { path: '/divisions', component: DivisionsView },
    { path: '/divisions/:divisionId', component: DivisionView },
    {
      path: '/seasons/:seasonId/divisions/:divisionId/players',
      component: PlayersView,
    },
  ],
})

export default router
