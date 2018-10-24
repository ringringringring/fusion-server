const db = require('trustnote-common/db');

let intro = {};

intro.initDb = async function () {

    // add table account_list
    await new Promise(resovle => {
        db.query("CREATE TABLE IF NOT EXISTS account_list (\n\
            address CHAR(32) NOT NULL,\n\
            wallet CHAR(44) NOT NULL,\n\
            is_change TINYINT NOT NULL,\n\
            address_index INT NOT NULL,\n\
            definition TEXT NOT NULL,\n\
            creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\n\
            );", function (rows) {
                resovle();
            });
    })

    // // add table unhandled_transaction
    // await new Promise(resovle => {
    //     db.query("CREATE TABLE IF NOT EXISTS unhandled_transaction (\n\
    //         address CHAR(32) NOT NULL,\n\
    //         txid CHAR(44) NOT NULL,\n\
    //         joint TEXT NOT NULL,\n\
    //         creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\n\
    //         );", function (rows) {
    //             resovle();
    //         });
    // })
}

module.exports = intro;