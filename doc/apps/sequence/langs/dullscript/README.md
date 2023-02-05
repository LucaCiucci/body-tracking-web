# DullScript

DullScript is a simple scripting language that can be used to write scripts for the Sequence app. It is directly translated to JavaScript and executed in the browser, but it is much simpler to write and understand.

## Tutorial

### Commands

In dullscript, **functions** are called **commands** or **procedures** or **routines**.

To call a command, you need to write the command name followed by a list of parameters, each parameter is separated by a space.

As an example, suppose you want to call a command named `beep` that plays a beep sound. To call it, you would just write a script like this:

```dullscript
beep
```

This is called an "implicit function call", sometimes you might want to make it clear that you are calling a procedure, so you can use the `call` keyword to prefix the command name:

```dullscript
call beep
```

The following variants are allowed:

```dullscript
beep
call beep
do beep
execute beep
run beep
```

Each command can have a list of parameters, for example the `beep` command has three parameters: `duration`, `frequency` and `volume`, but they are optional, so you can just call it with no parameters.

For example, if you want to play a beep 1 second long, you can write:
```dullscript
beep 1
```

Some functions might have required parameters, i.e. parameters that do not have a default value, for example the the `add_label` command has a required parameter `label_id` and an optional parameter `color`. So these two lines are both valid:

```dullscript
add_label "my_label"
add_label "my_label" "red"
```

but this one is not:

```dullscript
add_label
```

because the `label_id` parameter is required.

Here is a possible example script that plays a beep and adds a label:

```dullscript
add_label "my_label" "red"
set_label "my_label" "Hello world!"
pause 1
beep
pause 1
remove_label "my_label"
```

### Definitions

You can alias some values with a name using the `def` keyword, this is useful if you want to use the same value multiple times, for example:

```dullscript
def left_arm [[LEFT_WRIST, LEFT_ELBOW], [LEFT_ELBOW, LEFT_SHOULDER]]

# ...
high left_arm
# ...
low left_arm
```

### Iterating

In dullscript, you can iterate in different ways, for example, you can use the `repeat` command to repeat a block of code a certain number of times:

```dullscript
repeat 10 i
    beep
    pause 1
```

In this example, the `repeat` command will execute the block of code 10 times, and each time it will set the variable `i` to the current iteration number, if you don't need the iteration number, you can omit it and just write `repeat 10` instead. The block of code to repeat is indented by 4 spaces.

You can also use the `for` statement that does the same thing in a more "programmer-friendly" way, for example:

```dullscript
for i from 1 to 10
    beep
    pause 1
```

However, the `repeat` command, even if less powerful, should be preferred because it is more readable and it is easier to write.

### Custom commands

You can create you own commands using the `routine` keyword, for example:

```dullscript
routine my_routine
    beep
    pause 1
    beep
    pause 1
    beep
    pause 1
```

As you can see, you have to write the `routine` keyword, then the name of the routine, then a list of commands, each command is separated by a new line and indented by 4 spaces.

You can make your routines to accept parameters, for example:

```dullscript
routine show_message message
    add_label "my_label" "red"
    set_label "my_label" message
    pause 1
    remove_label "my_label"
```

Here, we have created a routine named `show_message` that accepts a parameter named `message`, and then it shows the message for 1 second. This might be useful, for example, if you want to define a routine that makes the patient to repeat an action a varying number of times, for example.

```dullscript
routine some_exercise t
    repeat t times counter r
        beep
        high left_arm
        pause 1
        beep
        low left_arm
        high right_arm
        pause 1
        low right_arm

some_exercise 10
countdown 3 "rest some time..."
some_exercise 5
```

### A worked example

You can see a worked example of a dullscript script [here](https://github.com/LucaCiucci/body-tracking-web/blob/main/public/sequences/examples/full_example.ds)