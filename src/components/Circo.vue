<template>
  <div id="circo">
    <div>Entrer un nom de circonscription de police:</div>
    <input v-model.lazy="circoSelected" type="text" list='circoList' v-on:focus="showWarning=false" autofocus>
     <datalist id='circoList'>
        <template v-for="circo in circo_liste">
           <option >{{ circo }}</option>
        </template>
     </datalist>
     <button>ok</button>
    <div class="warning" v-show="showWarning">
      {{ circoSelected }} n'est pas une circonscription de police dont nous avons le tracé.
    </div>
  </div>
</template>

<script>
import circonscriptions from '../assets/json/circonscriptions.json'

export default {
  name: 'circo',
  data () {
    return {
      circoSelected: '',
      showWarning: false
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
      let vm = this
      let theCirco = vm.circo_liste.find(circo =>
        circo.toLowerCase() === vm.circoSelected.toLowerCase()
      )

      if (theCirco) {
        let route = {
          name: 'sous-carte',
          params: { view: 'circonscription', id: theCirco }
        }
        this.$router.push(route)
        this.showWarning = false
      } else {
        this.showWarning = true
      }
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
  padding-top: 20px;
  padding-bottom: 20px;
}

input:focus {
  border: 2px solid rgb(0, 116, 217);
  border-radius: 4px;
}

.warning {
  color: red;
  padding-top: 30px;
}
</style>
