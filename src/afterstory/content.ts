import type {
  ClauseId,
  Effect,
  EndingId,
  ExternalEvent,
  ReplyOption,
  TurnContent,
  Visitor,
} from './types';

export const TURN_COUNT = 8;

export const TURN_CONTENT: TurnContent[] = [
  {
    id: 1,
    date: '2026.01.10',
    title: '回来',
    headline: '第一张桌子',
    brief: [
      '二〇二六年一月，名单还没有公布。旧高原已经不再是一个地方，它剩下一些群、一些桌子、一些还在回消息的人。',
      '一个减害派的值班人找到你。他没有叫你回来主持，只说想请你做一次见证。你带了一个旧文件袋：两年前没写完的公约，和一张空白的签到表。',
      '桌子还在。椅子少了一把。没有人问你为什么回来，但每个人都在看。',
    ],
    visitor: {
      from: '减害值班人',
      role: '夜间答疑桌 / 无名',
      question: '「老师，你这次回来，是打算留下，还是只来看一眼？」',
      options: [
        {
          id: 'sit',
          label: '先坐下，听他把这半年说完',
          effectText: '信任 +6 / 混乱 -1 / 群众→减害 1',
          line: '你把外套搭在椅背上，没有先谈名单。他讲了很久，你只记下三件还需要人做的事。',
          effect: { trust: 6, chaos: -1, move: [{ from: 'mass', to: 'harm', n: 1 }] },
        },
        {
          id: 'roster',
          label: '先问现在谁还在值班',
          effectText: '信任 +2 / 暴露 +1 / 群众→减害 1',
          line: '值班表比两年前短。你把空出来的那几格圈上，又写上「待定」。',
          effect: { trust: 2, exposure: 1, move: [{ from: 'mass', to: 'harm', n: 1 }] },
        },
        {
          id: 'folder',
          label: '把旧文件袋推过去，让他先看',
          effectText: '信任 +4 / 混乱 -2',
          line: '他抽出那张空白签到表，看了半天，问：「这次要写谁的名字？」你说，先不写。',
          effect: { trust: 4, chaos: -2 },
        },
      ],
    },
    night: ['旧群冷场。没有人退群，也没有人说话。', '一个灰格灭了下去，像有人把图钉拔走。'],
    art: '/assets/afterstory/event_01_return.png',
  },
  {
    id: 2,
    date: '2026.01.31',
    title: '名字',
    headline: '名单还在群里流传',
    brief: [
      '一月底，有人说夜间答疑桌是卖药窝点。一个群众用户拍了视频，镜头只扫到桌角和半张纸。',
      '旧帖被翻出来。ODW 和 FOW 互相指控「点炮全员」「蓄意报复」；爱德华的名字被反复@。',
      '你还没有拿到名单。你只拿到一个更麻烦的东西：别人已经开始替你们解释你们是谁。',
    ],
    visitor: {
      from: '群众用户',
      role: '平台来的求助者 / 无名',
      question: '「你们是不是也把我当盲目派？还是说，只有能帮你们赢的人，才算人？」',
      options: [
        {
          id: 'listen',
          label: '先听完，再回答「不是」',
          effectText: '信任 +6 / 混乱 -1 / 群众→减害 1',
          line: '你没有纠正他的用词。他说完，自己把「盲目派」改成了「还没决定的人」。',
          effect: { trust: 6, chaos: -1, move: [{ from: 'mass', to: 'harm', n: 1 }] },
        },
        {
          id: 'boundary',
          label: '解释边界：我们不代表所有人',
          effectText: '信任 +3 / 暴露 +2 / 群众→减害 1',
          line: '他听懂了，也明显失望。走之前他还是把视频删了。',
          effect: { trust: 3, exposure: 2, move: [{ from: 'mass', to: 'harm', n: 1 }] },
        },
        {
          id: 'video',
          label: '先要视频原片，确认拍到了什么',
          effectText: '暴露 +3 / 信任 -2',
          line: '他给了你原片，也把聊天记录截走了。你得到证据，失去一个愿意坐下的人。',
          effect: { exposure: 3, trust: -2 },
        },
      ],
    },
    night: ['平台限流。答疑桌的帖子只剩自己可见。', '鸡哥发来一句：「要不要我帮你平事？」你没有回。'],
    art: '/assets/afterstory/event_02_name.png',
  },
  {
    id: 3,
    date: '2026.02.21',
    title: '春节',
    headline: '爱德华死后的第一次会',
    brief: [
      '二月四日之后，自由左的席位卡空了几天。二月二十一日，鼠尾草第一次以领袖身份坐进来。',
      '她把外套搭在椅背上，没有坐爱德华原来的位置。桌上多了一把空椅，谁也没有把它搬走。',
      '第五把椅子还空着。春节的群比平时安静，安静得像大家都在等另一个人先说话。',
    ],
    visitor: {
      from: '鼠尾草',
      role: '自由左领袖',
      question: '「你们准备怎么处理他的死？别给我一份声明。我要知道，你们打算怎么让下一个人不死。」',
      options: [
        {
          id: 'care',
          label: '先问那天谁陪着他，再谈责任',
          effectText: '信任 +5 / 混乱 -3 / 自由左关系 +1',
          line: '她看了你很久，说：「行。那你先把急救条款写出来，别再让别人替你们擦。」',
          effect: { trust: 5, chaos: -3, relation: { left: 1 } },
        },
        {
          id: 'account',
          label: '先讲清楚我们的责任，不替谁遮掩',
          effectText: '暴露 +2 / 自由左关系 -1 / 信任 +2',
          line: '她把「责任」两个字记在本子上，也把你的名字单独圈了起来。',
          effect: { exposure: 2, trust: 2, relation: { left: -1 } },
        },
        {
          id: 'quiet',
          label: '不替他解释，只把空椅留下',
          effectText: '信任 -2 / 混乱 +1',
          line: '会议开得很短。散会时她把那张空椅推回桌边，没有看你。',
          effect: { trust: -2, chaos: 1 },
        },
      ],
    },
    night: ['春节的空桌比平时长。有人发了一张没有人的饭桌照片。', '自由左的一个格退回群众，像有人提前离席。'],
    art: '/assets/afterstory/event_03_spring.png',
  },
  {
    id: 4,
    date: '2026.03.14',
    title: '曝光',
    headline: '停骂不是和解',
    brief: [
      '二月二十六日，鼠尾草说「窝不骂你了」。下一句仍然是指控：你对她关系好的人又骂又 b；鸡哥在她推下发激将帖，导致你封号。',
      '记者发来私信，只问一个问题：爱德华怎么死的。平台审核也来了，措辞比记者客气，意思差不多。',
      '自由左停摆后重组。有人要求清算你，有人要求你先清算旧渠道。两种清算都很有吸引力。',
    ],
    visitor: {
      from: '记者 / 平台审核',
      role: '外部记录者 / 无名',
      question: '「你只需要回答一件事：爱德华的死，和你们这个圈子有没有关系？」',
      options: [
        {
          id: 'facts',
          label: '只确认事实，不替任何人定罪',
          effectText: '暴露 +3 / 信任 +2 / 自由左关系 +1',
          line: '记者把录音笔放下，说：「这不像一个答案。」你说：「本来就不该由我替他们回答。」',
          effect: { exposure: 3, trust: 2, relation: { left: 1 } },
        },
        {
          id: 'platform',
          label: '把问题推回给平台和旧渠道',
          effectText: '暴露 +5 / 混乱 +1',
          line: '这段话被截成一句标题。群众里有人第一次替你说话，也有人说你在转移视线。',
          effect: { exposure: 5, chaos: 1 },
        },
        {
          id: 'refuse',
          label: '拒绝回答，先把人送回家',
          effectText: '暴露 -2 / 信任 -3 / 混乱 +2',
          line: '记者走了。审核的邮件还在。你关掉屏幕，听见楼下有人按错门铃。',
          effect: { exposure: -2, trust: -3, chaos: 2 },
        },
      ],
    },
    night: ['停骂帖被转了几百次，没有一条是道歉。', '鸡哥把旧账翻出来，@了你，又删掉。', '平台限流七天。你第一次觉得安静也有重量。'],
    art: '/assets/afterstory/event_04_exposure.png',
  },
  {
    id: 5,
    date: '2026.04.04',
    title: '急救',
    headline: '一条能救人的线',
    brief: [
      '社区急救站愿意开一条转介线。条件很简单，也很难：别曝光，别把急救站写成英雄，别让记者在门口等。',
      '值班的人说得很直：「我们能接的人不多。你们要是每次都把事闹大，我连这几个也接不住。」',
      '你知道他在害怕什么。你也知道，害怕本身不是罪。',
    ],
    visitor: {
      from: '急救站值班人',
      role: '夜间急救站 / 无名',
      question: '「你能保证什么？保证不拍我，还是保证下一次有人倒下时，你们先叫车？」',
      options: [
        {
          id: 'protect',
          label: '先保证不曝光急救站，把转介线接起来',
          effectText: '信任 +5 / 混乱 -2 / 急救线 +1',
          line: '他给了你一个只在工作时间响的号码。你把号码抄在手册最后一页，没有拍照。',
          effect: { trust: 5, chaos: -2, flags: ['first-aid-line'] },
        },
        {
          id: 'transparent',
          label: '要求公开转介流程，接受监督',
          effectText: '暴露 +4 / 信任 +2 / 急救线 +1',
          line: '他沉默了一会儿，说：「公开可以。但别把我的名字写进去。」',
          effect: { exposure: 4, trust: 2, flags: ['first-aid-line'] },
        },
        {
          id: 'numbers',
          label: '先谈能救几个人，不谈立场',
          effectText: '信任 +2 / 混乱 -1 / 急救线 +1',
          line: '你们在白板上写了三个数字：能转介的、能跟进的、只能留电话的。数字很小，但是真的。',
          effect: { trust: 2, chaos: -1, flags: ['first-aid-line'] },
        },
      ],
    },
    night: ['一次过量。电话打进来时，值班人正在打瞌睡。', '救护车来了。没有人拍视频。'],
    art: '/assets/afterstory/event_05_clinic.png',
  },
  {
    id: 6,
    date: '2026.04.25',
    title: '知识',
    headline: '一句话被截出去',
    brief: [
      '四月二十日，鼠尾草谈知识论。她说，知识不该被门禁锁住，也不该被一句「为你好」扣下。',
      '一句话被截出去骂：她在教人怎么用。原视频没有人看，截图转了几千次。',
      '她来找你，不是来求助。她想知道，你到底要保护谁。',
    ],
    visitor: {
      from: '鼠尾草',
      role: '自由左领袖',
      question: '「你把知识锁起来，是为了保护人，还是为了保护你自己不被骂？」',
      options: [
        {
          id: 'admit',
          label: '承认知识会伤人，也承认门禁会伤人',
          effectText: '信任 +4 / 混乱 -2 / 自由左关系 +1',
          line: '她没有笑，也没有再追问。走之前她说：「那就把两种伤都写进条款。」',
          effect: { trust: 4, chaos: -2, relation: { left: 1 } },
        },
        {
          id: 'open',
          label: '坚持全公开，不替任何人设门',
          effectText: '暴露 +6 / 自由左关系 +1 / 混乱 -1',
          line: '她第一次在你面前点头。平台的删除通知在同一分钟弹出来。',
          effect: { exposure: 6, chaos: -1, relation: { left: 1 } },
        },
        {
          id: 'deflect',
          label: '把问题推回给她：先管好你的人',
          effectText: '自由左关系 -1 / 混乱 +2 / 信任 -2',
          line: '她收起本子，说：「我知道了。」你不知道她知道了什么。',
          effect: { relation: { left: -1 }, chaos: 2, trust: -2 },
        },
      ],
    },
    night: ['知识条款的草稿被截图泄露。评论区在争「谁有资格讲」。', '自由左内部有人要求清算你，也有人要求先签手册。'],
    art: '/assets/afterstory/event_06_knowledge.png',
  },
  {
    id: 7,
    date: '2026.05.16',
    title: '代表',
    headline: '签字前夜',
    brief: [
      '四把有票权的椅子要定下来，第五把空着。你也要定下来：成立会那天，你坐在哪里。',
      '旧渠道的人来找你，说得很客气：你要秩序，还是你要干净？两种都能给你，只要你别再让记者到处跑。',
      '名单草案还在群里流传。五月底越来越近，桌子上的空椅却一直没有搬走。',
    ],
    visitor: {
      from: '旧渠道联系人',
      role: '旧渠道 / 无名',
      question: '「你要秩序，还是你要干净？别急着回答。你只要说一句，今晚就能安静。」',
      options: [
        {
          id: 'refuse',
          label: '拒绝旧渠道，但留下一个能打的电话',
          effectText: '信任 +3 / 混乱 +1 / 自由右关系 +1',
          line: '他没有生气，只把你的号码存进一个没有备注的通讯录。你不知道这算不算一种承诺。',
          effect: { trust: 3, chaos: 1, relation: { right: 1 } },
        },
        {
          id: 'deal',
          label: '谈条件，换一夜安静',
          effectText: '暴露 -3 / 混乱 -2 / 自由右关系 +1 / 承诺',
          line: '他答应今晚不闹事。你答应不把这次谈话写进会议记录。',
          effect: { exposure: -3, chaos: -2, relation: { right: 1 }, flags: ['old-deal'] },
        },
        {
          id: 'burn',
          label: '把话说死：新药圈不替旧渠道洗地',
          effectText: '信任 -2 / 混乱 +1 / 自由右关系 -1',
          line: '他站起来，把椅子推回桌下。门关得很轻，像一句没有说完的威胁。',
          effect: { trust: -2, chaos: 1, relation: { right: -1 } },
        },
      ],
    },
    night: ['旧渠道的人被清场。没有人受伤，群少了一半。', '有人在群里发：明天别带手机。', '你把手册最后一页翻出来，签字栏还是空的。'],
    art: '/assets/afterstory/event_07_representative.png',
  },
  {
    id: 8,
    date: '2026.05.31',
    title: '成立',
    headline: '五把椅子，四支笔，一本手册',
    brief: [
      '社区活动室。五张椅子，一张旧桌子，一本被翻得起毛的手册。旧公约在桌子底下，没人把它扔掉。',
      '名单的传闻没有停。但今天没有人谈名单，所有人都在看签字栏。',
      '你站在门边，忽然想起一月十日那张空白的签到表。现在它上面有名字了，虽然还不多。',
    ],
    visitor: {
      from: '五席 / 值班人',
      role: '成立会 / 无名',
      question: '「今天你坐哪儿？主持人，还是旁边那个见证人？」',
      options: [
        {
          id: 'beside',
          label: '坐在旁边，不坐主位',
          effectText: '信任 +5 / 混乱 -2 / 自由左关系 +1',
          line: '你把主位留给轮值的人，自己坐在靠门的位置。有人问为什么，你说：「方便去倒水。」',
          effect: { trust: 5, chaos: -2, relation: { left: 1 } },
        },
        {
          id: 'sign',
          label: '先让四席签字，再谈位置',
          effectText: '信任 +3 / 混乱 -2 / 手册签字 +1',
          line: '笔在四个人手里传了一圈。第五把椅子空着。有人签得很慢，有人签完没有抬头。',
          effect: { trust: 3, chaos: -2, flags: ['sign-push'] },
        },
        {
          id: 'archive',
          label: '把旧公约收起来，先念手册前言',
          effectText: '暴露 -3 / 信任 +2 / 混乱 -1',
          line: '「团结不是同意，是同意继续谈。」你念完，房间里安静了几秒，然后有人把椅子往前挪了一点。',
          effect: { exposure: -3, trust: 2, chaos: -1 },
        },
      ],
    },
    night: ['签字。盖章。有人先走了，有人留下来收拾杯子。', '名单终究会来。但今天，新药圈先有了一个名字。'],
    art: '/assets/afterstory/event_08_founding.png',
  },
];

