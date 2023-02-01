
//import * as ts from "typescript";

import { POSE_LANDMARKS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_RIGHT } from '@mediapipe/pose';

import * as drawing from './drawing';

export type Language = 'javascript' | 'typescript' | 'dullscript';

export interface Script {
    code: string;
    language: Language;
}

/**
 * 
 * @param code The code to compile.
 * @param language The language of the code.
 * @returns A function that can be called to execute the code.
 */
export function compile(code: string, language: Language): Function {
    let jsCode = (() => {
        switch (language) {
            case 'javascript':
                const jsCode = `return (async () => { ${code} })();`;
                return jsCode;
            case 'typescript':
                throw new Error("Typescript is not implemented yet");
                //return ts.transpile(code);
            case 'dullscript':
                throw new Error("Dullscript is not implemented yet");
                //return code;
            default:
                throw new Error("Unknown language: " + language);
        }
    })();

    console.warn("Compiling code: " + jsCode);

    // see http://jslint.fantasy.codes/the-function-constructor-is-eval for the warning
    let compiledFunction = new Function(jsCode);

    return compiledFunction;
}

export namespace runner {
    var _abort: boolean = false;
    var _pause: boolean = false;
    var _speed_: number = 1;
    /*export */var iter_interval_ms = 1000 / 2;
    var canvas_updater = () => {};

    export function set_canvas_updater(func: () => void) {
        canvas_updater = func;
    }

    export function get_canvas_updater(): () => void {
        return canvas_updater;
    }

    var _execution: Promise<void> | null = null;

    export class AbortException extends Error {
        constructor(message: string) {
            super(message);
            this.name = "AbortException";
        }
    }

    /**
     * Resets the runner parameters to their default values.
     */
    export function resetParams() {
        setProgramSpeed(1);
        iter_interval_ms = 1000 / 30;
    }

    function resetStateParams() {
        _abort = false;
        _pause = false;
    }

    /**
     * Checks if the program is running.
     */
    export function isRunning(): boolean {
        return _execution !== null;
    }

    /**
     * Checks if the program is in abort state.
     */
    export function isAborted(): boolean {
        return _abort;
    }

    /**
     * Tell the program to abort.
     */
    export function tellAbort() {
        _abort = true;
    }

    /**
     * Checks if the program is running and in aborting state.
     */
    export function isAborting(): boolean {
        return isRunning() && isAborted();
    }

    /**
     * Waits for the program to end.
     * To catch both the normal end and the abort, use the `Promise::finally` method.
     * Note that if the program is not running, the promise resolves immediately.
     * @returns A promise that resolves when the program ends.
     */
    export function waitForProgramEnd(): Promise<void> {
        if (_execution === null) {
            return Promise.resolve();
        } else {
            return _execution;
        }
    }

    /**
     * Launches the program.
     * @param func The function to execute.
     */
    export function launch(func: Function): Promise<void> | null {
        if (isRunning()) {
            throw new Error("The program is already running");
        }
        // waits for the previous program to end,
        // just in case it is still running.
        // TODO maybe this is not necessary
        // since we already checked if the program is running?
        waitForProgramEnd().finally(() => {
            resetStateParams();
            setup_globals();

            // wraps the function in an async function to ensure that it is
            // asynchronous and that it can be awaited.
            let run = async () => {
                const execution_promise = func();
                const result = await execution_promise; // Note: should be undefined... I think
                if (result !== undefined) {
                    console.warn("The execution function returned a value: " + result, "This value will be ignored");
                }
            };

            // starts the execution
            let execution = run();

            // when the execution ends, resets the execution promise
            execution.finally(() => {
                _execution = null;
                drawing.reset_draw_data();
                canvas_updater();
            });

            // stores the execution promise
            _execution = execution;

            let promise = execution;
            return promise;
        });

        return null;
    }

