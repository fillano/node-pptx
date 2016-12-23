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

let result = {};
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
				let parser = new xml2js.Parser();
				parser.parseString(zip.entryDataSync(cur).toString(), (err, data) => {
					if(!!err) return reject(err);
					resolve({file: cur, data: data});
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
		objs.forEach(obj => {
			if(obj.file.indexOf('.rels') > -1 || obj.file.indexOf('.xml') > -1)
				result[obj.file] = obj.data;
		});
		return new Promise((resolve, reject) => {
			fs.writeFile(argv._[1] + path.sep + 'main.json', JSON.stringify(result, null, 2), {encoding: 'utf-8'}, err => {
				if(!!err) return reject(err);
				resolve(objs);
			});
		});
	}, (reason) => {
		console.error(reason);
	})
	.then(objs => {
		return new Promise((resolve, reject) => {
			fs.mkdir(argv._[1] + path.sep + 'media', err => {
				if(!!err) return reject(err);
				resolve(objs);
			})
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
				let filename = argv._[1] + path.sep + 'media' + path.sep + cur.file.split(path.sep)[cur.file.split(path.sep).length-1];
				fs.writeFile(filename, cur.data, err => {
					if(!!err) return reject(err);
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
	console.log('[Usage] node node-pptx [path to pptx file] [export directory]');
}