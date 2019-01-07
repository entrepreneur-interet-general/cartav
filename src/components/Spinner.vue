<template>
  <div v-if="show" id='spinner'>
    <i class="fa fa-refresh fa-spin fa-3x fa-fw"></i>
    <h3>récupération des données en cours...</h3>
  </div>
</template>

<script>
export default {
  computed: {
    show () {
      return this.$store.state.showSpinner
    }
  }
}
</script>

<style>
  #spinner {
    padding: 10px;
    z-index: 2000;
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    text-align: center;
  }
</style>
