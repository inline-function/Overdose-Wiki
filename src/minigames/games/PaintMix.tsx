import { useEffect, useRef, useState } from 'react';
import type { PaintMixGame } from '../../content/types';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

export function PaintMix({
  data,
  onReady,
  onCaption,
}: {
  data: PaintMixGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const tr = useT();
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
        onCaption(tr('paint.removed', { label: labelOf(id) }));
        return current.filter((item) => item !== id);
      }
      if (current.length >= layer.target.length) {
        onCaption(tr('paint.full'));
        return current;
      }
      onCaption(tr('paint.added', { label: labelOf(id) }));
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
      onCaption(tr('paint.wrong'));
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
        <span className={s.paintWallLabel}>{done.length >= data.layers.length ? tr('paint.done') : layer.label}</span>
      </div>
      <div className={s.paintControls}>
        <div className={s.paintLayers} aria-label={tr('paint.layersAria')}>
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
                    onCaption(tr('paint.back', { label: item.label }));
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
          <span className={s.paintTargetLabel}>{tr('paint.target')}</span>
          <span
            className={s.paintSwatch}
            data-testid="paint-target"
            role="img"
            style={{ background: targetColor }}
            aria-label={tr('paint.targetAria', { list: layer.target.map((id) => labelOf(id)).join(' + ') })}
          />
          <span className={s.paintMixLabel} aria-live="polite">
            {selected.length ? selected.map((id) => labelOf(id)).join(' + ') : tr('paint.pick')}
          </span>
        </div>
        <div className={s.paintPots} role="group" aria-label={tr('paint.paletteAria')}>
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
          {all ? tr('paint.allDone') : tr('paint.apply')}
        </button>
      </div>
    </div>
  );
}
