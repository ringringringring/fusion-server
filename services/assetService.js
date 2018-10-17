const db = require('trustnote-common/db');
const validation = require('../utils/validation');
const jointService = require('./jointService');

let assetService = {};

// 查询余额
assetService.queryBalance = function (address, asset) {
    return new Promise(async (resolve, reject) => {
        let err;

        await validation.address(address).catch(e => { err = e });
        if (err) {
            reject(err);
        }

        if (asset === "TTT") {
            asset = undefined;
        }

        db.query("SELECT asset, is_stable, SUM(amount) AS balance \n\
            FROM outputs JOIN units USING(unit) \n\
            WHERE is_spent=0 AND address=? AND sequence='good' AND asset IS ? \n\
            GROUP BY is_stable", [address, asset],
            function (rows) {
                let balance = {
                    stable: 0,
                    pending: 0
                }
                if (rows) {
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        balance[row.is_stable ? 'stable' : 'pending'] = row.balance;
                    }
                }
                else {
                    reject("address not exist")
                }
                resolve(balance);
            })
    })
}

// 查询交易历史
assetService.queryHistory = function (address, asset, pageXOffset, size) {
    return new Promise(async (resolve, reject) => {
        let err;

        await validation.address(address).catch(e => { err = e });
        if (err) {
            reject(err);
        }

        if (asset === "TTT") {
            asset = undefined;
        }

        try {
            db.query('SELECT unit FROM outputs WHERE address=? AND asset is ? ORDER BY output_id DESC LIMIT ?,?',
                [address, asset, pageXOffset, size], function (rows) {
                    jointService.readMultiJoint(db, rows).then(arrJoint => {
                        resolve(arrJoint);
                    })
                })
        } catch (error) {
            reject("get history error");
        }

    })
}

// 发起交易
assetService.transfer = function (payer, outputs, message) {
    return new Promise(async (resolve, reject) => {
        try {
            await validation.address(payer).catch(e => { throw "invalid address of payer" })
            await validation.message(message).catch(e => { throw e })
            await validation.outputs(outputs).catch(e => { throw e })
        } catch (err) {
            reject(err);
        }

        outputs.push({ address: payer, amount: 0 })

        try {
            await assetService.checkAsset(asset).catch(e => { throw e });
            await assetService.checkAssetIsStable(asset).catch(e => { throw e });
            await assetService.checkAssetBalance(address, asset, outputs).catch(e => { throw e });
        } catch (err) {
            reject(err);
        }

        jointService.composeJoint(payer, outputs, message, function (b64_to_sign, objoint) {
            console.log(b64_to_sign);
            console.log(objoint);
        },function (error) {
            console.log(error);
        })
    })
}

// 检查资产是否存在
assetService.checkAsset = function (asset) {
    return new Promise((resolve, reject) => {
        if (asset == "TTT") {
            resolve();
        }
        else {
            db.query("SELECT 1 FROM assets WHERE unit=?", [asset], function (rows) {
                if (rows.length) {
                    resolve();
                }
                else {
                    reject("asset not exist")
                }
            })
        }
    })
}

// 检查资产是否稳定状态
assetService.checkAssetIsStable = function (asset) {
    return new Promise((resolve, reject) => {
        if (asset == "TTT") {
            resolve();
        }
        else {
            db.query('SELECT 1 FROM units WHERE unit=? AND is_stable=1', [asset], function (rows) {
                if (rows.length) {
                    resolve();
                }
                else {
                    reject("unit not stable yet");
                }
            })
        }
    })
}

assetService.checkAssetBalance = function (address, asset, outputs) {
    return new Promise(async (resolve, reject) => {
        let accumulated_amount = 0;
        let totalBalance;
        for (let output of outputs) {
            accumulated_amount += output.amount;
        }

        await assetService.queryBalance(address, asset).then(balance => {
            totalBalance = balance.stable;
        }).catch(err => {
            reject(err);
        })

        if (totalBalance >= accumulated_amount) {
            resolve();
        }
        else {
            reject(`not enough asset: ${asset} from address ${address}`);
        }
    })
}

module.exports = assetService;