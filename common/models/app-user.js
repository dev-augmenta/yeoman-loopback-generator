module.exports = function(AppUser) {


	AppUser.files = function( id, cb ){
		AppUser.findById( id, function(error, instance){
			var response = instance.folder;

			var ds = AppUser.app.dataSources.storage;
			var container = ds.createModel('container');
			container.getFiles(instance.folder, null, function(error, data){
				var response = data;
				cb(null, response);
			});
		});
	};

	AppUser.remoteMethod(
		'files',
		{
			description : 'Queries files of AppUser',
			accepts :[ { arg: 'id', description: 'Model id', type: 'string', required : true}],
			http : { path : '/:id/files', verb : 'get'},
			returns : { arg: 'data', type : 'string'}
		}
	);

	/* OPERATION HOOKS */
	// AFTER SAVE
	// Hook executed after user creation
	// Create a user container (bucket) for his museum files
	// TODO: link instances
	AppUser.observe('after save', function createUserContainer(ctx, next){

		if( ctx.isNewInstance )
		{
			var containerName = 'vrseum-'+ctx.instance.username+'-'+ctx.instance.id.toString();
			console.log('New AppUser created  ' + JSON.stringify(ctx, null, 2));

			// Create new datasource for user file container
			var ds = ctx.Model.app.dataSources.storage;
			var container = ds.createModel('container');
			container.createContainer({name : containerName}, function(error, folder){

				if( !error )
				{
					AppUser.findById( ctx.instance.id, function(error, dbInstance){
							if( dbInstance && !error)
							{
								dbInstance.updateAttributes({ folder : containerName }, function(err, inst){
								if( err ) return done(err);
							});
						}
					});

					console.log('New user container created with name ' + containerName);
				}
				else
				{
					console.log(error);
				}

			});
		}

		next();
	});

	// AFTER DELETE
	// Hook executed after user deletion
	// Remove the user container (bucket) and all his files
	// TODO: delete museum instances and containers
	AppUser.observe('before delete', function deleteUserContainer(ctx, next){


			console.log('About to delete user with id: ' + ctx.where.id);

			AppUser.findById(ctx.where.id, function(err, model) {

				var ds = ctx.Model.app.dataSources.storage;
				var container = ds.createModel('container');

				console.log('Container that will be deleted ' + model.folder);


				container.destroyContainer(model.folder, function(error, userContainer){

					if( !error )
					{
						console.log('Container deleted');
					}
					else
					{
						console.log(error);
					}

					next();
				});
			});
		});

};
