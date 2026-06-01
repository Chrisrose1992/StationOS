local LT = ic.enums.LogicType

local PRINTER_SLOT = 0
local STACKER_SLOT = 1
local SERVER_URL = "http://127.0.0.1:4000"
local DEFAULT_PRINT_AMOUNT = 100

local ui = ss.ui.surface("main")
ss.ui.activate("main")

local size = ui:size()
local W = size.w
local H = size.h

local printAmount = DEFAULT_PRINT_AMOUNT
local currentRecipeHash = 0
local currentPrefabName = nil
local lookupRequestId = nil

local colors = {
    bg = "#0D1117",
    panel = "#161B22",
    header = "#1F2937",
    text = "#E5E7EB",
    textDim = "#9CA3AF",
    accent = "#38BDF8",
    success = "#22C55E",
    warning = "#F59E0B",
    danger = "#EF4444",
}

local function readNumber(slot, logicType)
    return ic.read(slot, logicType) or 0
end

local function setPowered(enabled)
    local value = enabled and 1 or 0

    ic.write(PRINTER_SLOT, LT.On, value)
    ic.write(STACKER_SLOT, LT.On, value)
end

local function togglePower()
    setPowered(readNumber(PRINTER_SLOT, LT.On) <= 0)
end

local function startPrinting()
    if printAmount <= 0 then
        return
    end

    ic.write(STACKER_SLOT, LT.Setting, printAmount)
    ic.write(PRINTER_SLOT, LT.Activate, 1)
end

local function resetPrinting()
    printAmount = 0

    ic.write(STACKER_SLOT, LT.ClearMemory, 1)
    ic.write(PRINTER_SLOT, LT.Activate, 0)
end

local function stopCompletedPrint(totalPrinted)
    if printAmount > 0 and totalPrinted >= printAmount then
        ic.write(PRINTER_SLOT, LT.Activate, 0)
        ic.write(STACKER_SLOT, LT.ClearMemory, 1)
    end
end

local function handleHashLookup(body)
    local data = util.json.decode(body)

    if data and data.name then
        currentPrefabName = data.name
    end
end

local function pollHttp()
    while true do
        local id, ok, status, body, err = ic.http.poll()

        if id == nil then
            break
        end

        if id == lookupRequestId then
            lookupRequestId = nil

            if ok and status == 200 then
                handleHashLookup(body)
            else
                print("Hash lookup failed", status, err)
            end
        end
    end
end

local function requestRecipeLookup(recipeHash)
    if recipeHash == currentRecipeHash then
        return
    end

    currentRecipeHash = recipeHash
    currentPrefabName = nil

    if recipeHash == 0 then
        return
    end

    lookupRequestId = ic.http.get(SERVER_URL .. "/api/hash-lookup/" .. tostring(recipeHash))
end

local function getPrinterStatus(printerOn, printerActive)
    if printerActive > 0 then
        return "PRINTING"
    end

    if printerOn > 0 then
        return "READY"
    end

    return "OFF"
end

local function addPanel(id, x, y, w, h, bg)
    ui:element({
        id = id,
        type = "panel",
        rect = {
            unit = "px",
            x = x,
            y = y,
            w = w,
            h = h,
        },
        style = {
            bg = bg,
        },
    })
end

local function addLabel(id, text, x, y, w, h, color, fontSize)
    ui:element({
        id = id,
        type = "label",
        rect = {
            unit = "px",
            x = x,
            y = y,
            w = w,
            h = h,
        },
        props = {
            text = text,
        },
        style = {
            color = color,
            align = "center",
            font_size = fontSize,
        },
    })
end

local function addButton(id, text, x, y, w, h, bg, onClick)
    ui:element({
        id = id,
        type = "button",
        rect = {
            unit = "px",
            x = x,
            y = y,
            w = w,
            h = h,
        },
        props = {
            text = text,
        },
        style = {
            bg = bg,
            text = "#FFFFFF",
        },
        on_click = onClick,
    })
end

local function drawRecipeIcon(printerOn)
    if printerOn <= 0 or currentPrefabName == nil then
        return
    end

    ui:element({
        id = "icon",
        type = "icon",
        rect = {
            unit = "px",
            x = (W / 2) - 64,
            y = 100,
            w = 128,
            h = 128,
        },
        props = {
            icon_type = "prefab",
            name = currentPrefabName,
        },
    })
end

local function drawQuantityInput()
    ui:element({
        id = "amount",
        type = "textinput",
        rect = {
            unit = "px",
            x = (W / 2) - 110,
            y = 310,
            w = 220,
            h = 36,
        },
        props = {
            value = tostring(printAmount),
            placeholder = "Quantity",
            title = "Print Quantity",
        },
        style = {
            bg = colors.panel,
            text = colors.text,
        },
        on_change = function(value)
            local amount = tonumber(value)

            if amount then
                printAmount = math.max(0, math.floor(amount))
            end
        end,
    })
end

local function drawProgress(completion, totalPrinted)
    ui:element({
        id = "progress",
        type = "progress",
        rect = {
            unit = "px",
            x = 40,
            y = 370,
            w = W - 80,
            h = 24,
        },
        props = {
            value = tostring(completion),
        },
        style = {
            bg = colors.panel,
            fill = colors.success,
        },
    })

    addLabel(
        "count",
        string.format("Printed : %d / %d", totalPrinted, printAmount),
        0,
        405,
        W,
        25,
        colors.text
    )
end

local function drawControls(printerOn)
    addButton(
        "power",
        printerOn > 0 and "POWER OFF" or "POWER ON",
        20,
        H - 55,
        140,
        40,
        printerOn > 0 and colors.warning or colors.success,
        togglePower
    )

    addButton(
        "start",
        "START",
        (W / 2) - 70,
        H - 55,
        140,
        40,
        colors.accent,
        startPrinting
    )

    addButton(
        "reset",
        "RESET",
        W - 160,
        H - 55,
        140,
        40,
        colors.danger,
        resetPrinting
    )
end

local function drawUi(state)
    ui:clear()

    addPanel("bg", 0, 0, W, H, colors.bg)
    addPanel("header", 0, 0, W, 60, colors.header)

    addLabel("title", "AUTO LATHE", 0, 15, W, 30, colors.text, 24)
    addLabel("status", "Status : " .. state.status, 0, 70, W, 25, colors.accent, 16)

    drawRecipeIcon(state.printerOn)

    addLabel(
        "item_name",
        currentPrefabName or "Waiting For Lookup...",
        20,
        240,
        W - 40,
        25,
        colors.text
    )

    addLabel(
        "hash",
        "Recipe Hash : " .. tostring(state.recipeHash),
        20,
        265,
        W - 40,
        25,
        colors.textDim
    )

    drawQuantityInput()
    drawProgress(state.completion, state.totalPrinted)
    drawControls(state.printerOn)

    ui:commit()
end

function tick(dt)
    pollHttp()

    local printerOn = readNumber(PRINTER_SLOT, LT.On)
    local printerActive = readNumber(PRINTER_SLOT, LT.Activate)
    local totalPrinted = readNumber(STACKER_SLOT, LT.ImportCount)
    local recipeHash = readNumber(PRINTER_SLOT, LT.RecipeHash)
    local completion = readNumber(PRINTER_SLOT, LT.CompletionRatio)

    stopCompletedPrint(totalPrinted)
    requestRecipeLookup(recipeHash)

    drawUi({
        printerOn = printerOn,
        recipeHash = recipeHash,
        completion = completion,
        totalPrinted = totalPrinted,
        status = getPrinterStatus(printerOn, printerActive),
    })
end
