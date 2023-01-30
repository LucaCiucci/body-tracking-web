
//import { Results } from '@mediapipe/pose'

export class Vector {
    x = 0;
    y = 0;

    add(v /*: Vector*/) /*: Vector*/ {
        let r = new Vector;
        r.x = this.x + v.x;
        r.y = this.y + v.y;
        return r;
    }

    opposite() /*: Vector*/ {
        let r = new Vector;
        r.x = -this.x;
        r.y = -this.y;
        return r;
    }

    norm() /*: number*/ {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
}

export function vFromXY(x /*: number*/, y /*: number*/) /*: Vector*/ {
    let r = new Vector;
    r.x = x;
    r.y = y;
    return r;
}

function dist(a /*: Vector*/, b /*: Vector*/) /*: number*/ {
    return a.add(b.opposite()).norm();
}

// ax + bx + c = 0
class ImplicitLine {
    a = 0;
    b = 0;
    c = 0;
}

function lineForm2Points(p0 /*: Vector*/, p1 /*:  Vector*/) /*: ImplicitLine*/ {
    /*
     x  - x0     y  - y0
    --------- = ---------    =>    (y1 - y0) x + (x0 - x1) y + ((y0 - y1) x0 + (x1 - x0) y0) = 0
     x1 - x0     y1 - y0
    */

   let l = new ImplicitLine;
   
   l.a = p1.y - p0.y;
   l.b = p0.x - p1.x;
   l.c = (p0.y - p1.y) * p0.x + (p1.x - p0.x) * p0.y;

   return l;
}

function intersection2Lines(l1 /*: ImplicitLine*/, l2 /*: ImplicitLine*/) /*: Vector*/ {
    // simplified formula from here:
    // https://www.cuemath.com/geometry/intersection-of-two-lines/

    let r = new Vector;

    r.x = (l1.b * l2.c - l2.b * l1.c) / (l1.a * l2.b - l2.a * l1.b);
    r.y = (l1.c * l2.a - l2.c * l1.a) / (l1.a * l2.b - l2.a * l1.b);

    return r;
}

export function intersection2LinesFromPoints(a0 /*: Vector*/, a1 /*: Vector*/, b0 /*: Vector*/, b1 /*: Vector*/) /*: Vector*/ {
    return intersection2Lines(lineForm2Points(a0, a1), lineForm2Points(b0, b1));
}

var file_tabella /*: string*/ = "";
file_tabella += "# fotogramma    dato";
var frameNumber = 0;

export function drawAngleBetweenKeypoints(
    canvas /*: HTMLCanvasElement*/,
    ctx /*: CanvasRenderingContext2D*/,
    results /*: Results*/,
    idx_a0 /*: number*/,
    idx_a1 /*: number*/,
    idx_b0 /*: number*/,
    idx_b1 /*: number*/,
    ) /*: void*/
{
    if (!results)
        return;
    if (!results.poseLandmarks)
        return;
    let _a0 = results.poseLandmarks[idx_a0];
    let _a1 = results.poseLandmarks[idx_a1];
    let _b0 = results.poseLandmarks[idx_b0];
    let _b1 = results.poseLandmarks[idx_b1];

    function makePositive(alpha /*: number*/) /*: number*/ {
        if (alpha < 0)
            return Math.PI * 2 + alpha;
        return alpha;
    }

    if (_a0 && _a1 && _b0 && _b1)
    {
        let a0 = vFromXY(_a0.x * canvas.width, _a0.y * canvas.height);
        let a1 = vFromXY(_a1.x * canvas.width, _a1.y * canvas.height);
        let b0 = vFromXY(_b0.x * canvas.width, _b0.y * canvas.height);
        let b1 = vFromXY(_b1.x * canvas.width, _b1.y * canvas.height);
        let d1 = a1.add(a0.opposite());
        let d2 = b1.add(b0.opposite());
        let v = intersection2LinesFromPoints(a0, a1, b0, b1);

        /*ctx.fillStyle = "#00FF00";
        ctx.beginPath();
        ctx.arc(v.x, v.y, 5, 0, 2 * Math.PI);
        ctx.fill();*/

        let alpha1 = makePositive(Math.atan2(d1.y, d1.x));
        let alpha2 = makePositive(Math.atan2(d2.y, d2.x));
        if (alpha1 > alpha2)
            [alpha1, alpha2] = [ alpha2, alpha1 ];

        let ccw = (alpha2 - alpha1) > Math.PI;

        ctx.fillStyle = "#0088FF88";
        ctx.beginPath();
        ctx.arc(v.x, v.y, 50, alpha1, alpha2, ccw);
        ctx.arc(v.x, v.y, 25, alpha2, alpha1, !ccw);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.font = "30px Arial";
        let txt = ((ccw ? alpha1 - alpha2 + Math.PI * 2 : alpha2 - alpha1) * 180 / Math.PI).toFixed(1) + "°";
        ctx.fillText(txt, v.x + 25, v.y);
        ctx.strokeText(txt, v.x + 25, v.y);

        if (idx_a0 == 24) {
            frameNumber += 1;
            file_tabella += "\n" + frameNumber + "\t" + ((ccw ? alpha1 - alpha2 + Math.PI * 2 : alpha2 - alpha1) * 180 / Math.PI).toFixed(1);
        }
    }
}

export function salva() {
    var data = new Blob([file_tabella], {type: 'text/plain'});

    let textFile = window.URL.createObjectURL(data);

    var link = document.createElement("a");
    link.download = "tabella.txt";
    link.href = textFile;
    link.click();
}
