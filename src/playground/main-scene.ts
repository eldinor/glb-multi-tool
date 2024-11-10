import {
  ArcRotateCamera,
  AssetContainer,
  DefaultRenderingPipeline,
  Engine,
  HemisphericLight,
  Scene,
  SceneLoader,
  Tools,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { GLTFFileLoader } from "@babylonjs/loaders";
import { Grid, h, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import { RowSelection } from "gridjs/plugins/selection";

import { prepareCamera, prepareLights, preparePipeLine } from "./prepareScene";

export default class MainScene {
  private camera: ArcRotateCamera;
  private screenshotArray: Array<string> = [];
  private dataArray: Array<[boolean, string, number, string, string, string, ArrayBuffer]> = [];
  // private grid: Grid | undefined;

  constructor(private scene: Scene, private canvas: HTMLCanvasElement, private engine: Engine) {
    prepareLights(this.scene);
    this.camera = prepareCamera(this.scene);

    this.loadComponents();
  }

  loadComponents(): void {
    let filesToLoad: Array<File> = [];

    let assetArrayBuffer: ArrayBuffer | undefined;
    let assetInfo: string;

    // form elements
    const form = document.forms.namedItem("uploader");

    const bttn = form!.save;
    const input = form!.querySelector('input[name="myfile[]"]');

    const top = document.getElementById("top")!;

    // event handler to add selected files to array - one or more at a time
    input!.addEventListener("change", function (_e) {
      console.log((_e.target as HTMLInputElement).files);
      for (let i = 0; i < (_e.target as HTMLInputElement)!.files!.length; i++)
        filesToLoad.push((_e.target as HTMLInputElement)!.files![i]);
    });

    bttn.addEventListener("click", async (e) => {
      e.preventDefault();

      let res: AssetContainer;
      (document.getElementById("progressBar") as any)!.value = 0;
      document.getElementById("sidebar")!.innerHTML = "";
      (document.getElementById("progressBar") as any)!.style.display = "inline-block";

      this.dataArray.length = 0; // if not the file will be added - TODO later, probably

      let extRequired: Array<string | undefined> = [];

      let grid: Grid | undefined;
      let counter = 0;

      for (const file of filesToLoad) {
        //  console.log(isGLBAsset((file as File).name));
        if (isGLBAsset((file as File).name)) {
          console.info("Promise to upload:%s", (file as File).size, (file as File).name);
          //   console.log(filesToLoad);
          SceneLoader.OnPluginActivatedObservable.addOnce((plugin) => {
            console.log(plugin.name);
            if (plugin.name === "gltf") {
              const loader = plugin as GLTFFileLoader;
              loader.validate = true;
              //      console.log(loader);
              //
              loader.onValidatedObservable.add((results) => {
                if (results.issues.numErrors > 0) {
                  console.log("ERRORS: ", results.issues.numErrors);
                  console.log("ERRORS: ", results.issues);
                }
              });
              //
              loader.onParsedObservable.addOnce((gltfBabylon) => {
                console.log((gltfBabylon.json as any).asset);
                if ((gltfBabylon.json as any).extensionsRequired) {
                  (gltfBabylon.json as any).extensionsRequired.forEach((element: string) => {
                    //         console.log(element);
                    extRequired.push(element);
                  });
                }
                if ((gltfBabylon.json as any).extensionsUsed) {
                  (gltfBabylon.json as any).extensionsUsed.forEach((element: any) => {
                    console.log("extensionsUsed", element);
                  });
                }
                //
                if ((gltfBabylon.json as any).asset.generator) {
                  assetInfo = (gltfBabylon.json as any).asset.generator;
                }

                if ((gltfBabylon.json as any).asset.extras) {
                  //   console.log(
                  //       "EXTRAS",
                  //      JSON.stringify((gltfBabylon.json as any).asset.extras)
                  //    );
                }
                //    console.log("JSON", gltfBabylon.json);
                //
              });
            }
          });
          //
          res = await SceneLoader.LoadAssetContainerAsync("", file);

          let objectURL = URL.createObjectURL(file);

          assetArrayBuffer = await Tools.LoadFileAsync(objectURL, true);
          counter++;

          let percent = (counter / filesToLoad.length) * 100;
          (document.getElementById("progressBar") as any)!.value = Math.round(percent);
          setTimeout(() => {
            (document.getElementById("progressBar") as any)!.style.display = "none";
          }, 1000);

          res.addAllToScene();

          this.camera.framingBehavior!.zoomOnMeshHierarchy(res.meshes[0], false);

          const scr = await Tools.CreateScreenshotUsingRenderTargetAsync(this.engine, this.camera, {
            precision: 1.0,
            width: 900,
            height: 900,
          });
          //
          let fileSize = ((file as File).size / (1024 * 1024)).toFixed(2) as any;
          fileSize = parseFloat(fileSize) as number;
          const selectbox = true;
          this.dataArray.push([
            //   selectbox,
            (file as File).name,
            //  sizeInMB,
            fileSize,
            scr,
            extRequired.join(", "),
            assetInfo,
            assetArrayBuffer,
          ]);
          res.dispose();
          extRequired = [];
        } // end of
        //
      } //
      //   console.log(dataArray);
      //
      if (grid) {
        grid.destroy();
      }

      const showScreenshotsButton = document.getElementById("showScreenshots")! as HTMLInputElement;
      showScreenshotsButton.addEventListener("change", function (_e) {
        console.log(showScreenshotsButton.checked);
        if ((grid as Grid) !== undefined) {
          grid!.updateConfig({ columns: grid?.config.columns }).forceRender();
        }
      });

      grid = new Grid({
        resizable: true,
        sort: true,
        // pagination: false,
        //   fixedHeader: true,
        //   height: "900px",
        columns: [
          //
          {
            id: "myCheckbox",
            name: "Select",
            plugin: {
              // install the RowSelection plugin
              component: RowSelection,
            },
          },
          //
          /*
          {
            name: "Select",
            width: "6%",
            sort: false,
            //   formatter: (cell) => html(`<b>${cell}</b>`),

            formatter: (cell, row) => {
              return h(
                "input",

                {
                  className: "testClass2",
                  type: "checkbox",
                  // src: cell as string,
                  onClick: () => {
                    console.log(row.cells);

                    console.log(grid?.config.columns);

                    //  grid!.config.columns[2]!.width = "20px";
                    // console.log(grid?.config.columns[2]!.width);

                    //   grid
                    //   ?.updateConfig({ columns: grid?.config.columns })
                    //   .forceRender();
                  },
                },
                cell?.toString()
              );
            },
          },
*/
          //
          {
            name: "Filename",
            formatter: (cell) => html(`<b>${cell}</b>`),
          },
          "Size, Mb",
          {
            name: "Screenshot",
            sort: false,
            //  width: showScreenshotsButton.checked ? "360px" : "20px",
            width: "320px",
            //   formatter: (cell) =>
            //  html(`<img src="${cell}" width=300><button>More</button>`),

            formatter: (cell) => {
              if (showScreenshotsButton.checked) {
                return h(
                  "img",
                  {
                    className: "testClass",
                    src: cell as string,
                    onClick: () => {
                      console.log(grid?.config.columns[1]);
                    },
                  },
                  "Edit"
                );
              } else {
                return h(
                  "div",
                  {
                    className: "testClass2",
                  },
                  ""
                );
              }
            },
          },
          {
            name: "Required Extensions",
            width: "15%",
          },
          {
            name: "Generator",
            width: "15%",
          },
        ],
        data: [...this.dataArray],
        //    search: true,
        style: {
          table: {
            "word-break": "break-word",
            "word-wrap": "break-word",
            "margin-bottom": "80px",
          },

          th: {},
          td: {},
        },
      });
      console.log(grid);

      //  grid.on("rowClick", (...args) => console.log("row: " + JSON.stringify(args), args));

      setTimeout(() => {
        grid.config.store.subscribe(function (state, prevState) {
          console.log("checkbox updated", state!.rowSelection);
          //  console.log("data", grid.config.store.state.data);

          console.log(grid.config.pipeline);
          console.log("CACHE", grid.config.pipeline.cache);
          let key = Array.from(grid.config.pipeline.cache.keys())[2];
          console.log(key);
          const tableData = grid.config.pipeline.cache.get(key).rows;
          console.log(tableData);

          let bbb: any[] = [];
          state!.rowSelection.rowIds.forEach((r) => {
            bbb.push(r);
          });
          console.log("bbb", bbb);

          for (let i = 0; i < bbb.length; i++) {
            for (let j = 0; j < tableData.length; j++) {
              if (bbb[i] == tableData[j].id) {
                console.log("Match: ", bbb[i], tableData[j].cells[1].data, tableData[j].cells[2].data);
              }
            }
          }
        });
      }, 1000);

      grid.render(document.getElementById("sidebar") as Element);

      filesToLoad.length = 0;

      //
    });
  }
}

export function niceBytes(z: number) {
  const units = ["bytes", "Kb", "Mb", "Gb", "Tb"];
  let x = z.toString();
  let l = 0,
    n = parseInt(x, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return n.toFixed(2) + " " + units[l];
}

function isGLBAsset(name: string): boolean {
  const queryStringIndex = name.indexOf("?");
  if (queryStringIndex !== -1) {
    name = name.substring(0, queryStringIndex);
  }

  return name.endsWith(".glb");
}

export function parseBool(val: any) {
  return val === true || val === "true";
}

export function tableStatesListener(state, prevState) {
  if (prevState.status < state.status) {
    if (prevState.status === 2 && state.status === 3) {
      console.log("Ready");
    }
  }
}
