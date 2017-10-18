const constants = {
  PVE: 'pve',
  ACC: 'acc',
  ACC_NO_PVE: 'accidentsNoPve',
  PVE_NO_ACC: 'pveNoAccidents',
  HEATMAP: 'heatmap',
  AGG_BY_ROAD: 'aggregatedByRoad',
  CLUSTER: 'cluster'
}

const strings = {
  [constants.PVE]: 'PV électroniques',
  [constants.ACC]: 'Accidents',
  [constants.ACC_NO_PVE]: 'Axes avec accidents, sans PV électroniques',
  [constants.PVE_NO_ACC]: 'Axes avec PV électroniques, sans accidents'
}

export {strings, constants}
export default constants
