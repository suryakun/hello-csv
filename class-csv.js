'use strict';

class dataCsv {

    constructor (line) {
        this.data = line;
    }

    mergeName () {
        this.data[0] = this.data[0] + " " + this.data[1];
        this.data.splice(1,1);
        return this.data;
    }
}

module.exports.dataCsv = dataCsv;