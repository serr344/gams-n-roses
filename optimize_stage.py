import json
import math

import numpy as np

try:
    from gamspy import Container, Equation, Model, Parameter, Sense, Set, Sum, Variable

    GAMSPY_AVAILABLE = True
except ImportError:
    GAMSPY_AVAILABLE = False


BASE_DB = 92.0
AUD_DIST = 50.0
AUD_ANGLE = 180.0
BUDGET = 1200

SLOT_DEFS = {
    "N": 0,
    "NE": 45,
    "E": 90,
    "SE": 135,
    "S": 180,
    "SW": 225,
    "W": 270,
    "NW": 315,
}
SLOT_IDS = ["NW", "N", "NE", "W", "E", "SW", "S", "SE"]

ITEMS = [
    {
        "id": "line_array",
        "name": "Line Array",
        "icon": "🔊",
        "type": "speaker",
        "magnitude": 14,
        "spread": 22,
        "cost": 300,
        "reflect_magnitude": None,
        "reflect_spread": None,
    },
    {
        "id": "fill_speaker",
        "name": "Fill Speaker",
        "icon": "🔉",
        "type": "speaker",
        "magnitude": 7,
        "spread": 55,
        "cost": 150,
        "reflect_magnitude": None,
        "reflect_spread": None,
    },
    {
        "id": "subwoofer",
        "name": "Subwoofer",
        "icon": "〽️",
        "type": "speaker",
        "magnitude": 5,
        "spread": 180,
        "cost": 200,
        "reflect_magnitude": None,
        "reflect_spread": None,
    },
    {
        "id": "barrier",
        "name": "Sound Barrier",
        "icon": "🧱",
        "type": "barrier",
        "magnitude": -18,
        "spread": 50,
        "cost": 250,
        "reflect_magnitude": None,
        "reflect_spread": None,
    },
    {
        "id": "absorber",
        "name": "Absorber Panel",
        "icon": "🔇",
        "type": "barrier",
        "magnitude": -10,
        "spread": 32,
        "cost": 100,
        "reflect_magnitude": None,
        "reflect_spread": None,
    },
    {
        "id": "reflector",
        "name": "Reflector",
        "icon": "🪞",
        "type": "hybrid",
        "magnitude": -9,
        "spread": 45,
        "cost": 350,
        "reflect_magnitude": 5,
        "reflect_spread": 40,
    },
]

EXAMPLE_STAGE_DATA = {
    "pos": {"x": 2400, "y": 2400},
    "data": {
        "maxDb": 87.5,
        "status": "optimal",
        "nearby": [
            {"type": "Devlet Hastanesi", "dbLimit": 40, "dist": 180, "centerX": 2400, "centerY": 2220},
            {"type": "Kütüphane", "dbLimit": 35, "dist": 250, "centerX": 2650, "centerY": 2400},
            {"type": "Üniversite Kampüsü", "dbLimit": 60, "dist": 320, "centerX": 2400, "centerY": 2720},
            {"type": "Belediye Binası", "dbLimit": 55, "dist": 400, "centerX": 2000, "centerY": 2400},
            {"type": "Rezidans (Gökdelen)", "dbLimit": 50, "dist": 150, "centerX": 2550, "centerY": 2250},
            {"type": "İlkokul", "dbLimit": 50, "dist": 290, "centerX": 2100, "centerY": 2550},
            {"type": "Ofis Binası", "dbLimit": 55, "dist": 210, "centerX": 2400, "centerY": 2610},
            {"type": "Yaşlı Bakımevi", "dbLimit": 40, "dist": 380, "centerX": 2780, "centerY": 2400},
        ],
    },
}


def angular_diff(a: float, b: float) -> float:
    """İki pusla açısı arasındaki minimum fark."""
    return abs(((a - b) + 180) % 360 - 180)


def item_contribution(item: dict, slot_angle: float, target_angle: float) -> float:
    """stage.js itemContribution() mantığı ile birebir katkı hesabı."""
    diff = angular_diff(target_angle, slot_angle)
    sigma = item["spread"]
    effect = item["magnitude"] * math.exp(-(diff**2) / (2 * sigma**2))

    if item["type"] == "hybrid" and item.get("reflect_magnitude") is not None:
        refl_diff = angular_diff(target_angle, AUD_ANGLE)
        effect += item["reflect_magnitude"] * math.exp(
            -(refl_diff**2) / (2 * item["reflect_spread"]**2)
        )

    return effect


def total_modifier_at(angle: float, placement: dict) -> float:
    mod = 0.0
    for slot_id, item in placement.items():
        if item is None:
            continue
        mod += item_contribution(item, SLOT_DEFS[slot_id], angle)
    return mod


