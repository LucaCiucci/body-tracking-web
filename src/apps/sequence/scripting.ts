

/**
 * This represents a node in the AST.
 */
class RawStatement {

    line: string = "";
    body: RawStatement[] = [];

    constructor(line: string) {
        this.line = line;
    }
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
function consume_lines(lines: string[], start_index: number, indent: number = 0): [RawStatement[], number, number] {
    let statements: RawStatement[] = [];

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
        const is_ok = line_indent >= indent;

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

function separate_raw_statements(src: string) {
    let lines = src.split("\n");
    return consume_lines(lines, 0, undefined)[0];
}

export function ciao() {
    console.log("ciao");
}