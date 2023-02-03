
import { Script, string_to_language } from "./scripting";
import { ModelComplexity, number_to_model_complexity, SimplifiedFacingMode, string_to_simplified_facing_mode } from "./types";

export namespace local_data {

    export const KEY = "sequence-app-data";

    /**
     * The settings of the app.
     */
    export interface Settings {
        /**
         * The facing mode of the camera.
         */
        facingMode: SimplifiedFacingMode,

        /**
         * Whether the camera is inverted.
         */
        inverted: boolean,

        /**
         * The complexity of the model.
         * 0: low
         * 1: medium
         * 2: high (full)
         */
        model_complexity: ModelComplexity,
    };

    export function default_settings(): Settings {
        return {
            facingMode: "user",
            inverted: false,
            model_complexity: 0,
        };
    }

    export function load_settings(settings: Settings, json: any) {
        if (json.facingMode !== undefined) {
            if (typeof json.facingMode !== "string") {
                throw new Error(`Invalid facingMode, expected string but got ${typeof json.facingMode}`);
            }
            settings.facingMode = string_to_simplified_facing_mode(json.facingMode);
        }
        if (json.inverted !== undefined) {
            if (typeof json.inverted !== "boolean") {
                throw new Error(`Invalid inverted, expected boolean but got ${typeof json.inverted}`);
            }
            settings.inverted = json.inverted;
        }
        if (json.model_complexity !== undefined) {
            if (typeof json.model_complexity !== "number") {
                throw new Error(`Invalid model_complexity, expected number but got ${typeof json.model_complexity}`);
            }
            settings.model_complexity = number_to_model_complexity(json.model_complexity);
        }
    }

    /**
     * Other data of the app.
     */
    export interface UserData {
        current_user_script: Script | null,
    };

    export function default_user_data(): UserData {
        return {
            current_user_script: null,
        };
    }

    export function load_user_data(user_data: UserData, json: any) {
        if (json.current_user_script !== undefined && json.current_user_script !== null) {
            if (typeof json.current_user_script !== "object") {
                throw new Error(`Invalid current_user_script, expected object but got ${typeof json.current_user_script}`);
            }
            const code = json.current_user_script.code;
            if (typeof code !== "string") {
                throw new Error(`Invalid current_user_script.code, expected string but got ${typeof code}`);
            }
            const language = json.current_user_script.language;
            if (typeof language !== "string") {
                throw new Error(`Invalid current_user_script.language, expected string but got ${typeof language}`);
            }
            user_data.current_user_script = {
                code,
                language: string_to_language(language),
            };
        }
    }

    export interface Data {
        settings: Settings,
        user_data: UserData,
    };


    export function default_data(): Data {
        return {
            settings: default_settings(),
            user_data: default_user_data(),
        };
    }

    export function load_data(data: Data, json: any) {
        if (json.settings !== undefined) {
            if (typeof json.settings !== "object") {
                throw new Error(`Invalid settings, expected object but got ${typeof json.settings}`);
            }
            load_settings(data.settings, json.settings);
        }
        if (json.user_data !== undefined) {
            if (typeof json.user_data !== "object") {
                throw new Error(`Invalid user_data, expected object but got ${typeof json.user_data}`);
            }
            load_user_data(data.user_data, json.user_data);
        }
    }

    var _data: Data = (() => {
        let data: Data = default_data();
        const data_str = localStorage.getItem(KEY);
        const data_obj = data_str && JSON.parse(data_str);
        if (data_obj) {
            load_data(data, data_obj);
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
    export function reset() {
        _data = default_data();
        save();
    }
}
