<template>
  <div>
    <div class="sidebar-tabs">
      <ul role="tablist">
        <li><a href="#timeFilters" role="tab"><i class="fa fa-clock-o"></i></a></li>
        <li><a href="#accidentsFilters" role="tab"><i class="fa fa-car"></i><i class="glyphicon glyphicon-fire"></i></a></li>
        <li><a href="#pveFilters" role="tab"><i class="glyphicon glyphicon-eye-open"></i> <i class="fa fa-exclamation"></i></a></li>
        <li><a href="#ratio" role="tab"><i class="fa fa-paint-brush"></i></a></li>
        <li><a href="#help" role="tab"><i class="glyphicon glyphicon-question-sign"></i></a></li>
      </ul>
    </div>

    <!-- Tab panes -->
    <div class="sidebar-content">
      <div class="sidebar-pane" id="timeFilters">
        <h1 class="sidebar-header">
          Filtres temporels (accidents et pve)
          <span class="sidebar-close"><i class="glyphicon glyphicon-triangle-left"></i></span>
        </h1>

        <div>
          <span v-for="(category, categoryName) in criteria_list">
            <span v-if="categoryName === 'PVE et accidents'">
              
              <span v-bind:id="'id'+categoryName.replace(/ /g,'_')" class="collapse in">
                <span v-for="(criteria, criteriaName) in category">
                  <h3>{{ 'display_name' in criteria ? criteria.display_name : criteriaName }}</h3>
                  <span v-for="(val, valName) in criteria.values">
                    <div class="row s-rows">
                      <div class="col-lg-8 funkyradio">
                        <div class="funkyradio-default">
                            <input type="checkbox" name="checkbox" v-bind:id=valName v-on:click="set_criteria(categoryName+'.'+criteriaName+'.values.'+valName, !val)" :checked="val"/>
                            <label v-bind:for=valName>{{valName }}</label>
                        </div>
                      <!--   <div class="checkbox">
                          <label>
                            <input type="checkbox" value="criteriaName" v-on:click="set_criteria(categoryName+'.'+criteriaName+'.values.'+valName, !val)" :checked="val"> 
                            {{valName }}
                          </label>
                        </div> -->
                      </div>
                      <div class="col-lg-2 agg_acc">
                        <span v-if="agg_acc_value(categoryName, criteriaName, valName)"> 
                        {{ agg_acc_value(categoryName, criteriaName, valName) }}
                        </span>
                      </div>
                      <div class="col-lg-2 agg_pve">
                        <span v-if="agg_pve_value(categoryName, criteriaName, valName)">
                        {{ agg_pve_value(categoryName, criteriaName, valName) }}
                        </span>
                      </div>
                      <br>
                    </div>
                  </span>
                </span>
              </span>
              <hr>
            </span>
          </span>
        </div>
      </div>

      <div class="sidebar-pane" id="accidentsFilters">
        <h1 class="sidebar-header">
          Filtres accidents
          <span class="sidebar-close"><i class="glyphicon glyphicon-triangle-left"></i></span>
        </h1>

        <div>
          <span v-for="(category, categoryName) in criteria_list">
            <span v-if="categoryName === 'Accidents'">
              
              <span v-bind:id="'id'+categoryName.replace(/ /g,'_')" class="collapse in">
                <span v-for="(criteria, criteriaName) in category">
                  <h3>{{ 'display_name' in criteria ? criteria.display_name : criteriaName }}</h3>
                  <span v-for="(val, valName) in criteria.values">
                    <div class="row s-rows">
                      <div class="col-lg-8 funkyradio">
                        <div class="funkyradio-default">
                            <input type="checkbox" name="checkbox" v-bind:id=valName v-on:click="set_criteria(categoryName+'.'+criteriaName+'.values.'+valName, !val)" :checked="val"/>
                            <label v-bind:for=valName>{{valName }}</label>
                        </div>
                      <!--   <div class="checkbox">
                          <label>
                            <input type="checkbox" value="criteriaName" v-on:click="set_criteria(categoryName+'.'+criteriaName+'.values.'+valName, !val)" :checked="val"> 
                            {{valName }}
                          </label>
                        </div> -->
                      </div>
                      <div class="col-lg-2 agg_acc">
                        <span v-if="agg_acc_value(categoryName, criteriaName, valName)"> 
                        {{ agg_acc_value(categoryName, criteriaName, valName) }}
                        </span>
                      </div>
                      <div class="col-lg-2 agg_pve">
                        <span v-if="agg_pve_value(categoryName, criteriaName, valName)">
                        {{ agg_pve_value(categoryName, criteriaName, valName) }}
                        </span>
                      </div>
                      <br>
                    </div>
                  </span>
                </span>
              </span>
              <hr>
            </span>
          </span>
        </div>
      </div>

      <div class="sidebar-pane" id="pveFilters">
        <h1 class="sidebar-header">
          Filtres PVE
          <span class="sidebar-close"><i class="glyphicon glyphicon-triangle-left"></i></span>
        </h1>

        <div>
          <span v-for="(category, categoryName) in criteria_list">
            <span v-if="categoryName === 'PVE'">
              
              <span v-bind:id="'id'+categoryName.replace(/ /g,'_')" class="collapse in">
                <span v-for="(criteria, criteriaName) in category">
                  <h3>{{ 'display_name' in criteria ? criteria.display_name : criteriaName }}</h3>
                  <span v-for="(val, valName) in criteria.values">
                    <div class="row s-rows">
                      <div class="col-lg-8 funkyradio">
                        <div class="funkyradio-default">
                            <input type="checkbox" name="checkbox" v-bind:id=valName v-on:click="set_criteria(categoryName+'.'+criteriaName+'.values.'+valName, !val)" :checked="val"/>
                            <label v-bind:for=valName>{{valName }}</label>
                        </div>
                      <!--   <div class="checkbox">
                          <label>
                            <input type="checkbox" value="criteriaName" v-on:click="set_criteria(categoryName+'.'+criteriaName+'.values.'+valName, !val)" :checked="val"> 
                            {{valName }}
                          </label>
                        </div> -->
                      </div>
                      <div class="col-lg-2 agg_acc">
                        <span v-if="agg_acc_value(categoryName, criteriaName, valName)"> 
                        {{ agg_acc_value(categoryName, criteriaName, valName) }}
                        </span>
                      </div>
                      <div class="col-lg-2 agg_pve">
                        <span v-if="agg_pve_value(categoryName, criteriaName, valName)">
                        {{ agg_pve_value(categoryName, criteriaName, valName) }}
                        </span>
                      </div>
                      <br>
                    </div>
                  </span>
                </span>
              </span>
              <hr>
            </span>
          </span>
        </div>
      </div>

      <div class="sidebar-pane" id="ratio">
        <h1 class="sidebar-header">Couleurs de la carte<span class="sidebar-close"><i class="glyphicon glyphicon-triangle-left"></i></span></h1>
          <ratio></ratio>
      </div>

      <div class="sidebar-pane" id="help">
        <h1 class="sidebar-header">Aide<span class="sidebar-close"><i class="glyphicon glyphicon-triangle-left"></i></span></h1>
          <div>Bon ici c'est l'aide.</div>
      </div>
    </div>
  </div>
