import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/store';
import { useSessionStore } from '../../game/sessionStore';
import { gateAudio } from '../../audio/gateAudio';
import g from './gates.module.css';

const TICKS = 143;
const TICK_MS = 70;
const PAGE_TICK = 84;
const REVEAL_START = 88;
const REVEAL_STEP = 6;
const STAMP_TICK = 124;
const DRUG_START = 132;
const EXIT_TICK = 138;

const LOGO = [
  '0111001111001000001',
  '1000101000101000001',
  '1000101000101001001',
  '1000101000101010101',
  '0111001111001100011',
];

const CODE = `const res = await fetch(
  '/odw/index.json'
)
const data = await res.json()
const open = data.reports
  .filter(r => r.open)
open.forEach(render)
console.log(open.length)`;

const CONSOLE_LINES = [
  '> GET /index.json 200',
  '> 60 scenes indexed',
  '> 17 cues ready',
  '> ready in 1.28s',
];

const TERM_LINES = [
  'ODW BIOS v1.00',
  'CPU 486DX2-66 ... OK',
  'MEMORY CHECK ... 640K OK',
  'FONT ROM 8/10/12 ... OK',
  'MOUNT /odw/archive/ ... OK',
  'MOUNT /odw/reports/ ... OK',
  'INDEX 60 SCENES ... OK',
  'AUDIO 17 CUES ... OK',
  'AUTH MODULE ... STANDBY',
];

const ADDRESS = 'http://odw.local/treaty/od';

const CASCADE = [
  { name: '007.rp', open: 92, close: 108 },
  { name: '049.rp', open: 95, close: 106 },
  { name: '050.rp', open: 98, close: 104 },
  { name: 'index.db', open: 100, close: 105 },
];

const TREATY = [
  '不向普通民众及非原始 OD 受众传递 OD 思想和 OD 信息。',
  '以圈子自我控制解决 OD 事态；减害知识只在圈内分享。',
  '保护路人免受 OD 信息诱导，保护圈子免受铁拳注意。',
  '不把不扩散异化为保护药物滥用的工具。',
  '不以不扩散之名堵住减害与劝退。',
  '记住它曾挡下传播，也曾在异化后伤到想退出的人。',
];

const DRUGS = [
  { name: '右美沙芬', tags: ['解离剂', '镇咳药'], desc: '止咳药；高剂量下解离，档案里反复出现。' },
  { name: '金刚烷胺', tags: ['抗病毒药', '谵妄剂'], desc: '抗病毒与抗帕金森药；过量时谵妄、幻觉。' },
  { name: '美金刚', tags: ['解离剂', '抗痴呆药'], desc: 'NMDA 拮抗剂；被误用作解离。' },
  { name: '普瑞巴林', tags: ['镇静剂', '抗癫痫药', '抗焦虑药'], desc: '抗癫痫与抗焦虑；断药反应强烈。' },
  { name: '奈福泮', tags: ['镇痛药', '抗胆碱能剂'], desc: '非阿片镇痛药，带抗胆碱能副作用。' },
  { name: '阿普唑仑', tags: ['苯二氮卓类药品', '镇静剂', '催眠剂'], desc: '短效苯二氮卓，抗焦虑与镇静。' },
  { name: '氯硝西泮', tags: ['苯二氮卓类药品', '镇静剂', '抗癫痫药'], desc: '长效苯二氮卓，抗癫痫与镇静。' },
  { name: '唑吡坦', tags: ['催眠剂', '迷幻剂', '梦境增强剂'], desc: '催眠药；梦境增强与梦游报告常见。' },
  { name: '氟西汀', tags: ['选择性血清素再摄取抑制剂', '抗抑郁药'], desc: '五朵金花之一。' },
  { name: '舍曲林', tags: ['选择性血清素再摄取抑制剂', '抗抑郁药'], desc: '五朵金花之一。' },
  { name: '帕罗西汀', tags: ['选择性血清素再摄取抑制剂', '抗抑郁药'], desc: '五朵金花之一；停药反应明显。' },
  { name: '氟伏沙明', tags: ['选择性血清素再摄取抑制剂', '抗抑郁药'], desc: '五朵金花之一。' },
  { name: '西酞普兰', tags: ['选择性血清素再摄取抑制剂', '抗抑郁药'], desc: '五朵金花之一。' },
  { name: '文拉法辛', tags: ['血清素去甲肾上腺素再摄取抑制剂', '抗抑郁药'], desc: 'SNRI；停药反应明显。' },
  { name: '度洛西汀', tags: ['血清素去甲肾上腺素再摄取抑制剂', '抗抑郁药', '镇痛药'], desc: 'SNRI，也用于神经痛。' },
  { name: '安非他酮', tags: ['去甲肾上腺素多巴胺再摄取抑制剂', '抗抑郁药', '兴奋剂'], desc: 'NDRI 抗抑郁药，带兴奋作用。' },
  { name: '喹硫平', tags: ['非典型抗精神病药', '镇静剂', '抗胆碱能剂'], desc: '非典型抗精神病药；低剂量常用于睡眠。' },
  { name: '哌甲酯', tags: ['兴奋剂', '注意力缺陷治疗药'], desc: '兴奋剂，用于注意力缺陷。' },
  { name: '二氢可待因', tags: ['阿片类药品', '镇痛药', '镇咳药'], desc: '弱阿片类镇痛与镇咳药。' },
  { name: '艾司氯胺酮', tags: ['解离剂', '迷幻剂', '抗抑郁药'], desc: '解离剂；近年用于难治性抑郁。' },
  { name: '乙醇', tags: ['镇静剂', '催眠剂'], desc: '最常见的镇静剂；戒断反应危险。' },
  { name: '尼古丁', tags: ['兴奋剂', '烟草制品成分'], desc: '兴奋剂；成瘾性极强。' },
  { name: '槟榔碱', tags: ['兴奋剂', '植物成分'], desc: '槟榔中的兴奋性生物碱。' },
  { name: '咖啡因', tags: ['兴奋剂', '黄嘌呤类'], desc: '最常用的兴奋剂；耐受与戒断常见。' },
  { name: '苏糖酸镁', tags: ['抗解离剂', '镁补充剂'], desc: '左苏；OD 圈里被当作反解离与恢复术的一部分。' },
];

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const DRUG_WINDOWS = (() => {
  const random = seeded(0x0d0d2026);
  const cells = Array.from({ length: 25 }, (_, index) => ({
    col: index % 5,
    row: Math.floor(index / 5),
  }));
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [cells[index], cells[swap]] = [cells[swap], cells[index]];
  }
  const shuffled = [...DRUGS];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled.map((drug, index) => {
    const cell = cells[index];
    return {
      ...drug,
      left: cell.col * 74 - 2 + Math.floor(random() * 12) - 6,
      top: cell.row * 44 - 2 + Math.floor(random() * 10) - 5,
      width: 88 + Math.floor(random() * 16),
      z: 20 + index,
    };
  });
})();

