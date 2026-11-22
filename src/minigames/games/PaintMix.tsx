import { useEffect, useRef, useState } from 'react';
import type { PaintMixGame } from '../../content/types';
import s from '../minigame.module.css';

export function PaintMix({
  data,
  onReady,
  onCaption,
}: {
  data: PaintMixGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [layerIndex, setLayerIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const readyRef = useRef(false);
  const layer = data.layers[Math.min(layerIndex, data.layers.length - 1)];
  const all = done.length >= data.layers.length;
  const colorOf = (id: string) => data.pigments.find((pigment) => pigment.id === id)?.color ?? '#888';
  const labelOf = (id: string) => data.pigments.find((pigment) => pigment.id === id)?.label ?? id;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function togglePigment(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        onCaption(`把${labelOf(id)}刮掉。`);
        return current.filter((item) => item !== id);
      }
      if (current.length >= layer.target.length) {
        onCaption('这一层放不下更多颜料了。先刮掉一种。');
        return current;
      }
      onCaption(`${labelOf(id)}加进去了。`);
      return [...current, id];
    });
  }

  function apply() {
    if (all) return;
    const wanted = new Set(layer.target);
    const chosen = new Set(selected);
    const exact =
      wanted.size === chosen.size && [...wanted].every((pigment) => chosen.has(pigment));
    if (!exact) {
      setSelected([]);
      onCaption('颜色不对。墙没吃进去。再看一眼目标色。');
      return;
    }
    setDone((current) => [...current, layer.id]);
    setSelected([]);
    onCaption(layer.note);
    if (layerIndex < data.layers.length - 1) setLayerIndex((current) => current + 1);
  }

  const gradientFor = (ids: string[]) =>
    `linear-gradient(135deg, ${ids.map((id) => colorOf(id)).join(', ')})`;
  const currentColor = selected.length ? gradientFor(selected) : 'transparent';
  const targetColor = gradientFor(layer.target);

  return (
    <div className={s.paint} data-testid="paint-stage">
      <div className={s.paintWall} data-testid="paint-wall" style={{ background: layer.underlay }}>
        {data.layers
          .filter((item) => done.includes(item.id))
          .map((item, index) => (
            <span
              key={item.id}
              className={s.paintDoneLayer}
              data-testid="paint-done-layer"
              style={{
                background: gradientFor(item.target),
                inset: `calc(${3 + index * 2} * var(--u))`,
                zIndex: index + 1,
              }}
            />
          ))}
        <div
          className={s.paintLayerPreview}
          data-testid="paint-preview"
          style={{ background: currentColor }}
        />
        <div className={s.paintCracks} aria-hidden="true" />
        <span className={s.paintWallLabel}>{done.length >= data.layers.length ? '墙刷完了' : layer.label}</span>
      </div>
      <div className={s.paintControls}>
        <div className={s.paintLayers} aria-label="三层颜色">
          {data.layers.map((item, index) => {
            const finished = done.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={s.paintLayerTab}
                data-testid="paint-layer"
                data-layer={item.id}
                data-target={item.target.join(',')}
                data-done={finished}
                data-active={index === layerIndex && !all}
                aria-pressed={finished}
                disabled={index > layerIndex || all}
                onClick={() => {
                  if (index < layerIndex) {
                    setLayerIndex(index);
                    setSelected([]);
                    onCaption(`回到${item.label}。`);
                  }
                }}
              >
                <span>{item.label}</span>
                {finished ? <span className={s.paintCheck}>✓</span> : null}
              </button>
            );
          })}
        </div>
        <div className={s.paintTargetRow}>
          <span className={s.paintTargetLabel}>目标色</span>
          <span
            className={s.paintSwatch}
            data-testid="paint-target"
            role="img"
            style={{ background: targetColor }}
            aria-label={`目标色：${layer.target.map((id) => labelOf(id)).join(' + ')}`}
          />
          <span className={s.paintMixLabel} aria-live="polite">
            {selected.length ? selected.map((id) => labelOf(id)).join(' + ') : '选颜料'}
          </span>
        </div>
        <div className={s.paintPots} role="group" aria-label="颜料盘">
          {data.pigments.map((pigment) => (
            <button
              key={pigment.id}
              type="button"
              className={s.paintPot}
              data-testid="paint-pigment"
              data-pigment={pigment.id}
              data-selected={selected.includes(pigment.id)}
              aria-pressed={selected.includes(pigment.id)}
              onClick={() => togglePigment(pigment.id)}
            >
              <span className={s.paintDot} style={{ background: pigment.color }} />
              {pigment.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={s.paintApply}
          data-testid="paint-apply"
          data-layer={layer.id}
          onClick={apply}
          disabled={all || selected.length === 0}
        >
          {all ? '都刷完了' : '刷上去'}
        </button>
      </div>
    </div>
  );
}
