#!/usr/bin/env python3
"""Write the seven shadow battles. Run: python tools/build-battles.py"""

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "src" / "content" / "private" / "battles.json"


def dmg(track, amount, target="enemy"):
    return {"op": "damage", "target": target, "track": track, "amount": amount}


def heal(track, amount, target="self"):
    return {"op": "heal", "target": target, "track": track, "amount": amount}


def status(name, stacks=1, target="enemy"):
    return {"op": "status", "target": target, "status": name, "stacks": stacks}


def neuro(name, amount, target="enemy"):
    return {"op": "neuro", "target": target, "neuro": name, "amount": amount}


def battle(id, title, name, epithet, kind, phys, psy, script, win, lose, mutual, player=None, fixed_hand=None, invulnerable=False):
    entry = {
        "id": id,
        "title": title,
        "opponent": {
            "name": name,
            "epithet": epithet,
            "kind": kind,
            "maxPhys": phys,
            "maxPsy": psy,
        },
        "player": player or {"maxPhys": 60, "maxPsy": 60},
        "deckMode": "fixed" if fixed_hand else "constructed",
        "script": script,
        "ending": {"win": win, "lose": lose, "mutual": mutual},
    }
    if fixed_hand:
        entry["fixedHand"] = fixed_hand
    if invulnerable:
        entry["opponent"]["invulnerable"] = True
    return entry


BATTLES = [
    battle(
        "battle-ch01-s03",
        "复演：昏迷",
        "呼吸的重量",
        "胸口上的石头",
        "trauma",
        60,
        60,
        [
            {"log": "呼吸慢了一拍。", "ops": [dmg("phys", 3), status("呼吸抑制", 1)]},
            {"log": "你听见自己的心跳。", "ops": [dmg("phys", 4), status("呼吸抑制", 1)]},
            {"log": "走廊的灯灭了。", "ops": [dmg("phys", 3), dmg("psy", 2)]},
            {"log": "有人叫你的名字，你分不清左右手。", "ops": [dmg("phys", 4), status("解离", 1)]},
        ],
        "你撑过了这一版。呼吸还在，但记录没有变完整。",
        "你被压在胸口下面。复演到此为止。",
        "你和那块石头一起沉了下去。",
    ),
    battle(
        "battle-ch01-s05",
        "复演：余晖",
        "不可复现的余晖",
        "那一次之后再也没有",
        "emotion",
        70,
        70,
        [
            {"log": "那天的光回来了。", "ops": [heal("psy", 3, "self"), neuro("血清素", 4, "self")], "when": {"playerBarBelow": "psy"}},
            {"log": "你想再试一次。", "ops": [dmg("psy", 3), neuro("谷氨酸", -4)]},
            {"log": "记忆开始褪色。", "ops": [dmg("psy", 4), status("解离", 1)]},
            {"log": "它只是一次偶然。", "ops": [dmg("psy", 4)]},
        ],
        "你把它写进了档案。余晖没有回来。",
        "你追着那点光，走进了更深的黑。",
        "你和余晖一起停在那一页。",
    ),
    battle(
        "battle-ch02-s03",
        "复演：k-hole",
        "金刚烷胺的形状",
        "墙在呼吸",
        "symptom",
        55,
        65,
        [
            {"log": "墙开始向内凹。", "ops": [status("谵妄", 1), neuro("乙酰胆碱", -8)]},
            {"log": "你看见彩色的虫子。", "ops": [dmg("psy", 4), status("解离", 1)]},
            {"log": "厕所的黑洞在等你。", "ops": [dmg("psy", 5), status("谵妄", 1)]},
            {"log": "有人在门外叫你的名字。", "ops": [dmg("psy", 3), neuro("谷氨酸", 5)]},
        ],
        "你从洞里爬出来，天已经亮了。",
        "你留在洞底。这一版档案没有结尾。",
        "你和那些虫子一起安静下来。",
    ),
    battle(
        "battle-ch02-s06",
        "复演：清晨",
        "清晨",
        "五点，天还没亮",
        "emotion",
        999,
        999,
        [
            {"log": "天快亮了。", "ops": [dmg("psy", 6)]},
            {"log": "你说，我睡个觉。", "ops": [dmg("psy", 7), status("解离", 1)]},
            {"log": "楼下有人在扫地。", "ops": [dmg("psy", 8)]},
            {"log": "她就不回来了。", "ops": [dmg("psy", 9), status("谵妄", 1)]},
        ],
        "你醒了过来。",
        "你没有拉住清晨。",
        "你和清晨一起停在了五点。",
        player={"maxPhys": 50, "maxPsy": 45},
        invulnerable=True,
    ),
    battle(
        "battle-ch03-s02",
        "复演：拉一把",
        "她自己的死意",
        "别拉我",
        "trauma",
        80,
        90,
        [
            {"log": "她说：别拉我。", "ops": [dmg("psy", 4)]},
            {"log": "你抓住的是一段记录。", "ops": [dmg("psy", 5), heal("psy", 4, "self")]},
            {"log": "她说：这是最后一次。", "ops": [dmg("psy", 6), heal("psy", 5, "self")]},
            {"log": "门开着，灯没有开。", "ops": [dmg("psy", 6), status("解离", 1)]},
        ],
        "你把她从门口拉回来了。只是这一次。",
        "你没能在她消失前抓住她。",
        "你们一起坐在门口，谁也没有再说话。",
        player={"maxPhys": 55, "maxPsy": 60},
    ),
    battle(
        "battle-ch03-s04",
        "复演：透明",
        "透明",
        "屋里的人会消失",
        "emotion",
        60,
        75,
        [
            {"log": "你转眼，屋里少了一个人。", "ops": [status("解离", 1), dmg("psy", 3)]},
            {"log": "你听见一两秒的声音。", "ops": [status("谵妄", 1), dmg("psy", 3)]},
            {"log": "你说，我是不是中毒性精分了。", "ops": [dmg("psy", 4), neuro("谷氨酸", -5)]},
            {"log": "墙上的影子开始变透明。", "ops": [status("解离", 2), dmg("psy", 4)]},
        ],
        "你把看到的东西写了下来。它们没有完全消失。",
        "你没能把屋里的人留住。",
        "你和那些透明的人一起淡了下去。",
    ),
    battle(
        "battle-side-83",
        "复演：门口的警车",
        "门口的警车",
        "它还在那里",
        "symptom",
        30,
        30,
        [
            {"log": "警车还停在门口。", "ops": [dmg("psy", 3)]},
            {"log": "你听见车门响。", "ops": [dmg("psy", 3), status("激越", 1)]},
            {"log": "你问自己：这是被害妄想吗？", "ops": [dmg("psy", 3), dmg("psy", 3, "self")]},
        ],
        "那只是一辆车。",
        "你没能说服自己。",
        "你和警车一起停在门口。",
        player={"maxPhys": 30, "maxPsy": 30},
        fixed_hand=["breathe", "window", "ask", "message"],
    ),
]

OUT.write_text(json.dumps(BATTLES, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {len(BATTLES)} battles")