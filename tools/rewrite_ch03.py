import json
from pathlib import Path

path = Path('src/content/private/chapters/ch03.json')
d = json.loads(path.read_text(encoding='utf-8'))
scenes = {s['id']: s for s in d['scenes']}


def dlg(speaker, text):
    return {'type': 'dialogue', 'speaker': speaker, 'text': text}


def quote(text, source=None):
    b = {'type': 'quote', 'text': text}
    if source:
        b['source'] = source
    return b


def choice(cid, prompt, options):
    return {'type': 'choice', 'id': cid, 'prompt': prompt, 'options': options}


s = scenes['ch03.s01']
s['title'] = '索死法'
s['beats'] = [
    dlg('处理者', '档案室的灯坏了一盏。我借着剩下的那盏读 50 号。'),
    quote('2024.02.23.01:28\n老师，██配酒会怎么样', 'report-050'),
    quote('去世\n会很难受吗'),
    quote('我希望能在无意识中去世'),
    quote('如果老师可以告诉我一个不会难受的方法，我也愿意买，而且我不会告诉别人'),
    dlg('处理者', '二月二十三日，凌晨一点二十八分。彼岸境向后藤要一个死法。'),
    dlg('后藤', '别诶诶。那会痛苦死的。先别一个人待着，告诉我你在哪。'),
    dlg('处理者', '他没有说“不要死”。他说“那会痛苦死的”。'),
    dlg('彼岸境', '我已经自杀失败七次了。'),
    dlg('处理者', '这句话之后，聊天记录空了很久。后藤没有接“七次”，只问她现在在哪。'),
    dlg('处理者', '她打字很快，一句接一句，像怕他关掉窗口。'),
    dlg('彼岸境', '我不会告诉别人。我只要一个不会难受的方法。'),
    dlg('后藤', '没有那种方法。'),
    dlg('彼岸境', '那你也给我一个。'),
    dlg('处理者', '后藤停了很久。最后他只说：“先别一个人。”他没有答应，也没有拒绝。'),
    dlg('处理者', '他把问题从“怎么死”挪到了“今晚怎么过”。'),
    choice('ch03.s01.choice', '选择', [
        {'id': 'o1', 'label': '拒绝她', 'note': '后藤只问她在哪', 'targetScene': 'ch03.s02'},
        {'id': 'o2', 'label': '转移话题', 'note': '后藤说“先别一个人”；没有给方法', 'targetScene': 'ch03.s02'},
        {'id': 'o3', 'label': '问她为什么', 'note': '彼岸境：因为我想在无意识中离开', 'targetScene': 'ch03.s02'},
        {'id': 'o4', 'label': '不回应', 'targetScene': 'ch03.s02'},
    ]),
]

s = scenes['ch03.s02']
s['title'] = '拉一把'
old_battle = {'type': 'battle', 'battleId': 'battle-ch03-s02', 'label': '救援'}
s['beats'] = [
    quote('别诶诶。那会痛苦死的。先别一个人待着。', 'report-050'),
    quote('告诉我你在哪。'),
    quote('我现在过来。'),
    dlg('处理者', '后藤没有开药。他做的只有三件事：问位置、让她别一个人、联系她身边的人。'),
    dlg('彼岸境', '老师，我到家了。'),
    dlg('处理者', '那天晚上，她喝了一点水，坐在门口等他。'),
    dlg('彼岸境', '我还是想要那个。'),
    dlg('处理者', '她没有说“那个”是什么。档案里也没有写。'),
    dlg('后藤', '因为我想知道，今晚过去以后，明天还会不会一样。'),
    dlg('彼岸境', '但是现在也过了好久了。还是很想。没有帮助……？'),
    dlg('处理者', '后藤没有回答“有没有帮助”。他在档案里写：这是一次测试。'),
    dlg('处理者', '今晚不是解药。它只是让她从“今晚就死”退到“明天再说”，但没有退到“不想死”。'),
    dlg('彼岸境', '没有帮助。'),
    dlg('后藤', '再撑一会儿。'),
    dlg('处理者', '他在档案里写：“这是一次测试。”他没有写“治疗”。这两个词之间，隔着一个很轻的、但很要命的东西。'),
    old_battle,
    {'type': 'choice', 'id': 'ch03.s02.choice', 'prompt': '选择', 'options': [
        {'id': 'o1', 'label': '留下', 'note': '进入战斗', 'targetScene': 'ch03.s02a'},
        {'id': 'o2', 'label': '离开', 'note': '跳过战斗；档案里多一行“我第二天才回她”', 'targetScene': 'ch03.s02a'},
    ]},
]

