const resp = require('../utils/responseUtil');
const express = require('express');
const router = express.Router();
const assetService = require('../services/assetService');

router.get('/balance/:address/:asset', function (req, res, next) {
    let address = req.params.address;
    let asset = req.params.asset;

    assetService.queryBalance(address, asset).then(balance => {
        resp.handleResponse(res, balance);
    }).catch(err => {
        resp.handleResponse(res, null, err);
    })
})

router.get('/txhistory/:address/:asset/:index/:size', function (req, res, next) {
    let asset = req.params.asset
    let address = req.params.address
    let index = parseInt(req.params.index)
    let size = parseInt(req.params.size)
    let pageXOffset = index * size - size

    assetService.queryHistory(address, asset, pageXOffset, size).then(arrJoint => {
        resp.handleResponse(res, { history: arrJoint });
    }).catch(err => {
        resp.handleResponse(res, null, err);
    })

})

router.post('/transfer', async function (req, res, next) {

    let asset = req.body.asset;
    let payer = req.body.payer;
    let outputs = req.body.outputs;
    let message = req.body.message;


    assetService.transfer(asset, payer, outputs, message).then(ret => {
        resp.handleResponse(res, ret);
    }).catch(err => {
        resp.handleResponse(res, null, err);
    })
})

router.post('/submittx', function (req, res, next) {
    var txid = req.body.txid
    var sig = req.body.sig

    if (!lru.has(txid)) {
        next(new BizError('payment finished or cancel', 1006))
        return
    }

    var unsignedunit = lru.get(txid)
    var newunit = txService.composeFullJoint(unsignedunit, sig)

    console.log(JSON.stringify(newunit))

    var callbacks = {
        ifError: function (error) {
            next(tutil.HandleSystemError(error))
            // return
        },
        ifNotEnoughFunds: function (error) {
            next(tutil.HandleSystemError(error))
            // return
        },
        ifOk: function (objJoint, arrChains) {
            console.log('broadcastJoint backs')
            // delete from cache!!
            removeFromcache(objJoint.unit)
            network.broadcastJoint(objJoint);

            _.handleResponse(res, { unit: newunit.unit })
        }
    }

    networkService.broadCastUnit(newunit, callbacks)

})

module.exports = router