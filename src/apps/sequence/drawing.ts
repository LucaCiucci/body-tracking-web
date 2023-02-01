
import { Results as PoseResults, Pose } from '@mediapipe/pose';
import { NormalizedLandmarkList } from '@mediapipe/drawing_utils';

export var draw_data: {
    labels: {
        name: string;
        value: string;
        color: string;
    }[],
    highlightedConnections: {
        from: number;
        to: number;
        color: string;
    }[],
    pose: PoseResults | null,
    draw_pose: boolean,
} = {
    labels: [],
    highlightedConnections: [],
    pose: null,
    draw_pose: true,
};

export var x_tmp_inverted: boolean = false;
export function set_x_tmp_inverted(value: boolean) {
    x_tmp_inverted = value;
}

export function reset_draw_data() {
    draw_data = {
        labels: [],
        highlightedConnections: [],
        pose: null,
        draw_pose: true,
    };
}

export function draw(canvasElement: HTMLCanvasElement, videoElement: HTMLVideoElement) {
    if (!canvasElement) {
        return;
    }
    let canvas = canvasElement;
    if (!videoElement) {
        return;
    }
    let ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }

    // update size if needed
    if (canvas.width !== canvas.clientWidth) {
        canvas.width = canvas.clientWidth;
    }
    if (canvas.height !== canvas.clientHeight) {
        canvas.height = canvas.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    
    {
        ctx.font = "30px monospace";
        let h = 30;
        let x = 10;
        let y = h;
        for (let label of draw_data.labels) {
            ctx.fillStyle = label.color;
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 1;
            ctx.strokeText(label.value, x, y);
            ctx.fillText(label.value, x, y);
            y += h;
        }
        ctx.lineWidth = 1;
    }

    let ve = videoElement;
    const video_aspect = videoElement.videoHeight / videoElement.videoWidth;
    const canvas_aspect = canvas.height / canvas.width;
    function video_to_canvas_coordinates(p: [number, number]) {
        let x = p[0];
        let y = p[1];
        let [video_width, video_height] = (() => {
            if (video_aspect > canvas_aspect) {
                // video is taller than canvas
                let height = canvas.height;
                return [height / video_aspect, height];
            } else {
                // video is wider than canvas
                let width = canvas.width;
                return [width, width * video_aspect];
            }
        })();
        return [
            x * video_width - (video_width - canvas.width) / 2,
            y * video_height - (video_height - canvas.height) / 2,
        ];
    }

    if (draw_data.pose) {
        let pose = draw_data.pose;
        let landmarks = pose.poseLandmarks as (NormalizedLandmarkList | undefined);

        if (!landmarks) {
            return;
        }

        if (draw_data.draw_pose) {
            ctx.fillStyle = "green";
            for (let landmark of landmarks) {
                let [x, y] = video_to_canvas_coordinates([landmark.x, landmark.y]);
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        for (let connection of draw_data.highlightedConnections) {
            let from = landmarks[connection.from];
            let to = landmarks[connection.to];
            let [x1, y1] = video_to_canvas_coordinates([from.x, from.y]);
            let [x2, y2] = video_to_canvas_coordinates([to.x, to.y]);
            ctx.strokeStyle = connection.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
}

export function highlight_connection(connection: [number, number]) {
    draw_data.highlightedConnections.push({
        from: connection[0],
        to: connection[1],
        color: "red",
    });
}

export function highlight_connections(connection: [number, number][]) {
    for (let c of connection) {
        highlight_connection(c);
    }
}

export function lowlight_connection(connection: [number, number]) {
    draw_data.highlightedConnections = draw_data.highlightedConnections.filter((c) => {
        if (c.from === connection[0] && c.to === connection[1]) {
            return false;
        }
        if (c.from === connection[1] && c.to === connection[0]) {
            return false;
        }
        return true;
    });
}

export function lowlight_connections(connection: [number, number][]) {
    for (let c of connection) {
        lowlight_connection(c);
    }
}

export function add_label(name: string, color: string = "gray") {
    draw_data.labels.push({
        name: name,
        value: "",
        color: color,
    });
}

export function remove_label(name: string) {
    draw_data.labels = draw_data.labels.filter((l) => l.name !== name);
}

export function set_label(name: string, value: string) {
    draw_data.labels = draw_data.labels.map((l) => {
        if (l.name === name) {
            l.value = value;
        }
        return l;
    });
}