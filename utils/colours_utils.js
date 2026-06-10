const colors = require('colors');

const colorize = (level, message) => {
    switch (level) {
        case 'error':
            return message.red;
        case 'warn':
            return message.yellow;
        case 'info':
            return message.green;
        case 'verbose':
            return message.cyan;
        case 'debug':
            return message.blue;
        default:
            return message;
    }
}

module.exports = colorize;
