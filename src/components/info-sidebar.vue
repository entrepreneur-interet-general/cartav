<template>
  <div v-if="!mobile" v-bind:class="{ collapsed: collapsed }">
    <div id='info-sidebar-header'>
      <span v-if='!collapsed'>
        <i class="glyphicon glyphicon-triangle-right" v-on:click='collapsed = !collapsed'></i>
        <span id='header-title'>CARTAV</span>
      </span>
      <span id='header-icon' v-on:click='collapsed = !collapsed'><i class="fa fa-compass fa-lg"></i></span>
    </div>
    <div id='info-sidebar-content'>
      <button type="button" class="btn btn-default" v-on:click='restore'><i class="fa fa-level-up"></i> Niveau supérieur</button>
      <hr>
      <circo v-if="levelIsCirco"></circo>
      <hoverInfo :data="infoSidebarData.hoverInfoData"></hoverInfo>
      <hr>
      <filterSummary></filterSummary>
    </div>
  </div>
</template>

<script>
import hoverInfo from './hoverInfo'
import circo from './Circo'
import L from 'leaflet'
import filterSummary from './filterSummary'

export default {
  data () {
    return {
      collapsed: false
    }
  },
  components: {
    hoverInfo,
    circo,
    filterSummary
  },
  computed: {
    levelIsCirco () {
      return this.$store.getters.levelIsCirco
    },
    mobile () {
      return L.Browser.mobile
    }
  },
  methods: {
    restore () {
      this.$router.push({path: '/carte'})
    }
  },
  props: ['infoSidebarData']
}
</script>

<style>
#info-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  max-height: 70%;
  overflow: auto;
  z-index: 1700;
  background-color: rgba(255, 255, 255, 0.90);
  cursor: auto;
}
@media (min-width: 768px) {
  #info-sidebar {
    border-radius: 4px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    top: 10px;
    right: 10px;
    transition: width 500ms;
    width: 300px;
    padding-bottom: 10px;
  }
}
#info-sidebar.collapsed {
  width: 40px;
  height: 40px;
  overflow: hidden;
}

.collapsed #info-sidebar-header {
  background-color: white;
  color: rgb(51, 51, 51);
}

#info-sidebar-header {
  height: 40px;
  line-height: 37px;
  padding-left: 10px;
  font-size: 14.4pt;
  color: #fff;
  background-color: #0074d9;
}

#header-title {
  padding-left: 10px;
}
#header-icon {
  position: absolute;
  right: 0;
  padding-right: 7px;
}

#info-sidebar-header i {
  cursor: pointer;
}

#info-sidebar-content {
  padding-top: 10px;
  padding-left: 10px;

}
#info-sidebar.collapsed #info-sidebar-content{
  display: none;
}

#pie-chart {
  position: absolute;
  bottom: 20px;
  width: 100%;
}
</style>
