"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testProcessDoesntGetArgsAdded = exports.testProcessGetsArgsAdded = exports.parseMethodDeclaration = void 0;
const parse_node_1 = require("../parse_node");
const specialMethods = [
    { name: "_process", args: "_delta: float" },
    { name: "_physics_process", args: "_delta: float" },
    { name: "_unhandled_input", args: "_event: InputEvent" },
    { name: "_unhandled_key_input", args: "_event: InputEventKey" },
];
const parseMethodDeclaration = (node, props) => {
    const funcName = node.name.getText();
    props.scope.enterScope();
    let result = parse_node_1.combine({
        parent: node,
        nodes: [node.body, ...node.parameters],
        props: props,
        addIndent: true,
        content: (body, ...params) => {
            let joinedParams = params.join(", ");
            const specialMethod = specialMethods.find((method) => method.name === funcName);
            if (specialMethod && joinedParams.trim() === "") {
                joinedParams = specialMethod.args;
            }
            return `
func ${funcName}(${joinedParams}):
  ${body || " pass"}
`;
        },
    });
    props.scope.leaveScope();
    return result;
};
exports.parseMethodDeclaration = parseMethodDeclaration;
exports.testProcessGetsArgsAdded = {
    ts: `
class Foo extends Node2D {
  _process() {}
}
  `,
    expected: `
extends Node2D
class_name Foo
func _process(_delta: float):
  pass
  `,
};
exports.testProcessDoesntGetArgsAdded = {
    ts: `
class Foo extends Node2D {
  _process(d: float) {}
}
  `,
    expected: `
extends Node2D
class_name Foo
func _process(_d):
  pass
  `,
};
//# sourceMappingURL=parse_method_declaration.js.map