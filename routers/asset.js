const resp = require('../utils/responseUtil');
const express = require('express');
const router = express.Router();
const assetService = require('../services/assetService');
const _ = require('lodash');

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

    let asset, address, index, size, pageXOffset;

    try {
        asset = req.params.asset;
        address = req.params.address;
        index = parseInt(req.params.index);
        if (_.isNaN(index)) throw "API error, index must be a number"
        if (index < 0) throw "API error, index cannot be < 0"
        size = parseInt(req.params.size);
        if (_.isNaN(size)) throw "API error, size must be a number"
        if (size > 10 || size <= 0) throw "API error, size should be 0 <= size < 10"
        pageXOffset = index * size - size
    } catch (err) {
        resp.handleResponse(res, null, err);
        return;
    }

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

router.post('/sign', function (req, res, next) {

    let txid = req.body.txid
    let sig = req.body.sig

    assetService.sign(txid, sig).then(ret => {
        resp.handleResponse(res, ret);
    }).catch(err => {
        resp.handleResponse(res, null, err);
    })
})

module.exports = router