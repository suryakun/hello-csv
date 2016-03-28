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
        return new Promise((resolve, reject)  => {
            fs.readFile(__dirname + '/sample.csv', (err, loadedCsv) => {
                parse(loadedCsv, (err, parsed) => {
                    if (err) reject(new Error('Error reading file'));
                    resolve(parsed);
                });
            });
        });
	}

	loopingLine(parsed) {
        return new Promise(resolve => {
            let promiseCollection = [];
            for (let index in parsed) {
                if (index > 0) {
                    let line = parsed[index];
                    let csv = new moduleCsv.dataCsv(line);
                    line = csv.mergeName();
                    debug(`sending data index: ${index - 1}`);
                    promiseCollection.push(this.sendSms(line));
                };
            };
            resolve(promiseCollection);
        });
	}

	sendSms(line) {
        return new Promise((resolve) => {
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
                    resolve(null);
                }
            });
        });
	}

	logToS3(promiseCollection) {
        Promise.all(promiseCollection)
        .then(promises=> {
            let lineToLogs = promises.filter((line)=> {
                return !!line;
            });

            lineToLogs.map(lineToLog => {
                helper.logToS3(lineToLog, (err, loggingStatus) => {
                    if (err) {
                        debug(err.message);
                    } else {
                        debug(loggingStatus);
                    }
                });
            })
        });
	}

    errorHandler(err){
        debug(err.message);
    }

	main() {
        this.readFile().then(parsed => {
            return this.loopingLine(parsed);
        }, reason => {
            return this.errorHandler(reason);
        }).then(promiseCollection => {
            return this.logToS3(promiseCollection);
        });        
	}

}

var runAsync = new PromiseParse;
runAsync.main();
