
//import a from "./Sequence.css";

import Split from 'react-split'

import { Header } from "../../components/header";
import { Oval } from 'react-loader-spinner'

import { Pose, Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

import Monaco from '@monaco-editor/react';

import React, { useEffect } from "react";

import "./index.css";
import { configure_monaco_editor_language } from './scripting_monaco';

import { Slider } from '@mui/material';
import Stack from '@mui/material/Stack';
import { FastRewind, FastForward } from '@mui/icons-material';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { NormalizedLandmarkList } from '@mediapipe/drawing_utils';
import Checkbox from '@mui/material/Checkbox';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
//import Select, { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
//import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import ciao from "./ciao.png"


import { compile, extension_to_language, Language, language_to_extension, runner } from './scripting';
import { calcola_angoli, draw, draw_data, set_x_tmp_inverted, x_tmp_inverted } from './drawing';
import { local_data } from './data';
import { SimplifiedFacingMode } from './types';

const TMP_OK = true;

var current_program_code = ``;
var current_program_language: Language = "dullscript";


{
    const user_data = local_data.data().user_data;
    const script = user_data.current_user_script;
    if (script) {
        current_program_code = script.code;
        current_program_language = script.language;
    }
}

function saveAs(blob: Blob, filename: string) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
    a.click();
}

const _save_timeout: number | null = null;
const save_interval_ms = 1000;
function tell_save_current_program_code_interval() {
    if (_save_timeout) {
        clearTimeout(_save_timeout);
    }
    setTimeout(() => {
        local_data.data().user_data.current_user_script = {
            code: current_program_code,
            language: current_program_language
        };
        local_data.save();
    }, save_interval_ms);
}

const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
});

/**
 * Shows a loading spinner while the loading prop is true.
 */
