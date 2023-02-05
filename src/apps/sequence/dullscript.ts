

/**
 * This represents a node in the AST.
 */
export class RawStatement {

    line: string = "";
    body: RawStatement[] = [];

    constructor(line: string) {
        this.line = line;
    }
}

function tmp_unused(..._args: any[]) {
}

/**
 * this function takes the lines and produces a list of statements.
 * 
 * if an "indent" is given, it will consume all the lines until it finds a line whith
 * a lower indent.
 * 
 * @param lines
 * @param start_index
 * @param indent
 * 
 * @returns the list of statements, the index of the last line consumed, the next non empty line indent
 */
export function consume_lines(lines: string[], start_index: number, indent: number = 0): [RawStatement[], number, number] {
    let statements: RawStatement[] = [];

    let last_consumed_line = start_index;

    for (let i = start_index; i < lines.length; ++i) {
        const line = lines[i];
        const trimmed_line = line.trim();

        // empty line
        if (trimmed_line.length === 0)
            continue;

        // comment
        if (trimmed_line.startsWith("//") || trimmed_line.startsWith("#"))
            continue;

        // the number of spaces at the beginning of the line
        const line_indent = line.search(/\S/);

        // if the line is indented less than the current indent, we are done
        const is_ok = line_indent >= indent;

        if (!is_ok) {
            return [statements, last_consumed_line, i];
        }

        let statement = new RawStatement(trimmed_line)

        const [sub_statements, sub_last_used, _next_line] = consume_lines(lines, i + 1, line_indent + 4);
        tmp_unused(_next_line);
        if (sub_statements.length > 0) {
            statement.body = sub_statements;
            i = sub_last_used;
        }

        statements.push(statement);
        last_consumed_line = i;
    }

    return [statements, last_consumed_line, lines.length];
}

function is_identifier(c: string): boolean {
    // checks that the first character is a letter or underscore,
    // and the rest are letters, numbers or underscores
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c);
}

function tokenize(line: string): string[] {
    let tokens: string[] = [];

    let blanks = [" ", "\t", "\r", "\n"];
    let comments = ["//", "#"];
    let strings = ["'", '"', "`"];
    let tokenizable_operators = [
        // parenthesis
        "(", ")", "[", "]", "{", "}",
        // arithmetic
        "+", "-", "*", "/", "%",
        // comparison
        "==", "===", "!=", "!==", "<", ">", "<=", ">=", "&&", "||", "!", "??", "?", ":", "=>",
        // bitwise
        "&", "|", "^", "~", "<<", ">>", ">>>",
        // assignment
        "=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", ">>>=",
        // increment
        "++", "--",
        // other
        /*".",*/ ",", ";", "...", "=>"
    ].sort((a, b) => b.length - a.length);

    function operator(src: string, pos: number): string {
        for (let op of tokenizable_operators) {
            if (src.substr(pos, op.length) === op) {
                return op;
            }
        }
        return "";
    }

    let pos = 0;
    while (pos < line.length) {
        let c = line[pos];
        
        if (blanks.includes(c)) {
            pos++;
            continue;
        }

        if (comments.includes(line.substr(pos, 2))) {
            break;
        }

        if (strings.includes(c)) {
            let terminator = c;
            let start = pos;
            pos++;
            while (pos < line.length) {
                // terminates if we find the terminator not escaped
                if (line[pos] === terminator && line[pos - 1] !== "\\") {
                    break;
                }
                pos++;
            }
            tokens.push(line.substr(start, pos - start + 1));
            pos++;
            continue;
        }

        // operators
        {
            let op = operator(line, pos);
            if (op.length > 0) {
                tokens.push(op);
                pos += op.length;
                continue;
            }
        }

        // identifier
        let start = pos;
        while (pos < line.length) {
            let c = line[pos];
            if (blanks.includes(c) || comments.includes(line.substr(pos, 2)) || strings.includes(c) || operator(line, pos).length > 0) {
                break;
            }
            pos++;
        }
        if (pos > start) {
            tokens.push(line.substr(start, pos - start));
            continue;
        }
    }

    return tokens;
}

