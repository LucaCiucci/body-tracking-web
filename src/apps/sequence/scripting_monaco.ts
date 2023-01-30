

import { editor as MonacoEditor } from "monaco-editor"
import monaco_import from "monaco-editor/esm/vs/editor/editor.api"

import { POSE_LANDMARKS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_RIGHT } from '@mediapipe/pose';

export const EXAMPLE_CODE = `// ciao a tutti
# definiamo le posizioni dei punti di riferimento
def braccio_destro [RIGHT_WRIST-RIGHT_ELBOW, RIGHT_ELBOW-RIGHT_SHOULDER]
def braccio_sinistro [LEFT_WRIST-LEFT_ELBOW, LEFT_ELBOW-LEFT_SHOULDER]

routine esercizio_braccia N integer
    repeat N times counter "ripetizioni"
        high braccio_destro
        pause 1 second
        low braccio_destro
        high braccio_sinistro
        pause 1 second
        low braccio_sinistro

repeat 3 times counter "serie"
    show "Esercizio braccia"
    countdown 3 seconds
    esercizio_braccia 10
    show "Riposo"
    countdown 30 seconds
`;

const BASIC_KEYWORDS = [
    "def", "routine", "repeat", "pause", "high", "low", "show", "countdown",
    "seconds", "milliseconds", "times",
    "integer", "string"
];

const KEYWORDS = (() => {
    let keywords = BASIC_KEYWORDS;
    let add_keys_of = (obj: any) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                keywords.push(key);
            }
        }
    };
    add_keys_of(POSE_LANDMARKS);
    add_keys_of(POSE_LANDMARKS_LEFT);
    add_keys_of(POSE_LANDMARKS_RIGHT);
    return keywords;
})();

// See https://stackoverflow.com/questions/71563507/how-to-load-custom-language-in-monaco-using-vuejs-webpack
// and https://stackblitz.com/edit/vue-cli-monaco-editor?file=src%2Fcustom-lang-monarch.js
export function configure_monaco_editor_language(editor: MonacoEditor.IStandaloneCodeEditor, monaco: typeof monaco_import) {
    monaco.languages.register({ id: 'mylang' });
    console.log(KEYWORDS);
    monaco.languages.setMonarchTokensProvider('mylang', {
        keywords: KEYWORDS,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        tokenizer: {
            root: [
                [/[a-zA-Z_$][\w$]*/,
                {
                  cases: {
                    //'@typeKeywords': 'keyword',
                    '@keywords': 'keyword',
                    '@default': 'identifier',
                  },
                }],
                [/\d+/, 'number'],
                
                { include: '@comment' },
                { include: '@string' },
            ],
            comment: [
                [/(\/\/|#).*$/, 'comment'],
            ],
            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\/\/.*$/, 'comment'],
            ],
            string: [
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@stringBody'],
            ],
            stringBody: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop'],
            ],
        }
    });

    //console.log(monaco.languages.getLanguages());

    for (let lang of monaco.languages.getLanguages()) {
        if (lang.id == "javascript") {
            console.log("Found javascript");
            console.log((lang as any).loader());
        }
    }
}