    /**
     * This is a hack to make all the required functions and variables
     * available in the global scope so that they can be accessed by the user's code.
     */
    function setup_globals() {
        let global = window as any;
        resetStateParams();
        landmarks_to_global(global);

        let update_drawing = () => {
            canvas_updater();
        }

        const pause = _impl_pause;
        global["pause"] = pause;
        const high = (connection: [number, number][]) => {
            drawing.highlight_connections(connection);
            update_drawing();
        };
        global["high"] = high;
        const low = (connection: [number, number][]) => {
            drawing.lowlight_connections(connection);
            update_drawing();
        };
        global["low"] = low;
        const add_label = (name: string, color: string = "gray") => {
            drawing.add_label(name, color);
            update_drawing();
        };
        global["add_label"] = add_label;
        const remove_label = (name: string) => {
            drawing.remove_label(name);
            update_drawing();
        };
        global["remove_label"] = remove_label;
        const set_label = (name: string, value: string) => {
            drawing.set_label(name, value);
            update_drawing();
        };
        global["set_label"] = set_label;
        const countdown = async (seconds: number, text: string = "", color: string = "gray") => {
            const name = "__countdown-label";
            add_label(name, color);
            for (let i = seconds; i > 0; i--) {
                set_label(name, text + " " + i);
                await pause(1);
            }
            remove_label(name);
        };
        global["countdown"] = countdown;
    }

    /**
     * This is a hack to get the landmarks into the global scope so
     * that it can be accessed by the user's code.
     */
    function landmarks_to_global(global: any) {
        function to_global(obj: object) {
            for (let key in obj) {
                global[key] = (obj as any)[key];
            }
        }
        to_global(POSE_LANDMARKS);
        to_global(POSE_LANDMARKS_LEFT);
        to_global(POSE_LANDMARKS_RIGHT);
    }

    /**
     * Checks if the program is paused.
     */
    export function isProgramPaused(): boolean {
        return _pause;
    }

    /**
     * Sets the program to pause.
     */
    export function setProgramPaused(pause: boolean) {
        _pause = pause;
    }

    /**
     * Gets the program speed.
     */
    export function getProgramSpeed(): number {
        return _speed_;
    }

    /**
     * Sets the program speed.
     */
    export function setProgramSpeed(speed: number) {
        // get the stack trace
        //let stack = new Error().stack;
        //console.log("stack", stack);
        console.log("Setting speed to " + speed);
        _speed_ = speed;
    }

    /**
     * Waits for the given number of seconds (implementation).
     * If pause is set, waits until pause is unset.
     * 
     * ## Remarks
     * - This is the actual pause implementation, it is meant to be
     *   used by the user's code with an alias or a wrapper called `pause`.
     * @param seconds time in seconds to wait
     */
    async function _impl_pause(seconds: number): Promise<void> {

        let to_wait_ms = seconds * 1000;
        console.log("Waiting for " + to_wait_ms + " ms ", _speed_);

        const start_time = Date.now();

        let iter_wait_real_tot = 0;
        let iter_wait_real_tot_2 = 0;

        while (to_wait_ms >= 0.1) { // we ignore pauses of less than 0.1 ms to avoid infinite loops due to rounding errors
            _impl_check_abort();
            await _impl_while_pause();

            // This is the time to wait for the next iteration.
            // it is the minimum of the time to wait and the iteration interval.
            // Note that if the speed is different than 1, the time to wait
            // is divided by the speed.
            let iter_wait_real = Math.min(to_wait_ms / getProgramSpeed(), iter_interval_ms);
            iter_wait_real_tot += iter_wait_real;

            // waits
            const start2 = Date.now();
            await delay(iter_wait_real);
            const end2 = Date.now();
            iter_wait_real_tot_2 += end2 - start2;

            // Updates the time to wait.
            // Note that if the speed is different than 1, the time to wait
            // is multiplied by the speed.
            to_wait_ms -= iter_wait_real * getProgramSpeed();
        }

        const end_time = Date.now();

        console.log("Waited for " + (end_time - start_time) + " ms, ", iter_wait_real_tot, iter_wait_real_tot_2);
    }

    /**
     * Wait until pause is unset.
     */
    async function _impl_while_pause() {
        while (_pause) {
            _impl_check_abort();
            await delay(iter_interval_ms);
        }
    }

    async function delay(ms: number) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Checks if abort is set and throws an `AbortException` if it is.
     */
    function _impl_check_abort(): void {
        if (_abort) {
            _impl_throw_abort();
        }
    }

    /**
     * Throws an `AbortException`.
     */
    function _impl_throw_abort(): void {
        throw new AbortException("Aborted");
    }
}

