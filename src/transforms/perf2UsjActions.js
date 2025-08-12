const oneifyTag = (t) => {
    if (['toc', 'toca', 'mt', 'imt', 's', 'ms', 'mte', 'sd'].includes(t)) {
        return t + '1';
    }
    return t;
};

const actions = {
    startDocument: [
        {
            description: 'Set up environment',
            test: () => true,
            action: ({context, workspace, output}) => {
                workspace.paraStack = [];
                const docContext = context.document.metadata.document;
                output.usj = {
                    type: "USJ",
                    version: "3.1",
                    content: [
                        {
                            "type": "book",
                            "marker": "id",
                            "code": docContext.bookCode,
                            "content": [docContext.id.split(" ").slice(1).join(" ")]
                        },
                    ]
                };
                for (let [key, value] of Object.entries(
                    context.document.metadata.document
                ).filter(
                    (kv) => !['tags', 'properties', 'bookCode', 'cl'].includes(kv[0])
                )) {
                    let headerObject = {
                        type: "para",
                        marker: oneifyTag(key)
                    };
                    if (value) {
                        headerObject.content = [value]
                    }
                    output.usj.content.push(headerObject);
                }
            },
        },
    ],
    blockGraft: [
        {
            description: 'Follow block grafts',
            test: ({context}) => true,
            action: (environment) => {
                let contextSequence = environment.context.sequences[0];
                const target = contextSequence.block.target;
                if (target) {
                    environment.context.renderer.renderSequenceId(environment, target);
                }
            },
        },
    ],
    startParagraph: [
        {
            description: 'Push to paraStack',
            test: () => true,
            action: ({context, workspace}) => {
                let tag = context.sequences[0].block.subType.split(':')[1];
                let paraOb = {
                    type: "para",
                    marker: oneifyTag(tag),
                    content: []
                };
                workspace.paraStack.push(paraOb);
            },
        }
    ],
    endParagraph: [
        {
            description: 'Merge paraStack one level down',
            test: () => true,
            action: ({workspace, output}) => {
                let topPara = workspace.paraStack.pop();
                if (topPara.content.length === 0) {
                    delete (topPara.content);
                }
                if (workspace.paraStack.length === 0) {
                    output.usj.content.push(topPara)
                } else {
                    workspace.paraStack[workspace.paraStack.length - 1].content.push(topPara)
                }
            },
        }
    ],
    inlineGraft: [
        {
            description: 'Treat footnotes and xrefs as paras',
            test: () => true,
            action: (environment) => {
                const element = environment.context.sequences[0].element;
                if (["footnote", "xref", "note_caller"].includes(element.subType)) {
                    let paraOb = {
                        type: "note",
                        marker: element.subType === "footnote" ? "f" : "x",
                        content: []
                    };
                    const target = element.target;
                    if (target) {
                        environment.workspace.paraStack.push(paraOb);
                        environment.context.renderer.renderSequenceId(environment, target);
                        let topPara = environment.workspace.paraStack.pop();
                        if (element.subType === "note_caller") {
                            environment.workspace.paraStack[environment.workspace.paraStack.length - 1].caller = topPara.content[0].content[0]
                        } else {
                            environment.workspace.paraStack[environment.workspace.paraStack.length - 1].content.push(topPara)
                        }
                    }
                }
            },
        },
    ],
    mark: [
        {
            description: 'Output chapter or verses',
            test: () => true,
            action: ({context, workspace, output}) => {
                const element = context.sequences[0].element;
                if (element.subType === 'verses') {
                    workspace.paraStack[workspace.paraStack.length - 1].content.push(
                        {
                            "type": "verse",
                            "marker": "v",
                            "number": element.atts["number"],
                        }
                    );
                } else if (element.subType === 'chapter') {
                    output.usj.content.push(
                        {
                            "type": "chapter",
                            "marker": "c",
                            "number": element.atts["number"],
                        }
                    );
                }
            },
        },
    ],
    text: [
        {
            description: 'Output text',
            test: () => true,
            action: ({context, workspace}) => {
                const text = context.sequences[0].element.text;
                workspace.paraStack[workspace.paraStack.length - 1].content.push(text);
            },
        },
    ],
};

export default actions;