for b in scenes['ch03.s02a']['beats']:
    if b.get('type') == 'dialogue' and '一小袋左苏' in b.get('text', ''):
        b['text'] = b['text'].replace('一小袋左苏', '一小袋药')

s = scenes['ch03.s03a']
s['title'] = '苦的东西'
s['beats'] = [
    dlg('处理者', '冰箱上贴着一张复诊单。她总是弄丢，后藤用磁铁把它压住。'),
    dlg('彼岸境', '这杯东西好难喝。'),
    dlg('后藤', '良药苦口。'),
    dlg('彼岸境', '你骗人。'),
    dlg('后藤', '我没骗你。它只是难喝。'),
    dlg('处理者', '她把一杯很苦的东西搅了很久，还是结块。她喝了一口，皱起脸，把杯子推给后藤。'),
    dlg('处理者', '后藤接过来，喝了一口，也皱起脸。'),
    dlg('彼岸境', '你也觉得难喝。'),
    dlg('后藤', '我没说好喝。'),
    dlg('处理者', '她笑了。那天的阳光很好，从厨房的窗户照进来，落在桌子上。风扇在头顶转，发出很轻的咔哒声。'),
    dlg('处理者', '她坐在椅子上，脚够不到地，一晃一晃。'),
    dlg('彼岸境', '这杯东西会不会让我不想死？'),
    dlg('后藤', '不知道。先试试。'),
    dlg('彼岸境', '那你陪我。'),
    dlg('后藤', '我在这。'),
    dlg('处理者', '她没有说话，低头看着杯子。过了一会儿，她说：'),
    dlg('彼岸境', '如果我好了，你还会理我吗？'),
    dlg('后藤', '会。'),
    dlg('彼岸境', '那你别骗我。'),
    dlg('后藤', '不骗你。'),
    dlg('处理者', '这是档案里少有的、没有争吵的下午。杯子里还剩一点浑浊的水，阳光照在里面，像一小块很淡的琥珀。'),
    {'type': 'choice', 'id': 'ch03.s03a.choice', 'prompt': '选择', 'options': [
        {'id': 'o1', 'label': '她后来好了吗？', 'note': '后藤：好了一阵', 'targetScene': 'ch03.s03b'},
        {'id': 'o2', 'label': '这杯东西有用吗？', 'note': '后藤：有一点。不够', 'targetScene': 'ch03.s03b'},
        {'id': 'o3', 'label': '不提问', 'targetScene': 'ch03.s03b'},
    ]},
]

