# Deathstar

A tool for creating scripts that store all your most commonly used CLI commands in your _deathstar_ and then ride them around _Gotham_ later.

### Commands

To save a script:
```sh
deathstar -s examples/tie-fighter.yml
```

To list saved scripts:
```sh
deathstar -l
```

To run a script:
```sh
deathstar -r tie-fighter
```

To delete a script:
```sh
deathstar -d tie-fighter
```

To update a script:
```sh
deathstar -u tie-fighter examples/tie-fighter.yml
```

To print a script:
```sh
deathstar -p tie-fighter
```

To print all scripts:
```sh
deathstar -P
```

To set a default script:
```sh
deathstar -D
```

To run the default script
```sh
deathstar -R
```

To view the config
```sh
deathstar -c
```

To change the shell deathstar uses (defaults to `/bin/bash`)
```sh
deathstar -S
```

### Scripts

Scripts are loaded in `.yml` files with a specific format e.g.
```yaml
---
tie-fighter:
  message: "Who should the spaceship follow?"
  options:
    millennium-falcon:
      message: "Shoot missiles or lasers?"
      options:
        missiles:
          command: "mkdir ~/Millennium\\ Falcon && cd ~/Millennium\\ Falcon && echo BOOM!!!"
        lasers:
          command: "mkdir ~/Millennium\\ Falcon && cd ~/Millennium\\ Falcon && echo Pew Pew!!!"
    x-wing:
      message: "Shoot missiles or lasers?"
      options:
        missiles:
          command: "mkdir ~/X-Wing && cd ~/X-Wing && echo BOOM!!!"
        lasers:
          command: "mkdir ~/X-Wing && cd ~/X-Wing && echo Pew Pew!!!"
```

By default the script will be named what ever the top level tag is. In the above example the script will be named `tie-fighter`.

Under the script name you can optionally have a `command` or `options` tag to determine whether you would like to run a command or ask a question. `options` can also have a preceding `message` displayed before asking the question.

### Tags

| Tags           | Description                                                                                                                      | Below                                  | Above                                              |
|----------------|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------|----------------------------------------------------|
| `<script>`     | This tag determines what deathstar will call the script                                                                            | nothing - this tag is the top most tag | everything - this tag is the top most tag          |
| `message`      | This tag can only be nested below a `<script>` or `<option>` tag and will provide the message to print before asking a question  | a `<script>` or <option>` tag          | nothing - this tag may only store a message string |
| `options`      | This tag signals that a question should be asked. The `<option>` tags below it will be the options displayed                     | a `<script>` or `<option>` tag         | One to many `<option>` tags                        |
| `<option>`     | This tag will display an option                                                                                                  | an `options` tag                       | a `message`, `options` or `command` tag            |
| `command`      | This tag will signal the command to be run if the option is selected                                                             | an `<option>` tag                      | nothing - this tag may only store a message string |
| `exit-command` | This tag will signal the command to be run if the option is selected and then exit                                               | an `<option>` tag                      | nothing - this tag may only store a message string |
