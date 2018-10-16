
const validationUtils = require('trustnote-common/validation_utils.js');

let validation = {};

validation.address = async function (address) {
    var valid = validationUtils.isValidAddress(address);
    if (valid)
        return true;
    else
        throw "invalid address";
}

validation.message = async function (message) {
    let msg;
    if (typeof message === "object")
        msg = JSON.stringify(message);
    else
        msg = message.toString();

    if (msg.length > 10000)
        throw "message too long";
    else
        return true;
}

validation.outputs = async function (outputs) {
    if (!Array.isArray(outputs)) {
        throw "outputs should be JSON Array";
    }
    if (outputs.length == 0) {
        throw 'empty outputs';
    }
    if (outputs.length > 127) {
        throw "exceed max outputs size,outputs size should be less than 127";
    }
    outputs.forEach(output => {
        if (Object.prototype.toString.call(output) !== "[object Object]") {
            throw "item within outputs must be JSON object";
        }
        if (typeof output.address == "undefined") {
            throw "item within outputs must have a attribute: address";
        }
        if (typeof output.amount == "undefined") {
            throw "item within outputs must have a attribute: amount";
        }
    })

    for (let output of outputs) {
        let address = output.address;
        let amount = output.amount;

        await validation.address(address).catch(e => { throw "invalid address of outputs" });

        // TODO 更详细的验证
        if (!Number.isInteger(amount) || amount < 0) {
            throw "amount should be a positive number";
        }
    }
}

module.exports = validation;