const db = require('trustnote-common/db');

function init () {
    initDB();
}

function initDB() {
    db.query("CREATE TABLE IF NOT EXISTS account_list (\n\
        address CHAR(32) NOT NULL,\n\
        wallet CHAR(44) NOT NULL,\n\
        is_change TINYINT NOT NULL,\n\
        address_index INT NOT NULL,\n\
        definition TEXT NOT NULL,\n\
        creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\n\
        );", function (rows) {});
}

init();