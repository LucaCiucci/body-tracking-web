
//import a from "./Sequence.css";

import Split from 'react-split'

import { Header } from "../../components/header";
import { Oval } from 'react-loader-spinner'

import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

import Monaco from '@monaco-editor/react';

import React, { useEffect } from "react";

import "./index.css";
import { configure_monaco_editor_language, EXAMPLE_CODE } from './scripting_monaco';

function Loading(props: {
    onMount?: (setLoading: (loading: boolean) => void) => void;
}): JSX.Element {
    let [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (props.onMount) {
            props.onMount(setLoading);
        }
    }, [props]);

    if (!loading) {
        return <></>;
    }

    return (
        <Oval
            height={80}
            width={80}
            color="rgb(0, 128, 255)"
            wrapperStyle={{}}
            wrapperClass="loading"
            visible={true}
            ariaLabel='oval-loading'
            secondaryColor="rgba(0, 128, 255, 0.5)"
            strokeWidth={4}
            strokeWidthSecondary={4}
            />
    )
}

function Display(props:{
    onMount?: (
        setLoading: (loading: boolean) => void,
        videoElement: React.RefObject<HTMLVideoElement>,
        canvasElement: React.RefObject<HTMLCanvasElement>,
        ) => void;
}): JSX.Element {
    const videoElement = React.useRef<HTMLVideoElement>(null);
    const canvasElement = React.useRef<HTMLCanvasElement>(null);

    let setLoading = (loading: boolean) => {
        console.error("setLoading not set");
    };

    React.useEffect(() => {
        if (props.onMount) {
            props.onMount(setLoading, videoElement, canvasElement);
        }
    });

    return (
        <div className="display">
            <video controls autoPlay id="input_video" ref={videoElement}/>
            <canvas id="output_canvas" width="800px" height="600px" ref={canvasElement} />
            <Loading onMount={(_setLoading) => {
                setLoading = _setLoading;
            }}/>
        </div>
    );
}

function ExecutionControls(props: {
    onMount?: (setCode: (code: string) => void) => void;
}): JSX.Element {
    return (
        <>ciao</>
    )
}

function Sidebar(): JSX.Element {

    let code = EXAMPLE_CODE;

    return (
        <div className="sidebar">
            <Monaco
                height="20em"
                language="mylang"
                theme="vs-dark"
                value={code}
                options={{
                    selectOnLineNumbers: true
                }}
                onChange={(value, event) => {
                    //console.log("onChange", value, event);
                    if (value) {
                        code = value;
                    }
                }}
                onMount={(editor, monaco) => {
                    configure_monaco_editor_language(editor, monaco);
                }}
                className="monaco-editor"
                />
            <ExecutionControls onMount={(setCode) => {
                
            }}/>
        </div>
    );
} 

export function Sequence(): JSX.Element {

    let videoElement = React.useRef<HTMLVideoElement>(null);
    let canvasElement = React.useRef<HTMLCanvasElement>(null);
    let setLoading = (loading: boolean) => {
        console.error("setLoading not set");
    };

    useEffect(() => {
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

        var started = false;

        let tellStarted = () => {
            if (!started) {
                started = true;
                setLoading(false);
            }
        };

        pose.onResults((results/* : Results*/) /*: void*/ => {
            tellStarted();
        });

        let ve = videoElement.current;
        if (ve) {
            let ve1 = ve;
            let camera /*: Camera | null*/ = new Camera(ve1, {
                onFrame: async () => {
                    //console.log(videoElement);
                    await pose.send({image: ve1})
                }//,
                //width: 1280,
                //height: 720
            });

            const TMP_OK = false;

            if (TMP_OK) {
                camera.start().then(() => {
                    console.log("camera started");
                });
            }
        }
    });

    return (
        <div className="sequence-app">
            <Header title="Sequence" root="../../"/>
            <link rel="stylesheet" href="./Sequence.css" />
            <Split className="main-content" gutterSize={5} minSize={[300, 300]}>
                <Display onMount={(_setLoading, videoRef, canvasRef) => {
                    videoElement = videoRef;
                    canvasElement = canvasRef;
                    setLoading = _setLoading;
                }} />
                <Sidebar />
            </Split>
            <div className="bottom">bottom</div>
        </div>
    );
}