</template>

<script>
import ratio from './ratio'

function niceDisplay (n) {
  // Gère l'affichage des nombres dans les clusters
  if (n > 1000000) {
    n = Math.round(n / 10000) / 100 + 'm'
  }
  if (n > 10000) {
    n = Math.round(n / 1000) + 'k'
  } else if (n > 1000) {
    n = Math.round(n / 100) / 10 + 'k'
  }
  return n
}

export default {
  components: {
    ratio: ratio
  },
  computed: {
    criteria_list () {
      return this.$store.state.criteria_list
    },
    level () {
      return this.$store.state.level
    },
    agg_acc () {
      return this.$store.state.accidents_value_by_filter
    },
    agg_pve () {
      return this.$store.state.pve_value_by_filter
    }
  },
  methods: {
    set_criteria (criteriaPath, value) {
      this.$store.dispatch('set_criteria', {criteriaPath: criteriaPath, value: value})
    },
    agg_pve_value (categoryName, criteriaName, valName) {
      return niceDisplay(this.agg_pve[categoryName + '.' + criteriaName + '.' + valName])
    },
    agg_acc_value (categoryName, criteriaName, valName) {
      return niceDisplay(this.agg_acc[categoryName + '.' + criteriaName + '.' + valName])
    }
  }
}
</script>

