const argv = require('minimist')(process.argv.slice(2));

if(argv._.length < 2) {
	help();
	process.exit();
}

const xml2js = require('xml2js')
, StreamZip = require('node-stream-zip')
, zip = new StreamZip({file: argv._[0], storeEntries: true})
, path = require('path')
, fs = require('fs');

let media = {};

zip.on('ready', () => {
	let entries = zip.entries();
	let objs = [];
	let meds = [];
	for(let i in entries) {
		if(entries.hasOwnProperty(i)) {
				objs.push(i);
		}
	}
	Promise.all(objs.reduce((pre, cur) => {
		if(cur.indexOf('.rels') > -1 || cur.indexOf('.xml') > -1) {
			let p = new Promise((resolve, reject) => {
				let parser = new xml2js.Parser({
					async: true,
					explicitRoot: false,
					preserveChildrenOrder: true, 
					explicitArray: false, 
					explicitChildren: true,
					trim: false,
					normalize: false,
				    allowSpacesInTextNode: true,
					attrValueProcessors: [function(name) {
						//no direct float value in ECMA-376 attribute
						if(name.search(/^-*[0-9]+$/) === 0) {
							if(name.length > 1 && name.indexOf('0') === 0) {
								return name;
							} else {
								return parseInt(name, 10);
							}
						} else {
							return name;
						}
					}]
				});
				parser.parseString(zip.entryDataSync(cur).toString(), (err, data) => {
					console.log('parsing ' + cur);
					if(!!err) return reject(err);
					resolve({file: cur, data: strip(data)});
				});
			});
			pre.push(p);
		}
		if(cur.indexOf('ppt/media') === 0) {
			let p = new Promise((resolve, reject) => {
				resolve({file: cur, data: zip.entryDataSync(cur)})
			});
			pre.push(p)
		}
		return pre;
	}, []))
	.then(objs => {
		let result = {};
		return new Promise((resolve, reject) => {
			objs.forEach(obj => {
				if(obj.file.indexOf('.rels') > -1 || obj.file.indexOf('.xml') > -1)
					result[obj.file] = obj.data;
			});
			if(argv['m'] === 1) {
				let data = require('node-pptx-parser')(result);
				fs.writeFile(argv._[1] + path.sep + 'main.js', 'var data = ' + JSON.stringify(data, null, 2), {encoding: 'utf-8'}, err => {
					if(!!err) return reject(err);
					console.log('writing ' + argv._[1] + path.sep + 'main.js');
					let rs = fs.createReadStream(__dirname + path.sep + 'template.html', {encoding:'utf-8'});
					let ws = fs.createWriteStream(argv._[1] + path.sep + 'index.html', {defaultEncoding:'utf-8'});
					ws.on('finish', () => {
						console.log('writing ' + argv._[1] + path.sep + 'index.html');
						resolve(objs);
					});
					rs.pipe(ws);
				});
			} else {
				fs.writeFile(argv._[1] + path.sep + 'main.json', JSON.stringify(result, null, 2), {encoding: 'utf-8'}, err => {
					if(!!err) return reject(err);
					console.log('writing ' + argv._[1] + path.sep + 'main.json');
					resolve(objs);
				});
			}
		});
	}, (reason) => {
		console.error(reason);
	})
	.then(objs => {
		return new Promise((resolve, reject) => {
			fs.mkdir(argv._[1] + path.sep + 'ppt', err => {
				if(!!err) return reject(err);
				fs.mkdir(argv._[1] + path.sep + 'ppt' + path.sep + 'media', err => {
					if(!!err) return reejct(err);
					resolve(objs);
				});
			});
		});
	}, reason => {
		console.error(reason);
	})
	.then(objs => {
		return Promise.all(objs.filter(entry => {
			if(entry.file.indexOf('ppt/media/') === 0)
				return true;
			return false;
		}).reduce((pre, cur) => {
			let p = new Promise((resolve, reject) => {
				let filename = argv._[1] + path.sep + 'ppt' + path.sep + 'media' + path.sep + cur.file.split(path.sep)[cur.file.split(path.sep).length-1];
				fs.writeFile(filename, cur.data, err => {
					if(!!err) return reject(err);
					console.log('writing ' + filename);
					resolve();
				});			
			});
			pre.push(p);
			return pre;
		}, []));
	})
	.then(() => {
		console.log('done.');
	});
});

function help() {
	console.log('[Usage] node node-pptx [options] [path to pptx file] [export directory]');
	console.log('options:');
	console.log('\t-m 0 : export json directly converted from xml.(default)');
	console.log('\t-m 1 : export parsed json other than original one by -m 0 option.');
}

function strip(obj) {
	for(let i in obj) {
		if(obj.hasOwnProperty(i) && i !== '$' && i !== '$$' && i !== '#name' && i !== '_') {
			delete obj[i];
		}
	}
	if(!!obj.$$) {
		let tmp = obj.$$.reduce((pre, cur) => {
			pre.push(strip(cur));
			return pre;
		}, []);
		obj.$$ = tmp;
	}
	return obj;
}
