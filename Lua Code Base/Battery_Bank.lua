local LT = ic.enums.LogicType
local LBM = ic.enums.LogicBatchMethod

local SERVER = "http://127.0.0.1:4000"
local POST_INTERVAL = 20

local BATTERY_HASH = hash("StructureBatteryLarge")

local timer = 10

local BANKS = {
	{ id = "wind_bank_1", name = Bank_A or "Wind Bank 1" },
	{ id = "wind_bank_2", name = Bank_B or "Wind Bank 2" },
	{ id = "wind_bank_3", name = Bank_C or "Wind Bank 3" },
	{ id = "wind_bank_4", name = Bank_D or "Wind Bank 4" },
	{ id = "wind_bank_5", name = Bank_E or "Wind Bank 5" },
	{ id = "wind_bank_6", name = Bank_F or "Wind Bank 6" }
}

function Build_Battery_Summary(banks)

	local totalCount = 0
	local ratioTotal = 0

	local actualPowerOutW = 0
	local potentialPowerInW = 0

	local online = false

	for _, bank in ipairs(banks) do

		local count = bank.count or 0

		totalCount = totalCount + count

		ratioTotal =
			ratioTotal +
			((bank.ratio or 0) * count)

		actualPowerOutW =
			actualPowerOutW +
			(bank.actual_power_out_w or 0)

		potentialPowerInW =
			potentialPowerInW +
			(bank.potential_power_in_w or 0)

		online = online or bank.online

	end

	return {
		battery_count = totalCount,

		battery_ratio =
		totalCount > 0
		and (ratioTotal / totalCount)
		or 0,

		actual_power_out_w = actualPowerOutW,
		potential_power_in_w = potentialPowerInW,

		online = online
	}
end

function Get_Battery_Info(bank)

	local bankHash = hash(bank.name)

	local count =
		ic.batch_read_name(
			BATTERY_HASH,
			bankHash,
			LT.On,
			LBM.Sum
		) or 0

	local ratio =
		ic.batch_read_name(
			BATTERY_HASH,
			bankHash,
			LT.Ratio,
			LBM.Average
		) or 0

	local actualPowerW =
		ic.batch_read_name(
			BATTERY_HASH,
			bankHash,
			LT.PowerActual,
			LBM.Sum
		) or 0

	local potentialPowerW =
		ic.batch_read_name(
			BATTERY_HASH,
			bankHash,
			LT.PowerPotential,
			LBM.Sum
		) or 0

	return {
		id = bank.id,
		name = bank.name,

		ratio = ratio,

		actual_power_out_w = actualPowerW,
		potential_power_in_w = potentialPowerW,

		online = count > 0,
		count = count
	}
end

function tick(dt)

	timer = timer + dt

	if time < POST_INTERVAL then
		return
	end

	elapsed = 0

	local banks = {}

	for _, bank in ipairs(BANKS) do
		table.insert(
			banks,
			Get_Battery_Info(bank)
		)
	end

	local payload = {
		replace = true,
		summary = Build_Battery_Summary(banks),
		banks = banks
	}

	local data =
		util.json.encode(payload)

	ic.http.post(
		SERVER .. "/api/power/banks",
		data,
		"application/json"
	)

end
