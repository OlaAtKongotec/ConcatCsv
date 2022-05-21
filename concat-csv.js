console.log("Concat CSV running");

/* --- Require --- */

var fs = require('fs');
var readline = require('readline');

/* --- Functions --- */

var func = {};

/*
	func.findAllFiles({
		directoryPath : '',
		fileEnding : '',
		filelist : []
	});
*/
func.findAllFiles = function(_p){
	var fs = fs || require('fs');
	var files = fs.readdirSync(_p.directoryPath);
	_p.filelist = _p.filelist || [];
	_p.fileEnding = _p.fileEnding || "";
	files.forEach(function(file) {
	  if (fs.statSync(_p.directoryPath + '/' + file).isDirectory()) {
		_p.fileList = func.findAllFiles({
			directoryPath : _p.directoryPath + '/' + file,
			fileEnding : _p.fileEnding,
			filelist : _p.filelist
		});
	  }
	  else {
		  if(file.substr(-_p.fileEnding.length) == _p.fileEnding){
		  	 _p.filelist.push(_p.directoryPath + '/' + file);
		  }
	  }
	});
	return _p.filelist;
}

func.splitCsvRow = function(csvRowString, delimiter){
	// Ignore delimiters inside doble quotes...
	var regExp = new RegExp(delimiter+'(?=(?:[^"]*"[^"]*")*[^"]*$)', 'g');
	var splitRow = csvRowString.split(regExp);
	return splitRow;
}

func.fixString = function(theString){
	return theString.toString('utf8').replace(/\0/g, '');
}

/* --- Variables --- */

var csvHeaders = [];

var inputPath = null;
var tempOutputFilePath = null;
var outputFilePath = null;
var delimiter = ',';

process.argv.forEach(function (val, index, array) {
	var splitVal = val.split("=");
	if(splitVal.length > 1){
		var property = splitVal[0];
		var value = splitVal[1];
		switch(property){
			case "in" :
				inputPath = value;
			break;
			case "out" :
				if(value.slice(0, - 1)!="/") value+="/";
				tempOutputFilePath = value+'temp-concatinated-result.csv';
				outputFilePath = value+'concatinated-result.csv';
			break;
			case "delimiter" :
				delimiter = value; 
			break;
		}
	}
});

if(!inputPath || !outputFilePath){
	console.log("--- Error, missing argument(s). ---\nUse the program like this:\nnode concat-csv.js in=/your/folder/with/many/csv/to/merge/ out=/where/output/ends/up/ delimiter=,\nWhere delimiter is a single character, like , (comma).");
	process.exit(1);
}


var writeStream = null;

var init = function (){
	var fileList = func.findAllFiles({
		directoryPath : inputPath,
		fileEnding : '.csv',
		filelist : []
	});
	fs.writeFileSync(tempOutputFilePath, '', 'utf8');
	writeStream = fs.createWriteStream(tempOutputFilePath,{flags:'a', encoding:'utf8'});
	processCsv(fileList);
}

var processCsv = function(fileList){
	var currentFilePath = fileList.shift();
	var csvHeaderIndexes = [];
	var lineIndex = 0;
	var lineReader = readline.createInterface({
		input: fs.createReadStream(currentFilePath),
	});
	lineReader.on('line', function (line) {
		switch(lineIndex){
			case 0 :
				var splitLine = func.splitCsvRow(line, ',');
				for(var i = 0; i < splitLine.length; i++){
					var currentHeaderIndex = csvHeaders.indexOf(splitLine[i]);
					if(currentHeaderIndex==-1){
						currentHeaderIndex = csvHeaders.length;
						csvHeaders.push(splitLine[i]);
					}
					csvHeaderIndexes.push(currentHeaderIndex);
				}
				console.log(csvHeaders.join(delimiter));
			break;
			default :
				var remappedLine = [];
				var splitLine = func.splitCsvRow(line, ',');
				for(var i = 0; i < splitLine.length; i++){
					remappedLine[csvHeaderIndexes[i]] = splitLine[i];
				}
				remappedLineString = remappedLine.join(delimiter);
				console.log(remappedLineString);
				if(remappedLineString.length != 0){
					writeStream.write(func.fixString(remappedLineString+"\n"));
				}
			break;
		}
		lineIndex++;
	});
	lineReader.on('close', function() {
		if(fileList.length > 0){
			processCsv(fileList);
		} else {
			console.log("--- Finished processing, creating final CSV ---");
			createFinalCsv();
		}
	});
}

var createFinalCsv = function(){
	fs.writeFileSync(outputFilePath, func.fixString(csvHeaders.join(delimiter)), 'utf8');
	writeStream = fs.createWriteStream(outputFilePath,{flags:'a', encoding:'utf8'});
	var lineReader = readline.createInterface({
		input: fs.createReadStream(tempOutputFilePath),
	});
	lineReader.on('line', function (line) {
		var remappedLine = new Array(csvHeaders.length);
		var splitLine = func.splitCsvRow(line, ',');
		if(splitLine.join("").length > 0){
			for(var i = 0; i < splitLine.length; i++){
				remappedLine[i] = splitLine[i];
			}
			remappedLineString = remappedLine.join(delimiter);
			console.log(remappedLineString);
			writeStream.write("\n"+func.fixString(remappedLineString));
		}
	});
	lineReader.on('close', function() {
		console.log("--- Finished! ---");
		console.log("Check output results file at:\n"+outputFilePath);
	});
}

init();