// groups together the tokens that are enclosed in parenthesis
function group_enclosed(tokens: string[]): string[] {
    const open_paren = ["(", "[", "{"];
    const close_paren = [")", "]", "}"];

    let result: string[] = [];

    let i = 0;
    while (i < tokens.length) {
        if (open_paren.indexOf(tokens[i]) < 0) {
            result.push(tokens[i]);
            i++;
            continue;
        }

        let parent_count = 1;
        let start = i;
        i++;
        while (i < tokens.length) {
            if (open_paren.indexOf(tokens[i]) >= 0) {
                parent_count++;
            } else if (close_paren.indexOf(tokens[i]) >= 0) {
                parent_count--;
            }
            if (parent_count === 0) {
                break;
            }
            i++;
        }

        //result.push(tokens.slice(start, i + 1).join(" "));
        result.push(tokens.slice(start, i + 1).join(""));
        i++;
    }

    return result;
}

export function separate_raw_statements(src: string) {
    let lines = src.split("\n");
    return consume_lines(lines, 0, undefined)[0];
}

export function to_js(statements: RawStatement[]): string {
    let code = "";
    
    for (const statement of statements) {
        const tokens = group_enclosed(tokenize(statement.line));
        if (tokens.length === 0)
            continue;

        // constant definition
        if (tokens[0] === "def") {
            if (tokens.length !== 3) {
                throw new Error(`Invalid definition, expected ${3} tokens but got ${tokens.length}: ${tokens}`);
            }
            let name = tokens[1];
            let body = tokens[2];
            code += `const ${name} = ${body};`;
            continue;
        }

        // routine definition
        if (tokens[0] === "routine") {
            if (tokens.length < 2) {
                throw new Error(`Invalid routine definition, expected at least ${2} tokens but got ${tokens.length}`);
            }
            let name = tokens[1];
            let args = tokens.slice(2);
            code += `async function ${name}(${args.join(", ")}) {`;
            code += to_js(statement.body);
            code += "};";
            continue;
        }

        // TODO if statement

        // TODO repeat statement

        // TODO return statement

        // repeat
        if (tokens[0] === "repeat") {
            if (tokens.length < 2) {
                throw new Error(`Invalid repeat statement, expected at least ${2} tokens but got ${tokens.length}`);
            }
            if (tokens.length > 3) {
                throw new Error(`Invalid repeat statement, expected at most ${3} tokens but got ${tokens.length}`);
            }
            const count = tokens[1];
            const name = tokens[2] || "i";
            code += `for (let ${name} = 0; ${name} < ${count}; ${name}++) {`;
            code += to_js(statement.body);
            code += "};";
            continue;
        }

        // for loop
        if (tokens[0] === "for") {
            if (tokens.length !== 6) {
                throw new Error(`Invalid for loop, expected ${6} tokens but got ${tokens.length}: ${tokens}`);
            }
            const name = tokens[1];
            if (tokens[2] !== "from") {
                throw new Error(`Invalid for loop, expected "from" but got ${tokens[2]}`);
            }
            const start = tokens[3];
            if (tokens[4] !== "to") {
                throw new Error(`Invalid for loop, expected "to" but got ${tokens[4]}`);
            }
            const end = tokens[5];
            code += `for (let ${name} = ${start}; ${name} < ${end}; ${name}++) {`;
            code += to_js(statement.body);
            code += "};";
            continue;
        }


        const function_call = (tokens: string[]): string => {
            if (tokens.length < 1) {
                throw new Error(`Invalid function call, expected at least ${1} tokens but got ${tokens.length}`);
            }
            const name = tokens[0];
            const args = tokens.slice(1);
            return `await ${name}(${args.join(", ")});`;
        }

        // explicit function call
        const call_keywords = ["call", "do", "execute", "run"];
        if (call_keywords.includes(tokens[0])) {
            code += function_call(tokens.slice(1));
            continue;
        }

        // implicit function call
        if (tokens.length >= 1 && is_identifier(tokens[0])) {
            code += function_call(tokens);
            console.log(tokens, function_call(tokens));
            continue;
        }

        // invalid statement
        throw new Error(`Invalid statement: ${statement.line}`);
    }

    return code;
}

export function parse_to_js(src: string) {
    let statements = separate_raw_statements(src);
    return to_js(statements);
}

async function prova() {
    let response = await fetch(process.env.PUBLIC_URL + "/sequences/examples/full_example.ds");
    const program_code = await response.text();
    let js_code = parse_to_js(program_code);
    console.log(js_code);
}

const TEST = false;
if (TEST) {
    prova();
}