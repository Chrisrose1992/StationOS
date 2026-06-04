local LT = ic.enums.LogicType
local LBM = ic.enums.LogicBatchMethod

local POWER_IN = 0
local POWER_OUT = 1

local BATTERY_HASH = hash("StructureBatteryLarge")

local pendingRequest = nil
local timer = 0

function tick(dt)
	timer = timer + dt

	local battery_count = ic.batch_read(BATTERY_HASH, LT.On, LBM.Sum) or 0
	local battery_ratio = ic.batch_read(BATTERY_HASH, LT.Ratio, LBM.Average) or 0
	local battery_error = ic.batch_read(BATTERY_HASH, LT.Error, LBM.Maximum) or 0

	local power_actual_in_w = ic.read(POWER_IN, LT.PowerActual) or 0
	local power_actual_out_w = ic.read(POWER_OUT, LT.PowerActual) or 0
	local power_required_out_w = ic.read(POWER_OUT, LT.PowerRequired) or 0

	if timer >= 3 and pendingRequest == nil then
		timer = 0

		local data_packet = util.json.encode({
			battery_count = battery_count,
			battery_ratio = battery_ratio,
			power_actual_in_w = power_actual_in_w,
			power_actual_out_w = power_actual_out_w,
			power_required_out_w = power_required_out_w,
			battery_error = battery_error
		})

		pendingRequest = ic.http.post(
			"http://127.0.0.1:4000/api/battery",
			data_packet,
			"application/json"
		)
	end

	local id, ok, status, body, err = ic.http.poll()

	if id ~= nil and id == pendingRequest then
		if ok then
			print("HTTP OK:", status)
		else
			print("HTTP Error:", err)
		end

		pendingRequest = nil
	end
end
