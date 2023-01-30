
import { autoUpdater } from 'electron'

export function checkUpdate() {
    autoUpdater.on('checking-for-update', () => {
        console.log("checking-for-update");
    });
    autoUpdater.on('update-available', () => {
        console.log("update-available");
    });
    autoUpdater.on('update-not-available', () => {
        console.log("update-not-available");
    })
    autoUpdater.on('error', (err) => {
    console.log("error: ", err.name, ": ", err.message);
    })
/*autoUpdater.on('download-progress', (progressObj) => {
let log_message = "Download speed: " + progressObj.bytesPerSecond;
log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
sendStatusToWindow(log_message);
})*/
    autoUpdater.on('update-downloaded', (info) => {
        console.log("update-downloaded");
    });

    //autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.setFeedURL({
        url: "https://github.com/LucaCiucci/bicycle_posture_analyzer"
    });
    autoUpdater.checkForUpdates();
}