// Please use async lib https://github.com/caolan/async
'use strict';

const debug = require('debug')('hello');
const fs = require('fs');
const parse = require('csv-parse');
const helper = require('./helper');
const moduleCsv = require('./class-csv');
const async  = require('async');

class AsyncParse {

	readFile(callback) {
        fs.readFile(__dirname + '/sample.csv', (err, loadedCsv) => {
            parse(loadedCsv, (err, parsed) => {
                if (err) callback(new Error('Error reading file'));
                callback(null, parsed);
            });
        });
	}

	loopingLine(parsed, callback) {
        for (let index in parsed) {
            if (index > 0) {
                let line = parsed[index];
                let csv = new moduleCsv.dataCsv(line);
                line = csv.mergeName();
                debug(`sending data index: ${index - 1}`);
                callback(null, line);
            };
        };
	}

	sendSms(line, callback) {
        helper.sendSms(line, (err, sendingStatus) => {
            let lineToLog;
            if (err) {
                debug(err.message);

                lineToLog = {
                    sendingStatus,
                    line,
                };
                callback(null, lineToLog);
            }
        });
	}

	logToS3(lineToLog, callback) {
        if (lineToLog) {
            helper.logToS3(lineToLog, (err, loggingStatus) => {
                if (err) {
                    callback(null, err.message);
                } else {
                    callback(null, loggingStatus);
                }
            });
        };
	}

	main() {
        var _this = this;
        async.waterfall([
			function (callback) {
                _this.readFile(callback);
			},
    		function (parsed, callback) {
                _this.loopingLine(parsed, callback);
			},
    		function (line, callback) {
                _this.sendSms(line, callback);
			},
			function (lineToLog, callback) {
                _this.logToS3(lineToLog, callback);
			},
    		function (loggingStatus, callback) {
                debug(loggingStatus);
			},
    	]);
	}

}

var runAsync = new AsyncParse;
runAsync.main();