function Loading(props: {
    loading?: boolean;
}): JSX.Element {

    if (!props.loading) {
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

function createInputVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.autoplay = true;
    video.controls = true;
    video.id = "input_video";
    return video;
}

function createOutputCanvasElement(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.id = "output_canvas";
    canvas.width = 800;
    canvas.height = 600;
    return canvas;
}

function Display(props:{
    loading: boolean,
    videoElement?: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement,
    inverted: boolean,
    set_valore_angolo_spalle: (valore_angolo_spalle: number) => void,
    set_valore_angolo_collo: (valore_angolo_gomiti: number) => void,
}): JSX.Element {

    if (props.canvasElement && props.videoElement) {
        if (props.inverted) {
            props.videoElement.style.transform = "scaleX(-1)";
        } else {
            props.videoElement.style.transform = "scaleX(1)";
        }
    }
    
    return (
        <div className="display" ref={ ref => {
            if (ref && props.videoElement && props.canvasElement) {
                ref.prepend(props.videoElement, props.canvasElement);
            }
        } }>
            <Loading loading={props.loading} />
        </div>
    );
}

function ExecutionControls(props: {
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onSpeedChange?: (speed: number) => void;
    onMount?: (setCode: (code: string) => void) => void;
}): JSX.Element {
    const [speed, setSpeed] = React.useState(1);
    return (
        <div>
            <Stack spacing={2} direction="row" alignItems="center" justifyContent="center">
                <Button onClick={() => {
                    if (props.onPlay) {
                        props.onPlay();
                    }
                }}>Play</Button>
                <Button onClick={() => {
                    if (props.onPause) {
                        props.onPause();
                    }
                }}>Pause</Button>
                <Button onClick={() => {
                    if (props.onStop) {
                        props.onStop();
                    }
                }}>Stop</Button>
            </Stack>
            <Stack spacing={0} direction="row" sx={{ mb: 1 }} alignItems="center">
                <div style={{width: "4em"}}>
                    {speed}x
                </div>
                <FastRewind />
                <Slider aria-label="Volume" value={speed} min={0.1} max={3} step={0.01} onChange={(event, value) => {
                    setSpeed(value as number);
                    if (props.onSpeedChange) {
                        props.onSpeedChange(value as number);
                    }
                }} />
                <FastForward />
                <Button onClick={() => {
                    setSpeed(1);
                    if (props.onSpeedChange) {
                        props.onSpeedChange(1);
                    }
                }}>reset</Button>
            </Stack>
        </div>
    )
}

function Sidebar(props: {
    inverted: boolean,
    setInverted: (inverted: boolean) => void
    openExamplesDlg: () => void;
    saveProgram: () => void;
    loadProgram: () => void;
    onLoad: (setCode: (code: string) => void) => void;
    language: Language;
    setLanguage: (language: Language) => void;
    default_code: string;
}): JSX.Element {

    const [speed, setSpeed] = React.useState(1);
    tmp_unused(setSpeed);

    return (
        <Split className="sidebar" gutterSize={5} minSize={[100, 100]} direction="vertical">
            <div style={{
                display: "flex",
                flexDirection: "column",
            }}>
                <div style={{
                    flexGrow: 1,
                }}>
                    <Monaco
                        height="98%"
                        language={props.language}
                        theme="vs-dark"
                        value={props.default_code}
                        options={{
                            selectOnLineNumbers: true
                        }}
                        onChange={(value, event) => {
                            if (value) {
                                current_program_code = value;
                                tell_save_current_program_code_interval();
                            }
                        }}
                        onMount={(editor, monaco) => {
                            configure_monaco_editor_language(editor, monaco);
                            props.onLoad((code: string) => {
                                editor.setValue(code);
                            });
                            /*(async () => {
                                let response = await fetch(default_program_path);
                                current_program_code = await response.text();
                                editor.setValue(current_program_code);
                            })()*/
                        }}
                        className="monaco-editor"
                    />
                </div>
                <Stack spacing={2} direction="row" alignItems="center" justifyContent="center">
                    <Button onClick={() => {
                        props.saveProgram();
                    }}>Save</Button>
                    <Button onClick={() => {
                        props.loadProgram();
                    }}>Load</Button>
                    <Button onClick={() => {
                        props.openExamplesDlg();
                    }}>Examples</Button>
                    <FormControl>
                        <InputLabel id="editor-language-select-label">Language</InputLabel>
                        <Select
                            labelId="editor-language-select-label"
                            id="editor-language-select"
                            value={props.language}
                            onChange={(event) => {
                                props.setLanguage(event.target.value as Language);
                            }}
                        >
                            <MenuItem value={"javascript"}>JavaScript</MenuItem>
                            <MenuItem value={"typescript"}>Typescript</MenuItem>
                            <MenuItem value={"dullscript"}>Dullscript</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </div>
            <div>
                <ExecutionControls onMount={(setCode) => {
                }} onPlay={async () => {
                    const program = compile(current_program_code, current_program_language);
                    if (program) {
                        if (runner.isRunning()) {
                            runner.tellAbort();
                            await runner.waitForProgramEnd();
                        }
                        runner.setProgramSpeed(speed);
                        let execution = runner.launch(program);
                        if (execution) {
                            execution.catch((e) => {
                                if (e instanceof runner.AbortException) {
                                    console.log("Program aborted");
                                }
                                else {
                                    console.error(e);
                                }
                            });
                        }
                    }
                }} onPause={() => {
                    runner.setProgramPaused(true);
                }} onStop={() => {
                    runner.tellAbort();
                }} onSpeedChange={(speed) => {
                    runner.setProgramSpeed(speed);
                }}
                />
                <div>
                    <Checkbox checked={props.inverted} onChange={(event) => {
                        props.setInverted(event.target.checked);
                    }} /> Inverted
                </div>
            </div>
        </Split>
    );
}

function Bottom(props: {
    onCameraFacingModeChange?: (facingMode: "user" | "environment") => void,
    facingMode: "user" | "environment",
    model_complexity: 0 | 1 | 2,
    set_model_complexity: (model_complexity: 0 | 1 | 2) => void
}): JSX.Element {
    return (
        <div>
            <select name="Facing Mode" onChange={(e) => {
                if (props.onCameraFacingModeChange) {
                    props.onCameraFacingModeChange(e.target.value as "user" | "environment");
                }
            }} value={props.facingMode}>
                <option value="user">user</option>
                <option value="environment">environment</option>
            </select>
            <select name="Model Complexity" onChange={(e) => {
                let value = e.target.value;
                switch (value) {
                    case "0":
                        props.set_model_complexity(0);
                        break;
                    case "1":
                        props.set_model_complexity(1);
                        break;
                    case "2":
                        props.set_model_complexity(2);
                        break;
                    default:
                        console.error("Invalid model complexity");
                }
            }} value={props.model_complexity}>
                <option value={"0"}>0</option>
                <option value={"1"}>1</option>
                <option value={"2"}>2</option>
            </select>
            <button onClick={() => {
                local_data.reset();
                window.location.reload();
            }} >Reset all</button>
        </div>
    )
}

namespace acquisition {
    var _camera: Camera | null = null;
    var _canvasElement: HTMLCanvasElement | null = null;
    var _videoElement: HTMLVideoElement | null = null;
    var set_valore_angolo_spalle: (valore_angolo_spalle: number) => void = () => { };
    var set_valore_angolo_collo: (valore_angolo_gomiti: number) => void = () => { };

    export function set_set_valore_angolo_spalle(set_valore_angolo_spalle_: (valore_angolo_spalle: number) => void) {
        set_valore_angolo_spalle = set_valore_angolo_spalle_;
    }

    export function set_set_valore_angolo_collo(set_valore_angolo_collo_: (valore_angolo_collo: number) => void) {
        set_valore_angolo_collo = set_valore_angolo_collo_;
    }

    export function camera() {
        return _camera;
    }

    export function set_camera(camera: Camera | null) {
        _camera = camera;
    }

    export function canvasElement() {
        return _canvasElement;
    }

    export function set_canvasElement(canvasElement: HTMLCanvasElement | null) {
        _canvasElement = canvasElement;
    }

    export function videoElement() {
        return _videoElement;
    }

    export function set_videoElement(videoElement: HTMLVideoElement | null) {
        _videoElement = videoElement;
    }

    export async function startAcquisition(setLoading: (loading: boolean) => void, facingMode: "user" | "environment" = "user") {

        let _video = videoElement();
        if (!_video) {
            return;
        }
        let video = _video;

        if (_camera) {
            await _camera.stop();
            _camera = null;
        }
    
        var pose = new Pose({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }});
    
        pose.setOptions({
            modelComplexity: 0,
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

        function transformResults(results: Results) {
            if (x_tmp_inverted) {
                let landmarks = results.poseLandmarks as (NormalizedLandmarkList | undefined);
                if (landmarks) {
                    landmarks.forEach((landmark) => {
                        landmark.x = 1 - landmark.x;
                    });
                }
            }
        };
    
        pose.onResults((results/* : Results*/) /*: void*/ => {
            tellStarted();
            transformResults(results);
            draw_data.pose = results;
            update_canvas();
        });
    
        _camera = new Camera(video, {
            onFrame: async () => {
                await pose.send({image: video});
            },//,
            //width: 1280,
            //height: 720
            facingMode: facingMode
        });
    
        if (TMP_OK) {
            await _camera.start();
        }
    }

    export async function stopAcquisition() {
        if (_camera) {
            await _camera.stop();
            _camera = null;
        }
        _canvasElement = null;
        _videoElement = null;
    }

    export async function update_canvas() {
        const canvas = canvasElement();
        const video = videoElement();
        if (canvas && video) {
            draw(canvas, video);
            let angoli = calcola_angoli();
            set_valore_angolo_spalle(angoli.spalle / 15);
            set_valore_angolo_collo(angoli.collo / 10);
            console.log(angoli);
        }
    }
}
runner.set_canvas_updater(acquisition.update_canvas);



function tmp_unused(..._args: any[]) {
}

tmp_unused(local_data.KEY);

function LinearGauge(props: {
    value: number, // -1 to 1
    label: string,
}): JSX.Element {

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.5em",
            margin: "0.5em",
        }}>
            {/*label*/}
            <div style={{width: "5em"}}>{props.label}</div>
            <div style={{
                // gradient where green is the center at 0 and red is at -1 and +1
                // violet-red-orange-yello-green-yellow-orange-red-violet
                background: "linear-gradient(90deg, #8B008B, #FF0000, #FFA500, #FFFF00, #008000, #FFFF00, #FFA500, #FF0000, #8B008B)",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid gray",
                flexGrow: 1,
            }}>
                {/*cursor*/}
                <div style={{
                    width: "0.5em",
                    height: "140%",
                    borderRadius: "0.25em",
                    background: "none",
                    transform: `translateY(-15%)`,
                    borderTop: "5px solid white",
                    borderBottom: "5px solid white",
                    borderLeft: "2px solid black",
                    borderRight: "2px solid black",
                    marginLeft: `${(props.value + 1) * 50}%`,
                }}></div>
                {/* transform: `translateX(${(props.value + 1) * 50}%)`, */}
            </div>
        </div>
    );
}

