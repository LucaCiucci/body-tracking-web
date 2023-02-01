
// This is a comment, it will be ignored when the script is executed.
// You can use it to write notes or to disable a line of code.

// This two lines define what "braccio_destro" and "braccio_sinistro" are.
// They are arrays (written "[]" in javascript) of segments, each segment is an array of two joints.
// To see a list of joints and segments, see https://mediapipe.dev/images/mobile/pose_tracking_full_body_landmarks.png
// Note that the joints are written in uppercase!
const braccio_destro = [[RIGHT_WRIST, RIGHT_ELBOW], [RIGHT_ELBOW, RIGHT_SHOULDER]]
const braccio_sinistro = [[LEFT_WRIST, LEFT_ELBOW], [LEFT_ELBOW, LEFT_SHOULDER]]

// Now we define a function "esercizio_braccia" that represents an exercise.
// 
// This exercise will consist in raising the right arm and then the left arm N times.
// 
// The exercise will take time to be executed, so we need to use the "async" keyword
// that will allow the use of the "await" keyword.
async function esercizio_braccia(N) {
    // This line will add a label to the screen
    // The first argument is the name of the label, it must be unique
    // The second argument is the text that will be displayed
    // The third argument (optional) is the color of the label
    add_label("ripetizione", "ripetizione", "red");

    // This line tells the program to repeat the following commands N times
    for (let r = 0; r < N; r++) {
        // This line will change the text of the label
        set_label("ripetizione", "ripetizione " + (r + 1) + "/" + N);

        // This line will highlight the segments of the right arm
        high(braccio_destro);

        // This line will wait for 1 second
        // Note that the "await" keyword is used, if omitted the program will not wait
        await pause(1, "second");

        // This two lines will turn off the segments of the right arm and
        // will turn on the segments of the left arm
        low(braccio_destro);
        high(braccio_sinistro);

        // wait another second
        await pause(1, "second");

        // turn off the segments of the left arm
        low(braccio_sinistro);
    }

    // when this routine is finished, we remove the label
    // we created at the beginning
    remove_label("ripetizione");
}

// Now that we have defined the function "esercizio_braccia", we can use it
// to create a sequence of exercises.
// The program will effectively start here!

// This line will add a label to the screen
add_label("serie", "serie", "green");

// This line will wait for 3 seconds while displaying a countdown,
// It is a very simple example that you could rewrite using the "*_label" and "pause" functions,
// but it is provided as a shortcut.
await countdown(3, "inizio tra");

// We want to repeat the exercise 3 times, so we use a "for" loop
for (let s = 0; s < 3; s++) {
    // Each time, we change the text of the label
    set_label("serie", "serie " + (s + 1) + "/3");

    // We execute the exercise
    await esercizio_braccia(5);

    // We wait for some time before starting the next exercise
    await countdown(5, "Riposo");
}

// At the end, we remove the label
// When the program finishes, all the labels will be removed automatically
// but it is good practice to remove them when they are no longer needed
remove_label("serie");