export const DEATH_INTERLUDE = {
  date: '2026.02.04',
  title: '一把空椅',
  body: [
    '2026 年 2 月 2 日，爱德华死亡。死因是阿片类与 GABA 能药物联用导致呼吸抑制。',
    '2 月 4 日 21:02，讣告出现。下葬在城郊公墓，一块没有照片的碑。镜音是当时的看护者；她在场，但没有及时发现呼吸抑制。',
    '有人说他自己吃的，有人说你骂过他，有人说 FOW 的门禁也有责任。你只能决定，今天先说什么。',
  ],
  question: '记者和鼠尾草同时看着你。你先回答哪一个问题？',
  options: [
    {
      id: 'accountability',
      label: '公开问责镜音：先把看护不当说清楚',
      effectText: '暴露 +8 / 混乱 +5 / 自由左 -1 / 急救条款 -1 票',
      line: '你把「看护不当」推到台前。空椅上没有人点头；自由左的人没有鼓掌，只把椅子往后挪了一点。',
      effect: { exposure: 8, chaos: 5, relation: { left: -1 }, flags: ['death-accountability'] } as Effect,
    },
    {
      id: 'careFirst',
      label: '先处理看护与急救：那天有没有人该去看他一眼',
      effectText: '信任 +5 / 混乱 -3 / 自由左保持中立 / 急救条款 +1 票',
      line: '你先问的是那天谁陪着他。鼠尾草没有回答，但把椅子拉近了一点。',
      effect: { trust: 5, chaos: -3, flags: ['death-care', 'friend-progress'] } as Effect,
    },
    {
      id: 'silence',
      label: '不公开表态：只去葬礼，不发声明',
      effectText: '信任 -3 / 混乱 +3 / 关系不变',
      line: '你去了葬礼，站在最后一排。没有人认出你，也没有人需要你发言。',
      effect: { trust: -3, chaos: 3, flags: ['death-silence'] } as Effect,
    },
  ],
} as const;

