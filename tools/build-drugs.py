#!/usr/bin/env python3
"""Build the game drug encyclopedia from a compact authored table.

Run: python tools/build-drugs.py
The output is the runtime source: src/content/private/drugs.json.
No doses, routes, or procurement details are written.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "content" / "private" / "drugs.json"

T = "chosen"


def neuro(name: str, amount: int, target: str = T):
    return {"op": "neuro", "target": target, "neuro": name, "amount": amount}


def heal(track: str, amount: int, target: str = T):
    return {"op": "heal", "target": target, "track": track, "amount": amount}


def hurt(track: str, amount: int, target: str = T):
    return {"op": "damage", "target": target, "track": track, "amount": amount}


def status(name: str, stacks: int = 1, target: str = T):
    return {"op": "status", "target": target, "status": name, "stacks": stacks}


def clear(name: str, stacks: int = 1, target: str = T):
    return {"op": "clearStatus", "target": target, "status": name, "stacks": stacks}


def ap(amount: int = 1):
    return {"op": "ap", "amount": amount}


def enzyme(name: str, mode: str, strength: str, target: str = T):
    return {
        "op": "enzyme",
        "target": target,
        "enzyme": name,
        "mode": mode,
        "strength": strength,
    }


COURSES = {
    "SSRI": {
        "id": "SSRI",
        "name": "SSRI 疗程",
        "turns": 3,
        "grace": 2,
        "ops": [heal("psy", 1, "self")],
    },
    "SNRI": {
        "id": "SNRI",
        "name": "SNRI 疗程",
        "turns": 3,
        "grace": 2,
        "ops": [heal("psy", 1, "self")],
    },
    "BZD": {
        "id": "BZD",
        "name": "苯二氮卓疗程",
        "turns": 3,
        "grace": 2,
        "ops": [clear("激越", 1, "self")],
    },
    "OPIOID": {
        "id": "OPIOID",
        "name": "阿片类疗程",
        "turns": 3,
        "grace": 2,
        "ops": [heal("phys", 1, "self")],
    },
}


def proper_for(template: str, target: str, enzyme_ops=None):
    t = "self" if target == "self" else T
    ops = []
    if template == "ssri":
        ops = [heal("psy", 1, t), neuro("血清素", 3, t)]
    elif template == "snri":
        ops = [
            heal("psy", 1, t),
            neuro("去甲肾上腺素", 4, t),
            neuro("血清素", 2, t),
        ]
    elif template == "benzo":
        ops = [heal("psy", 2, t), clear("激越", 1, t), neuro("GABA", 6, t)]
    elif template == "opioid":
        ops = [heal("phys", 4, t), heal("psy", 1, t), neuro("内啡肽", 8, t)]
    elif template == "stim":
        ops = [ap(1), neuro("多巴胺", 6, t), neuro("去甲肾上腺素", 4, t), clear("镇静", 1, t)]
    elif template == "antipsych":
        ops = [heal("psy", 2, t), clear("谵妄", 1, t), neuro("多巴胺", -6, t)]
    elif template == "antihist":
        ops = [heal("psy", 1, t), clear("激越", 1, t), neuro("组胺", -6, t)]
    elif template == "dissoc":
        ops = [
            clear("解离", 1, t),
            neuro("谷氨酸", -8, t),
            neuro("多巴胺", 4, t),
            heal("psy", 1, t),
        ]
    elif template == "anticholinergic":
        ops = [heal("phys", 2, t), clear("解离", 1, t)]
    elif template == "other":
        ops = [heal("psy", 1, t)]
    return ops + (enzyme_ops or [])


def over_for(template: str, target: str):
    t = "self" if target == "self" else T
    if template == "ssri":
        return [heal("psy", 4, t), neuro("血清素", 20, t), status("血清素综合征", 2, t)]
    if template == "snri":
        return [
            heal("psy", 3, t),
            neuro("血清素", 15, t),
            neuro("去甲肾上腺素", 10, t),
            status("血清素综合征", 1, t),
        ]
    if template == "benzo":
        return [
            heal("psy", 3, t),
            neuro("GABA", 15, t),
            status("镇静", 2, t),
            status("呼吸抑制", 1, t),
        ]
    if template == "opioid":
        return [
            heal("phys", 6, t),
            neuro("内啡肽", 20, t),
            status("呼吸抑制", 2, t),
        ]
    if template == "stim":
        return [
            ap(1),
            neuro("多巴胺", 20, t),
            neuro("去甲肾上腺素", 15, t),
            status("激越", 2, t),
        ]
    if template == "antipsych":
        return [
            heal("psy", 2, t),
            neuro("多巴胺", -20, t),
            status("镇静", 2, t),
            status("抗胆碱能", 1, t),
        ]
    if template == "antihist":
        return [neuro("组胺", -20, t), status("抗胆碱能", 2, t)]
    if template == "dissoc":
        return [
            neuro("谷氨酸", -18, t),
            neuro("多巴胺", 10, t),
            status("解离", 2, t),
            hurt("psy", 4, "self"),
        ]
    if template == "anticholinergic":
        return [
            status("谵妄", 2, t),
            status("抗胆碱能", 2, t),
            hurt("phys", 2, "self"),
        ]
    return None


VALENCE = {
    "欣快": "positive",
    "解离": "neutral",
    "镇静": "neutral",
    "耐受": "neutral",
    "呼吸抑制": "negative",
    "谵妄": "negative",
    "抗胆碱能": "negative",
    "血清素综合征": "negative",
    "激越": "negative",
    "戒断": "negative",
}

TEMPLATE_EFFECTS = {
    "ssri": [("欣快", 1), ("血清素综合征", 6)],
    "snri": [("欣快", 1), ("激越", 3)],
    "benzo": [("镇静", 1), ("呼吸抑制", 6)],
    "opioid": [("欣快", 1), ("呼吸抑制", 6)],
    "stim": [("欣快", 1), ("激越", 3)],
    "antipsych": [("镇静", 1), ("抗胆碱能", 3)],
    "antihist": [("镇静", 1), ("抗胆碱能", 3), ("谵妄", 6)],
    "dissoc": [("解离", 1), ("欣快", 3), ("谵妄", 6)],
    "anticholinergic": [("抗胆碱能", 3), ("谵妄", 6)],
    "other": [("镇静", 1)],
}


def effect_profile(template, proper, over, unit, step):
    entries = {}

    def add(name, weight):
        if name not in VALENCE:
            return
        current = entries.get(name)
        if current is None or weight > current:
            entries[name] = weight

    for op in proper:
        if op.get("op") == "status":
            add(op["status"], 1)
    for op in over or []:
        if op.get("op") == "status":
            add(op["status"], 6 if (op.get("stacks") or 1) >= 2 else 3)
    for name, weight in TEMPLATE_EFFECTS.get(template, []):
        add(name, weight)
    effects = []
    for name, weight in entries.items():
        severity = "heavy" if weight >= 6 else "medium" if weight >= 3 else "light"
        effects.append({
            "name": name,
            "threshold": round(weight * step, 3),
            "unit": unit,
            "weight": weight,
            "severity": severity,
            "valence": VALENCE[name],
        })
    effects.sort(key=lambda item: (item["threshold"], item["name"]))
    return effects


def drug(
    slug: str,
    name: str,
    klass: str,
    template: str,
    summary: str,
    description: str,
    *,
    tags=None,
    aliases=None,
    targets="both",
    substrates=None,
    inhibitors=None,
    inducers=None,
    half_life=8.0,
    bioavailability=None,
    effect_line=1,
    concentration_unit=None,
    concentration_step=None,
    tolerance=1,
    withdrawal=None,
    course=None,
    proper_extra=None,
    over_extra=None,
    class_note=None,
):
    description = description.replace('规范使用', '单次使用时').replace('没有过量模式', '重复使用不会触发额外追加效应')
    proper = proper_for(template, targets, proper_extra)
    over = over_for(template, targets)
    if over is None and over_extra is None:
        over_ops = None
    else:
        over_ops = over or []
        if over_extra:
            over_ops += over_extra
    if bioavailability is None:
        bioavailability = {"other": 0.5, "otc": 0.6, "rx": 0.7, "c2": 0.8, "c1": 0.9, "narcotic": 0.95}.get(klass, 0.6)
    neuro_profile = {}
    for op in proper:
        if op["op"] == "neuro":
            neuro_profile[op["neuro"]] = neuro_profile.get(op["neuro"], 0) + op["amount"]
    entry = {
        "kind": "drug",
        "id": slug,
        "name": name,
        "aliases": aliases or [],
        "klass": klass,
        "tags": tags or [],
        "summary": summary,
        "description": description,
        "neuro": neuro_profile,
        "substrates": substrates or [],
        "inhibitors": inhibitors or {},
        "inducers": inducers or [],
        "halfLife": half_life,
        "bioavailability": bioavailability,
        "effectLine": 2 if over_ops is None and effect_line == 1 else effect_line,
        "concentrationPerDose": concentration_step or (0.5 if (concentration_unit or ("g" if slug == "ethanol" else "mcg" if klass in ("c1", "narcotic") else "mg")) == "g" else 10 if (concentration_unit or ("g" if slug == "ethanol" else "mcg" if klass in ("c1", "narcotic") else "mg")) == "mcg" else 1),
        "concentrationEffects": effect_profile(
            template,
            proper,
            over_ops or [],
            concentration_unit or ("g" if slug == "ethanol" else "mcg" if klass in ("c1", "narcotic") else "mg"),
            concentration_step or (0.5 if (concentration_unit or ("g" if slug == "ethanol" else "mcg" if klass in ("c1", "narcotic") else "mg")) == "g" else 10 if (concentration_unit or ("g" if slug == "ethanol" else "mcg" if klass in ("c1", "narcotic") else "mg")) == "mcg" else 1),
        ),
        "tolerance": tolerance,
        "card": {
            "targets": targets,
            "proper": proper,
        },
    }
    if class_note:
        entry["classNote"] = class_note
    if over_ops:
        entry["card"]["over"] = over_ops
    if course:
        entry["card"]["course"] = COURSES[course]
    if withdrawal:
        entry["withdrawal"] = withdrawal
    return entry


DRUGS = [
    # 其他
    drug(
        "ethanol",
        "乙醇",
        "other",
        "other",
        "短暂的放松，随后是反跳。",
        "最常见的镇静剂。规范使用只换到很短的放松；过量会压住呼吸，停药后出现戒断。",
        tags=["镇静剂", "其他"],
        targets="self",
        substrates=["CYP2E1"],
        half_life=0.2,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "酒精的戒断反跳开始。"},
        proper_extra=[hurt("phys", 1, "self"), neuro("GABA", 6, "self"), neuro("内啡肽", 3, "self")],
        over_extra=[heal("psy", 4, "self"), neuro("GABA", 20, "self"), status("呼吸抑制", 1, "self")],
    ),
    drug(
        "nicotine",
        "尼古丁",
        "other",
        "stim",
        "短促的清醒，很快回落。",
        "烟草中的兴奋剂。规范使用给一点行动力；过量带来心悸与激越。",
        tags=["兴奋剂", "其他"],
        targets="self",
        substrates=["CYP2A6"],
        half_life=2,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "尼古丁戒断开始。"},
        over_extra=[neuro("多巴胺", 12, "self"), neuro("去甲肾上腺素", 10, "self"), status("激越", 1, "self")],
    ),
    drug(
        "arecoline",
        "槟榔碱",
        "other",
        "stim",
        "槟榔里的兴奋性生物碱。",
        "规范使用给一点行动力；过量会走向胆碱能过载与激越。",
        tags=["兴奋剂", "植物成分"],
        targets="self",
        half_life=0.1,
        tolerance=2,
        over_extra=[hurt("phys", 3, "self"), status("激越", 2, "self")],
    ),
    drug(
        "caffeine",
        "咖啡因",
        "other",
        "stim",
        "最常用的兴奋剂。",
        "规范使用换 1 点行动力；过量会心悸、焦虑，之后是耐受与戒断。",
        tags=["兴奋剂", "黄嘌呤类"],
        targets="self",
        substrates=["CYP1A2"],
        half_life=5,
        tolerance=2,
        withdrawal={"status": "戒断", "log": "咖啡因戒断：头痛与疲倦。"},
        over_extra=[neuro("多巴胺", 10, "self"), neuro("去甲肾上腺素", 8, "self")],
    ),
    drug(
        "magnesium_threonate",
        "苏糖酸镁",
        "other",
        "other",
        "左苏；反解离与恢复术的一部分。",
        "规范使用清除一点解离，让谷氨酸往基线回落。没有过量模式。",
        tags=["抗解离剂", "镁补充剂"],
        targets="self",
        half_life=4,
        tolerance=1,
        proper_extra=[clear("解离", 1, "self"), neuro("谷氨酸", 4, "self"), heal("psy", 2, "self")],
    ),
    # OTC
    drug(
        "diphenhydramine",
        "苯海拉明",
        "otc",
        "antihist",
        "抗组胺与镇静。",
        "规范使用帮助入睡、压住一点激越；过量会抗胆碱能、意识混浊。",
        tags=["抗组胺", "OTC"],
        targets="self",
        substrates=["CYP2D6"],
        inhibitors={"CYP2D6": "weak"},
        half_life=6,
        tolerance=2,
    ),
    drug(
        "dimenhydrinate",
        "茶苯海明",
        "otc",
        "antihist",
        "晕车药，也是镇静剂。",
        "规范使用压住恶心与激越；过量会谵妄、抗胆碱能。",
        tags=["抗组胺", "OTC"],
        targets="self",
        half_life=6,
        tolerance=2,
        over_extra=[status("谵妄", 1, "self")],
    ),
    drug(
        "omeprazole",
        "奥美拉唑",
        "otc",
        "other",
        "胃黏膜保护。",
        "规范使用让身体舒服一点；它不直接改变心理，但会拖慢部分药物的代谢。",
        tags=["质子泵抑制剂", "OTC"],
        targets="self",
        inhibitors={"CYP2C19": "moderate"},
        half_life=1,
        tolerance=1,
        proper_extra=[heal("phys", 2, "self")],
    ),
    drug(
        "melatonin",
        "褪黑素",
        "otc",
        "other",
        "睡眠节律。",
        "规范使用帮助入睡、恢复一点心理；过量只会更困。",
        tags=["催眠剂", "OTC"],
        targets="self",
        half_life=1,
        tolerance=1,
        proper_extra=[heal("psy", 1, "self"), clear("激越", 1, "self"), neuro("组胺", -2, "self")],
        over_extra=[status("镇静", 1, "self")],
    ),
    # Rx
    drug(
        "amantadine",
        "金刚烷胺",
        "rx",
        "stim",
        "抗病毒与抗帕金森药；过量时谵妄。",
        "规范使用给一点行动力；过量会抗胆碱能、谵妄。",
        tags=["抗病毒药", "谵妄剂"],
        targets="both",
        half_life=15,
        tolerance=2,
        over_extra=[status("谵妄", 2, "chosen"), status("抗胆碱能", 1, "chosen")],
    ),
    drug(
        "memantine",
        "美金刚",
        "rx",
        "dissoc",
        "NMDA 拮抗剂；被误用作解离。",
        "规范使用让谷氨酸回落、清除一点解离；过量会解离与谵妄。",
        tags=["解离剂", "抗痴呆药"],
        targets="both",
        half_life=60,
        tolerance=1,
        over_extra=[status("谵妄", 1, "chosen")],
    ),
    drug(
        "nefopam",
        "奈福泮",
        "rx",
        "other",
        "非阿片镇痛药，带抗胆碱能副作用。",
        "规范使用缓解身体疼痛；过量会抗胆碱能与激越。",
        tags=["镇痛药", "抗胆碱能剂"],
        targets="both",
        substrates=["CYP2D6"],
        half_life=4,
        tolerance=1,
        proper_extra=[heal("phys", 2, "chosen"), neuro("去甲肾上腺素", 3, "chosen")],
        over_extra=[status("抗胆碱能", 2, "chosen"), status("激越", 1, "chosen")],
    ),
    drug(
        "fluoxetine",
        "氟西汀",
        "rx",
        "ssri",
        "五朵金花之一；长效 SSRI。",
        "规范使用建立 SSRI 疗程；过量会把血清素推过阈值。它同时抑制 CYP2D6。",
        tags=["SSRI", "五朵金花"],
        targets="self",
        substrates=["CYP2D6"],
        inhibitors={"CYP2D6": "strong"},
        half_life=96,
        tolerance=1,
        course="SSRI",
        withdrawal={"status": "戒断", "log": "SSRI 停药反跳。"},
    ),
    drug(
        "sertraline",
        "舍曲林",
        "rx",
        "ssri",
        "五朵金花之一。",
        "规范使用建立 SSRI 疗程；过量会把血清素推过阈值。",
        tags=["SSRI", "五朵金花"],
        targets="self",
        substrates=["CYP2D6"],
        inhibitors={"CYP2D6": "moderate"},
        half_life=26,
        tolerance=1,
        course="SSRI",
        withdrawal={"status": "戒断", "log": "SSRI 停药反跳。"},
    ),
    drug(
        "paroxetine",
        "帕罗西汀",
        "rx",
        "ssri",
        "五朵金花之一；停药反应明显。",
        "规范使用建立 SSRI 疗程；过量会把血清素推过阈值。",
        tags=["SSRI", "五朵金花"],
        targets="self",
        substrates=["CYP2D6"],
        inhibitors={"CYP2D6": "strong"},
        half_life=21,
        tolerance=1,
        course="SSRI",
        withdrawal={"status": "戒断", "log": "帕罗西汀停药反跳明显。"},
    ),
    drug(
        "fluvoxamine",
        "氟伏沙明",
        "rx",
        "ssri",
        "五朵金花之一；CYP 抑制谱较宽。",
        "规范使用建立 SSRI 疗程；过量会把血清素推过阈值。",
        tags=["SSRI", "五朵金花"],
        targets="self",
        substrates=["CYP2D6"],
        inhibitors={"CYP1A2": "strong", "CYP2C19": "strong"},
        half_life=15,
        tolerance=1,
        course="SSRI",
        withdrawal={"status": "戒断", "log": "SSRI 停药反跳。"},
    ),
    drug(
        "citalopram",
        "西酞普兰",
        "rx",
        "ssri",
        "五朵金花之一。",
        "规范使用建立 SSRI 疗程；过量会把血清素推过阈值。",
        tags=["SSRI", "五朵金花"],
        targets="self",
        substrates=["CYP2C19"],
        half_life=35,
        tolerance=1,
        course="SSRI",
        withdrawal={"status": "戒断", "log": "SSRI 停药反跳。"},
    ),
    drug(
        "venlafaxine",
        "文拉法辛",
        "rx",
        "snri",
        "SNRI；停药反应明显。",
        "规范使用建立 SNRI 疗程；过量会把血清素与去甲肾上腺素一起推高。",
        tags=["SNRI", "抗抑郁药"],
        targets="self",
        substrates=["CYP2D6"],
        half_life=5,
        tolerance=2,
        course="SNRI",
        withdrawal={"status": "戒断", "log": "SNRI 停药反跳。"},
    ),
    drug(
        "duloxetine",
        "度洛西汀",
        "rx",
        "snri",
        "SNRI；也用于神经痛。",
        "规范使用建立 SNRI 疗程；过量会把血清素与去甲肾上腺素一起推高。",
        tags=["SNRI", "抗抑郁药", "镇痛药"],
        targets="self",
        substrates=["CYP2D6", "CYP1A2"],
        inhibitors={"CYP2D6": "moderate"},
        half_life=12,
        tolerance=2,
        course="SNRI",
        withdrawal={"status": "戒断", "log": "SNRI 停药反跳。"},
    ),
    drug(
        "bupropion",
        "安非他酮",
        "rx",
        "other",
        "NDRI 抗抑郁药，带兴奋作用。",
        "规范使用给一点行动力与心理；过量会激越、心悸。",
        tags=["NDRI", "抗抑郁药", "兴奋剂"],
        targets="self",
        substrates=["CYP2D6"],
        inhibitors={"CYP2D6": "strong"},
        half_life=21,
        tolerance=2,
        proper_extra=[ap(1), neuro("多巴胺", 6, "self"), neuro("去甲肾上腺素", 4, "self")],
        over_extra=[neuro("多巴胺", 20, "self"), neuro("去甲肾上腺素", 15, "self"), status("激越", 2, "self")],
    ),
    drug(
        "quetiapine",
        "喹硫平",
        "rx",
        "antipsych",
        "非典型抗精神病药；低剂量常用于睡眠。",
        "规范使用压住谵妄与激越；过量会镇静、抗胆碱能。",
        tags=["非典型抗精神病药", "镇静剂"],
        targets="both",
        substrates=["CYP3A4"],
        half_life=7,
        tolerance=2,
        over_extra=[neuro("组胺", -12, "chosen")],
    ),
    drug(
        "naloxone",
        "纳洛酮",
        "rx",
        "other",
        "阿片类拮抗剂。",
        "规范使用清除呼吸抑制，并把内啡肽拉回；没有过量模式。",
        tags=["拮抗剂", "阿片类拮抗剂"],
        targets="both",
        half_life=1,
        tolerance=1,
        proper_extra=[clear("呼吸抑制", 2, "chosen"), neuro("内啡肽", -15, "chosen"), heal("phys", 4, "chosen")],
    ),
    drug(
        "flumazenil",
        "氟马西尼",
        "rx",
        "other",
        "苯二氮卓拮抗剂。",
        "规范使用清除镇静；没有过量模式。",
        tags=["拮抗剂", "苯二氮卓拮抗剂"],
        targets="both",
        half_life=1,
        tolerance=1,
        proper_extra=[clear("镇静", 2, "chosen"), neuro("GABA", -8, "chosen"), heal("psy", 2, "chosen")],
    ),
    drug(
        "trihexyphenidyl",
        "苯海索",
        "rx",
        "anticholinergic",
        "抗胆碱能药。",
        "规范使用缓解身体僵硬；过量会谵妄与抗胆碱能。",
        tags=["抗胆碱能剂"],
        targets="self",
        half_life=10,
        tolerance=2,
    ),
    drug(
        "promethazine",
        "异丙嗪",
        "rx",
        "antihist",
        "抗组胺与镇静。",
        "规范使用压住激越；过量会抗胆碱能与谵妄。",
        tags=["抗组胺", "镇静剂"],
        targets="both",
        substrates=["CYP2D6"],
        inhibitors={"CYP2D6": "moderate"},
        half_life=12,
        tolerance=2,
        over_extra=[status("谵妄", 1, "chosen")],
    ),
    drug(
        "tramadol",
        "曲马多",
        "rx",
        "opioid",
        "弱阿片类镇痛药，也影响血清素与去甲肾上腺素。",
        "规范使用缓解身体疼痛；过量会呼吸抑制，并推高血清素。",
        tags=["阿片类药品", "镇痛药"],
        targets="both",
        substrates=["CYP2D6", "CYP3A4"],
        half_life=6,
        tolerance=2,
        over_extra=[neuro("血清素", 10, "chosen")],
    ),
    drug(
        "mirtazapine",
        "米氮平",
        "rx",
        "other",
        "抗抑郁药，明显镇静。",
        "规范使用恢复心理与睡眠；过量会镇静与体重/代谢负担。",
        tags=["抗抑郁药", "镇静剂"],
        targets="self",
        substrates=["CYP3A4", "CYP2D6"],
        half_life=20,
        tolerance=1,
        proper_extra=[heal("psy", 2, "self"), neuro("组胺", -8, "self"), neuro("去甲肾上腺素", 2, "self")],
        over_extra=[status("镇静", 2, "self")],
    ),
    drug(
        "trazodone",
        "曲唑酮",
        "rx",
        "other",
        "抗抑郁药，低剂量常用于睡眠。",
        "规范使用帮助入睡；过量会镇静与血清素负荷。",
        tags=["抗抑郁药", "催眠剂"],
        targets="self",
        substrates=["CYP3A4"],
        half_life=8,
        tolerance=1,
        proper_extra=[heal("psy", 1, "self"), neuro("组胺", -5, "self"), neuro("血清素", 2, "self")],
        over_extra=[status("镇静", 2, "self"), neuro("血清素", 10, "self")],
    ),
    drug(
        "gabapentin",
        "加巴喷丁",
        "rx",
        "other",
        "抗癫痫与神经痛药。",
        "规范使用降低焦虑；过量会镇静。",
        tags=["抗癫痫药", "镇静剂"],
        targets="self",
        half_life=6,
        tolerance=2,
        proper_extra=[heal("psy", 1, "self"), neuro("GABA", 4, "self"), clear("激越", 1, "self")],
        over_extra=[status("镇静", 1, "self")],
    ),
    drug(
        "olanzapine",
        "奥氮平",
        "rx",
        "antipsych",
        "非典型抗精神病药。",
        "规范使用压住激越与谵妄；过量会镇静、抗胆碱能。",
        tags=["非典型抗精神病药", "镇静剂"],
        targets="both",
        substrates=["CYP1A2"],
        half_life=33,
        tolerance=2,
    ),
    drug(
        "haloperidol",
        "氟哌啶醇",
        "rx",
        "antipsych",
        "典型抗精神病药。",
        "规范使用压住谵妄；过量会镇静与锥体外系负担。",
        tags=["抗精神病药", "镇静剂"],
        targets="both",
        substrates=["CYP2D6", "CYP3A4"],
        half_life=18,
        tolerance=2,
        over_extra=[status("镇静", 1, "chosen")],
    ),
    drug(
        "scopolamine",
        "东莨菪碱",
        "rx",
        "anticholinergic",
        "抗胆碱能药。",
        "规范使用缓解恶心与晕动；过量会谵妄与抗胆碱能。",
        tags=["抗胆碱能剂"],
        targets="self",
        half_life=4,
        tolerance=2,
        over_extra=[status("谵妄", 2, "self")],
    ),
    drug(
        "lithium",
        "碳酸锂",
        "rx",
        "other",
        "心境稳定剂，治疗窗很窄。",
        "规范使用稳定心理；过量会毒性、谵妄与生理损伤。",
        tags=["心境稳定剂"],
        targets="self",
        half_life=24,
        tolerance=1,
        proper_extra=[heal("psy", 2, "self"), clear("激越", 1, "self")],
        over_extra=[hurt("phys", 6, "self"), status("谵妄", 2, "self"), status("抗胆碱能", 1, "self")],
    ),
    # 精二
    drug(
        "dextromethorphan",
        "右美沙芬",
        "c2",
        "dissoc",
        "镇咳药；高剂量下解离。",
        "规范使用让谷氨酸回落；过量会强解离，并反噬自己。",
        tags=["解离剂", "镇咳药"],
        targets="both",
        substrates=["CYP2D6"],
        half_life=4,
        tolerance=3,
        over_extra=[heal("psy", 0, "self")],
    ),
    drug(
        "pregabalin",
        "普瑞巴林",
        "c2",
        "benzo",
        "抗癫痫与抗焦虑；断药反应强烈。",
        "规范使用压住激越；过量会镇静与呼吸抑制。",
        tags=["镇静剂", "抗癫痫药", "抗焦虑药"],
        targets="self",
        half_life=6,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "普瑞巴林断药反应。"},
        course="BZD",
    ),
    drug(
        "alprazolam",
        "阿普唑仑",
        "c2",
        "benzo",
        "短效苯二氮卓。",
        "规范使用压住激越；过量会镇静与呼吸抑制。",
        tags=["苯二氮卓类药品", "镇静剂", "催眠剂"],
        targets="both",
        substrates=["CYP3A4"],
        half_life=11,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "苯二氮卓戒断。"},
        course="BZD",
    ),
    drug(
        "clonazepam",
        "氯硝西泮",
        "c2",
        "benzo",
        "长效苯二氮卓。",
        "规范使用压住激越；过量会镇静与呼吸抑制。",
        tags=["苯二氮卓类药品", "镇静剂", "抗癫痫药"],
        targets="both",
        substrates=["CYP3A4"],
        half_life=34,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "苯二氮卓戒断。"},
        course="BZD",
    ),
    drug(
        "zolpidem",
        "唑吡坦",
        "c2",
        "benzo",
        "催眠药；梦境增强与梦游报告常见。",
        "规范使用帮助入睡；过量会镇静、谵妄。",
        tags=["催眠剂", "迷幻剂", "梦境增强剂"],
        targets="self",
        substrates=["CYP3A4"],
        half_life=2.5,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "唑吡坦反跳性失眠。"},
        over_extra=[status("谵妄", 1, "self")],
    ),
    drug(
        "esketamine",
        "艾司氯胺酮",
        "c2",
        "dissoc",
        "解离剂；近年用于难治性抑郁。",
        "规范使用短暂解离并恢复心理；过量会强解离与反噬。",
        tags=["解离剂", "迷幻剂", "抗抑郁药"],
        targets="both",
        substrates=["CYP3A4", "CYP2B6"],
        half_life=5,
        tolerance=2,
    ),
    drug(
        "ketamine",
        "氯胺酮",
        "c2",
        "dissoc",
        "解离剂。",
        "规范使用短暂解离；过量会强解离与心理反噬。",
        tags=["解离剂", "迷幻剂"],
        targets="both",
        substrates=["CYP3A4", "CYP2B6"],
        half_life=3,
        tolerance=2,
    ),
    drug(
        "diazepam",
        "地西泮",
        "c2",
        "benzo",
        "长效苯二氮卓。",
        "规范使用压住激越；过量会镇静与呼吸抑制。",
        tags=["苯二氮卓类药品", "镇静剂"],
        targets="both",
        substrates=["CYP3A4", "CYP2C19"],
        half_life=48,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "苯二氮卓戒断。"},
        course="BZD",
    ),
    drug(
        "lorazepam",
        "劳拉西泮",
        "c2",
        "benzo",
        "中效苯二氮卓。",
        "规范使用压住激越；过量会镇静与呼吸抑制。",
        tags=["苯二氮卓类药品", "镇静剂"],
        targets="both",
        substrates=["CYP3A4"],
        half_life=14,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "苯二氮卓戒断。"},
        course="BZD",
    ),
    drug(
        "zopiclone",
        "右佐匹克隆",
        "c2",
        "benzo",
        "催眠药。",
        "规范使用帮助入睡；过量会镇静与谵妄。",
        tags=["催眠剂"],
        targets="self",
        substrates=["CYP3A4"],
        half_life=6,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "催眠药反跳。"},
        over_extra=[status("谵妄", 1, "self")],
    ),
    # 精一
    drug(
        "methylphenidate",
        "哌甲酯",
        "c1",
        "stim",
        "兴奋剂，用于注意力缺陷。",
        "规范使用给 1 点行动力；过量会激越、心悸。",
        tags=["兴奋剂", "注意力缺陷治疗药"],
        targets="self",
        half_life=3,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "兴奋剂反跳。"},
    ),
    drug(
        "modafinil",
        "莫达非尼",
        "c1",
        "stim",
        "觉醒促进剂。",
        "规范使用给 1 点行动力；过量会激越、失眠。",
        tags=["兴奋剂", "觉醒促进剂"],
        targets="self",
        substrates=["CYP3A4"],
        half_life=15,
        tolerance=2,
        class_note="国内按第一类精神药品管理。",
    ),
    # 麻
    drug(
        "dihydrocodeine",
        "二氢可待因",
        "narcotic",
        "opioid",
        "弱阿片类镇痛与镇咳。",
        "规范使用缓解身体疼痛；过量会呼吸抑制。",
        tags=["阿片类药品", "镇痛药", "镇咳药"],
        targets="both",
        substrates=["CYP2D6"],
        half_life=4,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "阿片类戒断。"},
        course="OPIOID",
    ),
    drug(
        "morphine",
        "吗啡",
        "narcotic",
        "opioid",
        "强阿片类镇痛药。",
        "规范使用压住疼痛；过量会呼吸抑制。",
        tags=["阿片类药品", "镇痛药"],
        targets="both",
        substrates=["CYP3A4"],
        half_life=2,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "阿片类戒断。"},
        course="OPIOID",
    ),
    drug(
        "codeine",
        "可待因",
        "narcotic",
        "opioid",
        "阿片类镇咳与镇痛药。",
        "规范使用压住疼痛；过量会呼吸抑制。",
        tags=["阿片类药品", "镇痛药", "镇咳药"],
        targets="both",
        substrates=["CYP2D6"],
        half_life=3,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "阿片类戒断。"},
        course="OPIOID",
    ),
    drug(
        "fentanyl",
        "芬太尼",
        "narcotic",
        "opioid",
        "强阿片类镇痛药。",
        "规范使用压住疼痛；过量会迅速呼吸抑制。",
        tags=["阿片类药品", "镇痛药"],
        targets="both",
        substrates=["CYP3A4"],
        half_life=4,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "阿片类戒断。"},
        course="OPIOID",
    ),
    drug(
        "methadone",
        "美沙酮",
        "narcotic",
        "opioid",
        "长半衰期阿片类。",
        "规范使用压住疼痛与戒断；过量会呼吸抑制。",
        tags=["阿片类药品", "镇痛药"],
        targets="both",
        substrates=["CYP3A4", "CYP2B6"],
        half_life=24,
        tolerance=3,
        withdrawal={"status": "戒断", "log": "阿片类戒断。"},
        course="OPIOID",
    ),
]

# 剧情专用动作：不进药品索引，不进构筑卡池。
ACTIONS = [
    {
        "kind": "action",
        "id": "breathe",
        "name": "呼吸",
        "aliases": [],
        "klass": "other",
        "tags": ["现实检验"],
        "summary": "心理 +4。",
        "description": "把注意力放回呼吸。",
        "neuro": {},
        "substrates": [],
        "inhibitors": {},
        "inducers": [],
        "halfLife": 0,
        "tolerance": 0,
        "card": {
            "targets": "self",
            "proper": [heal("psy", 4, "self")],
            "storyOnly": True,
        },
    },
    {
        "kind": "action",
        "id": "window",
        "name": "看窗外",
        "aliases": [],
        "klass": "other",
        "tags": ["现实检验"],
        "summary": "心理 +3。",
        "description": "确认窗外仍然是同一棵树。",
        "neuro": {},
        "substrates": [],
        "inhibitors": {},
        "inducers": [],
        "halfLife": 0,
        "tolerance": 0,
        "card": {
            "targets": "self",
            "proper": [heal("psy", 3, "self")],
            "storyOnly": True,
        },
    },
    {
        "kind": "action",
        "id": "ask",
        "name": "问自己",
        "aliases": [],
        "klass": "other",
        "tags": ["现实检验"],
        "summary": "心理 +4。",
        "description": "问自己：这是被害妄想吗？",
        "neuro": {},
        "substrates": [],
        "inhibitors": {},
        "inducers": [],
        "halfLife": 0,
        "tolerance": 0,
        "card": {
            "targets": "self",
            "proper": [heal("psy", 4, "self")],
            "storyOnly": True,
        },
    },
    {
        "kind": "action",
        "id": "message",
        "name": "给朋友发消息",
        "aliases": [],
        "klass": "other",
        "tags": ["现实检验"],
        "summary": "心理 +5。",
        "description": "把此刻发给一个真实的人。",
        "neuro": {},
        "substrates": [],
        "inhibitors": {},
        "inducers": [],
        "halfLife": 0,
        "tolerance": 0,
        "card": {
            "targets": "self",
            "proper": [heal("psy", 5, "self")],
            "storyOnly": True,
        },
    },
]

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(DRUGS + ACTIONS, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {len(DRUGS)} drugs + {len(ACTIONS)} actions -> {OUT}")