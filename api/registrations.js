var utils = require("./../utils.js");
var config = require("./../config.json");
var users = require("./users.js");

exports.getRegistrations = function(body, callback)
{
	GLOBAL.registrationDB.view('registration', 'by_name',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("registration.getRegistration error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var registration = body.rows[X].value;
				registration.id = registration._id;
				delete registration._id;
				delete registration._rev;
				result.push(registration);
			}

			callback(result);
		}
	});
}

function getRegistrationsByIds(registrationIds, callback)
{
	var registrationsById = {};
	GLOBAL.registrationDB.fetch({keys:registrationIds}, function (error, body, headers)
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
				registrationsById[row.id] = row.doc;
			}
			for (var X in registrationsIds)
			{
				var registrationId = registrationsIds[X];
				if(registrationsById[registrationId] == null)
				{
					callback(null);
					return;
				}
			}

			callback(registrationsById);
		}
	});
}

exports.addRegistration = function(body, callback)
{
	console.log("registration.addRegistration: "+body);

	if(!body.name)
	{
		callback({status:"error", message:"Invalid name"});
		return;
	}
	var player = {name: body.name};
	if(body.email) player.email = body.email;
	if(body.company) player.company = body.company;
	if(body.recentGameCount) player.recentGameCount = body.recentGameCount;
	player.added = new Date().getTime();
	console.log("trying to add: "+body + "body" +player);

	GLOBAL.registrationDB.insert(player, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("registration.addRegistration error: "+error);
			callback({status:"error", message:error.message});
		}
		else
		{
			console.log("registration.addRegistration OK: " + JSON.stringify(body));
			callback({status:"ok"});
		}
	});
}

exports.activeRegistration = function(body, callback)
{
	console.log("registration.activate: "+body);
	if(!body.registrationId)
	{
		callback({status:"error", message:"Invalid id"});
		return;
	}

	users.isAsscessTokenValidForAdding(body.fbAccessToken, function(ok) {
		if(ok)
		{
			var registrationIds = [body.registrationId];
			getRegistrationsByIds(playerIds, function(registrationsById)
			{
				if(registrationsById && registrationsById[body.registrationId])
				{
					var registration = registrationsById[body.registrationId];

					var initialExperience = registration.recentGameCount - 1;
					if (initialExperience > 3)
					  initialExperience = 3;
					if (initialExperince < 1)
					  initialExperience = 1;
					var body = {
						name:registration.name,
						company:registration.company,
						initialExperience:initialExperience
					}

					users.addUserToDB(body,function(ok)
					{
						callback({status:"ok"});
					});
				}
				else callback({status:"error", message:"Not found."});
			});
		}
		else
		{
			console.log("activeRegistration: "+ body.name +" NOT AUTHORIZED");
			callback({status:"error", message:"Not authorized."});
		}
	});

}
