// please use promise approach to fight the naive one in parse-callback.js
'use strict';

const debug = require('debug')('hello');
const fs = require('fs');
const parse = require('csv-parse');
const helper = require('./helper');
const moduleCsv = require('./class-csv');
const async  = require('async');

class PromiseParse {

	readFile() {
    return new Promise(resolve  => {
        fs.readFile(__dirname + '/sample.csv', (err, loadedCsv) => {
            parse(loadedCsv, (err, parsed) => {
                if (err) callback(new Error('Error reading file'));
                resolve(parsed);
            });
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
            callback(line);
        };
    };
	}

	sendSms(line) {
    return new Promise((resolve, reject) => {
        helper.sendSms(line, (err, sendingStatus) => {
            let lineToLog;
            if (err) {
                debug(err.message);

                lineToLog = {
                    sendingStatus,
                    line,
                };
                resolve(lineToLog);
            } else {
                reject(null);
            }
        });
    });
	}

	logToS3(lineToLog) {
    if (lineToLog) {
        helper.logToS3(lineToLog, (err, loggingStatus) => {
            if (err) {
                debug(err.message);
            } else {
                debug(loggingStatus);
            }
        });
    };
	}

	main() {
    var _this = this;
    _this.readFile()
		.then((parsed) => {
    _this.loopingLine(parsed, (line) => {
        _this.sendSms(line).then((line) => {
            _this.logToS3(line);
        });
    });
		});
	}

}

var runAsync = new PromiseParse;
runAsync.main();
