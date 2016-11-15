var fs		= require('fs');
var argv 	= require('optimist').argv;
var eyes	= require('eyes');
var xml2js	= require('xml2js');
var parser	= new xml2js.Parser();

if (typeof(argv.xml) == 'undefined' || typeof(argv.origlang) == 'undefined' || typeof(argv.wantedlangs) == 'undefined' ) {
	printUsage();
	//eyes.inspect(argv);
} else {
	//eyes.inspect(argv);
	var config = {
			'xmlFile': 		argv.xml,
			'origLangSlug':	argv.origlang,
			'wantedLangs':	argv.wantedlangs.split(',')	
	};
	//eyes.inspect(config);
	fs.stat(config.xmlFile, function (err, stats) {
		if (err) {
			console.log("File not found or not readable");
		} else {
			fs.readFile(config.xmlFile, function(err, data) {
				if (err) {
					console.log("File not readable");

				} else {
					parser.parseString(data);
				}
			});
		}
	} );
	
	
}


parser.on('end', function(result) {
	var tmpArrayForCsv = [];
	// Headline
	var headLine = ['Type', 'Key', config.origLangSlug];
	for (k in config.wantedLangs) {
		headLine.push(config.wantedLangs[k]);
	}
	tmpArrayForCsv.push(headLine);
	for (k in result) {
    var results = Array.isArray(result[k]) ? result[k] : [result[k]];
		if (k == 'string') {
			parseString(results, k, tmpArrayForCsv);
		} else if (k=='string-array') {
      parseStringArray(results, k, tmpArrayForCsv);
    } else if (k=='plurals') {
      parsePlurals(results, k, tmpArrayForCsv);
    } else {
			eyes.inspect(k);
			eyes.inspect(result[k]);
		}
	}

	//eyes.inspect(tmpArrayForCsv);

	writeToCsv(tmpArrayForCsv);

});

function parseString(result, k, arrayForCsv){
  for (entry in result) {
    if (result[entry]['#'].substr(0,8) == '@string/') {
      //console.log('skipped'+result[k][entry]['@'].name);
    } else {
      //eyes.inspect(result[k][entry]);
      var toAdd = [k, result[entry]['@'].name, result[entry]['#']];
      for (wl in config.wantedLangs) {
        toAdd.push('');
      }

      arrayForCsv.push(toAdd);
    }
  }
}

function parseStringArray(result, k, arrayForCsv){
  for (entry in result) {
    for (item in result[entry].item) {
      var toAdd = [k, result[entry]['@'].name, result[entry].item[item]];
      for (wl in config.wantedLangs) {
        toAdd.push('');
      }
      arrayForCsv.push(toAdd);
    }
  }
}

function parsePlurals(result, k, arrayForCsv){
  for (entry in result) {
    for (item in result[entry].item) {
      var toAdd = [k, result[entry]['@'].name + "/" +result[entry].item[item]["@"].quantity, result[entry].item[item]["#"]];
      for (wl in config.wantedLangs) {
        toAdd.push('');
      }
      arrayForCsv.push(toAdd);
    }
  }
}

function writeToCsv(csvArr) {
	var stringForFile = "";
	for (row in csvArr) {
		var rowStr = '';
		for (entry in csvArr[row]) {
			var str = csvArr[row][entry];
			str = str.replace(/\\'/g,'\'');
			if (str.indexOf('"') != -1) {
				str = str.replace(/"/g,'\\"\\"');
				str = '"'+str+'"';
			} else if (str.indexOf(',') != -1) {
				str = '"'+str+'"';
			}
			rowStr+=","+str;
		}
		rowStr= rowStr.substring(1);
		stringForFile +=rowStr+"\n";
	}
	console.log(stringForFile);
}

function printUsage() {
	console.log("Usage:");
	console.log("");
	console.log("node ./export.js --xml path/to/strings.xml --origlang en --wantedlangs it,de,fr,nl");

}