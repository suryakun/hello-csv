'use strict';

const debug = require('debug')('hello');
const fs = require('fs');
const readline = require('readline');
const parse = require('csv-parse');
const helper = require('./helper');
const moduleCsv = require('./class-csv');
const async  = require('async');

class PromiseParse {

	readFile(callback) {
        let index = 0;
        let rl = readline.createInterface({
            input: fs.createReadStream(__dirname + '/sample.csv'),
        });

        rl.on('line', line => {
            parse(line, (err, parsed) => {
                if (index == 0) {
                    index = 1; // skip first line of stream
                } else {
                    index++;
                    callback(parsed[0], index - 2);
                }
            });
        });
	}

	loopingLine(parsed, index, callback) {
        let line = parsed;
        let csv = new moduleCsv.dataCsv(line);
        line = csv.mergeName();
        debug(`sending data index: ${index}`);
        callback(line);
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
        var self = this;
        self.readFile((parsed, index) => {
            self.loopingLine(parsed, index, line => {
                self.sendSms(line)
				    .then(lineToLog => {
                        self.logToS3(lineToLog);
				});
            });
        });
	}

}

var runAsync = new PromiseParse;
runAsync.main();
