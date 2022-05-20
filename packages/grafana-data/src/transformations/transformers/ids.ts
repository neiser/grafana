export enum DataTransformerID {
  // join = 'join', // Pick a field and merge all series based on that field
  append = 'append',
  //  rotate = 'rotate', // Columns to rows
  reduce = 'reduce',
  order = 'order',
  organize = 'organize',
  rename = 'rename',
  calculateField = 'calculateField',
  seriesToColumns = 'seriesToColumns',
  seriesToRows = 'seriesToRows',
  merge = 'merge',
  concatenate = 'concatenate',
  labelsToFields = 'labelsToFields',
  filterFields = 'filterFields',
  filterFieldsByName = 'filterFieldsByName',
  filterFrames = 'filterFrames',
  filterByRefId = 'filterByRefId',
  renameByRegex = 'renameByRegex',
  filterByValue = 'filterByValue',
  noop = 'noop',
  ensureColumns = 'ensureColumns',
  groupBy = 'groupBy',
  sortBy = 'sortBy',
  histogram = 'histogram',
  configFromData = 'configFromData',
  rowsToFields = 'rowsToFields',
  prepareTimeSeries = 'prepareTimeSeries',
  convertFieldType = 'convertFieldType',
  fieldLookup = 'fieldLookup',
  heatmap = 'heatmap',
  spatial = 'spatial',
  extractFields = 'extractFields',
  groupingToMatrix = 'groupingToMatrix',
  limit = 'limit',
}