def db_received_at(building: dict, stage_pos: dict, placement: dict) -> float:
    dx = building["centerX"] - stage_pos["x"]
    dy = building["centerY"] - stage_pos["y"]
    dist = math.hypot(dx, dy)

    if dist < 1:
        return 999.0

    compass_deg = (math.atan2(dx, -dy) * 180 / math.pi + 360) % 360
    modifier = total_modifier_at(compass_deg, placement)
    return BASE_DB + modifier - 20 * math.log10(dist)


def audience_db(placement: dict) -> float:
    modifier = total_modifier_at(AUD_ANGLE, placement)
    return BASE_DB + modifier - 20 * math.log10(AUD_DIST)


def count_violations(buildings: list, stage_pos: dict, placement: dict) -> int:
    return sum(
        1
        for b in buildings
        if db_received_at(b, stage_pos, placement) > b["dbLimit"]
    )


def calculate_crowd(buildings: list, stage_pos: dict, placement: dict) -> int:
    adb = audience_db(placement)
    violations = count_violations(buildings, stage_pos, placement)
    base_crowd = max(0, int((adb - 50) * 450))
    penalty = violations * 2500
    return max(0, base_crowd - penalty)


def total_cost(placement: dict) -> int:
    return sum(item["cost"] for item in placement.values() if item)


def run_gamspy_optimization(stage_data: dict) -> dict:
    """
    GAMSPy ile tam MIP optimizasyonu.

    Karar değişkeni:
        x[s, i] ∈ {0,1}  -> slot s'e item i yerleştirilsin mi

    Amaç:
        İzleyiciye giden dB seviyesini maksimize etmek

    Kısıtlar:
        1. Her slotta en fazla 1 ekipman
        2. Toplam bütçe <= BUDGET
        3. Her bina için dB limiti aşılmayacak
    """
    if not GAMSPY_AVAILABLE:
        raise RuntimeError("GAMSPy kurulu değil. `pip install gamspy` komutunu çalıştırın.")

    buildings = stage_data["data"]["nearby"]
    stage_pos = stage_data["pos"]

    n_slots = len(SLOT_IDS)
    n_items = len(ITEMS)
    n_bldgs = len(buildings)

    aud_contrib = np.zeros((n_slots, n_items))
    bldg_contrib = np.zeros((n_slots, n_items, n_bldgs))
    bldg_baseline = np.zeros(n_bldgs)
    bldg_limit = np.zeros(n_bldgs)

    for s_idx, slot_id in enumerate(SLOT_IDS):
        slot_angle = SLOT_DEFS[slot_id]
        for i_idx, item in enumerate(ITEMS):
            aud_contrib[s_idx, i_idx] = item_contribution(item, slot_angle, AUD_ANGLE)

            for b_idx, b in enumerate(buildings):
                dx = b["centerX"] - stage_pos["x"]
                dy = b["centerY"] - stage_pos["y"]
                dist = math.hypot(dx, dy)

                if dist < 1:
                    bldg_contrib[s_idx, i_idx, b_idx] = 0.0
                    continue

                compass_deg = (math.atan2(dx, -dy) * 180 / math.pi + 360) % 360
                bldg_contrib[s_idx, i_idx, b_idx] = item_contribution(
                    item, slot_angle, compass_deg
                )

    for b_idx, b in enumerate(buildings):
        dx = b["centerX"] - stage_pos["x"]
        dy = b["centerY"] - stage_pos["y"]
        dist = math.hypot(dx, dy)

        if dist >= 1:
            bldg_baseline[b_idx] = BASE_DB - 20 * math.log10(dist)
        else:
            bldg_baseline[b_idx] = 999.0

        bldg_limit[b_idx] = b["dbLimit"]

    m = Container()

    S = Set(m, name="S", records=SLOT_IDS, description="Slots")
    I = Set(m, name="I", records=[it["id"] for it in ITEMS], description="Items")
    B = Set(m, name="B", records=[f"b{j}" for j in range(n_bldgs)], description="Buildings")

    cost_p = Parameter(
        m,
        name="cost_p",
        domain=[I],
        records=[(it["id"], it["cost"]) for it in ITEMS],
        description="Item costs",
    )

    aud_p = Parameter(
        m,
        name="aud_p",
        domain=[S, I],
        records=[
            (SLOT_IDS[s], ITEMS[i]["id"], float(aud_contrib[s, i]))
            for s in range(n_slots)
            for i in range(n_items)
        ],
        description="Audience contribution per slot-item",
    )

    bldg_p = Parameter(
        m,
        name="bldg_p",
        domain=[S, I, B],
        records=[
            (SLOT_IDS[s], ITEMS[i]["id"], f"b{b}", float(bldg_contrib[s, i, b]))
            for s in range(n_slots)
            for i in range(n_items)
            for b in range(n_bldgs)
        ],
        description="Building contribution per slot-item",
    )

    base_p = Parameter(
        m,
        name="base_p",
        domain=[B],
        records=[(f"b{b}", float(bldg_baseline[b])) for b in range(n_bldgs)],
        description="Baseline dB at each building",
    )

    limit_p = Parameter(
        m,
        name="limit_p",
        domain=[B],
        records=[(f"b{b}", float(bldg_limit[b])) for b in range(n_bldgs)],
        description="dB limit for each building",
    )

    aud_base = Parameter(
        m,
        name="aud_base",
        records=float(BASE_DB - 20 * math.log10(AUD_DIST)),
        description="Audience baseline dB",
    )

    budget_p = Parameter(
        m,
        name="budget_p",
        records=float(BUDGET),
        description="Total budget",
    )

    x = Variable(
        m,
        name="x",
        domain=[S, I],
        type="binary",
        description="1 if item i is placed in slot s",
    )

    aud_db_var = Variable(
        m,
        name="aud_db_var",
        type="free",
        description="Audience dB level",
    )

    obj_eq = Equation(m, name="obj_eq", description="Define audience dB")
    obj_eq[...] = aud_db_var == aud_base + Sum((S, I), aud_p[S, I] * x[S, I])

    one_per_slot = Equation(m, name="one_per_slot", domain=[S])
    one_per_slot[S] = Sum(I, x[S, I]) <= 1

    budget_eq = Equation(m, name="budget_eq")
    budget_eq[...] = Sum((S, I), cost_p[I] * x[S, I]) <= budget_p

    bldg_eq = Equation(m, name="bldg_eq", domain=[B], description="Building dB constraints")
    bldg_eq[B] = base_p[B] + Sum((S, I), bldg_p[S, I, B] * x[S, I]) <= limit_p[B]

    stage_model = Model(
        m,
        name="stage_optimizer",
        equations=m.getEquations(),
        problem="MIP",
        sense=Sense.MAX,
        objective=aud_db_var,
    )

    stage_model.solve(output=None)

    optimal_placement = {}
    records = x.records

    for slot_id in SLOT_IDS:
        optimal_placement[slot_id] = None
        if records is None:
            continue

        for item in ITEMS:
            match = records[(records["S"] == slot_id) & (records["I"] == item["id"])]
            if not match.empty and match["level"].values[0] > 0.5:
                optimal_placement[slot_id] = item
                break

    return optimal_placement


