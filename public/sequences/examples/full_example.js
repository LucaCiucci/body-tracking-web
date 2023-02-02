
// This is a comment, it will be ignored when the script is executed.
// You can use it to write notes or to disable a line of code.

// See https://mediapipe.dev/images/mobile/pose_tracking_full_body_landmarks.png
// for the list of joints (note that here they are written in uppercase).
const braccio_destro = [[RIGHT_WRIST, RIGHT_ELBOW], [RIGHT_ELBOW, RIGHT_SHOULDER]]
const braccio_sinistro = [[LEFT_WRIST, LEFT_ELBOW], [LEFT_ELBOW, LEFT_SHOULDER]]

async function esercizio_braccia(N) {
    add_label("ripetizione", "red");
    for (let r = 0; r < N; r++) {
        set_label("ripetizione", "ripetizione " + (r + 1) + "/" + N);
        high(braccio_destro);
        await pause(1, "second");
        low(braccio_destro);
        high(braccio_sinistro);
        await pause(1, "second");
        low(braccio_sinistro);
    }
    remove_label("ripetizione");
}

await countdown(3, "inizio tra");

add_label("serie", "green");
for (let s = 0; s < 3; s++) {
    set_label("serie", "serie " + (s + 1) + "/3");
    await esercizio_braccia(5);
    await countdown(5, "Riposo");
}
remove_label("serie");