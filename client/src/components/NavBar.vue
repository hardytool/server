<template>
  <nav class="navbar is-dark" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <RouterLink class="navbar-item" to="/">
        <!-- Using :src so Vite does not attempt to bundle this server-served asset -->
        <img :src="logoSrc" alt="RD2L logo" height="28" />
        <strong class="ml-2 has-text-white">RD2L</strong>
      </RouterLink>
      <button
        class="navbar-burger"
        :class="{ 'is-active': menuOpen }"
        aria-label="menu"
        aria-expanded="false"
        @click="menuOpen = !menuOpen"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>
    </div>

    <div class="navbar-menu" :class="{ 'is-active': menuOpen }">
      <div class="navbar-start">
        <RouterLink class="navbar-item" to="/">Home</RouterLink>
        <RouterLink class="navbar-item" to="/seasons">Seasons</RouterLink>
        <RouterLink class="navbar-item" to="/divisions">Divisions</RouterLink>
      </div>

      <div class="navbar-end">
        <div class="navbar-item">
          <div class="buttons">
            <a class="button is-light is-small" href="/auth/steam">
              <span class="icon"><i class="fas fa-sign-in-alt"></i></span>
              <span>Sign in with Steam</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuOpen = ref(false)
// This image is served by the Express static middleware, not bundled by Vite.
const logoSrc = '/assets/notext.png'
</script>
