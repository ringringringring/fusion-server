const storage = require('trustnote-common/storage.js');
const constants = require('trustnote-common/constants.js');
const Wallet = require('trustnote-common/wallet.js');
const objectHash = require('trustnote-common/object_hash.js');
const validation = require('trustnote-common/validation.js');
const writer = require('trustnote-common/writer.js');
const network = require('trustnote-common/network.js')

let placeholder = '----------------------------------------------------------------------------------------';

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

jointService.validate = function (objJoint) {
    return new Promise((resolve, reject) => {
        validation.validate(objJoint, {
            ifUnitError: function (err) {
                reject("Validation error: " + err);
            },
            ifJointError: function (err) {
                reject("unexpected validation joint error: " + err);
            },
            ifTransientError: function (err) {
                reject("unexpected validation transient error: " + err);
            },
            ifNeedHashTree: function () {
                reject("unexpected need hash tree");
            },
            ifNeedParentUnits: function (arrMissingUnits) {
                reject("unexpected dependencies: " + arrMissingUnits.join(", "));
            },
            ifOk: function (objValidationState, validation_unlock) {
                console.log("base asset OK " + objValidationState.sequence);
                if (objValidationState.sequence !== 'good') {
                    validation_unlock();
                    reject("Bad sequence " + objValidationState.sequence);
                    return;
                }
                writer.saveJoint(
                    objJoint, objValidationState,
                    null,
                    function onDone() {
                        console.log("saved unit " + unit);
                        validation_unlock();
                        resolve(objJoint);
                    }
                );
            }
        });
    })
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
                    if (rows.length !== 1){
                        conn.release();
                        reject("definition not found, please reload app or register address fisrt");
                        return;
                    }
                    handleDefinition(null, JSON.parse(rows[0].definition));
                });
            },
            sign: function (objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature) {
                let buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
                b64_to_sign = buf_to_sign.toString('base64');
                handleSignature(null, placeholder);
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

jointService.sendJoint = function (joint, sig) {
    return new Promise(async (resolve, reject) => {
        let strJoint = JSON.stringify(joint);
        let strSignedJoint = strJoint.replace(placeholder, sig);
        let objSignedJoint = {
            unit: JSON.parse(strSignedJoint)
        }
        objSignedJoint.unit.unit = objectHash.getUnitHash(objSignedJoint.unit);

        try {
            let objJoint = await jointService.validate(objSignedJoint).catch(e => { throw e })
            network.broadcastJoint(objJoint);
            resolve(objJoint.unit);
        } catch (err) {
            reject(err);
        }
    })
}

module.exports = jointService;