export const EXTERNAL_EVENTS: ExternalEvent[] = [
  {
    id: 'video-interview',
    title: '视频主采访',
    body: '一个做城市观察的视频主在楼下等了两个小时。他没有拍到人，只拍到了关着的门和一张被撕掉一半的值班表。',
    effectText: '暴露 +6 / 信任 -2 / 混乱 +4',
    effect: { exposure: 6, trust: -2, chaos: 4, move: [{ from: 'mass', to: 'right', n: 1 }] },
  },
  {
    id: 'drug-control',
    title: '药品管理加强',
    body: '附近几家药店同时收到通知：含特定成分的药品要登记身份证。店员把通知贴在玻璃上，拍照的人比买药的人多。',
    effectText: '暴露 +4 / 混乱 +6 / 群众→减害 1',
    effect: { exposure: 4, chaos: 6, move: [{ from: 'mass', to: 'harm', n: 1 }] },
  },
  {
    id: 'reporter-watch',
    title: '记者蹲守',
    body: '记者没有进楼。他在马路对面站了一整个下午，每隔半小时拍一张门口的照片。',
    effectText: '暴露 +8 / 信任 -3 / 混乱 +3',
    effect: { exposure: 8, trust: -3, chaos: 3 },
  },
  {
    id: 'platform-purge',
    title: '平台集中清号',
    body: '值班表相关的一批账号在同一晚被清掉。有人换了小号回来，有人没有再回来。',
    effectText: '暴露 +10 / 混乱 +5 / PC -1',
    effect: { exposure: 10, chaos: 5, pc: -1, move: [{ from: 'mass', to: 'harm', n: 1 }] },
  },
  {
    id: 'neighbor-complaint',
    title: '邻居投诉',
    body: '楼下的人说夜里总有人进出。物业来敲门，没有进来，只站在门口看了一眼那张桌子。',
    effectText: '暴露 +5 / 混乱 +4 / 信任 -1',
    effect: { exposure: 5, chaos: 4, trust: -1, move: [{ from: 'mass', to: 'harm', n: 1 }] },
  },
  {
    id: 'offline-meeting',
    title: '有人提议线下见面',
    body: '群里有人问：既然值班表都发了，能不能见一面。地点改了三次，最后定在一家关得最晚的便利店门口。',
    effectText: '暴露 +5 / 信任 +4 / 混乱 +3 / 群众→减害 2',
    effect: { exposure: 5, trust: 4, chaos: 3, move: [{ from: 'mass', to: 'harm', n: 2 }] },
  },
  {
    id: 'first-aid-inspection',
    title: '急救站被检查',
    body: '急救站门口多了一张检查通知。值班人把转介线的小纸条从玻璃上撕下来，折好，放进围裙口袋。',
    effectText: '暴露 +4 / 信任 -2 / 混乱 +5 / PC -1',
    effect: { exposure: 4, trust: -2, chaos: 5, pc: -1 },
  },
  {
    id: 'outside-solidarity',
    title: '外地同行声援',
    body: '一个外地小组转发了你们的值班表，配文只有一句：「这张桌子还在。」评论里有人问地址，也有人提醒小心。',
    effectText: '暴露 +3 / 信任 +4 / 混乱 -2 / 群众→减害 1',
    effect: { exposure: 3, trust: 4, chaos: -2, move: [{ from: 'mass', to: 'harm', n: 1 }] },
  },
];

