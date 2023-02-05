# Predefined Commands

The following commands are predefined in the Sequence language:
 - `beep`: plays a beep sound
 - `pause`: pauses the execution of the script for a given amount of time
 - `high`: highlights the given keypoints
 - `low`: removes the highlight from the given keypoints
 - `add_label`: adds visible text to the screen
 - `set_label`: sets the text of a label
 - `remove_label`: removes a label from the screen

## Commands

### `beep`
Plays a beep sound

This command plays a beep sound on the device, it might be useful to notify the patient that the next step is about to start.

#### Parameters
 - `duration`: the duration of the beep, defaults to `0.3`
 - `frequency`: the frequency of the beep, defaults to `864`
 - `volume`: the volume of the beep, defaults to `1`

#### Examples
Example usage in DullScript:
```dullscript
beep           # <- plays a beep with default parameters
beep 0.5 1000  # <- plays a beep with custom parameters (1000hz for 0.5 seconds)
```

### `pause`
Pauses the execution of the script for a given amount of time

This command pauses the execution of the script for a given amount of time, it can be used to wait for the patient to do something.

#### Parameters
 - `duration`: the duration of the pause in seconds, defaults to `1`

#### Examples
Example usage in DullScript:
```dullscript
pause 1.5  # <- pauses the execution for 1.5 seconds
```

Example usage in JavaScript:
```javascript
// note: this is an async function so you need to await it
await pause(1.5);
```

### `high`
Highlights the given keypoints

This command highlights the given keypoints, it can be used to notify the patient which keypoints to focus on.

#### Parameters
 - `keypoints`: the keypoints to highlight, can be a single keypoint or a list of (keypoints or segments (array of two keypoints))

#### Examples
TODO

### `low`
Removes the highlight from the given keypoints

This command removes the highlight from the given keypoints, it can be used to notify the patient which keypoints to focus on.

TODO ...

### `add_label`
Adds visible text to the screen

This command adds a visible text label to the screen, it can be used to notify what the next step is, what repetition number is, etc.

#### Parameters
 - `id`: the id of the label, it must be unique
 - `color`: the color of the label, defaults to `#000000`

#### Examples
```dullscript
add_label "repetition" "blue"  # <- adds a label with id "repetition" and color "blue"
set_label "repetition" "repetition 1"
```

### `set_label`
Sets the text of a label

This command sets the text of a label, it can be used to notify what the next step is, what repetition number is, etc.

#### Parameters
 - `id`: the id of the label, it must be unique
 - `text`: the text of the label

#### Examples
```dullscript
add_label "repetition" "blue"  # <- adds a label with id "repetition" and color "blue"
set_label "repetition" "repetition 1"
```

### `remove_label`
Removes a label from the screen

This command removes a label from the screen, it can be used to notify what the next step is, what repetition number is, etc.

#### Parameters
 - `id`: the id of the label, it must be unique

#### Examples
```dullscript
add_label "repetition" "blue"  # <- adds a label with id "repetition" and color "blue"
set_label "repetition" "repetition 1"
pause 1
remove_label "repetition"
```

