/** English blurbs for the drug dossier panels. Keys mirror infoText.ts. */
export const TAG_TEXT_EN: Record<string, string> = {
  '兴奋剂': 'Raises alertness, heart rate and the sense of action; repeated use brings tolerance and rebound.',
  '镇静剂': 'Lowers central excitation, bringing relaxation and drowsiness; risk rises sharply when stacked with respiratory depression.',
  '抗抑郁药': 'Adjusts mood-related transmitters; slow to take effect, and side effects show up first in overdose.',
  '抗焦虑药': 'Reduces anxiety and alertness; stopping after long use can cause rebound.',
  '解离剂': 'Cuts the link between perception and cognition; the higher the dose, the further the body drifts from the room.',
  '阿片类': 'Pain relief and euphoria while breathing is depressed; tolerance and dependence arrive fast.',
  '苯二氮卓类药品': 'Boosts GABA inhibition, bringing sedation, anxiolysis and amnesia.',
  '抗组胺': 'Damps histaminergic wakefulness and allergic response; anticholinergic effects are obvious in overdose.',
  '抗精神病药': 'Damps dopamine and other excitatory systems; sedation and metabolic load are common.',
  '抗癫痫药': 'Reduces abnormal discharge and overexcitation; stopping can rebound.',
  '镇咳药': 'Suppresses the cough reflex; some produce dissociation at high doses.',
  '催眠剂': 'Shortens time to sleep; changes sleep architecture and memory.',
  '镇痛药': 'Reduces pain transmission; side effects differ widely between mechanisms.',
  '抗胆碱能剂': 'Blocks acetylcholine; brings dry mouth, fever, delirium and urinary retention.',
  '选择性血清素再摄取抑制剂': 'Raises serotonin in the synaptic gap; slow onset, and overdose can head toward serotonin syndrome.',
  '血清素去甲肾上腺素再摄取抑制剂': 'Raises both serotonin and noradrenaline; discontinuation effects are marked.',
  '去甲肾上腺素多巴胺再摄取抑制剂': 'Raises noradrenaline and dopamine; carries stimulation and appetite loss.',
  'NMDA 拮抗剂': 'Blocks NMDA receptors, producing dissociative anaesthesia and cognitive change.',
  'NMDA 激动剂': 'Boosts glutamate transmission; may counter dissociation, and may also bring excitotoxicity.',
  '植物成分': 'From plants or extracts; composition is complex, and impurities and dose are hard to control.',
  '其他': 'Not covered by the tags above; still read it through the dossier mechanism.',
};

export const NEURO_TEXT_EN: Record<string, string> = {
  '血清素': 'Mood, sleep, appetite and temperature; too much can trigger serotonin syndrome.',
  '多巴胺': 'Reward, motivation, movement and attention; too much brings agitation and psychotic-like experience.',
  '去甲肾上腺素': 'Alertness, heart rate, blood pressure and stress response; too much brings palpitations, tremor, anxiety.',
  '谷氨酸': 'The main excitatory transmitter; blocking NMDA receptors produces dissociation.',
  'GABA': 'The main inhibitory transmitter; boosting it sedates and calms anxiety, and overdose suppresses breathing.',
  '乙酰胆碱': 'Memory, muscle contraction and secretion; blocking it brings dry mouth, delirium, urinary retention.',
  '组胺': 'Wakefulness, allergy and stomach acid; blocking it brings drowsiness and sedation.',
  '内啡肽': 'Endogenous pain relief and euphoria; agonising opioid receptors depresses breathing.',
};

export const ENZYME_TEXT_EN: Record<string, string> = {
  CYP1A2: 'Metabolises caffeine and similar substances; inhibiting it prolongs their effect.',
  CYP2A6: 'Metabolises nicotine and similar substances; large individual variation.',
  CYP2B6: 'Metabolises some psychiatric drugs and opioids.',
  CYP2C8: 'Metabolises some analgesics and antidiabetics.',
  CYP2C9: 'Metabolises warfarin and some antiepileptics.',
  CYP2C19: 'Metabolises some antidepressants and proton-pump inhibitors.',
  CYP2D6: 'Metabolises many psychiatric drugs and dextromethorphan; inhibiting it raises blood levels.',
  CYP2E1: 'Metabolises ethanol and other small molecules; long-term drinking induces it.',
  CYP3A4: 'One of the most common drug-metabolising enzymes; grapefruit juice and similar inhibit it.',
  CYP3A5: 'Overlaps with CYP3A4; expression varies between individuals.',
  'MAO-A': 'Breaks down serotonin and noradrenaline; inhibiting it raises both.',
  'MAO-B': 'Mainly breaks down dopamine; inhibiting it prolongs dopamine action.',
};

export const EFFECT_TEXT_EN: Record<string, string> = {
  '解离': 'Perception and cognition come apart: the body feels light, the room feels far, time slows. Light is floating; medium is the body not being yours; heavy is a clean break.',
  '欣快': 'Short-lived ease and pleasure; usually comes with tolerance, then rebound.',
  '镇静': 'Movement and thought slow, drowsiness; dangerous when stacked with respiratory depression.',
  '呼吸抑制': 'Breathing turns shallow and slow; severe cases lead to hypoxia and coma.',
  '谵妄': 'Acute confusion: orientation to time and place drops, shadow people and persecutory delusions may appear.',
  '抗胆碱能': 'Dry mouth, fever, fast heartbeat, clouded consciousness, urinary retention.',
  '血清素综合征': 'Serotonin overload: fever, tremor, hyperreflexia, altered consciousness.',
  '戒断': 'Rebound after stopping: anxiety, insomnia, pain, depression; severe cases can be life-threatening.',
  '耐受': 'The same dose stops producing the same effect, pushing the dose up.',
  '激越': 'Restlessness, irritability, fast heartbeat; hard to sit still.',
};

export const CLASS_TEXT_EN: Record<string, string> = {
  other: 'Other: not filed under prescription or controlled-drug classes.',
  otc: 'OTC: over the counter, and still possibly psychoactive.',
  rx: 'Rx: prescription only, needs a doctor\'s assessment.',
  c2: 'Schedule II: second-class psychotropic, green/white four-square mark.',
  c1: 'Schedule I: first-class psychotropic, dark green/white four-square mark.',
  narcotic: 'Narcotic: blue square marked with the narcotic character.',
};

export const INFO_FALLBACK_EN = {
  tag: (key: string) => `Tag: ${key}.`,
  neuro: (key: string) => `Neurotransmitter: ${key}.`,
  enzyme: (key: string) => `Enzyme: ${key}.`,
  effect: (key: string) => `Effect: ${key}.`,
};
