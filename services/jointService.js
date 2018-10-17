const storage = require('trustnote-common/storage');

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

jointService.composeJoint = function (payer, arrOutputs, text, callbacks, errorHandler) {
    let composer = require('trustnote-common/composer.js');

    var callback = {
        ifError: onError,
        ifNotEnoughFunds: errorHandler,
        ifOk: function (objJoint, arrChains) {
            var newJoint = removeFakeSignature(objJoint, [payer])
            var buf_to_sign = objectHash.getUnitHashToSign(newJoint.unit)
            var b64ToSign = buf_to_sign.toString('base64')
            callbacks(b64ToSign, newJoint)
        }
    }

    composer.composeConsignorJoint(payer, arrOutputs, text, jointService.signer, callback);
}

jointService.signer = {
    readSigningPaths: function (conn, address, handleLengthsBySigningPaths) {
        handleLengthsBySigningPaths({ r: constants.SIG_LENGTH });
    },
    readDefinition: function (conn, address, handleDefinition) {
        conn.query("SELECT definition FROM my_addresses WHERE address=?", [address], function (rows) {
            if (rows.length !== 1)
                throw "definition not found";
            handleDefinition(null, JSON.parse(rows[0].definition));
        });
    },
    sign: function (objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature) {
        var buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
        db.query(
            "SELECT wallet, account, is_change, address_index \n\
			FROM my_addresses JOIN wallets USING(wallet) JOIN wallet_signing_paths USING(wallet) \n\
			WHERE address=? AND signing_path=?",
            [address, signing_path],
            function (rows) {
                if (rows.length !== 1)
                    throw Error(rows.length + " indexes for address " + address + " and signing path " + signing_path);
                var row = rows[0];
                signWithLocalPrivateKey(row.wallet, row.account, row.is_change, row.address_index, buf_to_sign, function (sig) {
                    handleSignature(null, sig);
                });
            }
        );
    }
}

module.exports = jointService;