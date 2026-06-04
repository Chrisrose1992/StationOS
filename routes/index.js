const router = require('express').Router();

const weather_controller = require("../controller/weather_controller");
const PowerGeneration = require("../controller/power_generation_controller");

//Weather
router.get("/weather", weather_controller.GetWeatherData);
router.post("/api/weather", weather_controller.PostWeatherData);

//Power Generation
router.get("/power", PowerGeneration.GetPower);
router.get("/power-banks", PowerGeneration.GetPowerBanks);
router.get("/api/power/banks", PowerGeneration.GetPowerBanksApi);
router.post("/api/wind_generation", PowerGeneration.PostWindGeneration);
router.post("/api/grid_generation", PowerGeneration.PostGridGeneration);
router.post("/api/battery", PowerGeneration.PostBaseBattery);
router.post("/api/power/banks", PowerGeneration.PostPowerBanks);


module.exports = router;
