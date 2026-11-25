import { use, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SAMPLE_SCENE } from '../content/sample';
import {
  chapterPromise,
  getReportMeta,
  getSceneMeta,
  hasContent,
  segmentForScene,
  segmentsForScene,
} from '../content/registry';
import type { Beat, Chapter, ChoiceOption, Scene } from '../content/types';
import { resolveSceneCue } from '../audio/cues';
import { gateAudio } from '../audio/gateAudio';
import { beatFx, FX, FX_FILTER, FX_OVERLAY, LAYER_ANIM, SCENE_ANIM } from '../ui/fx';
import { useSuppressGuide } from '../ui/guideState';
import { useCue } from '../audio/useCue';
import { audio } from '../audio/AudioManager';
import { ChapterOpening } from '../openings/ChapterOpening';
import { makeHistory } from '../game/persistence';
import { CHAPTER_INTROS } from '../game/intros';
import { CANVAS_OPENINGS } from '../openings/registry';
import { CHAPTER_REPORT } from '../game/routing';
import { isSceneUnlocked } from '../game/unlocks';
import { useGameStore } from '../game/store';
import { warTableOf } from '../game/warTable';
import { getAnalysisCase } from '../content/analysis';
import { getMiniGame } from '../content/minigames';
import { AnalysisStage } from '../analysis/AnalysisStage';
import { MiniGameStage } from '../minigames/MiniGameStage';
import { CivilWarEvent } from '../components/CivilWarEvent';
import { EN_NAMES, localizeName } from '../content/en/names';
import { getLocale, useT, type MessageKey } from '../i18n';
import { PlaceholderPage } from './PlaceholderPage';
import p from './pages.module.css';

const BG_LABEL: Record<string, string> = {
  bg_archive: '档案室',
  bg_river_night: '江边夜',
  bg_goto_room: '后藤房间',
  bg_river_day: '江边 / 下午',
  bg_caijia_room: '彩加房间',
  bg_higan_home: '彼岸境房间',
  bg_dlc_classroom: 'DLC 教室',
  bg_residential_path: '住宅街',
  bg_beijing: '北京街头',
  bg_dlc_summer_street: '江边冰粉摊',
  bg_dlc_night_market: '夜市',
  bg_dlc_school_gate: '校门',
  bg_dlc_convenience: '便利店门口',
  bg_dlc_chunfeng_room: '春风的房间',
  bg_dlc_noodle_shop: '老友粉店',
  bg_summer_street: '夏季街道',
  bg_wheat_dusk: '麦田 / 黄昏',
  bg_rooftop_dusk: '楼顶 / 黄昏',
  bg_plateau: '第五高原',
  bg_tunnel: '隧道 / 夜',
  bg_hospital_ward: '病房',
  bg_night_street: '夜街 / 警车',
  bg_spring_festival: '春节 / 余晖',
  bg_civil_war_room: '内战 / 档案室',
  bg_rumor_fracture: '伪藤 / 传播墙',
  bg_testimony_fracture: '罗生门 / 三支麦克风',
  bg_doc_fracture: '公开文档 / 涂黑',
  bg_knowledge_fracture: '知识论 / 双面书架',
};

const BG_LABEL_EN: Record<string, string> = {
  bg_archive: 'Archive Room',
  bg_river_night: 'River at night',
  bg_goto_room: "Gotō's room",
  bg_river_day: 'Riverside / afternoon',
  bg_caijia_room: "Ayaka's room",
  bg_higan_home: "Jing's room",
  bg_dlc_classroom: 'DLC classroom',
  bg_residential_path: 'Residential street',
  bg_beijing: 'A street in Beijing',
  bg_dlc_summer_street: 'Ice-jelly stall by the river',
  bg_dlc_night_market: 'Night market',
  bg_dlc_school_gate: 'School gate',
  bg_dlc_convenience: 'Outside the convenience store',
  bg_dlc_chunfeng_room: "Chunfeng's room",
  bg_dlc_noodle_shop: 'Old Friends noodle shop',
  bg_summer_street: 'Summer street',
  bg_wheat_dusk: 'Wheat field / dusk',
  bg_rooftop_dusk: 'Rooftop / dusk',
  bg_plateau: 'The Fifth Plateau',
  bg_tunnel: 'Tunnel / night',
  bg_hospital_ward: 'Hospital ward',
  bg_night_street: 'Night street / police car',
  bg_spring_festival: 'Spring Festival / afterglow',
  bg_civil_war_room: 'Civil war / archive room',
  bg_rumor_fracture: 'Fake Gotō / the wall of spread',
  bg_testimony_fracture: 'Rashomon / three microphones',
  bg_doc_fracture: 'Public doc / blacked out',
  bg_knowledge_fracture: 'Epistemology / two-sided shelf',
};

