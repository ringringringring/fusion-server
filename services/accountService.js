const db = require('trustnote-common/db');
const Bitcore = require('bitcore-lib');
const crypto = require('crypto');
const objectHash = require('trustnote-common/object_hash.js')

let accountService = {};

accountService.register = function (pubkey) {
    return new Promise((resolve, reject) => {
        try {
            let walletId = crypto.createHash("sha256").update(pubkey, "utf8").digest("base64");
            let pubkeyObj = Bitcore.HDPublicKey.fromString(pubkey);
            let addressPubkey = pubkeyObj.derive("m/0/0").publicKey.toBuffer().toString("base64");
            let arrDefinition = ['sig', { pubkey: addressPubkey }];
            let address = objectHash.getChash160(arrDefinition);
            db.query('SELECT address FROM account_list WHERE address = ?', [address], function (rows) {
                if (rows.length) {
                    resolve(rows[0].address);
                }
                else {
                    let address_index = 0;
                    db.query('select max(address_index) as addr_index from account_list', function (rows) {
                        if (rows.addr_index)
                            address_index = rows.addr_index;
                        db.query('INSERT INTO account_list(address,wallet,is_change,address_index,definition) VALUES(?,?,?,?,?)',
                            [address, walletId, 0, address_index, JSON.stringify(arrDefinition)], function (rows) {
                                resolve(address);
                            })
                    })
                }
            })
        } catch (error) {
            reject("register error");
        }

    })
}

module.exports = accountService;