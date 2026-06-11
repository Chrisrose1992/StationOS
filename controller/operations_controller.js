const {
    acknowledgeStationEvent,
    loadStationEvents,
    loadTelemetryTrend,
} = require('../helper/database_helper');

async function getEvents(req, res) {
    try {
        const events = await loadStationEvents(req.query.limit);
        return res.json({ success: true, events });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Unable to load station events.',
        });
    }
}

async function acknowledgeEvent(req, res) {
    try {
        const acknowledgedBy = String(
            req.body?.acknowledgedBy || 'StationOS operator',
        ).trim() || 'StationOS operator';
        const event = await acknowledgeStationEvent(
            req.params.eventId,
            acknowledgedBy,
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found.',
            });
        }

        return res.json({ success: true, event });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Unable to acknowledge event.',
        });
    }
}

async function getTrend(req, res) {
    try {
        const points = await loadTelemetryTrend(
            req.params.series,
            req.query.sourceId,
            req.query.hours,
        );

        if (!points) {
            return res.status(400).json({
                success: false,
                error: 'Unknown trend series.',
            });
        }

        return res.json({
            success: true,
            series: req.params.series,
            sourceId: req.query.sourceId || null,
            points,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Unable to load telemetry trend.',
        });
    }
}

module.exports = {
    acknowledgeEvent,
    getEvents,
    getTrend,
};
