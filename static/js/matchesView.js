function MatchesView(loadableTable)
{
	
var table = loadableTable;
var self = this;
var playersById;
var exportText;
var matches;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.table.style.display = 'inherit';
	if(matches == null)
	{
		self.loadMatches();
	}
}

this.hide = function()
{
	table.table.style.display  = 'none';
}

this.loadPlayers = function()
{
	callAPI({request:"getPlayers"}, self.setPlayers);
}

this.setPlayers = function(players)
{
	playersById = {};
	for (var X in players)
	{
		var player = players[X];
		playersById[player.id] = player;
	}
 	self.loadMatches();
}

this.loadMatches = function()
{
	if(playersById == null)
	{
		self.loadPlayers();
		return;
	}
	table.clear();
	table.setLoading(true);
	callAPI({request:"getMatches"}, onMatchesLoaded);
}

function onMatchesLoaded(data)
{
	matches = data;
	table.setLoading(false);
	table.clear();
	
	var playerRow;
	for(var i = data.length - 1; i >= 0; i--)
	{
		playerRow = table.createRow();
		fillRowWithMatch(playerRow, data[i]);
	}
}

function fillRowWithMatch(tableRow, match)
{
	var cells = tableRow.getElementsByTagName("td");
	var date = new Date(match.date);
	var cellIdx = 1;
	var change = Math.round(Number(match.KDleft)*100)/100;
	var colors = [ 'lightgreen', '#FFCCCC' ];
	
	var leftScoreChange = getChildByTag(tableRow, "leftScoreChange");
	leftScoreChange.parentNode.style.cssText = 'background-color: '+colors[change > 0 ? 0 : 1];
	setContentsOfTag(tableRow, "leftScoreChange", change);
	setContentsOfTag(tableRow, "leftAttacker", getPlayerNameFromId(match.leftPlayers[0]));
	setContentsOfTag(tableRow, "leftDefender", match.leftPlayers.length > 1 ? getPlayerNameFromId(match.leftPlayers[1]) : "");
	setContentsOfTag(tableRow, "leftScore", match.leftScore);
	
	var rightScoreChange = getChildByTag(tableRow, "rightScoreChange");
	rightScoreChange.parentNode.style.cssText = 'background-color: '+colors[change > 0 ? 1 : 0];
	setContentsOfTag(tableRow, "rightScoreChange", -change);
	setContentsOfTag(tableRow, "rightAttacker", getPlayerNameFromId(match.rightPlayers[0]));
	setContentsOfTag(tableRow, "rightDefender", match.rightPlayers.length > 1 ? getPlayerNameFromId(match.rightPlayers[1]) : "");
	setContentsOfTag(tableRow, "rightScore", match.rightScore);
	
	var dateStr = date.getDate() + ", "+ (date.getMonth()+1) + ", " + date.getFullYear() + "<br/>" + doubleDigit(date.getHours()) + ":" + doubleDigit(date.getMinutes());
	setContentsOfTag(tableRow, "matchDate", dateStr);
}

function getPlayerNameFromId(playerId)
{
	var player = playersById[playerId];
	return player ? player.name : "";
}

function doubleDigit(number)
{
	if(number < 10)
	{
		return "0"+number;
	}
	return ""+number;
}


function onRebuiltMatchStats(ok)
{
	self.loadMatches();
	alert(ok ? "Successful" : "Failed");
}


this.exportData = function()
{
	var exportArea = document.getElementById("exportArea");
	if(exportArea == null)
	{
		alert("can't find exportArea in view");
		return;
	}
	exportArea.innerHTML = "";
	callAPI({request:"getMatchesRaw"}, 
	function(docs)
	{
		var obj = {docs:docs};
		exportArea.appendChild(document.createTextNode(JSON.stringify(obj)));
	});
}

}
