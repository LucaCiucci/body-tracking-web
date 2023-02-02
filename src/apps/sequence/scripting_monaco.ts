

import { editor as MonacoEditor } from "monaco-editor"
import monaco_import from "monaco-editor/esm/vs/editor/editor.api"

import { POSE_LANDMARKS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_RIGHT } from '@mediapipe/pose';

export const EXAMPLE_CODE_OLD = `// ciao a tutti
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

// This is written in javascript
export const EXAMPLE_CODE = `// ciao a tutti
// definiamo le posizioni dei punti di riferimento
const braccio_destro = [[RIGHT_WRIST, RIGHT_ELBOW], [RIGHT_ELBOW, RIGHT_SHOULDER]]
const braccio_sinistro = [[LEFT_WRIST, LEFT_ELBOW], [LEFT_ELBOW, LEFT_SHOULDER]]

/**
 * @param {number} N numero di ripetizioni
 */
async function esercizio_braccia(N) {
    add_label("ripetizione", "ripetizione", "red");
    for (let r = 0; r < N; r++) {
        set_label("ripetizione", "ripetizione " + (r + 1) + "/" + N);
        high(braccio_destro);
        await pause(1, "second");
        low(braccio_destro);
        high(braccio_sinistro);
        await pause(1, "second");
        low(braccio_sinistro);
    }
    remove_label("ripetizione");
}

add_label("serie", "serie", "green");
await countdown(3, "inizio tra");
for (let s = 0; s < 3; s++) {
    set_label("serie", "serie " + (s + 1) + "/3");
    await esercizio_braccia(5);
    await countdown(5, "Riposo");
}
remove_label("serie");
`;


const BASIC_KEYWORDS = [
    "def", "routine", "call", "do", "execute", "run", "repeat", "times", "counter"
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
    monaco.languages.register({ id: 'dullscript' });
    monaco.languages.setMonarchTokensProvider('dullscript', {
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
        if (lang.id === "javascript") {
            console.log("Found javascript");
            console.log((lang as any).loader());
        }
    }
}