<style>
/*.sidebar-tabs > ul > li.active {
  background-color: black;
}*/




.sidebar-tabs{
  border-right: 1px solid #bebebe;
}
.checkbox{
  margin: 3px 0px;
}
.agg_acc {
  color: rgba(253, 32, 32, 1.0);
  background-color: rgba(253, 32, 32, 0.1);
}
.agg_pve {
  color: rgba(9, 9, 253, 1.0);
  background-color: rgba(9, 9, 253, 0.1);
}
.categoryTitle {
  background-color: #bebebe;
  margin: 0px -20px;
  text-align: center;
  padding: 10px 0px;
  font-weight: bold;
  font-size: 18px;
}
/*
#filters > div {
  margin-top: 30px;
}
*/
.sidebar-content > .sidebar-pane > div {
  margin-top: 30px;
  padding-right: 40px;
}


/* FUNKY CHECKBOXES*/
.funkyradio div {
  clear: both;
  overflow: hidden;
}

.funkyradio label {
  width: 100%;
  border-radius: 3px;
  border: 1px solid #D1D3D4;
  font-weight: normal;
}

.funkyradio input[type="checkbox"]:empty {
  display: none;
}

.funkyradio input[type="checkbox"]:empty ~ label {
  position: relative;
  line-height: 2.5em;
  text-indent: 3.25em;
  /*margin-top: 2em;*/
  cursor: pointer;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
}

.funkyradio input[type="checkbox"]:empty ~ label:before {
  position: absolute;
  display: block;
  top: 0;
  bottom: 0;
  left: 0;
  content: '';
  width: 2.5em;
  background: #D1D3D4;
  border-radius: 3px 0 0 3px;
}

.funkyradio input[type="checkbox"]:hover:not(:checked) ~ label {
  color: #888;
}

.funkyradio input[type="checkbox"]:hover:not(:checked) ~ label:before {
  content: '\2714';
  text-indent: .9em;
  color: #C2C2C2;
}

.funkyradio input[type="checkbox"]:checked ~ label {
  color: #777;
}

.funkyradio input[type="checkbox"]:checked ~ label:before {
  content: '\2714';
  text-indent: .9em;
  color: #333;
  background-color: #ccc;
}

.funkyradio input[type="checkbox"]:focus ~ label:before {
  box-shadow: 0 0 0 3px #999;
}

.funkyradio-default input[type="checkbox"]:checked ~ label:before {
  color: #333;
  background-color: #ccc;
}

.funkyradio-primary input[type="checkbox"]:checked ~ label:before {
  color: #fff;
  background-color: #337ab7;
}

.funkyradio-success input[type="checkbox"]:checked ~ label:before {
  color: #fff;
  background-color: #5cb85c;
}

.funkyradio-danger input[type="checkbox"]:checked ~ label:before {
  color: #fff;
  background-color: #d9534f;
}

.funkyradio-warning input[type="checkbox"]:checked ~ label:before {
  color: #fff;
  background-color: #f0ad4e;
}

.funkyradio-info input[type="checkbox"]:checked ~ label:before {
  color: #fff;
  background-color: #5bc0de;
}

</style>
