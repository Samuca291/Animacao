import React from "react";
import { Composition, registerRoot } from "remotion";
import { Main, timeline } from "./Main";

const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    durationInFrames={timeline.totalFrames}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
    defaultProps={{ music: true }}
  />
);

registerRoot(Root);
