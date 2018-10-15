const db = require('trustnote-common/db');
const validationUtils = require('trustnote-common/validation_utils.js');
const storage = require('trustnote-common/storage');

let assetService = {};

assetService.queryBalance = function (address, asset) {
    return new Promise((resolve, reject) => {
        let err;

        err = validationUtils.isValidAddress(address) ? null : "invalid address";
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
                resolve(balance);
            })
    })
}

function readJoint(unit) {
    return new Promise(resolve => {
        storage.readJoint(db, unit, {
            ifFound: function (objJoint) {
                resolve(objJoint);
            },
            ifNotFound: function () {
                console.error('get history error')
            }
        })
    })
}

async function readAllJoint(rows) {
    let arrJoint = [];
    for (let row of rows) {
        let joint = await readJoint(row.unit);
        arrJoint.push(joint);
    }
    return arrJoint;
}

assetService.queryHistory = function (address, asset, pageXOffset, size) {
    return new Promise((resolve, reject) => {
        let err;

        err = validationUtils.isValidAddress(address) ? null : "invalid address";
        if (err) {
            reject(err);
        }

        if (asset === "TTT") {
            asset = undefined;
        }

        try {
            db.query('SELECT unit FROM outputs WHERE address=? AND asset is ? ORDER BY output_id DESC LIMIT ?,?',
                [address, asset, pageXOffset, size], function (rows) {
                    readAllJoint(rows).then(arrJoint => {
                        resolve(arrJoint);
                    })
                })
        } catch (error) {
            reject("get history error");
        }

    })
}

module.exports = assetService;