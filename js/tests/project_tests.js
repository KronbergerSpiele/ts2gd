"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
const main_1 = require("../main");
const test = () => {
    console.log("Hello world");
    main_1.main({
        buildLibraries: false,
        help: false,
        init: false,
    });
};
exports.test = test;
exports.test();
//# sourceMappingURL=project_tests.js.map