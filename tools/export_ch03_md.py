import json
from pathlib import Path

root = Path('src/content/private/chapters/ch03.json')
out = Path('../重写文本/章节/ch03-老师再也不见')
data = json.loads(root.read_text(encoding='utf-8'))
files = {
    'ch03.s01': '01-索死法.md', 'ch03.s02': '02-拉一把.md', 'ch03.s02a': '02a-助手日志.md',
    'ch03.s03': '03-成为助手.md', 'ch03.s03a': '03a-苦的东西.md', 'ch03.s03b': '03b-长消息.md',
    'ch03.s03c': '03c-又一次.md', 'ch03.s04': '04-透明的人.md', 'ch03.s05': '05-家史.md',
    'ch03.s05a': '05a-北京.md', 'ch03.s05b': '05b-小郁.md', 'ch03.s05c': '05c-公开帖.md',
    'ch03.s05d': '05d-最后一次.md', 'ch03.s06': '06-失联.md', 'ch03.s07': '07-消失.md',
    'ch03.s08': '08-尾声.md',
}
num = {
    'ch03.s01': '01', 'ch03.s02': '02', 'ch03.s02a': '02a', 'ch03.s03': '03',
    'ch03.s03a': '03a', 'ch03.s03b': '03b', 'ch03.s03c': '03c', 'ch03.s04': '04',
    'ch03.s05': '05', 'ch03.s05a': '05a', 'ch03.s05b': '05b', 'ch03.s05c': '05c',
    'ch03.s05d': '05d', 'ch03.s06': '06', 'ch03.s07': '07', 'ch03.s08': '08',
}
for scene in data['scenes']:
    sid = scene['id']
    lines = [
        '---',
        f'id: {sid}',
        f"source_refs: [{', '.join(scene.get('sourceRefs', []))}]",
        f"content_flags: [{', '.join(scene.get('flags', []))}]",
        'status: draft',
        '---',
        '',
        f"# 场景 {num[sid]} · {scene['title']}",
        '',
    ]
    for beat in scene['beats']:
        t = beat.get('type')
        if t == 'dialogue':
            lines.append(f"**{beat.get('speaker','处理者')}**：{beat.get('text','')}")
        elif t == 'quote':
            if beat.get('source'):
                lines.append(f"> 来源：{beat['source']}")
            lines.extend('> ' + part if part else '>' for part in beat.get('text','').split('\n'))
        elif t == 'choice':
            lines.append('**选择**')
            for opt in beat.get('options', []):
                note = f" → {opt['note']}" if opt.get('note') else ''
                lines.append(f"- {opt['label']}{note}")
        elif t == 'battle':
            lines.append(f"**战斗 · {beat.get('label','战斗')}**")
            lines.append(f"- ID：{beat.get('battleId','')}")
            lines.append('- 注意：复演不改变事实。')
        lines.append('')
    (out / files[sid]).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('wrote', files[sid])