export type ClauseVariant = {
  id: string;
  label: string;
  summary: string;
  line: string;
  effect: Effect;
};

export type ClauseContent = {
  id: ClauseId;
  order: number;
  turn: number;
  title: string;
  subtitle: string;
  intro: string;
  variants: ClauseVariant[];
};

export const CLAUSES: ClauseContent[] = [
  {
    id: 'names',
    order: 1,
    turn: 2,
    title: '名字与边界',
    subtitle: '我们是谁，不做什么',
    intro: '旧公约背面还有空白。第一行要写清楚：这里不是卖药的地方，也不是道德审判庭。',
    variants: [
      {
        id: 'circle',
        label: '药圈',
        summary: '承认旧称呼，把边界写在门口',
        line: '「药圈」被保留下来，但后面加了一行：不代购，不介绍渠道，不替任何人担保。',
        effect: { exposure: 4, chaos: -1, relation: { left: 1 }, move: [{ from: 'mass', to: 'harm', n: 2 }, { from: 'mass', to: 'left', n: 1 }] },
      },
      {
        id: 'network',
        label: '互助网络',
        summary: '不叫圈，叫一张能求助的网',
        line: '名字变轻了。有人觉得这像在躲，有人第一次愿意把家属群转进来。',
        effect: { trust: 3, exposure: 2, move: [{ from: 'mass', to: 'harm', n: 1 }, { from: 'mass', to: 'left', n: 1 }] },
      },
      {
        id: 'old',
        label: '老地方',
        summary: '保留旧名字，换掉旧规矩',
        line: '旧名字让老人愿意回来，也让新来的人先站在门口看了一会儿。',
        effect: { chaos: 1, relation: { left: -1 }, move: [{ from: 'mass', to: 'harm', n: 1 }, { from: 'mass', to: 'right', n: 1 }] },
      },
    ],
  },
  {
    id: 'knowledge',
    order: 2,
    turn: 6,
    title: '知识如何流通',
    subtitle: '公开、分级，还是门禁',
    intro: '四月二十日之后，知识成了争议本身。你要决定，哪些东西可以放在桌面上。',
    variants: [
      {
        id: 'open',
        label: '全公开',
        summary: '不设门，接受被误读的风险',
        line: '全公开。有人骂你们教人用药，也有人在凌晨三点第一次找到能看懂的解释。',
        effect: { exposure: 6, chaos: -2, relation: { left: 1 }, move: [{ from: 'mass', to: 'harm', n: 3 }, { from: 'mass', to: 'left', n: 1 }] },
      },
      {
        id: 'tiered',
        label: '分级公开',
        summary: '急救信息开放，操作细节留在小桌',
        line: '分级公开。你们把「怎么活下来」放在门口，把「怎么用」留在需要的人手里。',
        effect: { trust: 2, exposure: 3, move: [{ from: 'mass', to: 'harm', n: 2 }, { from: 'mass', to: 'left', n: 1 }] },
      },
      {
        id: 'closed',
        label: '只在圈内',
        summary: '先保住桌子，再谈开放',
        line: '只在圈内。桌子保住了，门口的人少了一些，里面的人也开始互相怀疑。',
        effect: { exposure: -2, chaos: 1, relation: { left: -1 } },
      },
    ],
  },
  {
    id: 'overdose',
    order: 3,
    turn: 5,
    title: '遇到过量怎么办',
    subtitle: '急救不是立场',
    intro: '急救站愿意开一条转介线，但要求你们先写清楚：出事时，谁先做什么。',
    variants: [
      {
        id: 'ambulance',
        label: '先叫救护车',
        summary: '把人交出去，也把责任接回来',
        line: '先叫救护车。有人担心暴露，有人担心警察；最后写下来的只有一句：人先活着。',
        effect: { trust: 5, chaos: -5, exposure: 2, move: [{ from: 'mass', to: 'harm', n: 2 }], flags: ['first-aid'] },
      },
      {
        id: 'friend',
        label: '先找熟人',
        summary: '相信圈内经验，慢一点但更隐蔽',
        line: '先找熟人。电话打通了，车没有来。第二天没有人提起这件事。',
        effect: { trust: -2, chaos: 1, exposure: -1, move: [{ from: 'mass', to: 'harm', n: 1 }] },
      },
      {
        id: 'self',
        label: '先自保',
        summary: '不留记录，不把自己搭进去',
        line: '先自保。你们把急救包收进柜子，也把门口的一块牌子摘了下来。',
        effect: { trust: -5, chaos: 2 },
      },
    ],
  },
  {
    id: 'representation',
    order: 4,
    turn: 7,
    title: '谁代表我们',
    subtitle: '后藤之外，还有谁',
    intro: '四把有票权的椅子要定下来，第五把暂时空着。你不能既是召集人，又是唯一能签字的人。',
    variants: [
      {
        id: 'election',
        label: '选举',
        summary: '把主持权交出去，接受被换掉',
        line: '选举。有人提名你，也有人提名一个只来过三次会的值班人。票数很接近。',
        effect: { trust: 5, chaos: -2, relation: { left: 1 }, move: [{ from: 'mass', to: 'harm', n: 1 }, { from: 'mass', to: 'left', n: 1 }] },
      },
      {
        id: 'rotation',
        label: '轮值',
        summary: '每个人坐一次主位，没有人永久拥有它',
        line: '轮值。第一次轮到一个不擅长说话的人，会议开得很慢，但没有人提前走。',
        effect: { trust: 3, chaos: -1, move: [{ from: 'mass', to: 'harm', n: 1 }] },
      },
      {
        id: 'elder',
        label: '老人指定',
        summary: '用旧威望换稳定，也把门重新关上',
        line: '老人指定。桌子很快安静下来，安静得像两年前。',
        effect: { chaos: 1, relation: { left: -1 }, move: [{ from: 'mass', to: 'right', n: 1 }] },
      },
    ],
  },
];

