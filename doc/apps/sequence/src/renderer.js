
console.log("Hello There!");

import * as p from "./parser.mjs";

/**
 * @type {boolean}
 */
var started = false;

function tell_started() {
    started = true;

    let loading = document.getElementById("loading");

    if (loading) {
        loading.style.display = "none";
    }

    console.log("started");
}

/**
 * @type {HTMLVideoElement}
 */
const videoElement = document.getElementById('input_video');
if (!videoElement) {
    throw new Error('No video element found');
}

/**
 * @type {HTMLCanvasElement}
 */
const canvasElement = document.getElementById('output_canvas');
if (!canvasElement) {
    throw new Error('No canvas element found');
}

/**
 * @type {HTMLDivElement}
 */
const code_editor_div = document.getElementById("code-editor");
if (!code_editor_div) {
    throw new Error('No code editor div found');
}

function launch() {
    var pose = new Pose({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }});

    pose.setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    pose.onResults((results/* : Results*/) /*: void*/ => {
        if (!started) {
            tell_started();
        }
        //console.log(results);
        if (canvasCtx)
        {
        }
    });
    
    let camera /*: Camera | null*/ = new Camera(videoElement, {
        onFrame: async () => {
            //console.log(videoElement);
            await pose.send({image: videoElement})
        }//,
        //width: 1280,
        //height: 720
    });

    console.log(camera.start());

    console.log(RIGHT_EYE_INNER)
}

/**
 * @returns {Promise<string>}
 */
async function default_code() {
    let response = await fetch("./src/example.txt");
    let text = await response.text();
    return text;
}

async function start() {

    console.log("start");

    let code = await default_code();
    code_editor_div.innerText = code;

    //launch();
}

p.test();
start();