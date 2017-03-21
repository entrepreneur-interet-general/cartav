<template>
  <div>
    <div class="sidebar-tabs">
      <ul role="tablist">
        <li><a href="#navigation" role="tab"><i class="fa fa-compass fa-lg"></a></li>
      </ul>
    </div>

    <!-- Tab panes -->
    <div class="sidebar-content">
      <div class="sidebar-pane" id="navigation">
        <h1 class="sidebar-header">Navigation<span class="sidebar-close"><i class="glyphicon glyphicon-triangle-right"></i></span></h1>
        <hoverInfo :data="hoverInfoData"></hoverInfo>
        <legende :data="hoverInfoData"></legende>
      </div>
    </div>
  </div>
</template>

<script>
import hoverInfo from './hoverInfo'
import legend from './legend'

export default {
  components: {
    hoverInfo: hoverInfo,
    legende: legend
  },
  props: ['hoverInfoData']
}
</script>

<style>
.sidebar-tabs{
  border-right: 1px solid #bebebe;
}
</style>