function bgLabel(id: string): string {
  const table = getLocale() === 'en' ? BG_LABEL_EN : BG_LABEL;
  return table[id] ?? (getLocale() === 'en' ? 'Scene' : '场景');
}

const BG_ASSET: Record<string, string> = {
  bg_summer_street: 'bg_dlc_summer_street',
};

const PROP_BY_SPEAKER: Record<string, string> = {
  后藤: 'goto',
  彩加: 'caijia',
  桜崎彩加: 'caijia',
  彼岸境: 'higan',
  春风: 'harukaze',
  Spring风: 'harukaze',
};

const CAT_STATES: Record<string, string> = {
  smile: 'smile',
  calm: 'smile',
  tired: 'sleepy',
  intense: 'hype',
  blank: 'blank',
};

// 后藤与彼岸境各有成套表情图，文件名后缀就是状态名。
const GOTO_STATES: Record<string, string> = {
  calm: 'calm',
  tired: 'tired',
  intense: 'intense',
  smile: 'smile',
  blank: 'blank',
};
const HIGAN_STATES: Record<string, string> = {
  calm: 'calm',
  tired: 'tired',
  intense: 'intense',
  smile: 'smile',
  blank: 'blank',
  fade: 'fade',
};
// 春风星头无脸，情绪靠星头颜色/光晕/体态。已出 calm/smile/intense 三态，
// 其余表情暂回退到现有差分，避免缺图；后续扩展时补文件并加映射。
const HARUKAZE_STATES: Record<string, string> = {
  calm: 'calm',
  smile: 'smile',
  intense: 'intense',
  restless: 'intense',
  tired: 'calm',
  blank: 'calm',
  fade: 'calm',
};
const PROP_BY_EN_NAME: Record<string, string> = {};
for (const [zh, prop] of Object.entries(PROP_BY_SPEAKER)) {
  const en = EN_NAMES[zh];
  if (en) PROP_BY_EN_NAME[en] = prop;
}

function propFor(speaker: string | undefined): string | undefined {
  if (!speaker) return undefined;
  return PROP_BY_SPEAKER[speaker] ?? PROP_BY_EN_NAME[speaker];
}

const MULTI_STATE_PROPS = new Set(['caijia', 'goto', 'higan', 'harukaze']);

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

const assetCache = new Map<string, HTMLImageElement>();

function loadAsset(path: string) {
  const cached = assetCache.get(path);
  if (cached) return cached;
  const image = new Image();
  image.decoding = 'async';
  image.src = path;
  assetCache.set(path, image);
  return image;
}

function sceneTransition(id: string): 'fade' | 'slide' | 'glitch' {
  if (['ch02.s01', 'ch03.s01', 'ch04.s01', 'dlc.s01'].includes(id)) return 'slide';
  if (['ch02.s17', 'ch03.s17', 'ch04.s37', 'dlc.s06'].includes(id)) return 'glitch';
  return 'fade';
}

function propMood(id: string, expr?: string) {
  if (id === 'caijia') return CAT_STATES[expr ?? 'smile'] ?? 'smile';
  if (id === 'goto') return GOTO_STATES[expr ?? 'calm'] ?? 'calm';
  if (id === 'higan') return HIGAN_STATES[expr ?? 'calm'] ?? 'calm';
  if (id === 'harukaze') return HARUKAZE_STATES[expr ?? 'calm'] ?? 'calm';
  return 'calm';
}

function propPath(id: string, mood: string) {
  return MULTI_STATE_PROPS.has(id)
    ? `assets/props/prop_${id}_${mood}.png`
    : `assets/props/prop_${id}.png`;
}

const FALLBACK_SCENE: Scene = {
  id: 'ch01.s05',
  chapterId: 'ch01',
  order: 5,
  title: '余晖',
  summary: '感觉 suicide 好没有意义。突然就不想死了，想好好活着。',
  flags: [],
  sourceRefs: ['report-007#RP-7-12'],
  stage: { bg: 'bg_river_night', bust: { speaker: '后藤', expr: 'calm' } },
  beats: [
    ...SAMPLE_SCENE.lines.map((text) => ({
      type: 'dialogue' as const,
      speaker: '后藤',
      text,
    })),
    {
      type: 'choice',
      id: 'sample.choice',
      options: SAMPLE_SCENE.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
      })),
    },
  ],
};

