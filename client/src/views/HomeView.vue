<template>
  <section class="hero is-dark">
    <div class="hero-body">
      <p class="title">RD2L</p>
      <p class="subtitle">Reddit Dota 2 League</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="columns is-multiline">
        <div class="column is-one-third">
          <div class="card">
            <div class="card-content">
              <p class="title is-5">Seasons</p>
              <p class="content">Browse all league seasons and their divisions.</p>
            </div>
            <footer class="card-footer">
              <RouterLink class="card-footer-item" to="/seasons">View seasons</RouterLink>
            </footer>
          </div>
        </div>

        <div class="column is-one-third">
          <div class="card">
            <div class="card-content">
              <p class="title is-5">Divisions</p>
              <p class="content">See all active divisions and their administrators.</p>
            </div>
            <footer class="card-footer">
              <RouterLink class="card-footer-item" to="/divisions">View divisions</RouterLink>
            </footer>
          </div>
        </div>

        <div class="column is-one-third">
          <div class="card">
            <div class="card-content">
              <p class="title is-5">Rules</p>
              <p class="content">Read the full league rules before registering.</p>
            </div>
            <footer class="card-footer">
              <a class="card-footer-item" href="/rules">View rules</a>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
