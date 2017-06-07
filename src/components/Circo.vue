<template>
  <div id="circo">
    <div>Entrer un nom de circonscription:</div>
    <input v-model.lazy="circoSelected" type="text" list='list'>
     <datalist id='list'>
        <template v-for="circo in circo_liste">
           <option >{{ circo }}</option>
        </template>
     </datalist>
     <button>ok</button>
     {{ circoSelected }}
  </div>
</div>
</template>

<script>
import circonscriptions from '../assets/json/circonscriptions.json'
import jQuery from 'jquery'
global.jQuery = jQuery
require('bootstrap')

export default {
  name: 'circo',
  data () {
    return {
      circoSelected: ''
    }
  },
  computed: {
    circo_liste () {
      let list = []
      for (let circo of circonscriptions.features) {
        list.push(circo.properties.nom_circo)
      }
      return list
    }
  },
  watch: {
    circoSelected () {
      let route = {
        name: 'sous-carte',
        params: { view: 'circonscription', id: this.circoSelected }
      }
      this.$router.push(route)
    }
  }
}
</script>

<style>
html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0px;
}

#circo {
  text-align: center;
  padding-top: 150px;
}
</style>
