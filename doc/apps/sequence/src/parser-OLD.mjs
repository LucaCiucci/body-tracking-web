
/*
Example code:
```
def braccio_destro [right_wrist-right_elbow, right_elbow-right_shoulder]
def braccio_sinistro [left_wrist-left_elbow, left_elbow-left_shoulder]

routine esercizio_braccia N integer
    repeat N times show_counter ripetizioni
        high braccio_destro
        pause 1 second
        low braccio_destro
        high braccio_sinistro
        pause 1 second
        low braccio_sinistro

repeat 3 times show_counter serie
    show Esercizio braccia
    countdown 3 seconds
    esercizio_braccia 10
    show Riposo
    countdown 30 seconds
```
*/

/**
 * This represents a node in the AST.
 */
class RawStatement {
    /**
     * 
     * @param {string} line 
     */
    constructor(line) {

        /**
         * @type {string[]}
         */
        this.body = [];

        /**
         * 
         */
        this.line = line;
    }
}

/**
 * 
 * @param {string} src 
 */
function separate_raw_statements(src) {
    let lines = src.split("\n");
    return consume_lines(lines, 0, undefined)[0];
}

/**
 * this function takes the lines and produces a list of statements.
 * 
 * if an "indent" is given, it will consume all the lines until it finds a line whith
 * a lower indent.
 * 
 * @param {string[]} lines
 * @param {number} start_index
 * @param {number | undefined} indent
 * 
 * @returns {[RawStatement[], number, number]} the list of statements, the index of the last line consumed, the next non empty line indent
 */
function consume_lines(lines, start_index, indent) {
    /**
     * @type {RawStatement[]}
     */
    let statements = [];

    let last_consumed_line = start_index;

    for (let i = start_index; i < lines.length; ++i) {
        const line = lines[i];
        const trimmed_line = line.trim();

        // empty line
        if (trimmed_line.length == 0)
            continue;

        // comment
        if (trimmed_line.startsWith("//") || trimmed_line.startsWith("#"))
            continue;

        // the number of spaces at the beginning of the line
        const line_indent = line.search(/\S/);

        // if the line is indented less than the current indent, we are done
        const is_ok = (indent === undefined) || (line_indent >= indent);

        if (!is_ok) {
            return [statements, last_consumed_line, i];
        }

        let statement = new RawStatement(trimmed_line)

        //console.log(consume_lines(lines, i + 1, line_indent + 4));
        const [sub_statements, sub_last_used, next_line] = consume_lines(lines, i + 1, line_indent + 4);
        if (sub_statements.length > 0) {
            statement.body = sub_statements;
            i = sub_last_used;
        }

        statements.push(statement);
        last_consumed_line = i;
    }

    return [statements, last_consumed_line, lines.length];
}

export async function test() {
    let lines = [
        "ciao a tutti",
        "    ciao 1",
        "    ciao 2",
        "    ciao 3",
        "        ciao 4",
        "pippo",
        "pluto",
        "    ciao 5",
    ]

    let code = await (await fetch("./src/example.txt")).text();
    let statements = separate_raw_statements(code);
    console.log(statements);
}


/**
 * Takes a line and returns a list of tokens.
 * 
 * @param {string} line
 * 
 * @returns {string[]}
 */
function tokenize_line(line) {
    line = line.trim();

    let tokens = [];

    let current_token = "";

    let flush_current_token = () => {
        if (current_token.length > 0) {
            tokens.push(current_token);
            current_token = "";
        }
    };

    let in_string = false;

    for (let i = 0; i < line.length; ++i) {
        const c = line[i];

        if (c == '"') {
            in_string = !in_string;
        }

        if (in_string) {
            current_token += c;
            continue;
        }

        if (c == " ") {
            flush_current_token();
        } else if (c == "(" || c == ")" || c == "[" || c == "]" || c == ",") {
            flush_current_token();
            tokens.push(c);
        } else {
            current_token += c;
        }
    }

    flush_current_token();

    return tokens;
}

/** @typedef { Literal, Variable } Expression */

class Literal {
    /**
     * @param {string} value
     */
    constructor(value) {
        /**
         * @type {string}
         */
        this.value = value;
    }
}

class Variable {
    /**
     * @param {string} name
     */
    constructor(name) {
        /**
         * @type {string}
         */
        this.name = name;
    }
}

class LiteralArray {
    /**
     * @param {Literal[]} values
     * @param {string} type
     * 

/** @typedef { Definition | Routine | Invocation } StatementType */

class Definition {
    /**
     * @param {string} name
     * @param {string[]} values
     */
    constructor(name, values) {

        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {string[]}
         */
        this.values = values;
    }
}

class Routine {
    /**
     * @param {string} name
     */
    constructor(name) {
        /**
        * @type {string}
        */
        this.name = name;

        /**
        * @type {string[]}
        */
        // TODO this.body = [];
    }
}

class Invocation {
    /**
     * @param {string} routine_name
     * @param {string[]} arguments
     */
}