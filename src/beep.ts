
var audioCtx = new AudioContext();

/**
 * Beep function for the browser.
 * 
 * Adapted from https://stackoverflow.com/a/29641185
 * @param duration the duration of the beep in seconds
 * @param frequency the frequency of the beep in hertz
 * @param volume the volume of the beep
 * @param type the type of the beep
 */
export function beep(duration: number = 0.3, frequency: number = 432, volume: number | undefined = undefined, type: OscillatorType = "sine"): Promise<void> {
    return new Promise((resolve, _reject) => {
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (volume) {
            gainNode.gain.value = volume;
        }

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        oscillator.onended = () => {
            resolve();
        };

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    });
};

(window as any).beep = beep;