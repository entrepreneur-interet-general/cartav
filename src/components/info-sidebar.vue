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
      <hoverInfo :data="hoverInfoData"></hoverInfo>
      <legende :data="hoverInfoData"></legende>
    </div>
  </div>
</template>

<script>
import hoverInfo from './hoverInfo'
import legend from './legend'

export default {
  data () {
    return {
      collapsed: false
    }
  },
  components: {
    hoverInfo: hoverInfo,
    legende: legend
  },
  props: ['hoverInfoData']
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
</style>
