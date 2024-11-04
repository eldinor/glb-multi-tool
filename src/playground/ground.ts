import { MeshBuilder, Scene } from "@babylonjs/core";
import "@babylonjs/loaders";

export class Ground {
  constructor(private scene: Scene) {
    this._createGround();
    this._createSphere();
  }

  _createGround(): void {
    const { scene } = this;

    const mesh = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      scene
    );
  }

  _createSphere(): void {
    const mesh = MeshBuilder.CreateSphere(
      "sphere",
      { diameter: 2, segments: 32 },
      this.scene
    );
    mesh.position.y = 4;
  }
}
