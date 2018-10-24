const storage = require('trustnote-common/storage.js');
const constants = require('trustnote-common/constants.js');
const Wallet = require('trustnote-common/wallet.js');
const objectHash = require('trustnote-common/object_hash.js');

let jointService = {}

jointService.readJoint = function (db, unit) {
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

jointService.readMultiJoint = async function (db, rows) {
    let arrJoint = [];
    for (let row of rows) {
        let joint = await jointService.readJoint(db, row.unit);
        arrJoint.push(joint);
    }
    return arrJoint;
}

jointService.composeJoint = function (asset, payer, outputs, message) {
    let b64_to_sign;
    let objJoint;
    return new Promise((resolve, reject) => {
        let signer = {
            readSigningPaths: function (conn, address, handleLengthsBySigningPaths) {
                handleLengthsBySigningPaths({ r: constants.SIG_LENGTH });
            },
            readDefinition: function (conn, address, handleDefinition) {
                conn.query("SELECT definition FROM account_list WHERE address=?", [address], function (rows) {
                    if (rows.length !== 1)
                        throw "definition not found";
                    handleDefinition(null, JSON.parse(rows[0].definition));
                });
            },
            sign: function (objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature) {
                let buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
                b64_to_sign = buf_to_sign.toString('base64');
                handleSignature(null, "----------------------------------------------------------------------------------------");
            }
        }

        let cb = function (err, joint) {
            if (err) {
                reject(err);
                return;
            }
            objJoint = joint;
            resolve({ b64_to_sign: b64_to_sign, txid: objJoint.unit.unit, unit: objJoint.unit });
        }

        Wallet.sendMultiPayment({
            asset: asset,
            paying_addresses: [payer],
            base_outputs: asset ? null : outputs,
            asset_outputs: asset ? outputs : null,
            change_address: payer,
            message: message,
            signer: signer,
        }, cb);
    })
}

module.exports = jointService;