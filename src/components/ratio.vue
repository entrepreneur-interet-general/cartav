<template>
  <div id='ratio'>
  <p>Métrique utilisée pour colorer la carte :</p>
  <div class="form-group">
    <label for="dividende">Nombre de</label>
    <select v-model="dividende" class="form-control" id="dividende">
      <option>accidents</option>
      <option>PVE</option>
      <option>habitants</option>
    </select>
  </div>
  <div class="form-group">
    <label for="divisor">par</label>
    <select v-model="divisor" class="form-control" id="divisor">
      <option>accidents</option>
      <option>PVE</option>
      <option>habitants</option>
    </select>
  </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      dividende: this.$store.state.dividende,
      divisor: this.$store.state.divisor
    }
  },
  watch: {
    dividende () {
      this.$store.commit('set_dividende', this.dividende)
    },
    divisor () {
      this.$store.commit('set_divisor', this.divisor)
    }
  },
  mounted () {
    this.$store.commit('set_dividende', 'accidents')
    this.$store.commit('set_divisor', 'habitants')
  },
  props: []
}
</script>

<style>
</style>
