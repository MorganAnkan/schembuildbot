var fs = require("fs");
var parser = require("./schematic-parser.js");
const config = require("./config.json"); 
var mcdata = require("minecraft-data")(config.version);
var Vec3 = require("vec3");
var download = require("./downloader.js").download;

var map = require("./map.json");//TODO: better map

var mineflayer = require("mineflayer");

Object.freeze(config.perms);
Object.freeze(config);

var options = {
    host: config.bot.host,
    port: config.bot.port,
    username: config.bot.username,
    version: config.version,
    checkTimeoutInterval: 690*1000
};

var bot = mineflayer.createBot(options);

bot.on("error", (e) => {
    console.log("bot err:",e);
})

bot.on("end", (reason) => {
    console.log("end:",reason);
})

bot.on("message", (m) => {
	console.log(m.toAnsi());
})

var prefix = "£";

bot.on("spawn", () => {
	bot.creative.startFlying();
	console.log("spawned");
})

var Directions = {
  normal: {
    NORTH: {yaw: 360, pitch: 0}, // -Z
    SOUTH: {yaw: 180, pitch: 0}, // +Z
    WEST: {yaw: 90, pitch: 0}, // -X
    EAST: {yaw: 270, pitch: 0}, // +X
    UP: {yaw: 0, pitch: 90}, // +Y
    DOWN: {yaw: 0, pitch: -90} // -Y
  } ,
  inverted: {
    NORTH: {yaw: 180, pitch: 0}, // -Z
    SOUTH: {yaw: 360, pitch: 0}, // +Z
    WEST: {yaw: 270, pitch: 0}, // -X
    EAST: {yaw: 90, pitch: 0}, // +X
    UP: {yaw: 0, pitch: -90}, // +Y
    DOWN: {yaw: 0, pitch: 90} // -Y
  } 
}

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

function lookDirection(direction, block) {
  let normal = map.normal.includes(block.block.name); 
	if(direction == undefined) return Promise.resolve(false);

	let dir = (normal) ? Directions.normal : Directions.inverted;
  dir = dir[direction.toUpperCase()] || Directions.inverted.NORTH;

	//console.log(`normal: ${normal}, dir: ${dir}, direction: ${direction}, block name: ${block.block.name}`);
  
  if (dir == null)
    return Promise.resolve(false);

  return new Promise(function(resolve, reject) {
    //console.log(`rotating ${direction} [${Math.radians(dir.yaw)}, ${Math.radians(dir.pitch)}]`,dir,`\n Block:${block.block.name}\nExpected rotation: ${block.block.facing}\npos:`,block.position,`\n`);

    bot.look(Math.radians(dir.yaw), Math.radians(dir.pitch), true, () => {
      resolve(true);

    });
  })
}

bot.on("chat", (username, message) => {//ok 
    if (!message.startsWith(prefix))
        return;

    let args = message.slice(prefix.length).split(" ");
    let cmd = args.shift();

    /*if (cmd == "ev" || cmd == "eval") {
        if (!config.perms.includes(username))
            return;

        new Promise(function(resolve, reject) {
          resolve(eval(args.join(" ")));
        })
        .then(output => setTimeout(() => {bot.chat(`&a> ${output}`)}, 150))
        .catch(err => bot.chat(`&c> ${err.message}`));
        // try {
        //   let output = eval(args.join(" "));
        //   setTimeout(() => {bot.chat(`&a> ${output}`)}, 150);
        // } catch (err) {
        //     bot.chat(`&c> ${err}`);
        // }
    }*/

    if (cmd == "help") {
        bot.chat("yes i need help");
    }

		if(cmd == "buildurl") {
      
			if(!args[0]) return bot.chat("please provide a url to yes");

			var urlObj;
			try {
      	urlObj = new URL(args[0].toString());
			} catch(e) {
				bot.chat(e.message);//mabe
			}

			if(urlObj == undefined) return;
      
    	if (urlObj.protocol == "https:" || urlObj.protocol == "http:") {
        bot.chat("Starting download...");
    	} else {
        return bot.chat(`hm something went wrong while parsing url ${urlObj.toString()}`);
    	}

			download(urlObj.toString(), undefined, (err, dest) => {
				if(err) {
					bot.chat(err);
					console.log(err);
				} else if(dest) {
					console.log("downloaded destination: "+dest);
					setTimeout(() => {bot.chat("building "+dest)}, 80);
					fs.readFile(dest, (err, data) => {
            if (data) {
                parser.parse(data, (e, data, datab) => {
                    if (e) {
                        console.log(e);
												setTimeout(() => bot.chat("oops: "+e), 50);
                    } else if (data && datab) {
                       build(data, datab);
											 fs.unlink(dest, ()=>{});
                    }
                });
            } else {
                console.log(err);
								setTimeout(() => bot.chat("oops: "+err.message), 50);	
            }
        });
				}
			})
		}

    if (cmd == "build") {
			if(bot.player.gamemode != 1) return bot.chat("im not in creative so i cant build sorry...");
      //muahahahahahahahhaa
			args[0] = (args[0].endsWith(".schem") || args[0].endsWith(".schematic")) ? args[0] : args[0]+".schem";

      let file = `./schems/${args[0]}`;
      //if (!fs.existsSync(file))
      //  file = `./downloaded/${args[0]}`;

      if(!fs.existsSync(file)) return bot.chat(`Schematic ${args[0]} doesnt exist!`);

			bot.chat(`ok please wait im attempting to build ${args[0]}`);
        fs.readFile(file, (err, data) => {
            if (data) {
                parser.parse(data, (e, data, datab) => {
                    if (e) {
                        console.log(e);
												setTimeout(() => bot.chat("oops: "+e), 50);
                    } else if (data && datab) {
                       build(data, datab);
                    }
                });
            } else {
                console.log(err);
								setTimeout(() => bot.chat("oops: "+err.message), 50);	
            }
        });
    }
});