export function App(props: {
}): JSX.Element {

    const [loading, setLoading] = React.useState(true);
    const set_loading = (loading: boolean) => {
        setLoading(loading);
    };
    interface SetCodeFunction {
        setCode: (code: string) => void;
    }
    const [set_code_f, set_set_code_f] = React.useState<SetCodeFunction | null>(null);

    // !!!
    const [inverted, _setInverted] = React.useState(local_data.data().settings.inverted);
    const setInverted = (inverted: boolean) => {
        _setInverted(inverted);
        local_data.data().settings.inverted = inverted;
        local_data.save();
    };
    set_x_tmp_inverted(inverted);

    const [facingMode, _setFacingMode] = React.useState(local_data.data().settings.facingMode);
    const setFacingMode = (facingMode: SimplifiedFacingMode) => {
        _setFacingMode(facingMode);
        local_data.data().settings.facingMode = facingMode;
        local_data.save();
    };
    const [model_complexity, _setModelComplexity] = React.useState(local_data.data().settings.model_complexity);
    const setModelComplexity = (model_complexity: 0 | 1 | 2) => {
        _setModelComplexity(model_complexity);
        local_data.data().settings.model_complexity = model_complexity;
        local_data.save();
    };

    if (!acquisition.videoElement() || !acquisition.canvasElement()) {
        acquisition.set_videoElement(createInputVideoElement());
        acquisition.set_canvasElement(createOutputCanvasElement());
        acquisition.startAcquisition(set_loading, facingMode);
    }

    const videoElement = (() => {
        let v = acquisition.videoElement();
        if (v) {
            return v;
        }
        return undefined;
    })();
    const canvasElement = (() => {
        let c = acquisition.canvasElement();
        if (c) {
            return c;
        }
        return undefined;
    })();
    const [language, _setLanguage] = React.useState<Language>(current_program_language);
    const setLanguage = (language: Language) => {
        current_program_language = language;
        tell_save_current_program_code_interval();
        _setLanguage(language);
    }
    const set_code = (code: string, language: Language) => {
        if (set_code_f) {
            current_program_code = code;
            setLanguage(language);
            set_code_f.setCode(code);
        }
    };

    const [examplesDlgOpen, setExamplesDlgOpen] = React.useState(false);

    const [default_code, _set_default_code] = React.useState(current_program_code);
    if (default_code.length === 0) {
        const f = fetch(process.env.PUBLIC_URL + "/sequences/examples/full_example.ds");
        f.then((response) => {
            response.text().then((text) => {
                _set_default_code(text);
                setLanguage("dullscript");
            });
        });
    }

    // stop acquisition when component unmounts
    useEffect(() => {
        return () => {
            //console.warn("unmounting");
            //acquisition.stopAcquisition();
        }
    }, []);

    let angoli = calcola_angoli();

    let [valore_angolo_spalle, set_valore_angolo_spalle] = React.useState(0);
    let [valore_angolo_collo, set_valore_angolo_collo] = React.useState(0);

    acquisition.set_set_valore_angolo_spalle(set_valore_angolo_spalle);
    acquisition.set_set_valore_angolo_collo(set_valore_angolo_collo);

    return (
        <ThemeProvider theme={darkTheme}>
        <Stack height="100%" className="sequence-app">
            <Header title="VDU posture monitor" />
            <Split className="main-content" gutterSize={5} minSize={[300, 300]} onDrag={() => {
                acquisition.update_canvas();
            }}>
                <Display
                    videoElement={videoElement}
                    canvasElement={canvasElement}
                    loading={loading}
                    inverted={inverted}
                    set_valore_angolo_spalle={set_valore_angolo_spalle}
                    set_valore_angolo_collo={set_valore_angolo_collo}
                />
                <Split className="sidebar" gutterSize={5} minSize={[100, 100]} direction="vertical">
                    <div>
                        {/*<div style={{fontSize: "150%", textAlign: "center"}}>Andamento postura</div>*/}
                        <img
                            src={ciao}
                            alt="MANCANTE"
                            // full width, vertically centered
                            style={{display: "block", width: "100%", height: "100%", objectFit: "contain"}}
                        />
                    </div>
                    <div>
                        <LinearGauge value={valore_angolo_collo} label='Collo' />
                        <LinearGauge value={valore_angolo_spalle} label='Spalle' />
                    </div>
                </Split>
            </Split>
            <Bottom onCameraFacingModeChange={(mode) => {
                setFacingMode(mode);
                // TODO fix
                // acquisition.startAcquisition(set_loading, mode);
                console.warn("TODO: fix camera facing mode change");
                window.alert(BUG_MESSAGE);
                window.location.reload();
            }} facingMode={facingMode}
            model_complexity={model_complexity}
            set_model_complexity={(model_complexity) => {
                setModelComplexity(model_complexity);
                // TODO fix
                // acquisition.startAcquisition(set_loading, mode);
                console.warn("TODO: fix model complexity change");
                window.alert(BUG_MESSAGE);
                window.location.reload();
            }}
            />
        </Stack>

        <Modal open={examplesDlgOpen} onClose={() => { setExamplesDlgOpen(false) }}>
            <Box style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "50%",
                height: "50%",
                backgroundColor: "rgb(30,30,30)",
            }}>
                <div className="modal-title">Examples</div>
                <ExamplesList openExample={(fileName, language) => {
                    let url = process.env.PUBLIC_URL + "/sequences/examples/" + fileName;
                    fetch(url).then((response) => {
                        return response.text();
                    }).then((text) => {
                        set_code(text, language);
                    });
                }} />
            </Box>
        </Modal>
        <CssBaseline />
        </ThemeProvider>
    );
}

const BUG_MESSAGE = "Due to an internal bug, page have to be reloaded to change this parameter, sorry for the inconvenience.";

function ExamplesList(props:{
    openExample: (fileName: string, language: Language) => void;
}): JSX.Element {

    const examples: { name: string, file: string, language: Language }[] = [
        { name: "elaborated example (DS)", file: "full_example.ds", language: "dullscript" },
        { name: "elaborated example (JS)", file: "full_example.js", language: "javascript" },
    ];

    return (
        <List sx={{
            width: "100%",
        }}>
            {
                examples.map((example) => {
                    return (
                        <ListItemButton key={example.name} onClick={() => props.openExample(example.file, example.language)}>
                            <ListItemText primary={example.name} />
                        </ListItemButton>
                    );
                })
            }
        </List>
    );
}