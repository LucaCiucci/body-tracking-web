
import { POSE_CONNECTIONS, Results as PoseResults, POSE_LANDMARKS } from '@mediapipe/pose';
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

interface Angoli {
    spalle: number;
    collo: number;
}

interface Val {
    position: number,
    color: [number, number, number],
};

function linear_gradient_interpolate(values: Val[], v: number): [number, number, number]  {
    if (values.length === 0) {
        return [0, 0, 0];
    }

    if (v <= values[0].position) {
        return values[0].color;
    }

    if (v >= values[values.length - 1].position) {
        return values[values.length - 1].color;
    }

    for (let i = 0; i < values.length - 1; i++) {
        let a = values[i];
        let b = values[i + 1];
        if (a.position <= v && v <= b.position) {
            let t = (v - a.position) / (b.position - a.position);
            return [
                a.color[0] * (1 - t) + b.color[0] * t,
                a.color[1] * (1 - t) + b.color[1] * t,
                a.color[2] * (1 - t) + b.color[2] * t,
            ];
        }
    }

    return [0, 0, 0];
}

function to_css_color(rgb: [number, number, number]): string {
    let r = "rgb(";
    r += Math.round(rgb[0]).toString() + ", ";
    r += Math.round(rgb[1]).toString() + ", ";
    r += Math.round(rgb[2]).toString() + ")";
    return r;
}

function neck_color(v: number): string {
    let values: Val[] = [
        {
            position: 0,
            color: [0, 255, 0]
        },
        {
            position: 5,
            color: [255, 255, 0]
        },
        {
            position: 10,
            color: [255, 0, 0]
        },
        {
            position: 15,
            color: [139, 0, 139]
        },
    ];
    let rgb = linear_gradient_interpolate(values, v);

    return to_css_color(rgb);
}

export function calcola_angoli(
): Angoli {
    let pose = draw_data.pose;

    if (!pose) {
        return {
            spalle: 0,
            collo: 0,
        };
    }

    let landmarks = pose.poseLandmarks as (NormalizedLandmarkList | undefined);

    if (!landmarks) {
        return {
            spalle: 0,
            collo: 0,
        };
    }

    let left_shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    let right_shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
function calcAngleDegrees(x: number, y: number) {
  return Math.atan2(y, x) * 180 / Math.PI;
}
    let shoulder_angle = calcAngleDegrees(
        -left_shoulder.x - -right_shoulder.x,
        left_shoulder.y - right_shoulder.y,
    );

    let left_eye = landmarks[POSE_LANDMARKS.LEFT_EYE];
    let right_eye = landmarks[POSE_LANDMARKS.RIGHT_EYE];

    let eye_angle = calcAngleDegrees(
        -left_eye.x - -right_eye.x,
        left_eye.y - right_eye.y,
    );

    return {
        spalle: shoulder_angle,
        collo: eye_angle,
    };
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
            let angles = calcola_angoli();
            let shoulder_angle = angles.spalle;
            let eye_angle = angles.collo;

            let worst = (() => {
                let a = Math.abs(angles.spalle * 3 / 2);
                let b = Math.abs(angles.collo);
                return (a > b) ? a : b;
            })();
            let worst_color = neck_color(worst);

            //drawConnectors(ctx, landmarks, POSE_CONNECTIONS, { color: "#7F00FF00", lineWidth: 4 });
            for (let conn of POSE_CONNECTIONS) {
                const from = landmarks[conn[0]];
                const to = landmarks[conn[1]];
                let [x1, y1] = video_to_canvas_coordinates([from.x, from.y]);
                let [x2, y2] = video_to_canvas_coordinates([to.x, to.y]);
                //ctx.strokeStyle = "#00FF007F";
                ctx.strokeStyle = "gray";
                ctx.strokeStyle = worst_color;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            /*ctx.fillStyle = "blue";
            for (let landmark of landmarks) {
                let [x, y] = video_to_canvas_coordinates([landmark.x, landmark.y]);
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }*/

            let left_shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
            let right_shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
            let left_eye = landmarks[POSE_LANDMARKS.LEFT_EYE];
            let right_eye = landmarks[POSE_LANDMARKS.RIGHT_EYE];
            
            // draw the shoulder angle from of the left shoulder
            let [x1, y1] = video_to_canvas_coordinates([left_shoulder.x, left_shoulder.y]);
            let [x2, y2] = video_to_canvas_coordinates([right_shoulder.x, right_shoulder.y]);
            //ctx.strokeStyle = "red";
            ctx.fillStyle = neck_color(Math.abs(angles.spalle * 3 / 2));
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            let midpoint = [(x1 + x2) / 2, (y1 + y2) / 2];
            ctx.lineTo(midpoint[0], midpoint[1]);
            ctx.lineTo(midpoint[0], y1);
            ctx.fill();

            // draw the shoulder angle from of the right shoulder
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(midpoint[0], midpoint[1]);
            ctx.lineTo(midpoint[0], y2);
            ctx.fill();

            // draw neck angle from midpoint to the midpoint of the eyes
            let [xa, ya] = midpoint;
            ctx.fillText(Math.round(angles.spalle).toString() + "°", xa + 50, ya - 10);
            let [xb, yb] = video_to_canvas_coordinates([(left_eye.x + right_eye.x) / 2, (left_eye.y + right_eye.y) / 2]);

            ctx.fillStyle = neck_color(Math.abs(angles.collo));
            ctx.beginPath();
            ctx.moveTo(xa, ya);
            ctx.lineTo(xb, yb);
            ctx.lineTo(xa, yb);
            ctx.fill();

            ctx.fillText(Math.round(angles.collo).toString() + "°", xb + 0, yb);
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

export function highlight_connection(connection: [number, number], color: string) {
    draw_data.highlightedConnections.push({
        from: connection[0],
        to: connection[1],
        color,
    });
}

export function highlight_connections(connection: [number, number][], color: string) {
    for (let c of connection) {
        highlight_connection(c, color);
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