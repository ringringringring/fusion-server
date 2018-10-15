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

module.exports = router