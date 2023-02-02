
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


import { compile, Language, runner, Script } from './scripting';
import { draw, draw_data, set_x_tmp_inverted, x_tmp_inverted } from './drawing';

const TMP_OK = true;

type SimplifiedFacingMode = "user" | "environment";

var current_program_code = `# See https://mediapipe.dev/images/mobile/pose_tracking_full_body_landmarks.png
# for the list of joints (note that here they are written in uppercase).
def braccio_destro [[RIGHT_WRIST, RIGHT_ELBOW], [RIGHT_ELBOW, RIGHT_SHOULDER]]
def braccio_sinistro [[LEFT_WRIST, LEFT_ELBOW], [LEFT_ELBOW, LEFT_SHOULDER]]

routine esercizio_braccia N
    add_label "ripetizione" "red"
    repeat N times counter r
        set_label "ripetizione" ("ripetizione " + (r + 1) + "/" + N)
        high braccio_destro
        pause 1 "second"
        low braccio_destro
        high braccio_sinistro
        pause 1 "second"
        low braccio_sinistro
    remove_label "ripetizione"

add_label "serie" "green"
countdown 3 "inizio tra"
repeat 3 times counter s
    set_label "serie" ("serie " + (s + 1) + "/3")
    execute esercizio_braccia 5
    countdown 5 "Riposo"
remove_label "serie"`;
var current_program_language: Language = "dullscript";

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
    inverted: boolean
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
    onLoad: (setCode: (code: string) => void) => void;
    language: Language;
    setLanguage: (language: Language) => void;
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
                        value={current_program_code}
                        options={{
                            selectOnLineNumbers: true
                        }}
                        onChange={(value, event) => {
                            if (value) {
                                current_program_code = value;
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
        </div>
    )
}

namespace acquisition {
    var _camera: Camera | null = null;
    var _canvasElement: HTMLCanvasElement | null = null;
    var _videoElement: HTMLVideoElement | null = null;

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
        }
    }
}
runner.set_canvas_updater(acquisition.update_canvas);

namespace local_storage_settings {
    export const KEY = "sequence-app-settings";
    export interface Settings {
        facingMode: SimplifiedFacingMode,
        inverted: boolean,
        model_complexity: 0 | 1 | 2,
    };
    var _settings: Settings = (() => {
        let settings: Settings = {
            facingMode: "user",
            inverted: false,
            model_complexity: 0
        }

        const settings_str = localStorage.getItem(KEY);
        const settings_obj = settings_str && JSON.parse(settings_str);
        if (settings_obj) {
            if (settings_obj.facingMode !== undefined) {
                settings.facingMode = settings_obj.facingMode;
            }
            if (settings_obj.inverted !== undefined) {
                settings.inverted = settings_obj.inverted;
            }
            if (settings_obj.model_complexity !== undefined) {
                settings.model_complexity = settings_obj.model_complexity;
            }
        }
        return settings;
    })();
    export function settings() {
        return _settings;
    }
    export function save() {
        const settings_str = JSON.stringify(_settings);
        localStorage.setItem(KEY, settings_str);
    }
}

interface Patient {
    id: string;
    name: string;
    scripts: Script[];
}

namespace local_data {
    export const KEY = "sequence-app-data";
    export interface Data {
        patients: Patient[];
    };
    var _data: Data = (() => {
        let data: Data = {
            patients: []
        }

        const data_str = localStorage.getItem(KEY);
        const data_obj = data_str && JSON.parse(data_str);
        if (data_obj) {
            if (data_obj.patients !== undefined) {
                data.patients = data_obj.patients;
            }
        }
        return data;
    })();
    export function data() {
        return _data;
    }
    export function save() {
        const data_str = JSON.stringify(_data);
        localStorage.setItem(KEY, data_str);
    }
}

function tmp_unused(..._args: any[]) {
}

tmp_unused(local_data.KEY);

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
    const [inverted, _setInverted] = React.useState(local_storage_settings.settings().inverted);
    const setInverted = (inverted: boolean) => {
        _setInverted(inverted);
        local_storage_settings.settings().inverted = inverted;
        local_storage_settings.save();
    };
    set_x_tmp_inverted(inverted);

    const [facingMode, _setFacingMode] = React.useState(local_storage_settings.settings().facingMode);
    const setFacingMode = (facingMode: SimplifiedFacingMode) => {
        _setFacingMode(facingMode);
        local_storage_settings.settings().facingMode = facingMode;
        local_storage_settings.save();
    };
    const [model_complexity, _setModelComplexity] = React.useState(local_storage_settings.settings().model_complexity);
    const setModelComplexity = (model_complexity: 0 | 1 | 2) => {
        _setModelComplexity(model_complexity);
        local_storage_settings.settings().model_complexity = model_complexity;
        local_storage_settings.save();
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

    // stop acquisition when component unmounts
    useEffect(() => {
        return () => {
            //console.warn("unmounting");
            //acquisition.stopAcquisition();
        }
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
        <Stack height="100%" className="sequence-app">
            <Header title="Sequence" />
            <Split className="main-content" gutterSize={5} minSize={[300, 300]} onDrag={() => {
                acquisition.update_canvas();
            }}>
                <Display
                    videoElement={videoElement}
                    canvasElement={canvasElement}
                    loading={loading}
                    inverted={inverted}
                />
                <Sidebar
                    inverted={inverted}
                    setInverted={setInverted}
                    openExamplesDlg={() => setExamplesDlgOpen(true)}
                    saveProgram={() => {
                        alert("SAVE PROGRAM");
                    }}
                    onLoad={(_setCode) => {
                        set_set_code_f({setCode: _setCode});
                    }}
                    language={language}
                    setLanguage={setLanguage}
                />
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