import LRU from 'lru-cache'

const cache = LRU({
  length: function(n, key) {
    return n.length + key.length
  }
})
console.log('cache created')
export default cache
