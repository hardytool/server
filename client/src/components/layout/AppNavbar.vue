<template>
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <RouterLink class="navbar-item" to="/">
        <strong>RD2L</strong>
      </RouterLink>
      <a
        role="button"
        class="navbar-burger"
        :class="{ 'is-active': burgerOpen }"
        aria-label="menu"
        aria-expanded="false"
        @click="burgerOpen = !burgerOpen"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div class="navbar-menu" :class="{ 'is-active': burgerOpen }">
      <div class="navbar-start">
        <RouterLink class="navbar-item" to="/">Home</RouterLink>
        <RouterLink class="navbar-item" to="/rules">Rules</RouterLink>
        <RouterLink class="navbar-item" to="/inhouserules">Inhouse Rules</RouterLink>
        <RouterLink class="navbar-item" to="/seasons">Seasons</RouterLink>
        <RouterLink class="navbar-item" to="/bracket">Bracket</RouterLink>
        <RouterLink
          v-if="activeSeason"
          class="navbar-item"
          :to="`/register`"
        >Register</RouterLink>
      </div>

      <div class="navbar-end">
        <div v-if="auth.user" class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link">
            <figure class="image is-24x24" style="margin-right: 0.5rem; display: inline-block;">
              <img :src="auth.user.avatar" :alt="auth.user.displayName" />
            </figure>
            {{ auth.user.displayName }}
          </a>
          <div class="navbar-dropdown is-right">
            <RouterLink class="navbar-item" :to="`/profile/${auth.user.steamId}`">Profile</RouterLink>
            <RouterLink class="navbar-item" :to="`/profile/${auth.user.steamId}/edit`">Edit Profile</RouterLink>
            <hr class="navbar-divider" />
            <div v-if="auth.user.isAdmin" class="navbar-item has-dropdown">
              <span class="navbar-item" style="font-weight: bold;">Admin</span>
              <RouterLink class="navbar-item" to="/admin/seasons">Seasons</RouterLink>
              <RouterLink class="navbar-item" to="/admin/divisions">Divisions</RouterLink>
              <RouterLink class="navbar-item" to="/admin/players">Players</RouterLink>
              <RouterLink class="navbar-item" to="/admin/teams">Teams</RouterLink>
              <RouterLink class="navbar-item" to="/admin/series">Series</RouterLink>
              <RouterLink class="navbar-item" to="/admin/playoff-series">Playoff Series</RouterLink>
              <RouterLink class="navbar-item" to="/admin/roles">Roles</RouterLink>
              <RouterLink class="navbar-item" to="/admin/admins">Admins</RouterLink>
              <RouterLink class="navbar-item" to="/admin/admin-groups">Admin Groups</RouterLink>
              <RouterLink class="navbar-item" to="/admin/banned-players">Banned Players</RouterLink>
              <RouterLink class="navbar-item" to="/admin/ips">IP Addresses</RouterLink>
              <hr class="navbar-divider" />
            </div>
            <a class="navbar-item" href="/logout">Logout</a>
          </div>
        </div>
        <div v-else class="navbar-item">
          <a class="button is-link" href="/auth/steam">
            <span class="icon"><i class="fab fa-steam"></i></span>
            <span>Sign in with Steam</span>
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSeasonStore } from '@/stores/season'

const auth = useAuthStore()
const { activeSeason } = useSeasonStore()
const burgerOpen = ref(false)
</script>
