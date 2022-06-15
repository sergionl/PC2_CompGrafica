"using strict";

import * as cg from "./cg.js";
import * as v3 from "./glmjs/vec3.js";
import * as v4 from "./glmjs/vec4.js";
import * as m4 from "./glmjs/mat4.js";
import * as twgl from "./twgl-full.module.js";

async function main(){
    //1 ambient sliders
  const ambientLight = document.querySelector("#ambient");
  const ambientR = document.querySelector("#ambientR");
  const ambientG = document.querySelector("#ambientG");
  const ambientB = document.querySelector("#ambientB");

  //2 difuse sliders
  const difuseR = document.querySelector("#difuseR");
  const difuseG = document.querySelector("#difuseG");
  const difuseB = document.querySelector("#difuseB");

  //3 cam sliders
  const camR = document.querySelector("#camR");
  const camG = document.querySelector("#camG");
  const camB = document.querySelector("#camB");

  //4 lampara sliders
  const lamparaLight = document.querySelector("#lamp");


  //canvas
  const canvitas = document.querySelector("#canvitas");
  const gl = canvitas.getContext("webgl2");
  if (!gl) return undefined !== console.log("couldn't create webgl2 context");

  twgl.setDefaults({ attribPrefix: "a_" });

  //shaders
  let vertSrc = await cg.fetchText("glsl/light.vert");
  let fragSrc = await cg.fetchText("glsl/light.frag");
  const objPrgInf = twgl.createProgramInfo(gl, [vertSrc, fragSrc]);


  //objeto cajas
  const obj = await cg.loadObj("models/crate/crate.obj", gl, objPrgInf);
  //objeto planeta
  const obj2 = await cg.loadObj("models/Sci-fi_Box_obj/Sci-fi Box.obj", gl, objPrgInf);
 
  // General stuff setup
  const cam = new cg.Cam([0, 0, 6], 25);

  let aspect = 16.0 / 9.0;
  let deltaTime = 0;
  let lastTime = 0;
  let theta = 0;

  const world = m4.create();
  const projection = m4.create();

   // some preloaded arrays to optimize memory usage
   const rotationAxis = new Float32Array([0, 1, 0]);
   const temp = v3.create();
   const one = v3.fromValues(1, 1, 1);
   const initial_light_pos = v3.fromValues(3.0, 0, 0);
   const origin = v4.create();
   const light_position = v3.create();

   const coords = {
    u_world: world,
    u_projection: projection,
    u_view: cam.viewM4,
  };

  const camara = {
    //ambiente y camara
    "u_light.ambient": v3.create(0),
    "u_light.cutOff": Math.cos(Math.PI / 15.0),
    "u_light.direction": cam.lookAt,
    "u_light.position": cam.pos,
    "u_light.sliderAmbientRGB": v3.create(0),
    "u_light.sliderCamaraRGB": v3.create(0),
    

    //diffuse
    "u_light.sliderDiffuseRGB": v3.create(0),
    "u_light.diffusePosition": v3.fromValues(15,8,14),
    "u_light.diffuseDirection":v3.fromValues(-0.25,-0.28,-0.93),
    "u_light.diffuseCutOff": Math.cos(Math.PI /15.0 ),

    //lampara
    "u_light.sliderLamparaRGB": v3.fromValues(1,0,1), //rosa oscuro
    "u_light.lamparaPosition": v3.fromValues(-4,3,5),
    "u_light.lamparaDirection": v3.fromValues(0.5,-0.2,-0.8),
    "u_light.lamparaCutOff": Math.cos(Math.PI / 15.0),
    "u_light.lamparaIntensidad": 0.0,
    
    u_viewPosition: cam.pos,
  };


  // multiple objects positions
    const numObjs = 100;
    const positions = new Array(numObjs);
      const rndb = (a, b) => Math.random() * (b - a) + a;
      for (let i = 0; i < numObjs; ++i) {
          positions[i] = [rndb(-13.0, 13.0), rndb(-12.0, 12.0), rndb(-14.0, 14.0)];
            //positions[i] = [0, 0, 0];
        }
    
    

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);


    function render(elapsedTime){

        elapsedTime *= 1e-3;
        deltaTime = elapsedTime - lastTime;
        lastTime = elapsedTime;
        // resizing stuff and general preparation
        if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            aspect = gl.canvas.width / gl.canvas.height;
        }
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // some logic to move the light around
        //if (autorotate) theta += deltaTime;
        if (theta > Math.PI * 2) theta -= Math.PI * 2;
        m4.identity(world);
        m4.rotate(world, world, theta, rotationAxis);
        m4.translate(world, world, initial_light_pos);
        v3.transformMat4(light_position, origin, world);

        // coordinate system adjustments
        m4.identity(projection);
        m4.perspective(projection, cam.zoom, aspect, 0.1, 100)

        // drawing object 1
        gl.useProgram(objPrgInf.program);
        twgl.setUniforms(objPrgInf, camara);

        let i = 0;

        for (const pos of positions) {
            m4.identity(world);
            m4.scale(world, world, v3.scale(temp, one, 1));
            m4.translate(world, world, pos);
            m4.rotate(world, world, theta, rotationAxis);
            twgl.setUniforms(objPrgInf, coords);
            if(i <= numObjs/2){
                for (const { bufferInfo, vao, material } of obj) {
                    gl.bindVertexArray(vao);
                    twgl.setUniforms(objPrgInf, {}, material);
                    twgl.drawBufferInfo(gl, bufferInfo);
                }
            }else
                {
                for (const { bufferInfo, vao, material } of obj2) {
                    gl.bindVertexArray(vao);
                    twgl.setUniforms(objPrgInf, {}, material);
                    twgl.drawBufferInfo(gl, bufferInfo);
                } 
            }
           
            i++
        }
        // logic to move the visual representation of the light source
        m4.identity(world);
        m4.translate(world, world, light_position);
        m4.scale(world, world, v3.scale(temp, one, 0.025));


        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

  //teclado y mouse
  document.addEventListener("keydown", (e) => {
    /**/ if (e.key === "w") cam.processKeyboard(cg.FORWARD, deltaTime);
    else if (e.key === "a") cam.processKeyboard(cg.LEFT, deltaTime);
    else if (e.key === "s") cam.processKeyboard(cg.BACKWARD, deltaTime);
    else if (e.key === "d") cam.processKeyboard(cg.RIGHT, deltaTime);
    else if (e.key === "r") autorotate = !autorotate;
    else if (e.key === "v") console.log(cam.pos);
    else if (e.key === "c") console.log(cam.lookAt);
  });
  canvitas.addEventListener("mousemove", (e) => cam.movePov(e.x, e.y));
  canvitas.addEventListener("mousedown", (e) => cam.startMove(e.x, e.y));
  canvitas.addEventListener("mouseup", () => cam.stopMove());
  canvitas.addEventListener("wheel", (e) => cam.processScroll(e.deltaY));
  //ambient
  ambientLight.addEventListener("change", () => {
    const value = ambientLight.value;
    camara["u_light.ambient"][0] = value / 100.0;
    camara["u_light.ambient"][1] = value / 100.0;
    camara["u_light.ambient"][2] = value / 100.0;
  });
  //1 ambient color
  ambientR.addEventListener("change", () => {
    const value = ambientR.value;
    camara["u_light.sliderAmbientRGB"][0] = value/255.0;
  });
  ambientG.addEventListener("change", () => {
    const value = ambientR.value;
    camara["u_light.sliderAmbientRGB"][1] = value/255.0;
  });
  ambientB.addEventListener("change", () => {
    const value = ambientR.value;
    camara["u_light.sliderAmbientRGB"][2] = value/255.0;
  });


  //2 diffuse color
  difuseR.addEventListener("change", () => {
    const value = difuseR.value;
    camara["u_light.sliderDiffuseRGB"][0] = value/255.0;
  });
  difuseG.addEventListener("change", () => {
    const value = difuseG.value;
    camara["u_light.sliderDiffuseRGB"][1] = value/255.0;
  });
  difuseB.addEventListener("change", () => {
    const value = difuseB.value;
    camara["u_light.sliderDiffuseRGB"][2] = value/255.0;
  });



  //3 camara color
  camR.addEventListener("change", () => {
    const value = camR.value;
    camara["u_light.sliderCamaraRGB"][0] = value/255.0;
  });
  camG.addEventListener("change", () => {
    const value = camG.value;
    camara["u_light.sliderCamaraRGB"][1] = value/255.0;
  });
  camB.addEventListener("change", () => {
    const value = camB.value;
    camara["u_light.sliderCamaraRGB"][2] = value/255.0;
  });

  //4 intensidad lampara
  lamparaLight.addEventListener("change", () => {
    const value = lamparaLight.value;
    camara["u_light.lamparaIntensidad"] = value/100.0;

  });

}


main();
