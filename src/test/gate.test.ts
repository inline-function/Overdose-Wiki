import { describe, expect, it } from 'vitest';
import { gateFor } from '../game/gate';
import {
  buildPassword,
  buildUsername,
  maskPassword,
  nextCount,
} from '../game/tokenFill';
import { cueForPath, resolveSceneCue } from '../audio/cues';
import type { Session } from '../game/session';

const base: Session = { booted: false, loggedIn: false };
const booted: Session = { booted: true, loggedIn: false };
const logged: Session = { booted: true, loggedIn: true };

describe('token fill', () => {
  it('types the username one character at a time', () => {
    expect(buildUsername(0)).toBe('');
    expect(buildUsername(1)).toBe('@S');
    expect(buildUsername(2)).toBe('@Su');
    expect(buildUsername(11)).toBe('@Supergogoto');
    expect(buildUsername(20)).toBe('@Supergogoto');
  });

  it('types the password one character at a time', () => {
    expect(buildPassword(3)).toBe('to_');
    expect(buildPassword(7)).toBe('to_the_');
    expect(buildPassword(35)).toBe('to_the_Ephemeral_and_to_the_Eternal');
    expect(buildPassword(50)).toBe('to_the_Ephemeral_and_to_the_Eternal');
  });

  it('shows only the last password character', () => {
    expect(maskPassword('abc', false)).toBe('**c');
    expect(maskPassword('abc', true)).toBe('abc');
    expect(maskPassword('', false)).toBe('');
  });

  it('advances but never exceeds the token count', () => {
    expect(nextCount(0, 2)).toBe(1);
    expect(nextCount(1, 2)).toBe(2);
    expect(nextCount(2, 2)).toBe(2);
  });
});

describe('gate order', () => {
  it('boots, logs in, then asks for consent', () => {
    expect(gateFor('/report/7', false, base)).toEqual({ to: '/welcome' });
    expect(gateFor('/report/7', false, booted)).toEqual({ to: '/login' });
    expect(gateFor('/report/7', false, logged)).toEqual({ to: '/consent' });
    expect(gateFor('/report/7', true, logged)).toBeNull();
  });

  it('keeps settings public but gates consent behind login', () => {
    expect(gateFor('/settings', false, base)).toBeNull();
    expect(gateFor('/consent', false, base)).toEqual({ to: '/welcome' });
  });

  it('never renders welcome once booted', () => {
    expect(gateFor('/welcome', false, base)).toBeNull();
    expect(gateFor('/welcome', false, booted)).toEqual({ to: '/login' });
    expect(gateFor('/welcome', false, logged)).toEqual({ to: '/consent' });
    expect(gateFor('/welcome', true, logged)).toEqual({ to: '/' });
  });

  it('sends logged-in visitors to pendingFrom', () => {
    expect(gateFor('/login', true, { ...logged, pendingFrom: '/report/7' })).toEqual({
      to: '/report/7',
    });
    expect(gateFor('/login', false, logged)).toEqual({ to: '/consent' });
  });

  it('keeps consent re-read available after acceptance', () => {
    expect(gateFor('/consent', true, logged)).toBeNull();
    expect(gateFor('/consent', false, logged)).toBeNull();
    expect(gateFor('/consent', false, booted)).toEqual({ to: '/login' });
  });
});

describe('scene cues', () => {
  it('maps key scenes and chapter defaults', () => {
    expect(resolveSceneCue({ id: 'ch01.s04', chapterId: 'ch01' })).toBe('afterglow');
    expect(resolveSceneCue({ id: 'ch01.s06', chapterId: 'ch01' })).toBe('tension');
    expect(resolveSceneCue({ id: 'ch02.s18', chapterId: 'ch02' })).toBe('ch02-late');
    expect(resolveSceneCue({ id: 'ch02.s01', chapterId: 'ch02' })).toBe('ch02-early');
    expect(resolveSceneCue({ id: 'dlc.s06', chapterId: 'dlc' })).toBe('tragedy');
    expect(resolveSceneCue({ id: 'ch03.s24', chapterId: 'ch03' })).toBe('disappear');
    expect(resolveSceneCue({ id: 'ch04.s01', chapterId: 'ch04' })).toBe('tension');
    expect(resolveSceneCue({ id: 'ch04.s40', chapterId: 'ch04' })).toBe('credits');
    expect(resolveSceneCue({ id: 'dlc.s05', chapterId: 'dlc' })).toBe('night-market');
    expect(resolveSceneCue({ id: 'dlc.s08', chapterId: 'dlc' })).toBe('dlc-summer');
  });

  it('routes pages to cues', () => {
    expect(cueForPath('/')).toBe('title');
    expect(cueForPath('/archive')).toBe('archive');
    expect(cueForPath('/battle/one')).toBeUndefined();
    expect(cueForPath('/report/7/replay/ch01.s01')).toBeUndefined();
    expect(cueForPath('/consent')).toBeUndefined();
    expect(cueForPath('/extras')).toBe('extras');
  });
});