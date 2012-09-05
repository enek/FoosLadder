
exports.getUsers = function(body, callback)
{
    matches = GLOBAL.usersDB.view('users', 'by_name',
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
			console.log("users.getUsers OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}


exports.addUser = function(body, callback)
{
	console.log("users.addUser: "+body.name);
	GLOBAL.usersDB.insert({name: body.name}, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.addUser error: "+error);
			callback({status:"error"});
		}
		else
		{
			console.log("users.addUser OK: " + JSON.stringify(body));
			callback({status:"OK"});
		}
	});
}


