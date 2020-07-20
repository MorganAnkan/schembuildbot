function isIntConv(str) {
    return !isNaN(parseInt(str))
}

function parseBool(str) {
    var a = {
        "true":true,
        "false":false
    };
    return a[str];
}

function isBoolConv(str) {
    return typeof(parseBool(str)) == "boolean";
}

function minecraftDataToJSON(dataStr) {
    var output = {};
    var splitAway = dataStr.split("[")[1].split("]")[0];
    var datas = splitAway.split(",");
    datas.forEach((rawStr) => {
        var dataSplit = rawStr.split("=");
        var name = dataSplit[0];
        var data = dataSplit[1];
        if(isIntConv(data)) {
            data = parseInt(data);
        } else if(isBoolConv(data)) {
            data = parseBool(data);
        } 
        // else string
        output[name] = data;
    });
    return output;
}

module.exports.minecraftDataToJSON = minecraftDataToJSON;