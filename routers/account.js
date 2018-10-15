const resp = require('../utils/responseUtil');
const express = require('express');
const router = express.Router();
const accountService = require('../services/accountService');

router.post('/register', function (req, res) {
    var pubkey = req.body.pubkey
    if (pubkey == '' || !pubkey) {
        resp.handleResponse(res, null, "wrong pubkey");
        return;
    }

    accountService.register(pubkey).then(address => {
        resp.handleResponse(res, { address: address });
    }).catch(err => {
        resp.handleResponse(res, null, err);
    })
})

module.exports = router;