s03b = {
    'id': 'ch03.s03b', 'chapterId': 'ch03', 'order': 3, 'title': '长消息',
    'summary': '# 场景 03b · 长消息',
    'flags': ['chat_log', 'caregiving', 'suicide_ideation', 'dependence'],
    'sourceRefs': ['report-050', 'report-051'],
    'stage': {'bg': 'bg_higan_home', 'bust': {'speaker': '彼岸境', 'expr': 'polite'}},
    'beats': [
        dlg('处理者', '她开始发很长的消息。一条接一条，像怕停下来就会沉下去。'),
        dlg('彼岸境', '老师，我今天又没睡。脑子里一直在转。'),
        dlg('彼岸境', '我是不是很烦。'),
        dlg('处理者', '后藤回得很短。'),
        dlg('后藤', '嗯。'),
        dlg('后藤', '去睡。'),
        dlg('彼岸境', '你是不是烦我。'),
        dlg('后藤', '没有。'),
        dlg('处理者', '他发了一张猫。猫躺在键盘上，挡住半个屏幕。'),
        dlg('彼岸境', '你根本不在乎。'),
        dlg('后藤', '我在。'),
        dlg('处理者', '他的回复很短，但没有断。档案里没有写他那一晚睡了没有。'),
        choice('ch03.s03b.choice', '这一段怎么记？', [
            {'id': 'o1', 'label': '让她说完', 'note': '记录更长', 'targetScene': 'ch03.s04'},
            {'id': 'o2', 'label': '转开话题', 'note': '记录到她发猫为止', 'targetScene': 'ch03.s04'},
            {'id': 'o3', 'label': '只记录，不评价', 'note': '只留“已回复”', 'targetScene': 'ch03.s04'},
        ]),
    ],
    'next': 'ch03.s03c',
}
scenes['ch03.s03b'] = s03b

s03c = {
    'id': 'ch03.s03c', 'chapterId': 'ch03', 'order': 3, 'title': '又一次',
    'summary': '# 场景 03c · 又一次',
    'flags': ['chat_log', 'caregiving', 'suicide_ideation', 'dependence'],
    'sourceRefs': ['report-050', 'report-051'],
    'stage': {'bg': 'bg_higan_home', 'bust': {'speaker': '彼岸境', 'expr': 'polite'}},
    'beats': [
        dlg('处理者', '三月的第一个星期，她又说了一次。'),
        dlg('彼岸境', '老师，我不想活了。'),
        dlg('处理者', '后藤打电话过去。她接了，但没有说话。'),
        dlg('后藤', '你在哪。'),
        dlg('彼岸境', '你别过来。'),
        dlg('处理者', '他还是去了。'),
        dlg('处理者', '她坐在门口，穿着外套，鞋只穿了一只。没有开灯。'),
        dlg('后藤', '吃饭了吗。'),
        dlg('彼岸境', '我没事。'),
        dlg('处理者', '后藤没有问“为什么”。他把外套脱下来，披在她身上，然后去烧水。'),
        dlg('处理者', '档案里记：又一次。她没有说过程，他也没有写。'),
        choice('ch03.s03c.choice', '这一段怎么记？', [
            {'id': 'o1', 'label': '记下“又一次”', 'note': '保留她的原话', 'targetScene': 'ch03.s04'},
            {'id': 'o2', 'label': '只记“已处理”', 'note': '不写过程', 'targetScene': 'ch03.s04'},
            {'id': 'o3', 'label': '不记', 'note': '下一段更短', 'targetScene': 'ch03.s04'},
        ]),
    ],
    'next': 'ch03.s04',
}
scenes['ch03.s03c'] = s03c

s = scenes['ch03.s04']
old_battle = next(b for b in s['beats'] if b['type'] == 'battle')
s['beats'] = [
    quote('看到在屋里面身边的人会变透明消失，要不就是经常看不见屋里的人，明明前几秒还在，我一转眼就不见了。', 'report-050'),
    dlg('处理者', '三月初。她开始描述“透明的人”。'),
    dlg('彼岸境', '前两天的时候偶尔我好像还有幻听，听到有人叫我，跟我说一句简短的话，都是一两秒的声音。'),
    dlg('彼岸境', '我怀疑我是不是中毒性精分了。'),
    dlg('后藤', '你最近吃了什么？'),
    dlg('彼岸境', '我最近吃了很多药。'),
    dlg('处理者', '档案里记了药名，数量被涂黑。'),
    dlg('彼岸境', '还想再做幸福的梦。'),
    dlg('处理者', '她说“透明”的时候，用了“屋里的人”这个词。不是“幻觉”，不是“影子”，是“屋里的人”。'),
    dlg('处理者', '好像那些人本来就在，只是她看不见了。'),
    dlg('彼岸境', '我是不是中毒性精分了？'),
    dlg('后藤', '先别下结论。把看到的东西写下来。'),
    old_battle,
    {'type': 'choice', 'id': 'ch03.s04.choice', 'prompt': '选择', 'options': [
        {'id': 'o1', 'label': '相信她', 'note': '后藤让她把看到的东西写下来', 'targetScene': 'ch03.s05'},
        {'id': 'o2', 'label': '怀疑她', 'note': '后藤说“可能是药”；她沉默', 'targetScene': 'ch03.s05'},
        {'id': 'o3', 'label': '不评价', 'targetScene': 'ch03.s05'},
    ]},
]