export function ReplayPage() {
  const tr = useT();
  const { id, seg } = useParams();
  const reportId = id ?? '7';
  const save = useGameStore((state) => state.save);
  const reportMeta = getReportMeta(reportId);
  const segmentMeta = reportMeta?.segments.find(
    (item) => item.id === seg || item.sceneId === seg,
  );
  const sceneMeta = segmentMeta?.sceneId
    ? getSceneMeta(segmentMeta.sceneId)
    : seg
      ? getSceneMeta(seg)
      : undefined;
  const locked = sceneMeta ? !isSceneUnlocked(sceneMeta, save) : false;
  const chapter = use(chapterPromise(locked ? undefined : sceneMeta?.chapterId));
  const scene =
    chapter?.scenes.find((item) => item.id === sceneMeta?.id) ??
    (reportId === '7' && !sceneMeta ? FALLBACK_SCENE : undefined);

  if (locked) {
    return (
      <PlaceholderPage
        title={tr('replay.title', { title: seg ?? '' })}
        kicker={tr('replay.lockedKicker')}
        note={tr('replay.lockedNote')}
      />
    );
  }

  if (!scene) {
    return (
      <PlaceholderPage
        title={tr('replay.title', { title: seg ?? '' })}
        kicker={tr('replay.missingKicker')}
        note={tr('replay.missingNote')}
      />
    );
  }

  const chapterReport =
    scene.reportId ?? CHAPTER_REPORT[scene.chapterId] ?? reportMeta?.id ?? reportId;
  return (
    <ScenePlayer
      scene={scene}
      chapter={chapter}
      reportId={chapterReport}
      segmentId={segmentMeta?.id ?? seg ?? scene.id}
      segmentLabel={segmentMeta?.label ?? scene.title}
    />
  );
}

