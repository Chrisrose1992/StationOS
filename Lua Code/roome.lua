local LT = ic.enums.LogicType
local LBM = ic.enums.LogicBatchMethod

local httpServer = "http://127.0.0.1:5000/api/room/Corridor"
local commandServer = "http://127.0.0.1:5000/api/command/Corridor"

local postTimer = 0
local commandTimer = 0

local commandRequestId = nil

local occupancySensor = 0

local read = ic.read
local batch_read = ic.batch_read

local light_long_hash = hash("StructureLightLong")
local light_led_hash = hash("StructureDiode")
local light_round_hash = hash("StructureLightRound")
local light_round_small_hash = hash("StructureLightRoundSmall")
local light_round_angled_hash = hash("StructureLightRoundAngled")

local room_sensor_hash = hash("StructureGasSensor")

--------------------------------------------------
-- COMMAND STATE
--------------------------------------------------

local weatherNight = false
local weatherStorm = false
local lightingColour = 11

--------------------------------------------------
-- COMMAND HANDLING
--------------------------------------------------

function HandleCommandResponse(body)

	local command = util.json.decode(body)

	if command == nil then
		print("Bad Command JSON")
		return
	end

	if command.weather then

		weatherNight =
			command.weather.isNight

		weatherStorm =
			command.weather.isStorm

	end

	if command.room
	and command.room.lightColour ~= nil then

		lightingColour =
			command.room.lightColour

	end

end

function PollHttp()

	while true do

		local id, ok, status, body, err =
			ic.http.poll()

		if id == nil then
			break
		end

		if id == commandRequestId then

			commandRequestId = nil

			if ok and status == 200 then

				HandleCommandResponse(body)

			else

				print(
					"Command Error",
					status,
					err
				)

			end

		end

	end

end

--------------------------------------------------
-- MAIN
--------------------------------------------------

function tick(dt)

	postTimer = postTimer + dt
	commandTimer = commandTimer + dt

	PollHttp()

	--------------------------------------------------
	-- GET COMMANDS
	--------------------------------------------------

	if commandTimer >= 0
	and commandRequestId == nil then

		commandTimer = 0

		commandRequestId =
			ic.http.get(commandServer)

	end

	--------------------------------------------------
	-- READ DEVICES
	--------------------------------------------------

	local occupied =
		read(
			occupancySensor,
			LT.Activate
		) or 0

	local light_long =
		batch_read(
			light_long_hash,
			LT.On,
			LBM.Sum
		) or 0

	local light_led =
		batch_read(
			light_led_hash,
			LT.On,
			LBM.Sum
		) or 0

	local light_round =
		batch_read(
			light_round_hash,
			LT.On,
			LBM.Sum
		) or 0

	local light_round_small =
		batch_read(
			light_round_small_hash,
			LT.On,
			LBM.Sum
		) or 0

	local light_round_angled =
		batch_read(
			light_round_angled_hash,
			LT.On,
			LBM.Sum
		) or 0

	local led_color =
		batch_read(
			light_led_hash,
			LT.Color,
			LBM.Maximum
		) or 0

	local total_lights =
		light_long +
		light_led +
		light_round +
		light_round_small +
		light_round_angled

	--------------------------------------------------
	-- ATMOS
	--------------------------------------------------

	local pressure =
		batch_read(
			room_sensor_hash,
			LT.Pressure,
			LBM.Average
		) or 0

	local temperature =
		batch_read(
			room_sensor_hash,
			LT.Temperature,
			LBM.Average
		) or 0

	local oxygen =
		batch_read(
			room_sensor_hash,
			LT.RatioOxygen,
			LBM.Average
		) or 0

	local nitrogen =
		batch_read(
			room_sensor_hash,
			LT.RatioNitrogen,
			LBM.Average
		) or 0

	local methane =
		batch_read(
			room_sensor_hash,
			LT.RatioMethane,
			LBM.Average
		) or 0

	local carbonDioxide =
		batch_read(
			room_sensor_hash,
			LT.RatioCarbonDioxide,
			LBM.Average
		) or 0

	local pollution =
		batch_read(
			room_sensor_hash,
			LT.RatioPollutant,
			LBM.Average
		) or 0

	--------------------------------------------------
	-- HAZARD CHECK
	--------------------------------------------------

	local hazard_gases = 0

	if methane > 0.2 then
		hazard_gases = 1
	elseif carbonDioxide > 0.2 then
		hazard_gases = 1
	elseif pollution > 0.5 then
		hazard_gases = 1
	end

	--------------------------------------------------
	-- NORMAL LIGHTS
	--------------------------------------------------


	ic.batch_write(
		light_long_hash,
		LT.On,
		occupied
	)

	ic.batch_write(
		light_round_hash,
		LT.On,
		occupied
	)

	ic.batch_write(
		light_round_small_hash,
		LT.On,
		occupied
	)

	ic.batch_write(
		light_round_angled_hash,
		LT.On,
		occupied
	)

	--------------------------------------------------
	-- LED STATUS LIGHTS
	--------------------------------------------------

	if weatherStorm == true then

		ic.batch_write(light_led_hash, LT.On, 1)
		ic.batch_write(light_led_hash, LT.Color, 4)

	elseif hazard_gases == 1 then

		ic.batch_write(light_led_hash, LT.On, 1)
		ic.batch_write(light_led_hash, LT.Color, 4)

	elseif occupied > 0 or weatherNight == true then

		ic.batch_write(light_led_hash, LT.On, 1)
		ic.batch_write(light_led_hash, LT.Color, lightingColour)

	else

		ic.batch_write(light_led_hash, LT.On, 0)

	end

	--------------------------------------------------
	-- POST ROOM DATA
	--------------------------------------------------

	if postTimer >= 0 then

		postTimer = 0

		local payload =
			util.json.encode({

				room = "Main Corridor",

				occupied = occupied,

				pressure = pressure,
				temperature = temperature,

				oxygen = oxygen,
				nitrogen = nitrogen,
				methane = methane,
				carbonDioxide = carbonDioxide,
				pollution = pollution,

				hazard = hazard_gases,

				light_long = light_long,
				light_led = light_led,
				light_round = light_round,
				light_round_small = light_round_small,
				light_round_angled = light_round_angled,

				led_color = led_color,

				total_lights = total_lights,
			})

		ic.http.post(
			httpServer,
			payload,
			"application/json"
		)

	end

end
