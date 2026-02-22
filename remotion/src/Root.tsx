import React from "react";
import { Composition } from "remotion";
import { TwoferShowcase } from "./TwoferShowcase";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TwoferShowcase"
      component={TwoferShowcase}
      durationInFrames={630}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