function build(data, datab) {
    let a = 0;
    let rotations = 0;
    data.forEach((schemBlock, i, arr) => {
			if(datab.Metadata == undefined || datab.old) {
				schemBlock.position.add(bot.entity.position).add(new Vec3(datab.WEOffsetX, datab.WEOffsetY, datab.WEOffsetZ));
			} else {
				schemBlock.position.add(bot.entity.position).add(new Vec3(datab.Metadata.WEOffsetX, datab.Metadata.WEOffsetY, datab.Metadata.WEOffsetZ));
			}
        var pos = { 
						x: Math.round(schemBlock.position.x), 
						y: Math.round(schemBlock.position.y), 
						z: Math.round(schemBlock.position.z) 
					};

        var testBlock = bot.blockAt(new Vec3(pos));
				if(testBlock == null) return console.log("oops testblock is null");

        if (testBlock.name == schemBlock.block.name && schemBlock.block.facing == testBlock.getProperties().facing) 
          return; 

        //   console.log(`name: ${schemBlock.block.name},\nblocks:${map.replace},\ninclude:${map.replace.includes(schemBlock.block.name)}`)
          
        if (map.replace.includes(testBlock.name)) {
          console.log("Found illegal block!")
          setItem("sponge");
          placeBlock(pos);
          breakBlock(pos);
        }
				
			if(schemBlock.blockType.includes("bed") && schemBlock.block.part == "head") return;
			if(schemBlock.blockType.includes("door") && schemBlock.block.half == "upper") return
			// skip upper parts of beds and upper parts of doors

        var farAway = schemBlock.position.distanceTo(bot.entity.position);
        if (farAway > 6)
            return console.log(`skipping too far away block ${schemBlock.block.displayName}, pos: ${schemBlock.position}, dist: ${farAway}`);

        setTimeout(() => {
            setItem(schemBlock.block.name);

            if (schemBlock.block.id != testBlock.id) {//remove wrong blocks
                breakBlock(testBlock.position);
            }
            setTimeout(() => {
								//console.log(schemBlock.block.facing+ " dir: "+strToDirection(schemBlock.block.facing));
								//bot.creative.flyTo(schemBlock.position.add(0, 2, 0), () => {});//testing...
								lookDirection(schemBlock.block.facing, schemBlock).then((rotated) => {
                    if (rotated) {
                      rotations++;
                      setTimeout(() => {
                        placeBlock(pos);
                      }, 100);
                    } else {
                      placeBlock(pos);
                    } 

                    if (i == arr.length-1) 
                      bot.chat("done!");

                }).catch((err) => {
                  console.log(err);
                  //bot.chat("promise [catch]");
                }) 
                
            }, testBlock.id == testBlock.id ? 1 : 50);//50 - 30 // slowed down
        }, 130 * a++ + 100*rotations);//200 - 50

        
    });

    
}

function placeBlock(pos, direction = 1) {
  bot._client.write("block_place", {
    location: pos,
    direction: direction,
    hand: 0,
    cursorX: 0.5,
    cursorY: 0.5,
    cursorZ: 0.5,
    insideBlock: false
  }); 
}

function breakBlock(pos) {
  bot._client.write('block_dig', {
      status: 0,
      location: pos,
      face: 1
  });
}

function setItem(name="stone") {
  let item = mcdata.itemsByName[name] || mcdata.itemsByName[map.invalid[name]];
  if (item == null) {
		console.log(`oops dont know the item for ${name}, using stone instead...`);
    item = {id: 1};
	}
 
  bot._client.write("set_creative_slot", {
      "slot": 36,
      "item": {
        "present": true,
        "itemId": item.id,
        "itemCount": 1
      }
  });
}

