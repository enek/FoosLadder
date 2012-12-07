function GraphView(view)
{
	var playersById;
	var matches;
	var showing;
	var selectedPlayers;
	
	var colors = ["#C00", "#00C", "#0C0", "#880", "#088", "#808", "#000", "#666", "#999", "#F93", "#7A3", "#39F", "#3F9", "#F39"];

	var graphLoading = $("#graphLoading");
	
	var playerNamesEle = $("graphSelectedPlayers");
	playerNamesEle.empty();
	
	var graph = $("<div></div>");
	view.append(graph);
	
this.show = function()
{
	showing = true;
	view.show();
	
	if(playersById == null)
	{
		graphLoading.show();
		self.loadPlayers();
		self.loadMatches();
	}
	else if(matches == null)
	{
		graphLoading.show();
		self.loadMatches();
	}
	else if(selectedPlayers == null)
	{
		selectAllIfEmpty();
	}
	else if(playersById) draw();
}

function selectAllIfEmpty()
{
	if(selectedPlayers == null)
	{
		selectedPlayers = [];
		for (var X in playersById)
		{
			var player = playersById[X];
			selectedPlayers.push(player);
		}
		draw();
	}
}

this.hide = function()
{
	showing = false;
	view.hide();
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
}

this.onReloading = function()
{
	graphLoading.show();
}

this.setMatches = function(data)
{
	matches = data;
	graphLoading.hide();
	if(showing)
	{
		if(selectedPlayers == null)
		{
			selectAllIfEmpty();
		}
		else if(playersById) draw();
	}
}

function draw()
{
	if(!selectedPlayers || selectedPlayers.length == 0)
	{
		graph.empty();
		playerNamesEle.text("");
		return;
	}
	
	var composite, player, playerId, matchi, match, rating, index, color;
	var playerNameHTMLs = [];
	
	for(var selindex in selectedPlayers)
	{
		player = selectedPlayers[selindex];
		playerId = player.id;
		
		var selectionIndex = selectedPlayers.indexOf(player);
		if(selectionIndex < 0)
		{
			continue;
		}
		
		var ratings = [];
		
		for(matchi in matches)
		{
			match = matches[matchi];
			
			index = match.leftPlayers.indexOf(playerId);
			if(index >= 0)
			{
				rating = match.preLeftRatings[index];
			}
			else
			{
				index = match.rightPlayers.indexOf(playerId);
				if(index >= 0)
				{
					rating = match.preRightRatings[index];
				}
				else
				{
					rating = ratings.length > 0 ? ratings[ratings.length-1]: 1600;
				}
			}
			ratings.push(Math.round(rating));
		}
		
		if(player.mixedStats)
		{
			var num = Number(player.mixedStats.score);
			if(!isNaN(num)) ratings.push(num);
		}
		
		color = colors[selindex % colors.length];
		
		graph.sparkline(ratings, {
			fillColor:false,
			lineWidth:1,
			lineColor:color,
			chartRangeMin:1300,
			chartRangeMax:2000,
			chartRangeClip:true,
			height:600,
			width:view.innerWidth()-10,
			composite:composite
		});
		
		playerNameHTMLs.push(" <a href='javascript:graphView.clearPlayer("+ selectionIndex +");'><span style='color:"+color+"'>" + player.name + "</span></a>");
		
		composite = true;
	}
	
	playerNamesEle.html(playerNameHTMLs.join(" | "));
}

this.clearPlayer = function(selectionIndex)
{
	selectedPlayers.splice(selectionIndex, 1);
	draw();
}

this.clearPlayers = function()
{
	selectedPlayers = [];
	draw();
}

this.selectPlayers = function()
{
	hideActivePlayerSelectDialog();
	
	if(!selectedPlayers) selectedPlayers = [];
	
	var options = {};
	options.inactivePlayers = selectedPlayers;
	
	showPlayerSelectionDialog(function(dialog, player)
	{
		if(player)
		{
			var index = selectedPlayers.indexOf(player)
			if(index >= 0)
			{
				selectedPlayers.splice(index, 1);
			}
			else
			{
				selectedPlayers.push(player);
			}
			draw();
		}
	}, "Select players", playersById, options);
}
}
