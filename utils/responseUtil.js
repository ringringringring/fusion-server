let responseUtil = {};

responseUtil.errCode = {
    success: 0
}

responseUtil.handleResponse = function (res, data, err) {

    let code;

    if(!err)
        code = responseUtil.errCode.success;

    res.send({
        network: 'devnet',
        errCode: code,
        errMsg: err || 'success',
        data: data
    })
}

module.exports = responseUtil;