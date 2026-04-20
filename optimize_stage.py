

import json
import math
import sys
import argparse
import textwrap
from dataclasses import dataclass, field
from typing import Optional


try:
    from gamspy import (
        Container, Set, Parameter, Variable, Equation,
        Model, Sense, Sum, Ord, Card
    )
    import gamspy.math as gmath
    GAMSPY_AVAILABLE = True
except ImportError:
    GAMSPY_AVAILABLE = False

import numpy as np

BASE_DB   = 92.0   # Sahnedeki temel ses basıncı (dBSPL @ 1m)
AUD_DIST  = 50.0   # İzleyici kitlesi mesafesi (m)
AUD_ANGLE = 180.0  # İzleyicinin bulunduğu pusla açısı (Güney)
BUDGET    = 1000   # Başlangıç bütçesi (🪙)

# Slot tanımları: isim → pusla açısı
SLOT_DEFS = {
    "N" : 0,
    "NE": 45,
    "E" : 90,
    "SE": 135,
    "S" : 180,
    "SW": 225,
    "W" : 270,
    "NW": 315,
}
SLOT_IDS = ["NW", "N", "NE", "W", "E", "SW", "S", "SE"]

# Ekipman kataloğu (stage.js ITEMS ile birebir)
ITEMS = [
    dict(id="line_array",  name="Line Array",      icon="🔊", type="speaker",
         magnitude=+14, spread=22,  cost=300,
         reflect_magnitude=None, reflect_spread=None),
    dict(id="fill_speaker",name="Fill Speaker",    icon="🔉", type="speaker",
         magnitude=+7,  spread=55,  cost=150,
         reflect_magnitude=None, reflect_spread=None),
    dict(id="subwoofer",   name="Subwoofer",       icon="〽️", type="speaker",
         magnitude=+5,  spread=180, cost=200,
         reflect_magnitude=None, reflect_spread=None),
    dict(id="barrier",     name="Sound Barrier",   icon="🧱", type="barrier",
         magnitude=-18, spread=50,  cost=250,
         reflect_magnitude=None, reflect_spread=None),
    dict(id="absorber",    name="Absorber Panel",  icon="🔇", type="barrier",
         magnitude=-10, spread=32,  cost=100,
         reflect_magnitude=None, reflect_spread=None),
    dict(id="reflector",   name="Reflector",       icon="🪞", type="hybrid",
         magnitude=-9,  spread=45,  cost=350,
         reflect_magnitude=+5, reflect_spread=40),
]

# ═══════════════════════════════════════════════════════════════════════════════
#  ÖRNEK VERİ  (index.html tıklanmadığında kullanılır)
# ═══════════════════════════════════════════════════════════════════════════════

