<template>
  <span>
    <select v-model="choice">
      <option v-for="c in criteria.choices">{{ c }}</option>
    </select>
    <br>
  </span>
</template>

<script>
export default {
  name: 'vehiculeFilter',
  data () {
    return {
      choice: this.criteria.choices['any'],
      options: [
        {label: '0', value: true},
        {label: '1', value: true},
        {label: '2', value: true},
        {label: '3+', value: true}
      ]
    }
  },
  props: ['criteriaPath', 'criteria'],
  watch: {
    choice () {
      if (this.choice === this.criteria.choices['any']) {
        for (let option of this.options) {
          option.value = true
        }
      } else if (this.choice === this.criteria.choices['none']) {
        for (let option of this.options) {
          if (option.label === '0') {
            option.value = true
          } else {
            option.value = false
          }
        }
      } else if (this.choice === this.criteria.choices['some']) {
        for (let option of this.options) {
          if (option.label === '0') {
            option.value = false
          } else {
            option.value = true
          }
        }
      }
      this.$store.dispatch('set_criteria', {criteriaPath: this.criteriaPath, criterias: this.options, type: 'bulk'})
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
select {
  width: 100%;
  height: 35px;
  background-color: white;
  border-color: rgb(209, 211, 212);
}
</style>
