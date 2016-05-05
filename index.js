var fs 			= require('fs'),
	path 		= require('path'),
	through 	= require('through2'),
	PluginError	= require('gulp-util').PluginError,
	hashsum		= require('hashsum'),
	Finder 		= require('fs-finder')
	;

const PLUGIN_NAME = 'gulp-hash-revision';

var revision = function(file_to_update){

	// Creating a stream through which each file will pass
	return through.obj(function(file, enc, cb) {
		if (file.isNull()) {
		  // return empty file
		  return cb(null, file);
		}
		if (file.isBuffer()) {

			var filename_base = path.basename(file.path);

			var filename_ext = path.extname(file.path);

			filename_base = filename_base.replace(filename_ext, '');

			var file_location = file.path;

			/* if it's not a map file file, continue */
			if(filename_ext!='.map'){
				var src = fs.createReadStream(file_location);
				hashsum.stream(src, function (err, hash) {
					/* we've created a hash, let's revise the reference*/
			  		revise(hash);
				});

				var revise = function(hash){
					fs.readFile(file_to_update, 'utf8', function (err,data){
						if(err){
							return console.log("Error: "+err);
						}

						// regex for old file name whether it has a hash or not
						var old_hash = new RegExp(filename_base + "[0-9A-z]*" + filename_ext);

						// the new hashname we're going to use
						var new_hash = filename_base+hash+filename_ext;

						// replace the old filename with the new one
						var result = data.replace(old_hash, new_hash);

						// write these contents back to the file_to_update
						fs.writeFile(file_to_update, result, 'utf8', function (err){
							if (err) return console.log(err);
						});	

						// location of the files that might have old instances
						var file_folder = file_location.replace(path.basename(file.path),'');

						// the old files "i.e. master897dg9a70.css but not master.css"
						var search_query = filename_base+'<[0-9A-z]{40}>'+filename_ext;
						var old_files = Finder.from(file_folder).findFiles(search_query);
						var new_file_name = file_location.replace(filename_ext,hash)+filename_ext;

						// delete the old files
						old_files.forEach(function(value){
							//fs.unlinkSync(value);	
							console.log("Value is: "+value);
							fs.stat(value,function(err){
								if( err==null && value != new_file_name){
									fs.unlinkSync(value);
								}
							});
						});

						// rename target file with hashsume
						fs.rename(file_location, new_file_name, function(err){
							if (err) return console.log(err);
						});
					});
				}
			}
			
		  	return cb(null, file);

		}
		if (file.isStream()) {
		  throw new PluginError(PLUGIN_NAME, 'Streams not supported');
		}

		cb(null, file);

	});
}

module.exports = revision;