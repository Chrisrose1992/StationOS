const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const colorize = require('../utils/colours_utils');
let logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const loggerConfig = {
    //log_level: [silly, debug, info, warn, error]
    log_level: 'debug',
    log_to_console: true,
    log_to_file: true,
}

const consoleLog = loggerConfig.log_to_console || false;
const fileLog = loggerConfig.log_to_file || false;

const appFormat = format.combine(
    format.timestamp(),
    format.splat(),
    format.printf((info) => {
        const logMessage = `${info.timestamp} ${colorize(info.level, info.level)}: ${info.message}`;
        return process.env.NODE_ENV === 'production'
            ? JSON.stringify({
                timestamp: info.timestamp,
                level: info.level,
                message: info.message,
            })
            : logMessage;
    })
);

const appTransports = [];

// Add a console transport if console logging is enabled
if (consoleLog) {
    appTransports.push(
        new transports.Console({
            format: appFormat,
            stderrLevels: ['error'],
        })
    );
}

// Attempt to create the log file
if (fileLog) {
    const logFileDirectory = path.join(__dirname, '..', 'serverLogs');

    try {
        const fileTransport = new DailyRotateFile({
            filename: path.join(logFileDirectory, 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: format.combine(format.json()),
        });

        appTransports.push(fileTransport);
    } catch (error) {
        console.error('error', 'Error creating log file:', error.message);
    }
}

const logger = createLogger({
    level: logLevel,
    format: appFormat,
    transports: appTransports,
});

// Log unhandled exceptions
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason.stack || reason}`);
});

process.on('uncaughtException', (err) => {
    logger.log('error', `Uncaught Exception: ${err.message}\nStack: ${err.stack}`);
    process.exit(1);
});

module.exports = logger;
