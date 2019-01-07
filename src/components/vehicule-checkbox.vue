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
  props: ['criteriaPath', 'criteria'],
  computed: {
    choice: {
      get () {
        let selection
        if (this.criteria.values.true) {
          selection = this.criteria.values.false ? 'any' : 'some'
        } else {
          selection = 'none'
        }
        return this.criteria.choices[selection]
      },
      set (newValue) {
        if (newValue === this.criteria.choices['any']) {
          for (const option of this.options) {
            option.value = true
          }
        } else if (newValue === this.criteria.choices['none']) {
          for (const option of this.options) {
            option.value = option.label !== 'true'
          }
        } else if (newValue === this.criteria.choices['some']) {
          for (const option of this.options) {
            option.value = option.label === 'true'
          }
        }
        this.$store.dispatch('set_criteria', {criteriaPath: this.criteriaPath, criterias: this.options, type: 'bulk', router: this.$router})
      }
    },
    options () {
      return [
        {label: 'false', value: this.criteria.values.false},
        {label: 'true', value: this.criteria.values.true}
      ]
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
