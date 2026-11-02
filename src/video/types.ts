/* eslint-disable @typescript-eslint/no-explicit-any */
export type Word = { text: string; norm: string; f0: number; f1: number };
export type Caption = { from: number; to: number; words: number[] };

export type Cue = {
  at_frame: number;
  target: string;
  action: string;
  [k: string]: any;
};

export type Layer = {
  id: string;
  kind: string;
  at_frame: number;
  until_frame?: number;
  slot?: string;
  enter?: string;
  props?: Record<string, any>;
  items?: Array<Record<string, any> & { at_frame: number }>;
};

export type Transition = { type: string; direction?: string; frames: number; timing?: string };

export type Scene = {
  id: string;
  type: "character" | "edit";
  act: string;
  narration: string;
  index: number;
  from: number;
  durationInFrames: number;
  leadFrames: number;
  speechFrames: number;
  audio: string | null;
  words: Word[];
  captions: Caption[];
  cues?: Cue[];
  layers?: Layer[];
  background?: string;
  setting?: { name: string; variant: string };
  cast?: Array<{ id: string; x: number; pose?: string; expression?: string }>;
  props?: Array<{ id: string; x: number; y: number; [k: string]: any }>;
  badge_day?: number;
  transition_out?: Transition;
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  source: string;
  method: string;
  scenes: Scene[];
};
