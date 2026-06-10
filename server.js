const express = require('express');
const path = require('path');

const logger = require('./middleware/logger_middleware');
const main_routes = require('./routes/main_routes');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views/'));

app.use('/', main_routes);

const startServer = async () => {
    const port = process.env.SERVER_PORT || 5000;

    app.listen(port, () => {
        logger.info(`Server running at http://127.0.0.1:${port}`);
        logger.info('Press CTRL-C to stop');
    }).on('error', (err) => {
        logger.error(`Server error: ${err.message}`);
        process.exit(1);
    });

    // Graceful Shutdown Handlers
    const shutdownHandler = (signal) => {
        logger.info(`Server shutting down due to ${signal}`);
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
};
startServer().then();
