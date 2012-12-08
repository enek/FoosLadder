function PlayerInspectView(loadableTable)
{

var players, playersById, inspectPlayerId;
var table = loadableTable;
var self = this;

this.setPlayer = function(playerName)
{
	inspectPlayerId = playerName;
	updateSort();
}

var sortKey = "mixedStats.score";
var sortReversed;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.element.show();
}

this.hide = function()
{
	table.element.hide();
}

this.setPlayers = function(data)
{
	onPlayersLoaded(data)
}

this.updateRows = function()
{
	table.clear();
	table.setLoading(true);
}

function onPlayersLoaded(data)
{
	players = data;
	playersById = {};
	for (var X in players)
	{
		var player = players[X];
		playersById[player.id] = player;
	}
}

function updateRows()
{
	table.setLoading(false);
	table.clear();
	
	var X, Y;
	var userRow;
	for(X in players)
	{
		if (players[X].id == inspectPlayerId)
		{
			fillRowsWithVersus(players[X]);			
		}
	}
}

function fillRowsWithVersus(user)
{

	var X, userRow;
	var versus = user.stats.versus;
	for (X in versus)
	{
		if (X.charAt(0) != '_')
		{
			userRow = table.createRow();
			fillRowWithUser(userRow, X, versus[X]);	
		}
	}
	
	setContentsOfTag(table.table, "inspectedPlayer", user.name);
	setContentsOfTag(table.table, "heads", versus._heads);
	setContentsOfTag(table.table, "total", versus._total);
}

function fillRowWithUser(tableRow, opponent, versusData)
{
	var userLink = "<a href='javascript:inspect(\""+opponent+"\")'>"+playersById[opponent].name+"</a>";
	
	setContentsOfTag(tableRow, "playerName", userLink);
	setContentsOfTag(tableRow, "wins", safeStr(versusData.wins));
	setContentsOfTag(tableRow, "losses", safeStr(versusData.losses));
}

function safeStr(obj)
{
	if(obj != undefined)
	{
		return Math.round(Number(obj));
	}
	return "";
}

this.toggleSortBy = function(key)
{
	
}

function updateSort()
{
	var properties = sortKey.split(".");
	players.sort(function(a, b)
	{
		var avalue = readPropertyChain(a, properties);
		var bvalue = readPropertyChain(b, properties);
		if(typeof avalue == "string") 
		{
			avalue = avalue.toLowerCase();
		}
		if(typeof bvalue == "string") 
		{
			bvalue = bvalue.toLowerCase();
		}
		var value = 0;
		
		if(avalue < bvalue)
		{
			value = 1;
		}
		else if(avalue > bvalue)
		{
			value = -1;
		}
		if(sortReversed)
		{
			return -value;
		}
		return value;
	});
	updateRows();
}

function readPropertyChain(obj, properties)
{
	for( var X in properties)
	{
		obj = obj[properties[X]];
		if(obj == null)
		{
			return "";
		}
	}
	return obj;
}


}
