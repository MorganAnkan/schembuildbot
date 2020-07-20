var nbt = require("prismarine-nbt");
var Vec3 = require("vec3");
var config = require("./config.json");
var blockStateParser = require("./blockstate-parser.js");
var mcdata = require("minecraft-data")(config.version);

function parse(data, cb) {
if(!cb) cb = (err) => {console.log(err)};
try {
nbt.parse(data, (error, data) => {
    if(data) {
        var simplified = nbt.simplify(data);
        //console.log("Data simplified:", simplified);
				var old = simplified.Blocks !== undefined;//"new" uses BlockData
        cb(undefined, blockDataToString(simplified, old), simplified);
    } else if(error) {
        cb(error);
    }
});
} catch(e) {
	cb(e);
}

}

//TODO actually make it able to read "old" schematic format

// https://pastebin.com/ht3bLDWn
// old = old version schematics // https://minecraft.gamepedia.com/Schematic_file_format
// !old = new schematics? used FAWE to get the "new" ones 

function blockDataToString(nbtData, old) {
	//console.log(nbtData);
    var outputData = [];
    var reversedPalette = old ? undefined : swapKeysWithValues(nbtData.Palette);
    var blockdata = old ? nbtData.Blocks : nbtData.BlockData;
    var width = nbtData.Width;
    var height = nbtData.Height;
    var length = nbtData.Length;
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            for (var z = 0; z < length; z++) { 
                var index = (y * length + z) * width + x; 
								var data = blockdata.slice(index, index + 7);
                
                var blockType = old ? "minecraft:"+(mcdata.blocks[data[0]] == undefined ? "stone" : mcdata.blocks[data[0]].name) : reversedPalette[data[0].toString()];
								var testBlockData = undefined;

								if(!old && blockType.includes("[") && blockType.includes("]")) { 
									testBlockData = blockStateParser.minecraftDataToJSON(blockType);// extract things like facing occupied etc
								}
                
                var block = mcdata.blocksByName[((blockType.includes("[") && blockType.includes("]")) ?
                    blockType.split("[")[0].split("minecraft:")[1] : blockType.split("minecraft:")[1])];

                testBlockData == undefined ? undefined : block = mergeObjects(testBlockData, block);
                outputData.push({ position: new Vec3(x, y, z), data, blockType, block, old });
            }
        }
    }
    
    //console.log(outputData);
    return outputData;
}

function mergeObjects(a, b) {
    return {...a, ...b};
}

function swapKeysWithValues(obj) {
    return Object.assign({}, ...Object.entries(obj).map(([a,b]) => ({ [b]: a })));
}

module.exports.parse = parse;