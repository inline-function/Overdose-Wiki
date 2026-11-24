import type { ConsentSection } from './consentText';

/**
 * English consent text. Kept section-for-section and item-for-item parallel to
 * the Chinese original: same order, same item counts, no added or dropped
 * claims. Register is faithful, not smoothed out.
 */
export const CONSENT_SECTIONS_EN: ConsentSection[] = [
  {
    title: 'Fictional content',
    items: [
      'This work is made from real texts and real stories, but the text is allowed to differ from reality. Characters, dialogue and plot have been fictionalized; some of the pharmacology is invented — for example, in this work magnesium L-threonate is written as an anti-dissociative that agonizes NMDA receptors, which it does not do in reality. We say up front that the text is not accurate, and we will not remind you of it at every turn.',
    ],
  },
  {
    title: 'Psychological warning',
    items: [
      'This work contains depictions of mental suffering, suicide, self-harm, drug abuse and death. If you are in a state you cannot bear, please think carefully about whether to go on.',
    ],
  },
  {
    title: 'Depictions of unhealthy drug use',
    items: [
      'We will not teach you how to abuse: no doses, no recipes, no sources. We will not talk you out of it either: no slogans, no sermons, no performative helpline number handed to you to call. All we do is record — describe what happened, and why those people went down that road.',
    ],
  },
  {
    title: 'Position',
    items: [
      "od is not worth championing, and not worth a blanket boycott either. Drug use is a subset of od, but od is not drug use; most oders are not chasing a high, they are in too much pain. We write that compulsion down, and we clear away the distorted outside gaze that sees the plateau's residents as 'junkies who only know how to get high'. We do not judge. We record.",
    ],
  },
  {
    title: 'About this site',
    items: [
      'This site is a fictional narrative interface, not a website, organization or service that actually operates.',
      'The login box is part of the work; the pass is preset fictional text, not a real account, and this work never submits or stores anything you type on any server.',
    ],
  },
  {
    title: 'Boundaries',
    items: [
      'Effects and pharmacology are plot devices, not guaranteed to be medically accurate, and are not diagnosis or treatment advice.',
      'Real names are used only for internal archiving; the public demo contains no real reports.',
      'This work has no server, no account system, no analytics and no external links; it never collects, uploads or syncs your input or reading data to the cloud or to any server.',
      'Progress and settings are stored only in this browser; clearing browser data will lose them.',
    ],
  },
  {
    title: 'Consent',
    items: [
      'Press that informed-consent button and we take it that you are informed. From then on we will not repeat the warnings and statements above.',
      'This notice appears once at every launch or reload; it does not repeat within the same run.',
    ],
  },
  {
    title: 'Please enjoy our game',
    items: [
      "Please enjoy our game. And when the text has shaken you so hard you cannot come down, look out the window. We will not say 'close the game, return to reality' — that you cannot come down is, as it happens, exactly what we most want to see. Your mental reaction is the finest praise a visual novel can receive.",
    ],
  },
];
