import {
  Scene,
  PointLight,
  Vector3,
  Color3,
  SpotLight,
  DefaultRenderingPipeline,
  Color4,
  Vector2,
  BlurPostProcess,
  ArcRotateCamera,
  Tools,
  CubeTexture,
} from "@babylonjs/core";

export function prepareLights(scene: Scene): void {
  scene.clearColor = new Color4(0, 0, 0, 0);
  const hdrTexture = new CubeTexture("https://playground.babylonjs.com/textures/environment.env", scene);
  hdrTexture.gammaSpace = false;
  scene.environmentTexture = hdrTexture;
  scene.environmentIntensity = 1;
}

export function prepareCamera(scene: Scene): ArcRotateCamera {
  const camera = new ArcRotateCamera("camera", Tools.ToRadians(90), Tools.ToRadians(20), 10, Vector3.Zero(), scene);
  camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

  camera.useFramingBehavior = true;
  camera.framingBehavior!.framingTime = 0;

  preparePipeLine(scene);

  return camera;
}

export function preparePipeLine(scene: Scene): DefaultRenderingPipeline {
  const pipeline = new DefaultRenderingPipeline("mt-pipeline", false, scene, [scene.activeCamera!]);
  pipeline.fxaaEnabled = true;
  pipeline.samples = 8;

  return pipeline;
}
