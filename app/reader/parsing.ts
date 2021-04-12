import _ from "lodash";

const unified = require("unified");
const markdown = require("remark-parse");
const gfm = require("remark-gfm");
const zwitch = require("zwitch");

type HandlerFunc = (tree: unknown, dunno: null, context: Context) => void;

type ExitFunc = () => void;

type EnterFunc = (name: string) => ExitFunc;

interface Context {
    handlers: Record<string, unknown>;
    stack: string[];
    enter: EnterFunc;
    handle: HandlerFunc;
}

export interface MdNode {
    type: string;
    props: Record<string, unknown>;
    children?: MdNode[];
    sequence?: {
        ordinal: string;
        label: string;
    };
}

function toMaybeSequenceItem(node: MdNode): MdNode {
    const text = node.props.text as string | undefined;
    if (!text) {
        return node;
    }
    const m = text.match(/([\dA-Z]+\.)\s+(.+)/);
    if (!m) {
        return node;
    }
    return _.extend(
        {
            sequence: {
                ordinal: m[1],
                label: m[2],
            },
        },
        node
    );
}

function createSequences(children: MdNode[]): MdNode[] {
    const maybeSequences = children.map((m) => toMaybeSequenceItem(m));
    const onlySequences = !_.some(maybeSequences, (s) => !s.sequence);
    if (onlySequences) {
        const ordinals = maybeSequences.map((s, index) => {
            if (!s.sequence) throw new Error();
            return {
                type: "Label",
                props: {
                    class: "md-seq-key",
                    row: index,
                    col: 0,
                    text: s.sequence.ordinal,
                    textWrap: false,
                },
            };
        });

        const labels = maybeSequences.map((s, index) => {
            if (!s.sequence) throw new Error();
            return {
                type: "Label",
                props: {
                    class: "md-seq-value",
                    row: index,
                    col: 1,
                    text: s.sequence.label,
                    textWrap: true,
                },
            };
        });

        return [
            {
                type: "GridLayout",
                props: {
                    class: "md-grid",
                    rows: _.times(maybeSequences.length, (i) => "auto").join(","),
                    columns: "auto,*",
                },
                children: _.concat(ordinals, labels),
            },
        ];
    }
    return children;
}

interface CustomContext extends Context {
    images: number;
}

function createContext(): CustomContext {
    function basic(node, parent, context) {
        return (node.children || []).map((child) => {
            return context.handle(child, node, context);
        });
    }

    const handlers = {
        root: basic,
        tableRow: (node, parent, context): MdNode => {
            return basic(node, parent, context);
        },
        tableCell: (node, parent, context): MdNode => {
            return basic(node, parent, context);
        },
        table: (node, parent, context): MdNode => {
            // Tables by default come back as rows of columns and so
            // the first thing we do is transpose that then we wrap
            // each column in a StackLayout with the col assigned.
            const rows = basic(node, parent, context);
            const headerless = _.tail(rows);
            const transpose = (m) => m[0].map((x, i) => m.map((x) => x[i]));
            const columns = transpose(headerless);
            const wrapped = columns.map(
                (column, index): MdNode => {
                    return {
                        type: "StackLayout",
                        props: {
                            col: index,
                            class: "md-column",
                        },
                        children: createSequences(_.flatten(column)),
                    };
                }
            );

            return { type: "GridLayout", props: { class: "md-grid", rows: "auto", columns: "*,*" }, children: wrapped };
        },
        image: (node, parent, context: CustomContext): MdNode => {
            context.images++;
            const sizing = node.url.split(":");
            const indices = sizing[0].split(",").map((s) => Number(s));
            return {
                type: "MarkdownImage",
                props: {
                    indices: indices,
                    alternate: node.alt,
                    sizing: sizing.length == 2 ? sizing[1] : "*",
                },
                children: [],
            };
        },
        listItem: (node, parent, context): MdNode => {
            const children = basic(node, parent, context);
            return { type: "StackLayout", props: { class: "md-list-item" }, children: children };
        },
        list: (node, parent, context): MdNode => {
            const children = basic(node, parent, context);
            return { type: "StackLayout", props: { class: "md-list" }, children: children };
        },
        text: (node, parent, context): MdNode => {
            return { type: "Label", props: { text: node.value, textWrap: true } };
        },
        link: (node, parent, context): MdNode => {
            const children = basic(node, parent, context);
            return { type: "MarkdownLink", props: { target: node.url }, children: children };
        },
        paragraph: (node, parent, context): MdNode => {
            const imagesBefore = context.images;
            const children = basic(node, parent, context);

            return {
                type: "FlexboxLayout",
                props: {
                    class: "md-paragraph",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    images: context.images - imagesBefore,
                },
                children: children,
            };
        },
        heading: (node, parent, context): MdNode => {
            const children = basic(node, parent, context);
            return {
                type: "FlexboxLayout",
                props: { class: `md-heading md-heading-${node.depth}`, justifyContent: "center", flexWrap: "wrap" },
                children: children,
            };
        },
    };

    const context: CustomContext = {
        handlers: handlers,
        stack: [],
        enter: enter,
        images: 0,
        handle: zwitch("type", {
            unknown: basic,
            handlers: handlers,
        }),
    };

    function enter(name: string): ExitFunc {
        context.stack.push(name);
        return exit;

        function exit() {
            context.stack.pop();
        }
    }

    return context;
}

function compiler(hasImages: boolean) {
    return function (this: any) {
        this.Compiler = (tree, file) => {
            const context = createContext();
            const finished = context.handle(tree, null, context) as unknown;
            // Backwards compatibility.
            if (context.images == 0 && hasImages) {
                (finished as MdNode[]).push({
                    type: "MarkdownImage",
                    props: {
                        indices: [],
                        alternate: "Images",
                        images: 1,
                        sizing: "*",
                    },
                });
            }
            return finished;
        };
    };
}

export async function transform(text: string, hasImages = false): Promise<MdNode> {
    // This is unavailable when we're running under NativeScript.
    global.process.cwd = function () {
        return "/";
    };

    const processor = unified().use(markdown).use(gfm);
    const done = await processor.use(compiler(hasImages)).process(text);
    const children = done.result as MdNode[];
    const withRows = children.map((node, i) => {
        _.extend(node.props, { row: i });
        return node;
    });
    return {
        type: "MarkdownRoot",
        props: {
            parsed: withRows,
        },
        children: withRows,
    };
}
