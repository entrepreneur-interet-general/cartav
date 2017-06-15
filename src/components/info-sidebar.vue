<template>
  <div v-bind:class="{ collapsed: collapsed }">
    <div id='info-sidebar-header'>
      <span v-if='!collapsed'>
        <i class="glyphicon glyphicon-triangle-right" v-on:click='collapsed = !collapsed'></i>
        <span id='header-title'>Navigation & Légende</span>
      </span>
      <span id='header-icon' v-on:click='collapsed = !collapsed'><i class="fa fa-compass fa-lg"></i></span>
    </div>
    <div id='info-sidebar-content'>
      <hoverInfo :data="infoSidebarData.hoverInfoData"></hoverInfo>
      <div v-if="infoSidebarData.showGraph">
        <pieChart :chart-data="infoSidebarData.graphData" :options="{legend: {display: true, position: 'bottom', labels: {boxWidth: 10, padding: 3, fontColor: '#333'}}}"></pieChart>
      </div>
      <legende></legende>
    </div>
  </div>
</template>

<script>
import hoverInfo from './hoverInfo'
import legend from './legend'
import pieChart from '../assets/js/pieChart.js'

export default {
  data () {
    return {
      collapsed: false
    }
  },
  components: {
    hoverInfo: hoverInfo,
    legende: legend,
    pieChart: pieChart
  },
  props: ['infoSidebarData']
}
</script>

<style>
#info-sidebar {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  overflow: hidden;
  z-index: 2000;
  background-color: rgba(255, 255, 255, 0.90);
  cursor: auto;
}
@media (min-width: 768px) {
  #info-sidebar {
    border-radius: 4px; 
    border: 2px solid rgba(0, 0, 0, 0.2);
    top: 10px;
    bottom: 10px;
    right: 10px;
    transition: width 500ms;
    width: 300px;
  }
}
#info-sidebar.collapsed {
  width: 40px;
  height: 40px;
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