def run_greedy_optimization(stage_data: dict) -> dict:
    """
    GAMSPy yoksa basit greedy fallback.
    Her adımda kalabalığı en çok artıran hamleyi seçer.
    """
    buildings = stage_data["data"]["nearby"]
    stage_pos = stage_data["pos"]

    placement = {sid: None for sid in SLOT_IDS}
    best_crowd = calculate_crowd(buildings, stage_pos, placement)
    remaining = BUDGET
    improved = True

    while improved:
        improved = False
        best_delta = 0
        best_move = None

        for slot_id in SLOT_IDS:
            current_item = placement[slot_id]

            for item in ITEMS:
                if current_item and current_item["id"] == item["id"]:
                    continue

                net_cost = item["cost"] - (current_item["cost"] if current_item else 0)
                if net_cost > remaining:
                    continue

                placement[slot_id] = item
                crowd = calculate_crowd(buildings, stage_pos, placement)
                delta = crowd - best_crowd
                placement[slot_id] = current_item

                if delta > best_delta:
                    best_delta = delta
                    best_move = (slot_id, item, net_cost)

        if best_move:
            slot_id, item, net_cost = best_move
            placement[slot_id] = item
            best_crowd += best_delta
            remaining -= net_cost
            improved = True

    return placement



def optimize(stage_data: dict, prefer_gamspy: bool = True) -> dict:
    """
    Public API — called by api_server.py.

    Returns:
        {
            placement, audience_db, violations, estimated_crowd,
            spent, remaining_budget, stage_pos, method,
            maxSeyirci, x, y, maxDb
        }
    """
    if prefer_gamspy and GAMSPY_AVAILABLE:
        try:
            placement = run_gamspy_optimization(stage_data)
            method = "GAMSPy MIP"
        except Exception:
            placement = run_greedy_optimization(stage_data)
            method = "Greedy (fallback)"
    else:
        placement = run_greedy_optimization(stage_data)
        method = "Greedy"

    buildings = stage_data["data"]["nearby"]
    stage_pos = stage_data["pos"]
    adb       = audience_db(placement)
    violations = count_violations(buildings, stage_pos, placement)
    crowd     = calculate_crowd(buildings, stage_pos, placement)
    spent     = total_cost(placement)

    return {
        "placement":        {sid: (item["id"] if item else None) for sid, item in placement.items()},
        "audience_db":      round(adb, 2),
        "violations":       violations,
        "estimated_crowd":  crowd,
        "spent":            spent,
        "remaining_budget": BUDGET - spent,
        "stage_pos":        stage_pos,
        "method":           method,
        "maxSeyirci":       crowd,
        "x":                stage_pos["x"],
        "y":                stage_pos["y"],
        "maxDb":            round(adb, 2),
    }