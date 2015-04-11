var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var defaults = require('lodash.defaults');
var through = require('through2');

//function isTest(file) {
//	var testFile = '';
//	return file.path == testFile;
//}

var plugin = function (opt) {
	var opts = {
		src      : 'src',
		build    : 'build',
		extension: null
	};
	opts = defaults(opt || {}, opts);

	var srcDirectory = path.join(plugin.root + '/' + opts.src);
	var buildDirectory = path.join(plugin.root + '/' + opts.build);

	var stream = through.obj(function (file, enc, callback) {
		var contents = null;
		var isModified = true;
		var stats = null;

		//if (isTest(file)) {
		//	console.log('ROOT DIR  : ' + plugin.root);
		//	console.log('SRC DIR   : ' + srcDirectory);
		//	console.log('BUILD DIR : ' + buildDirectory);
		//}

		if (file.isStream()) {
			this.push(file);
			return callback();
		}

		if (file.isBuffer()) {
			contents = file.contents.toString('utf8');
			contents = crypto.createHash('md5').update(contents).digest('hex');

			var extName = path.extname(file.relative);
			var baseName = path.basename(file.relative, extName);
			var pathName = path.dirname(file.relative);
			var destFile = path.join(buildDirectory + '/' + pathName + '/' + baseName + (opts.extension ? opts.extension : extName));


			//if (isTest(file)) {
			//	console.log('relative : ' + file.relative);
			//	console.log('pathname : ' + pathName);
			//	console.log('basename : ' + baseName + extName);
			//	console.log('destFile   : ' + destFile);
			//}


			if (fs.existsSync(destFile)) {
				stats = fs.lstatSync(destFile);
			}

			if (stats && stats.isFile()) {
				var destContents = fs.readFileSync(destFile, 'utf-8');
				var destContentsHash = crypto.createHash('md5').update(destContents).digest('hex');

				//if (isTest(file)) {
				//	console.log('FILE         : ' + file.path);
				//	console.log('BUFFER       : ' + file.path);
				//	console.log('RELATIVE     : ' + file.relative);
				//	console.log('EXTNAME      : ' + extName);
				//	console.log('BASENAME     : ' + baseName);
				//	console.log('DEST         : ' + buildDirectory);
				//	console.log('DEST FILE    : ' + destFile);
				//	console.log('HASH SRC     : ' + contents);
				//	console.log('HASH DEST    : ' + destContentsHash);
				//}

				if (contents === destContentsHash) {
					isModified = false;
				}
			}
		}

		if (!isModified) {
			callback();
			return;
		}

		console.log('check hash: changed (' + file.relative + ')');
		this.push(file);
		callback();
	});
	return stream;
};

plugin.root = '';

module.exports = plugin;
