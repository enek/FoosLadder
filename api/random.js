var MAX_RATING_CHANGE = 120;
var WEAKEST_PLAYER_INFLUENCE_RATIO = 0.3;

exports.setParameters = function(param)
{
	if(param.maxK) MAX_RATING_CHANGE = param.maxK;
	if(param.weakPlayerRatio != null) WEAKEST_PLAYER_INFLUENCE_RATIO = param.weakPlayerRatio;
}

exports.updateRatingForMatch = function(playersById, getStatsFunction, matchData)
{
	var KDleft = exports.getLeftRatingChange(playersById, getStatsFunction, matchData.leftPlayers, matchData.leftScore, matchData.rightPlayers, matchData.rightScore);
	
	matchData.KDleft = KDleft;
	
	addRatingToPlayers(playersById, getStatsFunction, matchData.leftPlayers, KDleft);
	addRatingToPlayers(playersById, getStatsFunction, matchData.rightPlayers, -KDleft);
	
	return KDleft / MAX_RATING_CHANGE;
}

exports.getLeftRatingChange = function(playersById, getStatsFunction, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	var Rleft = exports.getCombinedRatingOfPlayers(playersById, getStatsFunction, leftPlayerIds);
	var Rright = exports.getCombinedRatingOfPlayers(playersById, getStatsFunction, rightPlayerIds);
	var Eleft = exports.expectedScoreForRating(Rleft, Rright);
	
	var Gleft = leftScore;
	var Gtotal = Gleft + rightScore;
	var Sleft = Gleft / Gtotal;
	
	var K = MAX_RATING_CHANGE;
	return K * ( Sleft - Eleft );
}

exports.expectedScoreForRating = function(rating, opponent)
{
	return Math.random();
}

exports.getCombinedRatingOfPlayers = function(playersById, getStatsFunction, players)
{
	var ratings = 0;
	var player;
	var index;
	var stats;
	var weakest, strongest;
	
	for (index in players)
	{
		player = playersById[players[index]];
		stats = getStatsFunction(player);
		var score = getProperty(stats, "score", exports.defaultScoreForPlayer(player)); 
		if (!weakest)
			weakest = score;
		else
			strongest = score;
		ratings += score;
	}
	
	if (players.length == 2) {
		if (weakest > strongest) {
			var t = weakest; weakest = strongest; strongest = t;
		}
		var combined = weakest * WEAKEST_PLAYER_INFLUENCE_RATIO + strongest * (1-WEAKEST_PLAYER_INFLUENCE_RATIO);
//		console.log([ratings, players.length, strongest, weakest, combined]);
		return combined;
	}
	
	var average = ratings / players.length;
	return average;
}

exports.defaultScoreForPlayer = function(player)
{
   /**		
	var defaults = {
		"Lu Aye Oo": 1800, 
		"John E": 1700, 
		"Pedro R": 1600, 
		"Stephen C": 1600,
		"Simon H": 1500,
		"Adam S": 1500,
		"Naree S": 1400,
		"Joe R": 1400,
		"Andy S": 1400,
		"Toby M": 1500,
	};
	if (defaults[player.name]) return defaults[player.name];
/**/	 
	return 1600;
}

function addRatingToPlayers(playersById, getStatsFunction, players, deltaRating)
{
	var player;
	var index;
	var stats;
	for (index in players)
	{
		player = playersById[players[index]];
		stats = getStatsFunction(player);
		score = getProperty(stats, "score", exports.defaultScoreForPlayer(player));
		stats["score"] = score + deltaRating;
// 		console.log(player.name+" "+Math.round(score)+" -> "+Math.round(score+deltaRating));
	}
}


function addToProperty(obj, property, value)
{
	if(!obj[property])
	{
		return obj[property] = value;
	}
	return obj[property] += value;
}

function getProperty(obj, property, defaultValue)
{
	if(!obj[property])
		return defaultValue;
		
	return obj[property];
}

