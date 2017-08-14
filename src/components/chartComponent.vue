<template>
  <div id='pieChart'>
  <pieChart :chart-data="chartData" :options="{legend: {display: true, position: 'bottom', labels: {boxWidth: 10, padding: 3, fontColor: '#333'}}}"></pieChart>
  </div>
</template>



<script>
import pieChart from '../assets/js/pieChart.js'

export default {
  components: {
    pieChart
  },
  props: ['chartData'],
  computed: {
  },
  methods: {
  }
}
</script>

<style>
#pieChart {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  overflow: hidden;
  z-index: 2000;
  background-color: rgba(255, 255, 255, 0.90);
  cursor: auto;
}
@media (min-width: 768px) {
  #pieChart {
    padding: 10px;
    border-radius: 4px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    bottom: 20px;
    right: 10px;
    width: 300px;
    height: 350px;
  }
}
</style>
