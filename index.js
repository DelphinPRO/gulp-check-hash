var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var defaults = require('lodash.defaults');
var through = require('through2');

var plugin = function (opt) {
	var opts = {
		src      : 'src',
		build    : 'build',
		extension: null,
		type     : 'hash' // hash | filetime
	};
	opts = defaults(opt || {}, opts);

	var srcDirectory = path.join(plugin.root + '/' + opts.src);
	var buildDirectory = path.join(plugin.root + '/' + opts.build);

	var stream = through.obj(function (file, enc, callback) {
		var contents = null;
		var isModified = true;
		var srcStats = null;
		var stats = null;

		if (file.isStream()) {
			this.push(file);
			return callback();
		}

		if (file.isBuffer()) {
			var extName = path.extname(file.relative);
			var baseName = path.basename(file.relative, extName);
			var pathName = path.dirname(file.relative);
			var destFile = path.join(buildDirectory + '/' + pathName + '/' + baseName + (opts.extension ? opts.extension : extName));
			if (fs.existsSync(destFile)) {
				stats = fs.lstatSync(destFile);

				if (opts.type == 'filetime') {
					srcStats = fs.lstatSync(path.join(srcDirectory + '/' + file.relative));
					if ((new Date(srcStats.mtime)).getTime() <= (new Date(stats.mtime)).getTime()) {
						isModified = false;
					}
				}
			}
			if (isModified && (opts.type == 'hash')) {
				contents = file.contents.toString('utf8');
				contents = crypto.createHash('md5').update(contents).digest('hex');

				if (stats && stats.isFile()) {
					var destContents = fs.readFileSync(destFile, 'utf-8');
					var destContentsHash = crypto.createHash('md5').update(destContents).digest('hex');

					if (contents === destContentsHash) {
						isModified = false;
					}
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