function ScenePlayer({
  scene,
  chapter,
  reportId,
  segmentId,
  segmentLabel,
}: {
  scene: Scene;
  chapter?: Chapter;
  reportId: string;
  segmentId: string;
  segmentLabel: string;
}) {
  const tr = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const replayIntro = Boolean(
    (location.state as { replayIntro?: boolean } | null)?.replayIntro,
  );
  const save = useGameStore((state) => state.save);
  const setProgress = useGameStore((state) => state.setProgress);
  const markRead = useGameStore((state) => state.markRead);
  const completeScene = useGameStore((state) => state.completeScene);
  const setChoice = useGameStore((state) => state.setChoice);
  const completeAnalysis = useGameStore((state) => state.completeAnalysis);
  const completeMinigame = useGameStore((state) => state.completeMinigame);
  const setWarTable = useGameStore((state) => state.setWarTable);
  const addHistory = useGameStore((state) => state.addHistory);
  const setStatus = useGameStore((state) => state.setStatus);
  const autoRead = useGameStore((state) => state.autoRead);
  const seeIntro = useGameStore((state) => state.seeIntro);
  const setAutoRead = useGameStore((state) => state.setAutoRead);
  const chapterIndex = chapter?.scenes.findIndex((item) => item.id === scene.id) ?? 0;
  const sceneNumber = Number(scene.id.match(/s(\d+)/)?.[1] ?? chapterIndex + 1);
  const total = chapter?.scenes.length ?? 0;
  const progressSegment = segmentForScene(reportId, scene.id)?.id ?? segmentId;
  const sceneCue = resolveSceneCue(scene);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finished = useRef(false);
  const typeTimer = useRef<number | null>(null);
  const intro = CHAPTER_INTROS[scene.chapterId];
  const isChapterStart = chapter?.scenes[0]?.id === scene.id;
  const introReduced =
    save.settings.motion === 'reduce' ||
    (typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [showIntro, setShowIntro] = useState(
    Boolean(
      intro &&
        !introReduced &&
        isChapterStart &&
        (replayIntro || !save.seenIntros.includes(scene.chapterId)),
    ),
  );
  const canvasOpening = showIntro && !introReduced ? CANVAS_OPENINGS[scene.chapterId] : undefined;
  const canvasIntro = Boolean(canvasOpening);
  useSuppressGuide(showIntro);
  useCue(showIntro ? undefined : sceneCue);
  const requestedStartBeat = Number(
    (location.state as { startBeat?: number } | null)?.startBeat,
  );
  const [beatIndex, setBeatIndex] = useState(() =>
    Number.isFinite(requestedStartBeat)
      ? Math.min(Math.max(Math.trunc(requestedStartBeat), 0), Math.max(scene.beats.length - 1, 0))
      : 0,
  );
  const [typed, setTyped] = useState('');
  const [showEnd, setShowEnd] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const beat = scene.beats[beatIndex];
  const beatSpeaker = (beat as { speaker?: string } | undefined)?.speaker;
  const speaker = propFor(beatSpeaker) ? beatSpeaker : scene.stage.bust?.speaker;
  const propId = propFor(speaker);
  const mood = propId ? propMood(propId, scene.stage.bust?.expr) : 'calm';
  const propSrc = propId ? assetUrl(propPath(propId, mood)) : null;
  const iconSrc = propFor(beatSpeaker) ? propSrc : null;
  const bgAsset = BG_ASSET[scene.stage.bg] ?? scene.stage.bg;
  const bgSrc = hasContent() ? assetUrl(`assets-private/bg/${bgAsset}.png`) : null;
  const text = beatText(beat);
  const isText = Boolean(text);
  const reduce =
    save.settings.motion === 'reduce' ||
    (typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const transition = reduce ? 'none' : (scene.transition ?? sceneTransition(scene.id));
  const fxId = showIntro || showEnd ? undefined : beatFx(beat);
  const analysis = beat?.type === 'analysis' ? getAnalysisCase(beat.caseId) : undefined;
  const minigame = beat?.type === 'minigame' ? getMiniGame(beat.id) : undefined;
  const fxSpec = fxId ? FX[fxId] : undefined;
  const fxFilter = !reduce && fxId ? FX_FILTER[fxId] : undefined;
  const fxOverlay = !reduce && fxId ? FX_OVERLAY[fxId] : undefined;
  const emotion = (beat as { emotion?: string } | undefined)?.emotion;
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const fxLayerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    gateAudio.configure({ mute: save.settings.audio.mute, sfx: save.settings.audio.sfx });
  }, [save.settings.audio.mute, save.settings.audio.sfx]);

  useEffect(() => {
    if (scene.id === 'ch04.s03') audio.preloadCue('drug-war');
  }, [scene.id]);

  useEffect(() => {
    if (!fxId || !fxSpec || showIntro) return;
    gateAudio.unlock();
    if (fxSpec.sound) gateAudio[fxSpec.sound]();
    if (reduce) return;
    const sceneAnim = SCENE_ANIM[fxId];
    const layerAnim = LAYER_ANIM[fxId];
    const running: Animation[] = [];
    if (sceneAnim && sceneRef.current) {
      running.push(sceneRef.current.animate(sceneAnim.keyframes, sceneAnim.options));
    }
    if (layerAnim && fxLayerRef.current) {
      running.push(fxLayerRef.current.animate(layerAnim.keyframes, layerAnim.options));
    }
    return () => running.forEach((anim) => anim.cancel());
  }, [beatIndex, fxId, fxSpec, reduce, showIntro]);

  // 情绪化的台词：换色 + 抖动，同时给一记失真低音
  useEffect(() => {
    if (emotion !== 'rage' || showIntro) return;
    gateAudio.unlock();
    gateAudio.rage();
  }, [beatIndex, emotion, showIntro]);

  // 余晖 / 阴暗时，整个维基窗口也跟着呼吸或沉下去
  useEffect(() => {
    const stage = document.querySelector('[data-testid="stage"]');
    if (!stage) return;
    if (!fxId) {
      stage.removeAttribute('data-window-fx');
      return;
    }
    stage.setAttribute('data-window-fx', fxId);
    return () => stage.removeAttribute('data-window-fx');
  }, [fxId]);

  const typing = isText && typed.length < text.length;

  useEffect(() => {
    const requested = Number(
      (location.state as { startBeat?: number } | null)?.startBeat,
    );
    setBeatIndex(
      Number.isFinite(requested)
        ? Math.min(Math.max(Math.trunc(requested), 0), Math.max(scene.beats.length - 1, 0))
        : 0,
    );
    setTyped('');
    setShowEnd(false);
    setChosen(null);
    setRevealing(false);
    setShowIntro(
      Boolean(
        CHAPTER_INTROS[scene.chapterId] &&
          chapter?.scenes[0]?.id === scene.id &&
          !introReduced &&
          (replayIntro ||
            !useGameStore.getState().save.seenIntros.includes(scene.chapterId)),
      ),
    );
    finished.current = false;
  }, [scene.id, replayIntro]);

  useEffect(() => {
    if (!showIntro) return;
    audio.stopBgm();
    if (canvasIntro) return;
    const timer = window.setTimeout(() => closeIntro(), 7000);
    return () => window.clearTimeout(timer);
  }, [showIntro, canvasIntro]);

  function closeIntro(completed = false) {
    if (intro) seeIntro(intro.chapterId);
    if (canvasIntro && completed) setRevealing(true);
    setShowIntro(false);
  }

  useEffect(() => {
    setProgress({
      reportId,
      segmentId: progressSegment,
      sceneId: scene.id,
      beat: beatIndex,
    });
  }, [beatIndex, progressSegment, reportId, scene.id, setProgress]);

  useEffect(() => {
    if (typeTimer.current !== null) {
      window.clearInterval(typeTimer.current);
      typeTimer.current = null;
    }
    if (!isText) {
      setTyped('');
      return;
    }
    if (reduce) {
      setTyped(text);
      return;
    }
    setTyped('');
    let index = 0;
    typeTimer.current = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length && typeTimer.current !== null) {
        window.clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    }, 33);
    return () => {
      if (typeTimer.current !== null) {
        window.clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    };
  }, [isText, reduce, text, beatIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let alive = true;
    const paint = (image: HTMLImageElement | null) => {
      if (alive) drawScene(ctx, scene.stage.bg, image);
    };
    const image = bgSrc ? loadAsset(bgSrc) : null;
    paint(image);
    if (image && !image.complete) {
      const onReady = () => paint(image);
      image.addEventListener('load', onReady, { once: true });
      image.addEventListener('error', onReady, { once: true });
    }
    return () => {
      alive = false;
    };
  }, [scene.id, scene.stage.bg, bgSrc]);

  useEffect(() => {
    if (!autoRead || showEnd || showIntro || !beat) return;
    if (
      beat.type === 'choice' ||
      beat.type === 'battle' ||
      beat.type === 'analysis' ||
      beat.type === 'minigame' ||
      beat.type === 'event'
    )
      return;
    if (typing) return;
    const timer = window.setTimeout(() => advance(), 1500);
    return () => window.clearTimeout(timer);
  }, [autoRead, showEnd, showIntro, beat, beatIndex, typing, typed]);

  useEffect(() => () => setAutoRead(false), [setAutoRead]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (beat?.type === 'analysis' || beat?.type === 'minigame' || beat?.type === 'event') return;
      if (beat?.type === 'choice') {
        const optionIndex = Number(event.key) - 1;
        const option = beat.options[optionIndex];
        if (option) {
          event.preventDefault();
          chooseOption(option);
        }
        return;
      }
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (event.repeat) return;
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function nextBeat() {
    if (beatIndex < scene.beats.length - 1) {
      setBeatIndex((index) => index + 1);
    } else {
      finishScene();
    }
  }

  function advance() {
    if (showIntro) {
      closeIntro();
      return;
    }
    if (!beat || showEnd) return;
    if (
      beat.type === 'choice' ||
      beat.type === 'battle' ||
      beat.type === 'analysis' ||
      beat.type === 'minigame' ||
      beat.type === 'event'
    )
      return;
    if (typing) {
      if (typeTimer.current !== null) {
        window.clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
      setTyped(text);
      return;
    }
    nextBeat();
  }

  function markCurrentScene() {
    if (finished.current) return false;
    finished.current = true;
    completeScene(scene.id);
    for (const item of segmentsForScene(scene.id)) {
      markRead(item.reportId, [item.segment.id]);
    }
    addHistory(
      makeHistory(
        'scene',
        tr('replay.readDone', { title: scene.title }),
        `/report/${reportId}/replay/${segmentId}`,
        scene.id,
      ),
    );
    return true;
  }

  function projectedSave() {
    if (save.completedScenes.includes(scene.id)) return save;
    return { ...save, completedScenes: [...save.completedScenes, scene.id] };
  }

  function returnToReport() {
    setAutoRead(false);
    setStatus(tr('replay.returned'));
    navigate(`/report/${reportId}`);
  }

  function finishScene() {
    if (!markCurrentScene()) return;
    if (scene.next) {
      const target = getSceneMeta(scene.next);
      // 同一章内继续自动播放；跨章一律回报告，不再弹“回首页/回报告”。
      if (target && target.chapterId === scene.chapterId) {
        if (isSceneUnlocked(target, projectedSave())) {
          goToScene(scene.next);
          return;
        }
        setStatus(tr('replay.nextLocked'));
        setAutoRead(false);
        setShowEnd(true);
        return;
      }
    }
    returnToReport();
  }

  function goToScene(sceneId: string) {
    const target = getSceneMeta(sceneId);
    if (!target) {
      setStatus(tr('replay.sceneNotWired', { id: sceneId }));
      setShowEnd(true);
      return;
    }
    const segments = segmentsForScene(sceneId);
    const nextReportId =
      segments[0]?.reportId ?? CHAPTER_REPORT[target.chapterId] ?? reportId;
    const nextSeg = segments[0]?.segment.id ?? sceneId;
    setProgress({
      reportId: nextReportId,
      segmentId: nextSeg,
      sceneId,
      beat: 0,
    });
    navigate(`/report/${nextReportId}/replay/${nextSeg}`);
  }

  function chooseOption(option: ChoiceOption) {
    if (!beat || beat.type !== 'choice') return;
    setChoice(scene.id, option.id);
    setChosen(option.label);
    if (option.note) setStatus(option.note);
    if (option.targetScene) {
      const target = getSceneMeta(option.targetScene);
      // 章节结束的选择直接把玩家送回报告；跨章不自动进入下一章。
      if (target && target.chapterId !== scene.chapterId) {
        markCurrentScene();
        returnToReport();
        return;
      }
      const nextSave = { ...save, completedScenes: save.completedScenes.includes(scene.id) ? save.completedScenes : [...save.completedScenes, scene.id] };
      if (target && !isSceneUnlocked(target, nextSave)) {
        markCurrentScene();
        setStatus(tr('replay.nextLocked'));
        setAutoRead(false);
        setShowEnd(true);
        return;
      }
      markCurrentScene();
      goToScene(option.targetScene);
      return;
    }
    finishScene();
  }

  return (
    <section className={p.replayPage}>
      <h1 className="sr-only">{tr('replay.title', { title: scene.title })}</h1>
      <div className={p.stageTop}>
        <span className={p.fileIcon} aria-hidden="true" />
        <span className={p.stageTopArchive}>
          {tr('replay.archiveLine', { report: reportId, segment: segmentLabel })}
        </span>
        <span className={p.stageTopChapter}>
          {tr('replay.chapterLine', {
            chapterId: scene.chapterId,
            title: chapter?.title ?? scene.title,
            scene: scene.title,
          })}
        </span>
        <span className={p.stageTopRight}>
          <span className={p.muted}>
            {String(sceneNumber).padStart(2, '0')} / {String(total || 12).padStart(2, '0')}
          </span>
          <Link className={p.replayStageLink} to={`/report/${reportId}`}>
            {tr('replay.fullReport')}
          </Link>
        </span>
      </div>

      <div
        className={p.sceneWrap}
        ref={sceneRef}
        onClick={advance}
        data-testid="scene-wrap"
        data-fx={fxId ?? 'none'}
        data-fx-label={fxId && getLocale() === 'en' ? tr(`fx.${fxId}` as MessageKey) : fxSpec?.label}
        style={{ filter: fxFilter ?? 'none' }}
      >
        <canvas
          key={scene.id}
          ref={canvasRef}
          data-testid="scene-canvas"
          className={`${p.sceneCanvas} pixelated`}
          data-transition={transition}
          width={352}
          height={198}
          style={
            bgSrc
              ? {
                  backgroundImage: `url("${bgSrc}")`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }
              : undefined
          }
          role="img"
          aria-label={tr('replay.canvasAria', { bg: bgLabel(scene.stage.bg) })}
        />

        {fxId && !reduce ? (
          <span ref={fxLayerRef} className={p.fxLayer} data-fx={fxId} aria-hidden="true" />
        ) : null}
        <span className={p.fxOverlay} data-type={fxOverlay} aria-hidden="true" />

        {canvasIntro && canvasOpening ? (
          <ChapterOpening opening={canvasOpening} onDone={closeIntro} />
        ) : showIntro && intro ? (
          <div
            className={p.chapterIntro}
            data-testid="chapter-intro"
            onClick={() => closeIntro()}
          >
            <div className={p.chapterIntroCard}>
              <span className={p.chapterEyebrow}>{intro.eyebrow}</span>
              <h2 className={p.chapterTitle}>{intro.title}</h2>
              <p className={p.chapterSubtitle}>{intro.subtitle}</p>
              <ul className={p.chapterLines}>
                {intro.lines.map((line, index) => (
                  <li key={line} style={{ animationDelay: `${0.35 + index * 0.45}s` }}>
                    {line}
                  </li>
                ))}
              </ul>
              <span className={p.chapterBar} aria-hidden="true">
                <i />
              </span>
              <button
                type="button"
                className={p.pixelButton}
                onClick={(event) => {
                  event.stopPropagation();
                  closeIntro();
                }}
              >
                {tr('replay.enterChapter')}
              </button>
            </div>
          </div>
        ) : showEnd ? (
          <div className={p.choicePanel} role="group" aria-label={tr('replay.endGroup')}>
            <p className={p.dialogLine}>{tr('replay.endLine', { title: scene.title })}</p>
            <p className={p.small}>
              {scene.next
                ? tr('replay.nextScene', { id: scene.next })
                : tr('replay.chapterEnd')}
            </p>
            <div className={p.choiceList}>
              <Link className={p.choice} to={`/report/${reportId}`}>
                {tr('replay.backReport')}
              </Link>
              <Link className={p.choice} to="/">
                {tr('replay.backHome')}
              </Link>
            </div>
          </div>
        ) : beat?.type === 'choice' ? (
          <div className={p.choicePanel} role="group" aria-label={tr('replay.choiceGroup')}>
            <p className={p.choicePrompt}>
              {chosen ? tr('replay.chosen', { label: chosen }) : tr('replay.choiceTitle')}
            </p>
            <div className={p.choiceList}>
              {beat.options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  className={p.choice}
                  onClick={(event) => {
                    event.stopPropagation();
                    chooseOption(option);
                  }}
                >
                  {index + 1}. {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : beat?.type === 'analysis' ? (
          <div className={p.choicePanel} role="group" aria-label={tr('replay.analysisGroup')}>
            <p className={p.choicePrompt}>{tr('replay.analysisTitle')}</p>
            <p className={p.small}>{tr('replay.analysisRunning', { id: beat.caseId })}</p>
          </div>
        ) : beat?.type === 'minigame' ? (
          <div className={p.choicePanel} role="group" aria-label={tr('replay.minigameGroup')}>
            <p className={p.choicePrompt}>{tr('replay.minigameTitle')}</p>
            <p className={p.small}>{beat.label ?? tr('replay.minigameHint')}</p>
          </div>
        ) : beat?.type === 'event' ? (
          <div className={p.choicePanel} role="group" aria-label={tr('replay.eventGroup')}>
            <p className={p.choicePrompt}>{tr('replay.eventTitle')}</p>
            <p className={p.small}>{tr('replay.eventBody')}</p>
          </div>
        ) : (
          <div
            className={`${p.dialog} ${fxId === 'glow' ? p.dialogGlow : ''} ${
              fxId === 'gloom' ? p.dialogGloom : ''
            }`}
            data-testid="dialog"
            onClick={(event) => { event.stopPropagation(); advance(); }}
          >
            {beat?.type === 'narration' && !beat.speaker ? (
              <span className={p.narrationTag}>{tr('replay.narration')}</span>
            ) : (
              <span className={p.nameplate}>
                {iconSrc ? (
                  <img className={p.speakerIcon} src={iconSrc} alt="" aria-hidden="true" />
                ) : null}
                {localizeName(
                  beat?.type === 'dialogue'
                    ? beat.speaker
                    : (beat as { speaker?: string })?.speaker,
                ) ?? tr('replay.archive')}
              </span>
            )}
            {beat?.type === 'quote' && beat.source && (
              <div className={p.dialogMeta}>{beat.source}</div>
            )}
            <div
              className={`${p.dialogLine} ${beat?.type === 'quote' ? p.quoteText : ''} ${
                emotion === 'rage' ? p.rageText : ''
              }`}
              data-emotion={emotion}
              data-testid="dialog-line"
            >
              {typed}
            </div>
            <span className="sr-only" aria-live="polite">
              {typing ? '' : text}
            </span>
            <span className={p.nextMark} aria-hidden="true">
              {typing ? '…' : tr('replay.clickContinue')}
            </span>
          </div>
        )}

        {revealing ? (
          <div
            className={p.introReveal}
            data-testid="intro-reveal"
            aria-hidden="true"
            onAnimationEnd={() => setRevealing(false)}
          />
        ) : null}
      </div>

      {beat?.type === 'analysis' && !showIntro && !showEnd ? (
        analysis ? (
          <AnalysisStage
            key={analysis.id}
            data={analysis}
            onExit={() => {
              setStatus(tr('replay.analysisClosed'));
              nextBeat();
            }}
            onDone={() => {
              completeAnalysis(beat.caseId);
              setStatus(tr('replay.analysisDone'));
              nextBeat();
            }}
          />
        ) : (
          <div className={p.choicePanel} role="group" aria-label={tr('replay.analysisGroup')}>
            <p className={p.choicePrompt}>{tr('replay.caseMissing')}</p>
            <p className={p.small}>
              {tr('replay.caseMissingLine', { id: beat.caseId })}
            </p>
            <button type="button" className={p.choice} onClick={nextBeat}>
              {tr('replay.skip')}
            </button>
          </div>
        )
      ) : null}

      {beat?.type === 'minigame' && !showIntro && !showEnd ? (
        minigame ? (
          <MiniGameStage
            key={`${minigame.id}-${beatIndex}`}
            data={minigame}
            completed={save.completedMinigames?.includes(minigame.id) ?? false}
            warTable={warTableOf(save)}
            onWarChange={setWarTable}
            onExit={() => {
              setStatus(tr('replay.minigameClosed'));
              nextBeat();
            }}
            onDone={() => {
              completeMinigame(minigame.id);
              setStatus(tr('replay.minigameDone'));
              nextBeat();
            }}
          />
        ) : (
          <div className={p.choicePanel} role="group" aria-label={tr('replay.minigameGroup')}>
            <p className={p.choicePrompt}>{tr('replay.minigameMissing')}</p>
            <p className={p.small}>
              {tr('replay.minigameMissingLine', { id: beat.id })}
            </p>
            <button type="button" className={p.choice} onClick={nextBeat}>
              {tr('replay.skip')}
            </button>
          </div>
        )
      ) : null}

      {beat?.type === 'event' && !showIntro && !showEnd ? (
        <CivilWarEvent
          onClose={() => {
            setStatus(tr('replay.eventDone'));
            nextBeat();
          }}
        />
      ) : null}
    </section>
  );
}

function beatText(beat: Beat | undefined): string {
  if (!beat) return '';
  if (
    beat.type === 'narration' ||
    beat.type === 'dialogue' ||
    beat.type === 'quote' ||
    beat.type === 'heading'
  ) {
    return beat.text;
  }
  return '';
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  bg: string,
  bgImage: HTMLImageElement | null,
) {
  const { width, height } = ctx.canvas;
  ctx.imageSmoothingEnabled = false;
  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else if (bg === 'bg_goto_room') {
    drawRoom(ctx, width, height);
  } else if (bg === 'bg_archive') {
    drawArchive(ctx, width, height);
  } else if (bg === 'bg_river_day') {
    drawRiverDay(ctx, width, height);
  } else {
    drawNightScene(ctx, width, height);
  }
}

function drawNightScene(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#1B2A3A';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#1E3042';
  for (let y = 0; y < height; y += 8) ctx.fillRect(0, y, width, 2);
  ctx.fillStyle = '#27445A';
  ctx.fillRect(0, 132, width, height - 132);
  ctx.fillStyle = '#2B4C64';
  for (let y = 136; y < height; y += 8) ctx.fillRect(0, y, width, 2);
  ctx.fillStyle = '#6B7F8C';
  ctx.fillRect(16, 120, width - 32, 4);
  [52, 132, 212, 292].forEach((x) => ctx.fillRect(x, 124, 3, 32));
  const stars = [
    [28, 24], [68, 44], [118, 18], [164, 38], [214, 22],
    [262, 52], [312, 28], [338, 66], [94, 70], [186, 82],
  ];
  ctx.fillStyle = '#D8E6F0';
  stars.forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));
}

function drawRoom(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#1B2028';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#2B2735';
  ctx.fillRect(0, 150, width, 48);
  ctx.fillStyle = '#27445A';
  ctx.fillRect(238, 34, 82, 66);
  ctx.fillStyle = '#8FA8B8';
  ctx.fillRect(242, 38, 74, 58);
  ctx.fillStyle = '#1B2A3A';
  ctx.fillRect(246, 42, 66, 50);
  ctx.fillStyle = '#4A4A55';
  ctx.fillRect(28, 112, 118, 12);
  ctx.fillRect(40, 124, 8, 44);
  ctx.fillRect(126, 124, 8, 44);
  ctx.fillStyle = '#17151F';
  ctx.fillRect(54, 76, 64, 36);
  ctx.fillStyle = '#3F6B3F';
  ctx.fillRect(58, 80, 56, 28);
  ctx.fillStyle = '#D9A441';
  ctx.fillRect(252, 122, 42, 30);
}

function drawArchive(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#2B2735';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#4A4A55';
  for (let x = 12; x < width; x += 58) {
    ctx.fillRect(x, 20, 44, 170);
    ctx.fillStyle = '#E8E0CC';
    for (let y = 30; y < 180; y += 18) {
      ctx.fillRect(x + 4, y, 36, 12);
      ctx.fillStyle = '#D6CCB4';
    }
    ctx.fillStyle = '#4A4A55';
  }
  ctx.fillStyle = '#8C8270';
  ctx.fillRect(0, 170, width, 28);
}

function drawRiverDay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#8FA8B8';
  ctx.fillRect(0, 0, width, 132);
  ctx.fillStyle = '#E8C87A';
  ctx.fillRect(0, 96, width, 36);
  ctx.fillStyle = '#5B8FA8';
  ctx.fillRect(0, 132, width, height - 132);
  ctx.fillStyle = '#6B7F8C';
  ctx.fillRect(16, 120, width - 32, 4);
  [52, 132, 212, 292].forEach((x) => ctx.fillRect(x, 124, 3, 32));
}
