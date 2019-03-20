#!/usr/bin/env node

const chalk = require('chalk');
const noop = require('lodash/noop');

const {
    ADD_COMMAND,
    Modification
} = require('src/constants');
const {
    GlobalConfig
} = require('src/config');
const {
    Script,
    Command,
    Directory
} = require('src/config/script');
const {
    containsWhitespace,
    replaceWhitespace,
    isEmptyString,
    safeExit
} = require('src/utility');
const {
    print,
    ERROR,
    MESSAGE
} = require('src/messages');
const {
    prompts,
    inquirerPrompts
} = require('src/shims/inquirer');
const CommandAdder = require('src/command-adder');
const Menu = require('src/menu');
const Operation = require('src/program/operations/operation');

const MAX_EXPECTED_ARGUMENTS_LENGTH = 1;

const addCommandToOptionChoices = ({
    script,
    optionKey,
    answers
}) => {
    const option = script.getOption(optionKey);
    const choices = option.getChoices();
    if (!choices.includes(answers.name)) {
        let index;
        if (choices.indexOf('back') > -1) {
            index = choices.indexOf('back');
        } else {
            index = choices.indexOf('quit');
        }
        choices.splice(index, 0, answers.name);
    }
    option.updateChoices(choices);
}

const addCommand = ({
    script,
    optionKey,
    commandKey,
    command,
    answers
}) => {
    script.addCommand({
        commandKey: commandKey,
        command: command
    });
    if (answers.path) {
        const directory = new Directory(answers.path);
        script.updateDirectory({
            directoryKey: commandKey,
            directory: directory
        });
    }
    addCommandToOptionChoices({
        script: script,
        optionKey: optionKey,
        answers: answers
    });
    GlobalConfig.save();
    print(MESSAGE, 'savedNewCommand', answers.name, script.getName());
}

const getUpdateCommandPrompt = (answers) => {
    let prompt = `Replace ${chalk.magenta.bold(answers.name)} with ${chalk.magenta.bold(answers.directive)} command`;
    if (!isEmptyString(answers.message) && isEmptyString(answers.path)) {
        prompt += ` and ${chalk.magenta.bold(answers.message)} message?`;
    } else if (isEmptyString(answers.message) && !isEmptyString(answers.path)) {
        prompt += ` and ${chalk.magenta.bold(answers.path)} directory?`;
    } else if (!isEmptyString(answers.message) && !isEmptyString(answers.path)) {
        prompt += `, ${chalk.magenta.bold(answers.message)} message and ${chalk.magenta.bold(answers.path)} directory?`;
    }
    return prompt;
}

const updateCommand = ({
    prompts,
    script,
    optionKey,
    commandKey,
    command,
    answers
}) => {
    const promptsSubscription = prompts.subscribe(({
        answer
    }) => {
        if (answer) {
            script.updateCommand({
                commandKey: commandKey,
                command: command
            });
            if (answers.path) {
                const directory = new Directory(answers.path);
                script.updateDirectory({
                    directoryKey: commandKey,
                    directory: directory
                });
            }
            addCommandToOptionChoices({
                script: script,
                optionKey: optionKey,
                answers: answers
            });
            GlobalConfig.save();
            print(MESSAGE, 'replacedCommand', answers.name, answers.directive);
        } else {
            print(MESSAGE, 'didNotReplaceCommand', answers.name, answers.directive);
        }
        promptsSubscription.unsubscribe();
        prompts.complete();
    }, noop, noop);

    // add's a new line before the question asking user if they want to update command is printed
    console.log('');

    prompts.next({
        type: 'confirm',
        name: 'confirm-replace-command',
        message: getUpdateCommandPrompt(answers)
    });
}

const addNewCommand = ({
    script,
    optionKey
}) => {
    const commandAdder = new CommandAdder();

    // add's a new line before the questions asking user to describe new command
    print(MESSAGE, 'addingCommandTitle');

    const promptsSubscription = inquirerPrompts.subscribe(({
        answer
    }) => {
        commandAdder.nextAnswer(answer);
        const question = commandAdder.nextQuestion();
        if (question) {
            inquirerPrompts.next(question);
        } else {
            promptsSubscription.unsubscribe();

            const key = commandAdder.answers.name;
            if (containsWhitespace(key)) {
                key = replaceWhitespace(key, '.');
            }
            const commandKey = `${optionKey}.${key}`;
            const command = new Command({
                directive: commandAdder.answers.directive,
                message: commandAdder.answers.message,
            });
            if (script.getCommand(commandKey)) {
                updateCommand({
                    prompts: prompts,
                    script: script,
                    optionKey: optionKey,
                    commandKey: commandKey,
                    command: command,
                    answers: commandAdder.answers
                });
            } else {
                addCommand({
                    script: script,
                    optionKey: optionKey,
                    commandKey: commandKey,
                    command: command,
                    answers: commandAdder.answers
                });
            }
            inquirerPrompts.complete();
        }
    }, (err) => {
        console.warn(err);
    }, () => {});

    inquirerPrompts.next(commandAdder.nextQuestion());
}

const getOptionChoicesWithAddingChoices = (script, optionKey) => {
    const choices = script.getOption(optionKey).getChoices();

    let index;
    if (choices.indexOf('back') > -1) {
        index = choices.indexOf('back');
    } else {
        index = choices.indexOf('quit');
    }

    // Append adding commands just before `back` and `quit`
    choices.splice(index, 0, ADD_COMMAND);

    return choices;
}

const getOptionChoicesWithoutCommands = (script, optionKey) => {
    const choices = script.getOption(optionKey).getChoices();
    return choices.filter(choice => {
        const key = choice;
        if (containsWhitespace(key)) {
            key = replaceWhitespace(key);
        }
        return !script.getCommand(`${optionKey}.${key}`);
    });
}

const getScriptModifiedForAdding = script => {
    const copiedScript = Script.copy(script);

    for (optionKey in copiedScript.getOptions()) {
        const option = copiedScript.getOption(optionKey);
        const modifiedMessage = `Add a ${chalk.magenta.bold('command')} to ${chalk.cyan.bold(option.getMessage())}`;
        option.updateMessage(modifiedMessage);
        option.updateChoices(getOptionChoicesWithoutCommands(copiedScript, optionKey));
        option.updateChoices(getOptionChoicesWithAddingChoices(copiedScript, optionKey))
    }

    return copiedScript;
}

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
        GlobalConfig.load();
        const script = GlobalConfig.getScript(scriptName);
        if (script) {
            const scriptModifiedForAdding = getScriptModifiedForAdding(script);

            print(MESSAGE, 'runningScriptInModifyMode', scriptName);

            const promise = scriptModifiedForAdding.run();

            promise.then(({
                modification,
                optionKey
            }) => {
                if (modification === Modification.ADD_COMMAND) {
                    addNewCommand({
                        script: script,
                        optionKey: optionKey
                    });
                }
            });
        } else {
            print(ERROR, 'scriptDoesNotExist', scriptName);
        }
    }
};

const operation = {
    name: 'modify',
    flag: 'm',
    description: 'modify a previously saved script',
    args: [{
        name: 'script name',
        required: false
    }],
    whitelist: [],
    run: handler
};

module.exports = new Operation(operation);