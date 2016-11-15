var fs = require('fs');
var argv = require('optimist').argv;
var eyes = require('eyes');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

if (typeof(argv.xml) == 'undefined' || typeof(argv.origlang) == 'undefined' || typeof(argv.wantedlangs) == 'undefined') {
  printUsage();
  //eyes.inspect(argv);
} else {
  //eyes.inspect(argv);
  var config = {
    'xmlFile': argv.xml,
    'origLangSlug': argv.origlang,
    'valuesDir': 'values',
    'resDir': 'res',
    'stringsFile': 'strings.xml',
    'wantedLangs': argv.wantedlangs.split(',')
  };
  //eyes.inspect(config);
  if (config.xmlFile.lastIndexOf(config.resDir) + config.resDir.length == config.xmlFile.length) {
    fs.exists(config.xmlFile, function (exists) {
      if (exists) {
        fs.readdir(config.xmlFile, function (err, files) {
          var values = files.filter(function (file) {
            return file.indexOf(config.valuesDir) > -1;
          });
          var origLangDir = config.valuesDir + "-" + config.origLangSlug;
          var origLangIndex = values.indexOf(origLangDir);
          values.splice(0, 0, values.splice(origLangIndex)[0]);

          //for(wl in config.wantedLangs){
          //  eyes.inspect(values, config.wantedLangs[wl], values.indexOf(config.wantedLangs[wl]));
          //  return file.indexOf(config.valuesDir) > -1 && file.indexOf(config.wantedLangs[wl]) > -1;
          //}
          eyes.inspect(values);

          for (value in values) {
            initCouter++;
            readFile(config.xmlFile + "/" + values[value] + "/" + config.stringsFile)
          }
        });
      }
      else {
        console.log("File or directory not exist");
      }
    });
  }
  else {
    readFile(config.xmlFile);
  }
}

function readFile(xmlFile) {
  //eyes.inspect(xmlFile);
  fs.stat(xmlFile, function (err, stats) {
    if (err) {
      console.log("File not found or not readable");
    } else {
      fs.readFile(xmlFile, function (err, data) {
        if (err) {
          console.log("File not readable");

        } else {
          parser.parseString(data);
        }
      });
    }
  });
}

var arrayForCsv = [];
var initCouter = 0;
var currentCunter = 0;
parser.on('end', function (result,result1,result2) {
  //if (currentCunter == 0) {
  //  for (var i = 0; i < 10000; i++) {
  //console.log(i)
  //}
  //}
  //if (currentCunter > 0) {
  //  eyes.inspect(config.wantedLangs[currentCunter]);
  //  eyes.inspect(result);
  //}
  currentCunter++;
  // Headline
  var headLine = ['Type', 'Key', config.origLangSlug];
  for (k in config.wantedLangs) {
    headLine.push(config.wantedLangs[k]);
  }
  if (arrayForCsv.length == 0) {
    arrayForCsv.push(headLine);
  }
  for (k in result) {
    var results = Array.isArray(result[k]) ? result[k] : [result[k]];
    if (k == 'string') {
      parseString(results, k, arrayForCsv);
    } else if (k == 'string-array') {
      parseStringArray(results, k, arrayForCsv);
    } else if (k == 'plurals') {
      parsePlurals(results, k, arrayForCsv);
    } else {
      eyes.inspect(k);
      eyes.inspect(results);
    }
  }

  if (initCouter == currentCunter) {
    //eyes.inspect(arrayForCsv);
    writeToCsv(arrayForCsv);
  }
});

function parseString(result, k, arrayForCsv) {
  for (entry in result) {
    if (result[entry]['#'].substr(0, 8) == '@string/') {
      //console.log('skipped'+result[k][entry]['@'].name);
    } else {
      //eyes.inspect(result[k][entry]);
      var toAdd = [k, result[entry]['@'].name, result[entry]['#']];
      addToArrayForCsv(arrayForCsv, toAdd);
    }
  }
}

function parseStringArray(result, k, arrayForCsv) {
  for (entry in result) {
    for (item in result[entry].item) {
      var toAdd = [k, result[entry]['@'].name, result[entry].item[item]];
      addToArrayForCsv(arrayForCsv, toAdd);
    }
  }
}

function parsePlurals(result, k, arrayForCsv) {
  for (entry in result) {
    for (item in result[entry].item) {
      var toAdd = [k, result[entry]['@'].name + "/" + result[entry].item[item]["@"].quantity, result[entry].item[item]["#"]];
      addToArrayForCsv(arrayForCsv, toAdd);
    }
  }
}

function addToArrayForCsv(arrayForCsv, toAdd) {
  //eyes.inspect(toAdd);
  if (currentCunter == 1) {
    for (wl in config.wantedLangs) {
      toAdd.push('');
    }
  }
  var found = false;
  arrayForCsv.map(function (currentValue, index, arr) {
    if (currentValue[1] == toAdd[1]) {
      currentValue.push(toAdd[2]);
      found = true;
    }
  });
  //console.log(toAdd);
  if (!found) {
    arrayForCsv.push(toAdd);
  }
  eyes.inspect(arrayForCsv);
}

function writeToCsv(csvArr) {
  var stringForFile = "";
  for (row in csvArr) {
    var rowStr = '';
    for (entry in csvArr[row]) {
      var str = csvArr[row][entry];
      str = str.replace(/\\'/g, '\'');
      if (str.indexOf('"') != -1) {
        str = str.replace(/"/g, '\\"\\"');
        str = '"' + str + '"';
      } else if (str.indexOf(',') != -1) {
        str = '"' + str + '"';
      }
      rowStr += "," + str;
    }
    rowStr = rowStr.substring(1);
    stringForFile += csvArr.length - 1 > row ? rowStr + "\n" : rowStr;
  }
  //console.log(stringForFile);
}

function printUsage() {
  console.log("Usage:");
  console.log("");
  console.log("node ./export.js --xml path/to/strings.xml --origlang en --wantedlangs it,de,fr,nl");

}