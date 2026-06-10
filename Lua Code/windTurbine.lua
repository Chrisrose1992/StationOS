local LT = ic.enums.LogicType

local httpServer =
	"http://127.0.0.1:5000/api/wind-turbine"

local postTimer = 0

local reader1 = 0
local reader2 = 1
local reader3 = 2


local turbine_hash =
	hash("-2082355173")

function tick(dt)

	postTimer = postTimer + dt

	local power_output = ic.read(reader3, LT.Setting) or 0
	local wind_speed = ic.read(reader1, LT.Setting) or 0
	local turbine_speed = ic.read(reader2, LT.Setting) or 0

	if postTimer >= 5 then

		postTimer = 0

		local data =
			util.json.encode({
				powerOutput = power_output,
				windSpeed = wind_speed,
				turbineSpeed = turbine_speed
			})

		ic.http.post(
			httpServer,
			data,
			"application/json"
		)

	end

end