scenes['ch03.s05b']['next'] = 'ch03.s05c'

s05c = {
    'id': 'ch03.s05c', 'chapterId': 'ch03', 'order': 5, 'title': '公开帖',
    'summary': '# 场景 05c · 公开帖',
    'flags': ['chat_log', 'caregiving', 'grief'],
    'sourceRefs': ['report-050', 'report-051'],
    'stage': {'bg': 'bg_archive', 'bust': {'speaker': '后藤', 'expr': 'calm'}},
    'beats': [
        dlg('处理者', '档案外的讨论区，有人转了一条后藤的公开帖。'),
        quote('不是所有人都能救。我只在悬崖边拉一把，要不要由你。我不收一分钱。', 'ODW 讨论区 · 公开帖（转）'),
        dlg('处理者', '评论说他冷血。他没有回。'),
        dlg('处理者', '同一晚，私聊窗口亮着。'),
        dlg('后藤', '你在哪。'),
        dlg('后藤', '回我。'),
        dlg('后藤', '我去找。'),
        dlg('处理者', '公开帖和私聊之间，隔着一句没有发出去的话。'),
        choice('ch03.s05c.choice', '这一段怎么归档？', [
            {'id': 'o1', 'label': '引公开帖', 'note': '档案留下他的冷话', 'targetScene': 'ch03.s06'},
            {'id': 'o2', 'label': '引私聊', 'note': '档案留下他的三个字', 'targetScene': 'ch03.s06'},
            {'id': 'o3', 'label': '两条都记', 'note': '并置，不评价', 'targetScene': 'ch03.s06'},
        ]),
    ],
    'next': 'ch03.s05d',
}
scenes['ch03.s05c'] = s05c

s05d = {
    'id': 'ch03.s05d', 'chapterId': 'ch03', 'order': 5, 'title': '最后一次',
    'summary': '# 场景 05d · 最后一次',
    'flags': ['chat_log', 'caregiving', 'suicide_ideation', 'grief'],
    'sourceRefs': ['report-050', 'report-051'],
    'stage': {'bg': 'bg_higan_home', 'bust': {'speaker': '彼岸境', 'expr': 'polite'}},
    'beats': [
        dlg('处理者', '三月十日，又一次。'),
        dlg('彼岸境', '老师，对不起。'),
        dlg('后藤', '别说对不起。你在哪。'),
        dlg('处理者', '这次她回得很快。像早就打好了。'),
        dlg('彼岸境', '我在家。你别过来。'),
        dlg('处理者', '后藤还是去了。他带了一份外卖，到了门口才发现自己没带钥匙——他把自己家的钥匙给了她。'),
        dlg('处理者', '她开门的时候，眼睛是肿的。她问：“老师，你是不是不要我了。”'),
        dlg('后藤', '没有。'),
        dlg('处理者', '他坐在门口，等她吃完。她没有吃几口。'),
        dlg('彼岸境', '这是最后一次了。'),
        dlg('后藤', '你上次也这么说。'),
        dlg('处理者', '档案里记：最后一次。三月十一日，她留下三行字。'),
        choice('ch03.s05d.choice', '这一段怎么记？', [
            {'id': 'o1', 'label': '记下“最后一次”', 'note': '保留她的原话', 'targetScene': 'ch03.s06'},
            {'id': 'o2', 'label': '只写“失联前夜”', 'note': '不写过程', 'targetScene': 'ch03.s06'},
            {'id': 'o3', 'label': '不记', 'note': '直接进入失联', 'targetScene': 'ch03.s06'},
        ]),
    ],
    'next': 'ch03.s06',
}
scenes['ch03.s05d'] = s05d