EXAMPLE_STAGE_DATA = {
    "pos": {"x": 2400, "y": 2400},
    "data": {
        "maxDb": 87.5,
        "status": "optimal",
        "nearby": [
            {"type": "Devlet Hastanesi",        "dbLimit": 40, "dist": 180, "centerX": 2400, "centerY": 2220},
            {"type": "Kütüphane",               "dbLimit": 35, "dist": 250, "centerX": 2650, "centerY": 2400},
            {"type": "Üniversite Kampüsü",       "dbLimit": 60, "dist": 320, "centerX": 2400, "centerY": 2720},
            {"type": "Belediye Binası",          "dbLimit": 55, "dist": 400, "centerX": 2000, "centerY": 2400},
            {"type": "Rezidans (Gökdelen)",      "dbLimit": 50, "dist": 150, "centerX": 2550, "centerY": 2250},
            {"type": "İlkokul",                  "dbLimit": 50, "dist": 290, "centerX": 2100, "centerY": 2550},
            {"type": "Ofis Binası",              "dbLimit": 55, "dist": 210, "centerX": 2400, "centerY": 2610},
            {"type": "Yaşlı Bakımevi",           "dbLimit": 40, "dist": 380, "centerX": 2780, "centerY": 2400},
        ]
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  YARDIMCI FONKSİYONLAR
# ═══════════════════════════════════════════════════════════════════════════════

def angular_diff(a: float, b: float) -> float:
    """İki pusla açısı arasındaki minimum fark (0-180°)."""
    d = abs(((a - b) + 180) % 360 - 180)
    return abs(d)

def item_contribution(item: dict, slot_angle: float, target_angle: float) -> float:
    """
    stage.js itemContribution() ile birebir:
    Gauss envelope ile bir item'ın hedef açıya katkısı.
    """
    diff  = angular_diff(target_angle, slot_angle)
    sigma = item["spread"]
    effect = item["magnitude"] * math.exp(-(diff**2) / (2 * sigma**2))

    if item["type"] == "hybrid" and item.get("reflect_magnitude"):
        refl_diff = angular_diff(target_angle, AUD_ANGLE)
        effect += item["reflect_magnitude"] * math.exp(
            -(refl_diff**2) / (2 * item["reflect_spread"]**2)
        )
    return effect

def total_modifier_at(angle: float, placement: dict) -> float:
    """Verilen açıdaki toplam dB modifikasyonu (yerleştirme: {slot_id: item})."""
    mod = 0.0
    for slot_id, item in placement.items():
        if item is None:
            continue
        slot_angle = SLOT_DEFS[slot_id]
        mod += item_contribution(item, slot_angle, angle)
    return mod

def db_received_at(building: dict, stage_pos: dict, placement: dict) -> float:
    """Bir binanın aldığı dB seviyesi."""
    dx = building["centerX"] - stage_pos["x"]
    dy = building["centerY"] - stage_pos["y"]
    dist = math.hypot(dx, dy)
    if dist < 1:
        return 999.0
    compass_deg = (math.atan2(dx, -dy) * 180 / math.pi + 360) % 360
    modifier = total_modifier_at(compass_deg, placement)
    return BASE_DB + modifier - 20 * math.log10(dist)

def audience_db(placement: dict) -> float:
    """50m güneydeki izleyici kitlesi ses seviyesi."""
    modifier = total_modifier_at(AUD_ANGLE, placement)
    return BASE_DB + modifier - 20 * math.log10(AUD_DIST)

def count_violations(buildings: list, stage_pos: dict, placement: dict) -> int:
    """Limit aşımı olan bina sayısı."""
    return sum(
        1 for b in buildings
        if db_received_at(b, stage_pos, placement) > b["dbLimit"]
    )

def calculate_crowd(buildings: list, stage_pos: dict, placement: dict) -> int:
    """stage.js calculateCrowd() ile birebir kitlesi hesabı."""
    adb        = audience_db(placement)
    violations = count_violations(buildings, stage_pos, placement)
    base_crowd = max(0, int((adb - 50) * 450))
    penalty    = violations * 2500
    return max(0, base_crowd - penalty)

def total_cost(placement: dict) -> int:
    return sum(item["cost"] for item in placement.values() if item)

# ═══════════════════════════════════════════════════════════════════════════════
#  GAMSPy LP / MIP MODELİ
# ═══════════════════════════════════════════════════════════════════════════════

def build_contribution_table(buildings: list, stage_pos: dict) -> dict:
    """
    Her (slot, item, building) üçlüsü için pre-hesaplanmış katkı tablosu.
    GAMSPy parametrelerine beslenecek.
    """
    table = {}
    for slot_id in SLOT_IDS:
        slot_angle = SLOT_DEFS[slot_id]
        for item in ITEMS:
            for b_idx, b in enumerate(buildings):
                dx = b["centerX"] - stage_pos["x"]
                dy = b["centerY"] - stage_pos["y"]
                dist = math.hypot(dx, dy)
                if dist < 1:
                    continue
                compass_deg = (math.atan2(dx, -dy) * 180 / math.pi + 360) % 360
                contrib = item_contribution(item, slot_angle, compass_deg)
                table[(slot_id, item["id"], b_idx)] = contrib
    return table

def run_gamspy_optimization(stage_data: dict) -> dict:
    """
    GAMSPy ile tam MIP optimizasyonu.

    Değişkenler:
        x[s,i] ∈ {0,1}  — slot s'e item i yerleştir

    Amaç:
        Maximize: audience_db katkısı = BASE_DB + mod_audience - 20·log10(50)
        Kalabalık = max(0, (AudDB - 50) * 450) (ihlalsiz)

    Kısıtlar:
        1. Her slot'a max 1 ekipman
        2. Toplam bütçe ≤ BUDGET
        3. Her bina için: BASE_DB + Σ x[s,i]·contrib[s,i,b] - 20·log10(dist_b) ≤ db_limit_b
    """
    if not GAMSPY_AVAILABLE:
        raise RuntimeError("GAMSPy kurulu değil. `pip install gamspy` komutunu çalıştırın.")

    buildings  = stage_data["data"]["nearby"]
    stage_pos  = stage_data["pos"]

    n_slots    = len(SLOT_IDS)
    n_items    = len(ITEMS)
    n_bldgs    = len(buildings)

    # ── Pre-compute katkı katsayıları ─────────────────────────────────────────
    # aud_contrib[s,i]: bu item+slot kombinasyonunun izleyici açısına katkısı
    # bldg_contrib[s,i,b]: binanın aldığı ek dB (mesafe terimi hariç)
    
    aud_contrib   = np.zeros((n_slots, n_items))
    bldg_contrib  = np.zeros((n_slots, n_items, n_bldgs))
    bldg_baseline = np.zeros(n_bldgs)   # sadece mesafeden gelen dB (ekipmansız)
    bldg_limit    = np.zeros(n_bldgs)

    for s_idx, slot_id in enumerate(SLOT_IDS):
        slot_angle = SLOT_DEFS[slot_id]
        for i_idx, item in enumerate(ITEMS):
            # İzleyiciye katkı
            aud_contrib[s_idx, i_idx] = item_contribution(item, slot_angle, AUD_ANGLE)
            # Her binaya katkı
            for b_idx, b in enumerate(buildings):
                dx = b["centerX"] - stage_pos["x"]
                dy = b["centerY"] - stage_pos["y"]
                dist = math.hypot(dx, dy)
                if dist < 1:
                    bldg_contrib[s_idx, i_idx, b_idx] = 0.0
                    continue
                compass_deg = (math.atan2(dx, -dy) * 180 / math.pi + 360) % 360
                bldg_contrib[s_idx, i_idx, b_idx] = item_contribution(item, slot_angle, compass_deg)

    for b_idx, b in enumerate(buildings):
        dx = b["centerX"] - stage_pos["x"]
        dy = b["centerY"] - stage_pos["y"]
        dist = math.hypot(dx, dy)
        if dist >= 1:
            bldg_baseline[b_idx] = BASE_DB - 20 * math.log10(dist)
        else:
            bldg_baseline[b_idx] = 999.0
        bldg_limit[b_idx] = b["dbLimit"]

    # ── GAMSPy Container ──────────────────────────────────────────────────────
    m = Container()

    # Setler
    S = Set(m, name="S", records=SLOT_IDS,                      description="Slots")
    I = Set(m, name="I", records=[it["id"] for it in ITEMS],    description="Items")
    B = Set(m, name="B", records=[f"b{j}" for j in range(n_bldgs)], description="Buildings")

    # Parametreler
    cost_p = Parameter(m, name="cost_p", domain=[I],
                       records=[(it["id"], it["cost"]) for it in ITEMS],
                       description="Item costs")

    aud_p = Parameter(m, name="aud_p", domain=[S, I],
                      records=[
                          (SLOT_IDS[s], ITEMS[i]["id"], float(aud_contrib[s, i]))
                          for s in range(n_slots) for i in range(n_items)
                      ],
                      description="Audience contribution per slot-item")

    bldg_p = Parameter(m, name="bldg_p", domain=[S, I, B],
                       records=[
                           (SLOT_IDS[s], ITEMS[i]["id"], f"b{b}", float(bldg_contrib[s, i, b]))
                           for s in range(n_slots)
                           for i in range(n_items)
                           for b in range(n_bldgs)
                       ],
                       description="Building contribution per slot-item")

    base_p = Parameter(m, name="base_p", domain=[B],
                       records=[(f"b{b}", float(bldg_baseline[b])) for b in range(n_bldgs)],
                       description="Baseline dB at each building (no equipment)")

    limit_p = Parameter(m, name="limit_p", domain=[B],
                        records=[(f"b{b}", float(bldg_limit[b])) for b in range(n_bldgs)],
                        description="dB limit for each building")

    aud_base = Parameter(m, name="aud_base",
                         records=float(BASE_DB - 20 * math.log10(AUD_DIST)),
                         description="Audience baseline dB (no equipment)")

    budget_p = Parameter(m, name="budget_p", records=float(BUDGET),
                         description="Total budget")

    # Karar değişkeni
    x = Variable(m, name="x", domain=[S, I], type="binary",
                 description="1 if item i is placed in slot s")

    # Amaç: izleyici dB'ini maksimize et
    aud_db_var = Variable(m, name="aud_db_var", type="free",
                          description="Audience dB level")

    # Denklemler
    # 1. Hedef fonksiyon tanımı
    obj_eq = Equation(m, name="obj_eq", description="Define audience dB")
    obj_eq[...] = aud_db_var == aud_base + Sum((S, I), aud_p[S, I] * x[S, I])

    # 2. Her slota max 1 item
    one_per_slot = Equation(m, name="one_per_slot", domain=[S])
    one_per_slot[S] = Sum(I, x[S, I]) <= 1

    # 3. Bütçe kısıtı
    budget_eq = Equation(m, name="budget_eq")
    budget_eq[...] = Sum((S, I), cost_p[I] * x[S, I]) <= budget_p

    # 4. Bina ses limiti kısıtları
    bldg_eq = Equation(m, name="bldg_eq", domain=[B],
                       description="Building dB limit constraints")
    bldg_eq[B] = (
        base_p[B] + Sum((S, I), bldg_p[S, I, B] * x[S, I]) <= limit_p[B]
    )

    # Model
    stage_model = Model(
        m,
        name="stage_optimizer",
        equations=m.getEquations(),
        problem="MIP",
        sense=Sense.MAX,
        objective=aud_db_var,
    )

    stage_model.solve(output=None)

    # ── Sonuçları çıkar ───────────────────────────────────────────────────────
    optimal_placement = {}
    for s_idx, slot_id in enumerate(SLOT_IDS):
        optimal_placement[slot_id] = None
        for i_idx, item in enumerate(ITEMS):
            val = x.records
            if val is not None:
                match = val[
                    (val["S"] == slot_id) & (val["I"] == item["id"])
                ]
                if not match.empty and match["level"].values[0] > 0.5:
                    optimal_placement[slot_id] = item
                    break

    return optimal_placement

# ═══════════════════════════════════════════════════════════════════════════════
#  BRUTE-FORCE / HEURISTIC FALLBACK  (GAMSPy yoksa)
# ═══════════════════════════════════════════════════════════════════════════════

def run_greedy_optimization(stage_data: dict) -> dict:
    """
    Açgözlü (greedy) yığma: Her adımda en yüksek kalabalık artışını veren
    (slot, item) çiftini seç. GAMSPy olmadığında kullanılır.
    """
    buildings = stage_data["data"]["nearby"]
    stage_pos = stage_data["pos"]

    placement = {sid: None for sid in SLOT_IDS}
    best_crowd = calculate_crowd(buildings, stage_pos, placement)
    remaining  = BUDGET
    improved   = True

    while improved:
        improved   = False
        best_delta = 0
        best_move  = None

        for slot_id in SLOT_IDS:
            current_item = placement[slot_id]
            for item in ITEMS:
                if current_item and current_item["id"] == item["id"]:
                    continue
                net_cost = item["cost"] - (current_item["cost"] if current_item else 0)
                if net_cost > remaining:
                    continue

                # Geçici yerleştir
                placement[slot_id] = item
                crowd = calculate_crowd(buildings, stage_pos, placement)
                delta = crowd - best_crowd

                if delta > best_delta:
                    best_delta = delta
                    best_move  = (slot_id, item, net_cost)

                # Geri al
                placement[slot_id] = current_item

        if best_move:
            slot_id, item, net_cost = best_move
            placement[slot_id] = item
            best_crowd += best_delta
            remaining  -= net_cost
            improved    = True

    return placement

# ═══════════════════════════════════════════════════════════════════════════════
#  RAPORLAMA
# ═══════════════════════════════════════════════════════════════════════════════

RESET  = "\033[0m"
BOLD   = "\033[1m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
MAGENTA= "\033[95m"
DIM    = "\033[2m"

def db_color(db: float) -> str:
    if db <= 70:  return GREEN
    if db <= 85:  return YELLOW
    return RED

def print_report(stage_data: dict, placement: dict, method: str):
    buildings = stage_data["data"]["nearby"]
    stage_pos = stage_data["pos"]

    adb        = audience_db(placement)
    violations = count_violations(buildings, stage_pos, placement)
    crowd      = calculate_crowd(buildings, stage_pos, placement)
    spent      = total_cost(placement)

    print()
    print(f"{BOLD}{'═'*62}{RESET}")
    print(f"{BOLD}{MAGENTA}   🎸  GAMS N' ROSES — Optimizasyon Raporu{RESET}")
    print(f"{DIM}   Yöntem: {method}{RESET}")
    print(f"{BOLD}{'═'*62}{RESET}")

    print(f"\n{BOLD}📍 Sahne Konumu:{RESET}  X={stage_pos['x']:.0f}, Y={stage_pos['y']:.0f}")
    print(f"{BOLD}💰 Bütçe:{RESET}         {BUDGET} 🪙 → {spent} 🪙 harcandı ({BUDGET-spent} 🪙 kaldı)")

    print(f"\n{BOLD}── Yerleştirilen Ekipmanlar ──{RESET}")
    placed_count = 0
    for slot_id in SLOT_IDS:
        item = placement[slot_id]
        if item:
            placed_count += 1
            angle = SLOT_DEFS[slot_id]
            contrib_aud = item_contribution(item, angle, AUD_ANGLE)
            sign = "+" if contrib_aud >= 0 else ""
            print(f"  {CYAN}[{slot_id:2s}]{RESET}  {item['icon']} {item['name']:<18}  "
                  f"💰{item['cost']:>3}🪙   "
                  f"izleyici: {sign}{contrib_aud:+.1f} dB")
        else:
            print(f"  {DIM}[{slot_id:2s}]  — boş —{RESET}")

    print(f"\n{BOLD}── Akustik Sonuçlar ──{RESET}")
    col = db_color(adb)
    print(f"  {BOLD}İzleyici dB:{RESET}   {col}{adb:.1f} dB{RESET}  (50m @ Güney)")
    
    if violations == 0:
        viol_str = f"{GREEN}✓ İhlal yok{RESET}"
    else:
        viol_str = f"{RED}⚠ {violations} bina ihlali{RESET}"
    print(f"  {BOLD}Bina İhlalleri:{RESET} {viol_str}")
    print(f"  {BOLD}Tahmini Kalabalık:{RESET} {crowd:>8,} 👥")

    print(f"\n{BOLD}── Bina Kısıt Tablosu ──{RESET}")
    print(f"  {'Bina Tipi':<28} {'Limit':>6} {'Alınan':>7} {'Durum':>12}")
    print(f"  {'─'*28} {'─'*6} {'─'*7} {'─'*12}")
    for b in sorted(buildings, key=lambda b: b["dbLimit"]):
        received = db_received_at(b, stage_pos, placement)
        violated = received > b["dbLimit"]
        margin   = b["dbLimit"] - received
        name     = b["type"][:27]
        status   = f"{RED}⚠ +{abs(margin):.1f}{RESET}" if violated else f"{GREEN}✓ −{abs(margin):.1f}{RESET}"
        col2     = RED if violated else RESET
        print(f"  {name:<28} {b['dbLimit']:>5.0f}dB {col2}{received:>6.1f}dB{RESET}  {status}")

    print(f"\n{BOLD}{'═'*62}{RESET}")
    
    # Özet kutu
    score_pct = min(100, (crowd / max(1, crowd + 5000)) * 100) if crowd > 0 else 0
    bar_len   = int(score_pct / 5)
    bar       = GREEN + "█" * bar_len + DIM + "░" * (20 - bar_len) + RESET
    print(f"\n  {bar}  {score_pct:.0f}%")
    print(f"\n  {BOLD}{YELLOW}► Tahmini kalabalık: {crowd:,} 👥{RESET}")
    print(f"  {BOLD}► İzleyici dB:       {adb:.1f} dB{RESET}")
    print(f"\n{DIM}  Sonuçları result.html ile karşılaştırın!{RESET}\n")

    return {
        "placement": {sid: (item["id"] if item else None) for sid, item in placement.items()},
        "audience_db": round(adb, 2),
        "violations": violations,
        "estimated_crowd": crowd,
        "spent": spent,
        "remaining_budget": BUDGET - spent,
        "stage_pos": stage_pos,
        "method": method,
    }

# ═══════════════════════════════════════════════════════════════════════════════
#  JSON EXPORT  (result.html ile entegrasyon)
# ═══════════════════════════════════════════════════════════════════════════════

def export_result_json(report: dict, output_path: str = "gams_result.json"):
    """
    Bu JSON, result.html'deki localStorage.setItem('gams_optimalData', ...) 
    yerine doğrudan kullanılabilir.
    """
    out = {
        "maxSeyirci": report["estimated_crowd"],
        "x": report["stage_pos"]["x"],
        "y": report["stage_pos"]["y"],
        "maxDb": report["audience_db"],
        "placement": report["placement"],
        "violations": report["violations"],
        "spent": report["spent"],
        "method": report["method"],
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"  📄 JSON çıktısı kaydedildi: {output_path}")
    print(f"     → Bu dosyayı result.html'e entegre etmek için gams_bridge.js'i kullanın.\n")

# ═══════════════════════════════════════════════════════════════════════════════
#  ANA AKIŞ
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="GAMS N' Roses — GAMSPy Sahne Optimizasyon Motoru",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
            Örnekler:
              python optimize_stage.py                          # Örnek veri ile çalıştır
              python optimize_stage.py --input stage_data.json # Gerçek oyun verisi ile
              python optimize_stage.py --method greedy         # GAMSPy olmadan greedy
              python optimize_stage.py --output result.json    # JSON çıktısı kaydet
        """)
    )
    parser.add_argument("--input",  default=None,
                        help="stageOptimData JSON dosyası (tarayıcıdan export edilmiş)")
    parser.add_argument("--output", default="gams_result.json",
                        help="Çıktı JSON dosyası adı (varsayılan: gams_result.json)")
    parser.add_argument("--method", choices=["gamspy", "greedy", "auto"], default="auto",
                        help="Optimizasyon yöntemi (varsayılan: auto)")
    args = parser.parse_args()

    # ── Veri yükle ────────────────────────────────────────────────────────────
    if args.input:
        with open(args.input, encoding="utf-8") as f:
            stage_data = json.load(f)
        print(f"\n{GREEN}✓ Veri yüklendi:{RESET} {args.input}")
    else:
        stage_data = EXAMPLE_STAGE_DATA
        print(f"\n{YELLOW}⚠ --input belirtilmedi, örnek veri kullanılıyor.{RESET}")

    buildings = stage_data["data"]["nearby"]
    print(f"  → {len(buildings)} bina kısıtı, sahne @ "
          f"({stage_data['pos']['x']:.0f}, {stage_data['pos']['y']:.0f})")

    # ── Yöntem seç ────────────────────────────────────────────────────────────
    use_gamspy = (args.method == "gamspy") or (args.method == "auto" and GAMSPY_AVAILABLE)

    if use_gamspy:
        print(f"\n{CYAN}🔧 GAMSPy MIP Modeli çözülüyor...{RESET}")
        try:
            placement = run_gamspy_optimization(stage_data)
            method    = "GAMSPy MIP (Tam Optimizasyon)"
        except Exception as e:
            print(f"{YELLOW}⚠ GAMSPy hatası: {e}{RESET}")
            print(f"{YELLOW}  Greedy yöntemine geçiliyor...{RESET}")
            placement = run_greedy_optimization(stage_data)
            method    = "Greedy Heuristic (GAMSPy fallback)"
    else:
        if not GAMSPY_AVAILABLE and args.method == "gamspy":
            print(f"{RED}✗ GAMSPy kurulu değil! `pip install gamspy` çalıştırın.{RESET}")
            sys.exit(1)
        print(f"\n{CYAN}🔧 Greedy heuristic çalıştırılıyor...{RESET}")
        placement = run_greedy_optimization(stage_data)
        method    = "Greedy Heuristic"

    # ── Rapor ─────────────────────────────────────────────────────────────────
    report = print_report(stage_data, placement, method)

    # ── JSON kaydet ───────────────────────────────────────────────────────────
    export_result_json(report, args.output)

    return report

# ═══════════════════════════════════════════════════════════════════════════════
#  ENTEGRASYON API  (diğer Python scriptleri import edebilir)
# ═══════════════════════════════════════════════════════════════════════════════

def optimize(stage_data: dict, prefer_gamspy: bool = True) -> dict:
    """
    Dışarıdan çağrılabilir API.

    Args:
        stage_data: localStorage'daki stageOptimData formatı
        prefer_gamspy: True ise GAMSPy dener, yoksa greedy'e düşer

    Returns:
        {placement, audience_db, violations, estimated_crowd, spent, ...}
    """
    if prefer_gamspy and GAMSPY_AVAILABLE:
        try:
            placement = run_gamspy_optimization(stage_data)
            method    = "GAMSPy MIP"
        except Exception:
            placement = run_greedy_optimization(stage_data)
            method    = "Greedy (fallback)"
    else:
        placement = run_greedy_optimization(stage_data)
        method    = "Greedy"

    buildings = stage_data["data"]["nearby"]
    stage_pos = stage_data["pos"]
    adb        = audience_db(placement)
    violations = count_violations(buildings, stage_pos, placement)
    crowd      = calculate_crowd(buildings, stage_pos, placement)

    return {
        "placement"       : {sid: (item["id"] if item else None) for sid, item in placement.items()},
        "audience_db"     : round(adb, 2),
        "violations"      : violations,
        "estimated_crowd" : crowd,
        "spent"           : total_cost(placement),
        "remaining_budget": BUDGET - total_cost(placement),
        "stage_pos"       : stage_pos,
        "method"          : method,
        # result.html formatı
        "maxSeyirci"      : crowd,
        "x"               : stage_pos["x"],
        "y"               : stage_pos["y"],
        "maxDb"           : round(adb, 2),
    }


if __name__ == "__main__":
    main()
