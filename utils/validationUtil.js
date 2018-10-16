function hasFieldsExcept(obj, arrFields){
	for (var field in obj)
		if (arrFields.indexOf(field) === -1)
			return true;
	return false;
}

function isInteger(int){
	return (typeof int === 'number' && int.toString().indexOf('.') === -1 && !isNaN(int));
}

function isPositiveInteger(int){
	return (typeof int === 'number' && int > 0 && int.toString().indexOf('.') === -1 && !isNaN(int));
}

function isPositiveInteger(int){
	return (typeof int === 'number' && int > 0 && int.toString().indexOf('.') === -1 && !isNaN(int));
}

function isNonnegativeInteger(int){
	return (typeof int === 'number' && int >= 0 && int.toString().indexOf('.') === -1 && !isNaN(int));
}

function isNonemptyString(str){
	return (typeof str === "string" && str.length > 0);
}

function isStringOfLength(str, len){
	return (typeof str === "string" && str.length === len);
}