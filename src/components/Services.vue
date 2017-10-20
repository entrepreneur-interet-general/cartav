<template>
  <div id="services">
    <h4>
      Services
      <span v-if="servicesSelected.length" id="deleteServices" @click="emptyServices">Tout effacer</span>
    </h4>
    <input v-model="newService" type="text" @focus="focus = true" @blur="focus = false" autofocus>
  <div id="servicesSuggestions" v-if="newService">
    <div v-for="(s,i) in filteredServices" @mouseover="index = i" @click="pushService(s.value)" :class="{highlighted: i == index}">
      <span v-html="s.display"></span>
    </div>
  </div>
  <ul>
    <li v-for="(s,i) in servicesSelected">
      {{ s }}
      <span @click="deleteService(i)" class="oneService">supprimer</span>
    </li>
  </ul>
  </div>
</template>

<script>
export default {
  name: 'services',
  data () {
    return {
      newService: '',
      focus: true,
      index: 0
    }
  },
  computed: {
    services_list () {
      return this.$store.state.services_list
    },
    servicesSelected () {
      return this.$store.state.services_selected.list
    },
    filteredServices () {
      const vm = this
      if (vm.newService) {
        let l = vm.newService.toLowerCase().split(' ')
        return this.services_list
          .filter(service => l.every(e => service.toLowerCase().includes(e)))
          .map(function (s) {
            let res = s
            for (let word of l) {
              let length = word.length
              let position = res.toLowerCase().indexOf(word)
              res = res.slice(0, position) + '<strong>' + res.slice(position, position + length) + '</strong>' + res.slice(position + length)
            }
            return {display: res, value: s}
          })
      } else {
        return []
      }
    }
  },
  methods: {
    pushService (s) {
      this.newService = ''
      const servicesSelected = this.servicesSelected.slice(0)
      servicesSelected.push(s)
      this.$store.dispatch('set_services_selected', servicesSelected)
    },
    emptyServices () {
      this.$store.dispatch('set_services_selected', [])
    },
    deleteService (i) {
      const servicesSelected = this.servicesSelected.slice(0)
      servicesSelected.splice(i, 1)
      this.$store.dispatch('set_services_selected', servicesSelected)
    }
  },
  watch: {
    newService () {
      this.index = 0
    }
  },
  mounted () {
    const vm = this
    this.$store.dispatch('set_services_list')
    document.getElementById('services').onkeydown = function (e) {
      switch (e.keyCode) {
        case 13:
        // touche entrée
          if (vm.focus && vm.filteredServices.length) { vm.pushService(vm.filteredServices[vm.index].value) }
          break
        case 38:
        // touche flêche haut
          if (vm.focus && vm.index) { vm.index-- }
          break
        case 40:
        // touche flêche bas
          if (vm.focus && vm.index < vm.filteredServices.length - 1) { vm.index++ }
          break
      }
    }
  }
}
</script>

<style>
#servicesSuggestions > div > span > strong {
  color: rgb(0, 116, 217);
  font-weight: bold;
}
</style>

<style scoped>
li {
  list-style-type: '- ';
}

#services:hover > h4 > #deleteServices, li:hover >.oneService {
  cursor: pointer;
  display: inline;
  padding-left: 20px;
  font-size: 12px;
  color: grey;
}

#deleteServices, .oneService {
  display: None;
}

#servicesSuggestions {
  position: static;
  width: 100%;
  background-color: white;
  border: 2px solid grey;
  border-radius: 5px;
}

.highlighted {
  background-color: lightblue;
  cursor: pointer;
}

#servicesSuggestions > div {
  padding: 3px;
}

#services {
  padding-top: 20px;
  padding-bottom: 20px;
}

input[type="text"] {
    width: 100%;
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