export const CLAUSE_BY_ID: Record<ClauseId, ClauseContent> = Object.fromEntries(
  CLAUSES.map((clause) => [clause.id, clause]),
) as Record<ClauseId, ClauseContent>;

export const ENDINGS: Record<
  EndingId,
  { title: string; kicker: string; body: string[]; final: string; tone: string }
> = {
  'new-circle': {
    title: '新药圈',
    kicker: '成立 / 不是所有人的胜利',
    body: [
      '成立会在社区活动室开了。四把有票权的椅子都签了字，第五把还空着。',
      '手册通过三条，第四条还在改。自由左的席位卡上写着鼠尾草的名字，旁边没有「代理」。',
      '你没有坐主位。轮值的人念完前言，把笔递给你；你签在见证人那一栏，字有点歪。',
      '名单终究会来。但这一次，名单落下时，已经有一张桌子接得住。',
    ],
    final: '团结不是同意，是同意继续谈。',
    tone: 'green',
  },
  clinic: {
    title: '急救站',
    kicker: '胜利 / 门比原来窄一点',
    body: [
      '比例过了七十。成立会开成了，但自由左的席位一直空着，或者坐着的人不肯签字。',
      '急救站的转介线救了几个人。手册只有两条，急救条款写得最清楚；其他的还在改。',
      '你们赢了数字，没有赢回那张桌子。有人说这已经够了；你没有反驳。',
      '至少下一次有人倒下时，电话会响。',
    ],
    final: '先让门开着。哪怕只开一条缝。',
    tone: 'blue',
  },
  'old-circle': {
    title: '旧药圈',
    kicker: '胜利 / 一个更小的圈',
    body: [
      '比例过了七十。群众很多，活跃格很少；地图看起来像一张被虫蛀过的纸。',
      '自由左和自由右都没有签字。手册通过了，但签字栏只有减害的两席。',
      '你们清掉了噪音，保住了桌子。桌子比以前干净，也比以前小。',
      '旧药圈没有消失。它只是换了一个更安静的房间。',
    ],
    final: '赢了比例，没赢回药圈。',
    tone: 'red',
  },
  ebb: {
    title: '退潮',
    kicker: '失败 / 减害低于 10%',
    body: [
      '减害的格子一格一格灭下去。答疑桌还在，但没有人再把它当成一张桌子。',
      '名单公布那天，群里没有人说话。你翻了很久，才找到一条没有撤回的消息。',
      '你没有把谁救回来。你也没有把谁推出去。你只是看着水退下去。',
    ],
    final: '有些人不是被赶走的，是等不到人。',
    tone: 'blue',
  },
  chaos: {
    title: '失控',
    kicker: '失败 / 混乱 ≥ 80',
    body: [
      '会开到一半，两个人站起来互骂。有人摔了杯子，有人把手册撕成两半。',
      '你试图让所有人回到座位上。没有人听。',
      '第二天，群解散了。你收到最后一条私信：「别再找我了。」',
    ],
    final: '桌子不是被掀翻的，是没有人再愿意坐下。',
    tone: 'red',
  },
  market: {
    title: '集市',
    kicker: '未成立 / 自由左与自由右占多数',
    body: [
      '五月三十一日过去了。没有成立会，只有几个群在转发同一份名单。',
      '自由左和自由右的格子加起来超过一半。大家都很热闹，但没有人愿意签一份共同的手册。',
      '你还在回私信。桌子还在。只是它不再是一张能开会的桌子。',
    ],
    final: '集市很吵。吵到没有人听见另一个人在求救。',
    tone: 'yellow',
  },
  'long-night': {
    title: '长夜',
    kicker: '未成立 / 没有赢家',
    body: [
      '五月三十一日，活动室的门没有开。钥匙还在你口袋里。',
      '手册停在第三条，签字栏空着。名单的传闻越来越具体，群里越来越安静。',
      '你把旧公约和空白签到表放回文件袋。两年前没有写完的东西，还是没有写完。',
    ],
    final: '长夜不是一瞬间来的。是一盏灯一盏灯灭掉。',
    tone: 'paper',
  },
};

export const ENDING_ORDER: EndingId[] = [
  'new-circle',
  'clinic',
  'old-circle',
  'ebb',
  'chaos',
  'market',
  'long-night',
];

export function replyOptions(visitor: Visitor): ReplyOption[] {
  return visitor.options;
}
