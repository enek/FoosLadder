var utils = require("./../utils.js");
var config = require("./../config.json");
var stats = require("./stats.js");

exports.getUsers = function(body, callback)
{
	GLOBAL.usersDB.view('users', 'by_name',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.getUsers error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var user = body.rows[X].value;
				user.id = user._id;
				delete user._id;
				delete user._rev;
				result.push(user);
			}
			//console.log("users.getUsers OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}

exports.getPlayersByIds = function(body, callback)
{
    matches = GLOBAL.usersDB.view('users', 'by_name',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.getUsersById error: "+error);
			callback({});
		}
		else
		{
			var result = {};
			for (var X in body.rows)
			{
				var user = body.rows[X].value;
				result[user._id] = user;
			}
			//console.log("users.getUsersById OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}

exports.addUser = function(body, callback)
{
	//console.log("users.addUser: "+body.name);
	
	exports.isAsscessTokenValidForAdding(body.fbAccessToken, function(ok) {
		if(ok)
		{
			addUserToDB(body.name, callback);
		}
		else
		{
			console.log("addUser: "+ body.name +" NOT AUTHORIZED");
			callback({status:"error", message:"Not authorized."});
		}
	});	
}

function addUserToDB(name, callback)
{
	GLOBAL.usersDB.insert({name: name}, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.addUser error: "+error);
			callback({status:"error", message:error.message});
		}
		else
		{
			console.log("users.addUser OK: " + JSON.stringify(body));
			callback({status:"ok"});
		}
	});
}

exports.updatePlayerStatsForMatch = function(matchData, callback)
{
	//console.log("users.updatePlayerStatsForMatch: "+JSON.stringify(matchData));
	var playerIds = matchData.leftPlayers.concat(matchData.rightPlayers);
	getPlayersByIdUsingIds(playerIds, function(playersById)
	{
		if(playersById == null)
		{
			console.log("FAILED TO GET PLAYER STATS TO UPDATE FOR MATCH.");
			callback(false);
			return;
		}
		
		var OK = stats.updateStatsOfPlayersByIdForMatch(playersById, matchData);
		if(!OK)
		{
			console.log("FAILED TO CALCULATE PLAYER STATS FOR MATCH.");
			callback(false);
			return;
		}
		updatePlayersByIdToDatabase(playersById, function(ok)
		{
			callback(ok);
		});
	});
}

exports.getExpectedScores = function(body, callback)
{
	var leftPlayers = utils.getLeftPlayersOfObject(body);
	var rightPlayers = utils.getRightPlayersOfObject(body);
	
	if(leftPlayers.length == 0 || rightPlayers.length == 0)
	{
		callback({leftScore:0, rightScore:0});
		return;
	}
	
	var playerIds = leftPlayers.concat(rightPlayers);
	getPlayersByIdUsingIds(playerIds, function(playersById)
	{
		callback(stats.getExpectedScores(playersById, leftPlayers, rightPlayers));
	});
}

exports.getRatingChange = function(body, callback)
{
	var leftPlayers = utils.getLeftPlayersOfObject(body);
	var rightPlayers = utils.getRightPlayersOfObject(body);
	
	if(leftPlayers.length == 0 || rightPlayers.length == 0)
	{
		callback({leftRating:0, rightRating:0});
		return;
	}
	
	var playerIds = leftPlayers.concat(rightPlayers);
	getPlayersByIdUsingIds(playerIds, function(playersById)
	{
		var obj = stats.getRatingChange(playersById, leftPlayers, rightPlayers, Number(body.leftScore), Number(body.rightScore));
		callback(obj);
	});
	
}

function getPlayersByIdUsingIds(playerIds, callback)
{
	var playersById = {};
	GLOBAL.usersDB.fetch({keys:playerIds}, function (error, body, headers)
	{
		if(error || !body)
		{
			callback(null);
		}
		else
		{
			for (var X in body.rows)
			{
				var row = body.rows[X];
				playersById[row.id] = row.doc;
			}
			for (var X in playerIds)
			{
				var playerid = playerIds[X];
				if(playersById[playerid] == null)
				{
					playersById[playerid] = {};
				}
			}
			
			callback(playersById);
		}
	});
}

exports.rebuiltPlayerStatsFromMatches = function(matchDatas, callback, keepOldStats)
{
	exports.getPlayersByIds({}, function(playersById)
	{
		var X;
		if (!keepOldStats)
		{
			console.log("Erasing stats for players...");
			for(X in playersById)
			{
				exports.clearPlayerStats(playersById[X]);
			}
		}
		var iterations = keepOldStats ? 100 : 1;
		for (var i=0; i < iterations; i++)
		{
			for(X in matchDatas)
			{
				var OK = stats.updateStatsOfPlayersByIdForMatch(playersById, matchDatas[X]);
				if(!OK)
				{
					console.log("FAILED TO CALCULATE PLAYER STATS FOR MATCH.");
					callback(false);
					return;
				}
			}
		}
		updateMatchesToDatabase(matchDatas, function(ok)
		{
			console.log("updating matches: "+ok);
		});
		updatePlayersByIdToDatabase(playersById, function(ok)
		{
			callback(ok);
		});
	});
}

function updateMatchesToDatabase(matchDatas, callback)
{
	var bulk = {};
	bulk.docs = [];
	
	for (X in matchDatas)
	{
		bulk.docs.push(matchDatas[X]);
	}

	GLOBAL.matchesDB.bulk(bulk, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("FAILED TO UPDATE MATCH STATS.");
			callback(false);
		}
		else
		{
			console.log("Updated match stats.");
			callback(true);
		}
	});
}

function updatePlayersByIdToDatabase(playersById, callback)
{
	var bulk = {};
	bulk.docs = [];
	for (X in playersById)
	{
		bulk.docs.push(playersById[X]);
	}
		
	GLOBAL.usersDB.bulk(bulk, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("FAILED TO UPDATE PLAYER STATS FOR MATCH.");
			callback(false);
		}
		else
		{
			console.log("Updated player stats for match.");
			callback(true);
		}
	});
}

exports.clearPlayerStats = function(player)
{
	stats.clearPlayerStats(player);
}

exports.isAsscessTokenValidForAdding = function(accessToken, callback)
{
	if(config.useFacebookAuth == false)
	{
		callback(true);
		return;
	}
	if(accessToken == null) {
		callback(false);
		return;
	}
	if(accessToken == config.secretAuthKey)
	{
		callback(true);
		return;
	}
	utils.getFacebookData(accessToken, function (response)
	{
		if(response.status == "ok")
		{
			var id = response.body.id;
			var username = response.body.username;
			if(config.allowedFacebookIds.indexOf(id) >= 0 || config.allowedFacebookIds.indexOf(username) >= 0)
			{
				callback(true);
			}
			else
			{
				exports.getPlayersByIds({}, function (playersById)
				{
					var found = false;
					for (var X in playersById)
					{
						var player = playersById[X];
						if(player.facebookId == id || player.facebookId == username)
						{
							found = true;
							break;
						}
					}
					callback(found);
				});
			}
		}
		else
		{
			console.log("isAsscessTokenValidForAdding: FAILED", response.body.message);
			callback(false);
		}
	})	
}