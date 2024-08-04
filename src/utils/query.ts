export function buildDynamicCondition (stateMap: Record<string, boolean>, statement: 'WHERE' | 'AND') {
  const queryList = Object.entries(stateMap)
    .map(([query, inUse]) => inUse ? query : '')
    .filter((item) => (item && item !== ''));

  if (queryList.length === 0) {
    return '';
  }

  else return `${statement} ${queryList.join(' AND ')}`;
}