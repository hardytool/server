<template>
  <footer class="footer">
    <div class="content has-text-centered">
      <p>RD2L &copy; {{ year }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
