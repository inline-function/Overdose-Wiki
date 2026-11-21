import { useEffect } from 'react';
import { audio } from './AudioManager';

export function useCue(id: string | undefined) {
  useEffect(() => {
    if (id) audio.playCue(id);
  }, [id]);
}