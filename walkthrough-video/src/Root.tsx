import React from 'react';
import {Composition} from 'remotion';
import {TambayayongWalkthrough} from './TambayayongWalkthrough';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TambayayongWalkthrough"
    component={TambayayongWalkthrough}
    durationInFrames={1800}
    fps={30}
    width={1920}
    height={1080}
  />
);