function LogoMark() {
  return (
    <div className={g.logo} aria-hidden="true">
      {LOGO.map((row, y) => (
        <div className={g.logoRow} key={y}>
          {Array.from(row, (cell, x) => (
            <i key={x} data-on={cell === '1'} />
          ))}
        </div>
      ))}
    </div>
  );
}

function useReduceMotion() {
  const setting = useGameStore((state) => state.save.settings.motion);
  const [system, setSystem] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystem(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return setting === 'reduce' || system;
}

export function BootScreen() {
  const reduce = useReduceMotion();
  const patch = useSessionStore((state) => state.patch);
  const finished = useRef(false);
  const termLogRef = useRef<HTMLDivElement>(null);
  const lastLogHeight = useRef(0);
  const lastTick = useRef(0);
  const lastMeter = useRef(0);
  const [tick, setTick] = useState(reduce ? TICKS : 0);
  const [armed, setArmed] = useState(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    patch({ booted: true });
  }, [patch]);

  const start = useCallback(() => {
    if (armed) return;
    gateAudio.unlock();
    setArmed(true);
  }, [armed]);

  useEffect(() => {
    if (reduce) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      start();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reduce, start]);

  useEffect(() => {
    if (reduce || !armed) return;
    const timer = window.setInterval(() => {
      setTick((value) => {
        if (value + 1 >= TICKS) {
          window.clearInterval(timer);
          finish();
          return TICKS;
        }
        return value + 1;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [armed, finish, reduce]);

  useEffect(() => {
    const log = termLogRef.current;
    if (!log) return;
    const delta = log.scrollHeight - lastLogHeight.current;
    lastLogHeight.current = log.scrollHeight;
    if (delta <= 0) return;
    const max = Math.max(0, log.scrollHeight - log.clientHeight);
    log.scrollTop = Math.min(log.scrollTop + delta, max);
  }, [tick]);

  useEffect(() => {
    gateAudio.unlock();
  }, []);

  useEffect(() => {
    if (tick === lastTick.current) return;
    lastTick.current = tick;
    if (!gateAudio.unlocked) return;
    if (tick >= 5 && tick < 30 && (tick - 5) % 3 === 0) gateAudio.data();
    if (tick >= 24 && tick < 64 && tick % 2 === 0) gateAudio.key();
    if (tick === 24 || tick === 50) gateAudio.open();
    if (tick >= 50 && tick < 58 && (tick - 50) % 2 === 0) gateAudio.tick();
    if (tick >= 32 && tick < 80 && tick % 8 === 0) gateAudio.tick();
    if (tick === 92 || tick === 95 || tick === 98 || tick === 100) gateAudio.open();
    if (tick === 108 || tick === 106 || tick === 104 || tick === 105) gateAudio.close();
    if (tick === STAMP_TICK) gateAudio.stamp();
    if (tick >= DRUG_START && tick < TICKS - 2) gateAudio.drug();
    if (tick === 80 || tick === EXIT_TICK) gateAudio.glitch();
  }, [tick]);

  const page = !reduce && tick >= PAGE_TICK;
  const typed = 'LOADING ARCHIVE ...'.slice(0, Math.max(0, Math.min(19, (tick - 30) * 2)));
  const spinner = '|/-\\'[Math.floor(tick / 2) % 4];
  const loadPct = reduce ? 100 : Math.min(100, Math.max(0, Math.round((tick - 28) * 5)));
  const meterOn = Math.round((loadPct / 100) * 12);

  useEffect(() => {
    if (meterOn <= lastMeter.current) return;
    lastMeter.current = meterOn;
    if (gateAudio.unlocked) gateAudio.progress(meterOn);
  }, [meterOn]);
  const code = CODE.slice(0, Math.max(0, (tick - 24) * 8));
  const address = ADDRESS.slice(0, Math.max(0, Math.min(ADDRESS.length, (tick - 87) * 2)));
  const progress = reduce
    ? 8
    : Math.min(8, Math.floor(Math.max(0, tick - REVEAL_START) / 4.5));
  const exit = !reduce && tick >= EXIT_TICK;
  const glitch = !reduce && ((tick >= 80 && tick <= 83) || exit);
  const stamp = tick >= STAMP_TICK;
  const drugCount = Math.min(
    DRUG_WINDOWS.length,
    Math.max(0, (tick - DRUG_START) * 4),
  );
  const reveal = (index: number) => {
    const from = REVEAL_START + index * REVEAL_STEP;
    return Math.min(1, Math.max(0, (tick - from) / REVEAL_STEP));
  };
  const status =
    tick < 12
      ? '正在接通…'
      : tick < 30
        ? '正在解析 HTML…'
        : tick < 46
          ? '正在载入字体…'
          : tick < 64
            ? '正在挂载档案…'
            : tick < REVEAL_START
              ? '正在校验…'
              : tick < STAMP_TICK
                ? '正在解封条约…'
                : tick < DRUG_START
                  ? '正在盖章…'
                  : '即将进入…';

  if (reduce) {
    return (
      <div className={g.boot} data-reduce="true" data-testid="boot">
        <div className={g.termStatic}>
          <LogoMark />
          <p className={g.staticLine}>ODW · 过度剂量维基</p>
          <p className={g.staticLine}>档案已就绪</p>
        </div>
        <button type="button" className={g.skip} onClick={finish}>
          进入
        </button>
        <p className="sr-only" aria-live="polite">
          载入完成
        </p>
      </div>
    );
  }

  return (
    <div className={g.boot} data-glitch={glitch} data-exit={exit} data-testid="boot">
      <div className={g.bootScan} aria-hidden="true" />
      {!page ? (
        <div
          className={g.term}
          onClick={armed ? undefined : start}
          data-armed={armed}
        >
          <div className={g.termBar}>
            <span>ODW BIOS</span>
            <span>COM1 · 9600</span>
          </div>
          <div className={g.termBody}>
            <div className={g.termLeft}>
              <LogoMark />
              <div className={g.termLog} ref={termLogRef}>
              {!armed && (
                <p className={g.termLine} data-on="true">
                  ODW BIOS v1.00
                </p>
              )}
              {TERM_LINES.map((line, index) => (
                <p key={line} className={g.termLine} data-on={tick >= 5 + index * 3}>
                  {line}
                </p>
              ))}
              <div className={g.termTree}>
                <p className={g.termLine} data-on={tick >= 18}>
                  /odw
                </p>
                <p className={g.termLine} data-on={tick >= 20}>
                  ├─ archive/
                </p>
                <p className={g.termLine} data-on={tick >= 22}>
                  ├─ reports/
                </p>
                <p className={g.termLine} data-on={tick >= 23}>
                  │  ├─ 007.rp
                </p>
                <p className={g.termLine} data-on={tick >= 24}>
                  │  ├─ 049.rp
                </p>
                <p className={g.termLine} data-on={tick >= 25}>
                  │  └─ 050.rp
                </p>
                <p className={g.termLine} data-on={tick >= 27}>
                  └─ index.db
                </p>
              </div>
              </div>
              <div className={g.termFoot}>
                {!armed && (
                  <p className={g.enterPrompt} data-testid="boot-prompt">
                    PRESS ENTER TO CONTINUE
                    <span className={g.cursor} aria-hidden="true">
                      █
                    </span>
                  </p>
                )}
                <p className={g.termMeterLine} data-on={tick >= 28}>
                  <span>DISK</span>
                  <span className={g.termMeter} aria-hidden="true">
                    {Array.from({ length: 12 }, (_, index) => (
                      <i key={index} data-on={index < meterOn} />
                    ))}
                  </span>
                  <span>{String(loadPct).padStart(3, ' ')}%</span>
                </p>
                <p className={g.termLine} data-on={tick >= 30}>
                  {typed}
                  <span className={g.loader} aria-hidden="true">
                    {spinner}
                  </span>
                  <span className={g.cursor} aria-hidden="true">
                    █
                  </span>
                </p>
              </div>
            </div>
            <div className={g.termSide} aria-hidden="true">
              {tick >= 24 && (
                <div className={g.codeWindow} data-close={tick >= 70}>
                  <div className={g.sideTitle}>
                    <span>main.js</span>
                    <span>×</span>
                  </div>
                  <pre className={g.codeBody}>{code}</pre>
                </div>
              )}
              {tick >= 50 && (
                <div className={g.logWindow} data-close={tick >= 70}>
                  <div className={g.sideTitle}>
                    <span>console</span>
                    <span>×</span>
                  </div>
                  <div className={g.logBody}>
                    {CONSOLE_LINES.map((line, index) => (
                      <p key={line} data-on={tick >= 50 + index * 2}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={g.browser} data-stamp={stamp}>
          <div className={g.browserBar}>
            <span className={g.browserTitle}>OD 不扩散公约.txt</span>
            <span className={g.browserDots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className={g.addressBar}>
            <span className={g.addressLabel}>档案</span>
            <span className={g.addressText}>{address}</span>
          </div>
          <div className={g.treatyPage}>
            <div className={g.treatyHead}>
              <span className={g.treatyTitle}>OD 不扩散公约</span>
              <span className={g.treatyMeta}>社群重构 · 2024-01 · 仅限档案</span>
            </div>
            <ol className={g.treatyList}>
              {TREATY.map((line, index) => (
                <li key={line} className={g.treatyItem}>
                  <span className={g.treatyIndex}>{index + 1}.</span>
                  <span className={g.treatyText}>{line}</span>
                  <span
                    className={g.redaction}
                    style={{ width: `${(1 - reveal(index)) * 100}%` }}
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ol>
            <div className={g.treatyFoot}>
              <div className={g.progress} aria-hidden="true">
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={index}
                    className={g.progressSeg}
                    data-on={progress > index}
                  />
                ))}
              </div>
              <span className={g.status} aria-live="polite">
                {status}
              </span>
            </div>
            {stamp && (
              <div className={g.treatyStamp} aria-hidden="true">
                <span>已归档</span>
                <span>ODW · 2026</span>
              </div>
            )}
          </div>
          <div className={g.cascade} aria-hidden="true">
            {CASCADE.map((win) => {
              if (tick < win.open) return null;
              const pct = Math.min(100, Math.max(0, (tick - win.open) * 8));
              const cells = Math.round(pct / 10);
              return (
                <div
                  key={win.name}
                  className={g.cascadeWindow}
                  data-close={tick >= win.close}
                >
                  <div className={g.cascadeTitle}>
                    <span>{win.name}</span>
                    <span>×</span>
                  </div>
                  <div className={g.cascadeBody}>
                    <div className={g.cascadeName}>载入 {win.name}</div>
                    <div className={g.cascadeTrack}>
                      {Array.from({ length: 10 }, (_, cell) => (
                        <i key={cell} data-on={cell < cells} />
                      ))}
                    </div>
                    <div className={g.cascadePct}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={g.drugs} aria-hidden="true">
            {DRUG_WINDOWS.slice(0, drugCount).map((win) => (
              <div
                key={win.name}
                className={g.drugWindow}
                style={{
                  left: `calc(${win.left} * var(--u))`,
                  top: `calc(${win.top} * var(--u))`,
                  width: `calc(${win.width} * var(--u))`,
                  zIndex: win.z,
                }}
              >
                <div className={g.drugTitle}>
                  <span>{win.name}</span>
                  <span>×</span>
                </div>
                <div className={g.drugTags}>{win.tags.join(' / ')}</div>
                <div className={g.drugDesc}>{win.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}