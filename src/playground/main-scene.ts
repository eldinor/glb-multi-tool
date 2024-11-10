import {
  ArcRotateCamera,
  DefaultRenderingPipeline,
  Engine,
  FilesInput,
  HemisphericLight,
  Scene,
  SceneLoader,
  Tools,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { GLTF2, GLTFFileLoader } from "@babylonjs/loaders";
import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";

import { Ground } from "./ground";

export default class MainScene {
  private camera: ArcRotateCamera;
  private valResults: any;
  private grid: Grid;
  public wrapper = document.getElementById("wrapper")!;

  constructor(private scene: Scene, private canvas: HTMLCanvasElement, private engine: Engine) {
    this._setCamera(scene);
    this._setLight(scene);
    this.loadComponents();
  }

  _setCamera(scene: Scene): void {
    this.camera = new ArcRotateCamera("camera", Tools.ToRadians(90), Tools.ToRadians(80), 20, Vector3.Zero(), scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.setTarget(Vector3.Zero());
  }

  _setLight(scene: Scene): void {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.6;
    scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
  }

  _setPipeLine(): void {
    const pipeline = new DefaultRenderingPipeline("default-pipeline", false, this.scene, [this.scene.activeCamera!]);
    pipeline.samples = 4;
    pipeline.fxaaEnabled = true;
  }

  loadComponents(): void {
    SceneLoader.OnPluginActivatedObservable.add((plugin) => {
      if (plugin.name === "gltf") {
        const loader = plugin as GLTFFileLoader;
        loader.validate = true;
        console.log("loader", loader);

        loader.onValidatedObservable.add((results) => {
          //   if (results.issues.numErrors > 0) {
          console.log("ERRORS: ", results.issues.numErrors);
          console.log("ERRORS: ", results.issues);
          console.log("INFO", results.info);
          this.valResults = results;
          this.createGrid(this.valResults);
          //   }
        });
      }
    });

    //
    let flist: File[];

    let fileDropTarget = new FilesInput(
      this.engine,
      this.scene,
      (sceneFile, scene) => {
        console.log(scene);
        console.log(sceneFile);
        flist = fileDropTarget.filesToLoad;
        console.log(flist);

        this._setCamera(scene);
        this._setLight(scene);
        this._setPipeLine();

        // scene.debugLayer.show();
      }, // Callback for scene load
      () => {}, // Callback for load progress
      () => {}, // Additional render loop logic callback
      () => {}, // Texture loading callback
      () => {}, // Started processing files callback
      null, // On reload callback
      () => {} // Error callback
    );
    fileDropTarget.monitorElementForDragNDrop(this.canvas);

    //
  }

  createGrid(res: any) {
    console.log("createGrid res", res);
    console.log("createGrid res", res.issues.messages);
    this.wrapper.innerHTML = "";
    if (this.grid) {
      this.grid.destroy();
    }
    const messages = res.issues.messages;
    const dataArray: any = [];
    messages.forEach((element) => dataArray.push([element.code, element.message, element.pointer, element.severity]));

    this.grid = new Grid({
      sort: true,
      data: [...dataArray],
      columns: ["Code", "Message", "Pointer", "Severity"],
    }).render(this.wrapper);

    //
  }
}
