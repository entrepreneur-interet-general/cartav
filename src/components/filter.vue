<template>
  <div id="filters">

    <button data-toggle="collapse" data-target="#demo">Collapsible</button>
    <div id="demo" class="collapse">
      Lorem ipsum dolor text....
    </div>

    <form>
        <span v-for="(category, category_name) in get_criteria_list">
            <h2>{{ category_name }}</h2>
            <span v-for="(criteria, criteria_name) in category">
                <h3>{{ criteria_name }}</h3>
                    <span v-for="(val, val_name) in criteria.values">
                      <input type="checkbox" value="criteria_name" v-on:click="set_criteria(category_name+'.'+criteria_name+'.values.'+val_name, !val)" :checked="val"> {{val_name }}<br>                        
                      </span>
                    </span>
                <hr>
            </span>
    </form>
  </div>
</template>

<script>
export default {
  computed: {
    get_criteria_list () {
      return this.$store.state.criteria_list
    }
  },
  methods: {
    set_criteria (criteriaPath, value) {
      this.$store.dispatch('set_criteria', {criteriaPath: criteriaPath, value: value})
    }
  },
  mounted () {
    this.$store.dispatch('queryES')
  }
}
</script>

<style>
#filters {
    width: 250px;
    height: 100%;
    overflow: scroll;
    float: left;
}
</style>
