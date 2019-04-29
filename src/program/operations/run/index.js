#!/usr/bin/env node

const {
    GlobalConfig
} = require('../../../config');
const {
    print,
    ERROR
} = require('../../../messages');
const {
    safeExit
} = require('../../../utility');
const Menu = require('../../../menu');
const Operation = require('../operation');

const MAX_EXPECTED_ARGUMENTS_LENGTH = 1;

const handler = args => {
    GlobalConfig.load();
    if (Object.keys(GlobalConfig.getScripts()).length === 0) {
        print(ERROR, 'noSavedScripts');
        safeExit();
    } else if (args.length === 0) {
        const menu = new Menu({
            operationName: operation.name,
            operationRun: operation.run
        });
        menu.run();
    } else {
        const scriptName = args[0];
        const script = GlobalConfig.getScript(scriptName);
        if (script) {
            script.run();
        } else {
            print(ERROR, 'scriptDoesNotExist', scriptName);
            safeExit();
        }
    }
};

const operation = {
    name: 'run',
    flag: 'r',
    description: 'run a previously saved script',
    args: [{
        name: 'script name',
        required: false
    }],
    whitelist: ['documented'],
    run: handler
};

module.exports = new Operation(operation);