s = scenes['ch03.s06']
s['beats'] = [
    quote('2024.03.11.11:45\n老师', 'report-050'),
    quote('可能我今天'),
    quote('2024.03.11.13:20'),
    quote('就直接拜拜了'),
    dlg('处理者', '三月十一日。她留下三行字。'),
    dlg('小郁', '波奇，小境她去世了吗？我很担心她。她联系你了吗？'),
    dlg('处理者', '三月十三日。小郁——彼岸境提过的“郁子”——开始找她。'),
    dlg('小郁', '她的手机关机了。她已经 24 小时没有消息了。'),
    dlg('小郁', '她好像死掉了…手机关机消息不回。'),
    dlg('后藤', '我去找。'),
    dlg('处理者', '他打了一句“回我”，删掉。又打了一句“别吓我”，删掉。最后只发出去三个字：“我去找。”'),
    dlg('处理者', '档案里没有写他找了多久。只有一句：警方也找不到。'),
    dlg('处理者', '后藤给她发了很多条消息。已读，没有回。他打了电话，关机。'),
    dlg('小郁', '她手上有药。她吃了很多。吃了会晕几天，还是会死掉？我担心的要疯掉了。'),
    dlg('处理者', '档案里没有写后藤怎么回答。只有一条时间戳：2024.03.14.07:58。'),
    {'type': 'choice', 'id': 'ch03.s06.choice', 'prompt': '选择', 'options': [
        {'id': 'o1', 'label': '去找', 'note': '后藤出门；档案里多一段路程', 'targetScene': 'ch03.s07'},
        {'id': 'o2', 'label': '等', 'note': '后藤留在档案室；s07 的记录更短', 'targetScene': 'ch03.s07'},
        {'id': 'o3', 'label': '问小郁', 'note': '小郁重复“她好像死掉了”', 'targetScene': 'ch03.s07'},
    ]},
]

s = scenes['ch03.s07']
insert_at = len(s['beats']) - 1
s['beats'].insert(insert_at, dlg('处理者', '她的房间里有叠好的毯子、一条蓝色长裙、一个托特包。桌上的水杯还没洗。'))

order = {
    'ch03.s01': 1, 'ch03.s02': 2, 'ch03.s02a': 2, 'ch03.s03': 3,
    'ch03.s03a': 3, 'ch03.s03b': 3, 'ch03.s03c': 3, 'ch03.s04': 4, 'ch03.s05': 5,
    'ch03.s05a': 5, 'ch03.s05b': 5, 'ch03.s05c': 5, 'ch03.s05d': 5, 'ch03.s06': 6,
    'ch03.s07': 7, 'ch03.s08': 8,
}
nexts = {
    'ch03.s01': 'ch03.s02', 'ch03.s02': 'ch03.s02a', 'ch03.s02a': 'ch03.s03',
    'ch03.s03': 'ch03.s03a', 'ch03.s03a': 'ch03.s03b', 'ch03.s03b': 'ch03.s03c',
    'ch03.s03c': 'ch03.s04', 'ch03.s04': 'ch03.s05', 'ch03.s05': 'ch03.s05a',
    'ch03.s05a': 'ch03.s05b', 'ch03.s05b': 'ch03.s05c', 'ch03.s05c': 'ch03.s05d',
    'ch03.s05d': 'ch03.s06', 'ch03.s06': 'ch03.s07',
    'ch03.s07': 'ch03.s08', 'ch03.s08': None,
}
for sid, sc in scenes.items():
    sc['order'] = order[sid]
    sc['next'] = nexts[sid]
d['scenes'] = [scenes[sid] for sid in order]
path.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('scenes', len(d['scenes']))