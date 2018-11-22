export default function(srcArr, destArr, compareFn) {
  const rs = []
  srcArr.forEach(item => {
    if (!destArr.find(compareFn.bind(null, item))) {
      rs.push({
        type: '-',
        value: item
      })
    }
  })
  destArr.forEach(item => {
    if (!srcArr.find(compareFn.bind(null, item))) {
      rs.push({
        type: '+',
        value: item
      })
    }
  })
  return rs
}
