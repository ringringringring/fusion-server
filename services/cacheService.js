const QuickLRU = require('quick-lru');
const lru = new QuickLRU({ maxSize: 1000 });

let cacheService = {}

cacheService.add = function (joint) {
    lru.set(joint.unit, joint);
}

cacheService.get = function (txid) {
    return lru.get(txid);
}

cacheService.remove = function (txid) {
    lru.delete(txid);
}

cacheService.has = function (txid) {
    return lru.has(txid);
}

module.exports = cacheService;