<template>
  <div id="appl">
    <filters v-if="!pageForPrint" id="sidebar" class="sidebar collapsed"></filters>
    <carte class="sidebar-map"></carte>
  </div>
</template>

<script>
import carte from './map'
import filters from './filter'

export default {
  name: 'app',
  components: {
    carte,
    filters
  },
  computed: {
    pageForPrint () {
      return this.$store.state.pageForPrint
    }
  },
  created () {
    if (this.$route.query) {
      if (this.$route.query.digest === this.$store.getters.configDigest) {
        this.$store.commit('set_criteria_list', this.$route.query.filters)
      }
      if (this.$route.query.services) {
        this.$store.commit('set_services_selected', this.$route.query.services.split(';;'))
      }
      if (this.$route.query.data) {
        this.$store.commit('set_localLevelData', this.$route.query.data)
      }
      if (this.$route.query.display) {
        this.$store.commit('set_localLevelDisplay', this.$route.query.display)
      }
      if (this.$route.query.dividende) {
        this.$store.commit('set_dividende', this.$route.query.dividende)
      }
      if (this.$route.query.divisor) {
        this.$store.commit('set_divisor', this.$route.query.divisor)
      }
      if (this.$route.query.accB && this.$route.query.accE) {
        this.$store.commit('set_acc_dates', [this.$route.query.accB, this.$route.query.accE])
      }
      if (this.$route.query.pveB && this.$route.query.pveE) {
        this.$store.commit('set_pve_dates', [this.$route.query.pveB, this.$route.query.pveE])
      }
      if (this.$route.query.pageForPrint) {
        this.$store.commit('set_page_for_print', true)
      }
    }
    this.$store.dispatch('replace_url_query')
  }
}
</script>

<style>
html, body, #app, #appl {
  height: 100%;
  width: 100%;
  margin: 0px;
}

.hideWelcomeMessage {
  display: none;
}
</style>
