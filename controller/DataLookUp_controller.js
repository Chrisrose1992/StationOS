const HashLookup = require('../data_models/stationeers_hash_lookup.json');

function normalizeHash(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return null;
    }

    const hash = value.trim();

    if (/^0x[0-9a-f]+$/i.test(hash)) {
        return String(parseInt(hash, 16) | 0);
    }

    if (/^-?\d+$/.test(hash)) {
        return hash;
    }

    return null;
}

function getHashLookUp(req, res) {
    const hash = normalizeHash(req.params.hash);

    if (!hash) {
        return res.status(400).json({
            error: "Hash must be a signed decimal value or hex CRC32 value.",
        });
    }

    const name = HashLookup[hash];

    if (!name) {
        return res.status(404).json({
            error: "Hash not found",
            hash,
        });
    }

    res.json({
        hash,
        name,
    });
}

module.exports = { getHashLookUp };