const braccio_destro = [[RIGHT_WRIST, RIGHT_ELBOW], [RIGHT_ELBOW, RIGHT_SHOULDER]];
const braccio_sinistro = [[LEFT_WRIST, LEFT_ELBOW], [LEFT_ELBOW, LEFT_SHOULDER]];

async function esercizio_braccia(N) {
    await add_label("ripetizione", "red");
    for (let r = 0; r < N; r++) {
        await set_label("ripetizione", ("ripetizione " + (r + 1) + "/" + N));
        await high(braccio_destro);
        await pause(1, "second");
        await low(braccio_destro);
        await high(braccio_sinistro);
        await pause(1, "second");
        await low(braccio_sinistro);
    };
    await remove_label("ripetizione");
};

await add_label("serie", "green");
await countdown(3, "inizio tra");
for (let s = 0; s < 3; s++) {
    await set_label("serie", ("serie " + (s + 1) + "/3"));
    await esercizio_braccia(5);
    await countdown(5, "Riposo");
};
await remove_label("serie");