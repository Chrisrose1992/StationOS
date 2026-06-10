const express = require('express');
const path = require('path');

const logger = require('./middleware/logger_middleware');
const {
    closeDatabase,
    initializeDatabase,
    loadLatestTelemetry,
} = require('./helper/database_helper');
const {
    restoreStationState,
} = require('./helper/stationState_helper');
const main_routes = require('./routes/main_routes');
const app = express();
const isDevelopment = process.env.NODE_ENV === 'development';

app.locals.liveReload = isDevelopment;

if (isDevelopment) {
    const livereload = require('livereload');
    const liveReloadServer = livereload.createServer({
        delay: 200,
    });

    liveReloadServer.watch([
        path.join(__dirname, 'public'),
        path.join(__dirname, 'views'),
    ]);
    liveReloadServer.server.once('connection', () => {
        setTimeout(() => liveReloadServer.refresh('/'), 100);
    });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views/'));

app.use('/', main_routes);

const startServer = async () => {
    const port = process.env.SERVER_PORT || 5000;

    try {
        await initializeDatabase();
        const latestTelemetry = await loadLatestTelemetry();
        const restored = restoreStationState(latestTelemetry);
        const restoredCount = Object.values(restored)
            .reduce((total, count) => total + count, 0);

        logger.info(
            `Restored ${restoredCount} telemetry source(s) from TimescaleDB`
        );
    } catch (error) {
        logger.error(`Database initialization failed: ${error.message}`);
        process.exit(1);
    }

    app.listen(port, () => {
        logger.info(`Server running at http://127.0.0.1:${port}`);
        logger.info('Press CTRL-C to stop');
    }).on('error', (err) => {
        logger.error(`Server error: ${err.message}`);
        process.exit(1);
    });

    // Graceful Shutdown Handlers
    const shutdownHandler = async (signal) => {
        logger.info(`Server shutting down due to ${signal}`);
        await closeDatabase();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
};
startServer().then();
