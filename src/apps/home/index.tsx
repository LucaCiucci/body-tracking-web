
import "./Home.css"

import bike_logo from "../bicycle_posture_analyzer/logo.svg";
import sequence_logo from "../sequence/logo.svg";

export function Home(): JSX.Element {
    return (
    <div className="home-app">
        <h1>
            Select a mode
        </h1>

        <div id="modes-container">
            <a className="mode" href="./apps/bicycle_posture_analyzer/">
                <img src={bike_logo} alt="bicycle" />
                <div className="title">
                    Bicycle angles<br/> (old)
                </div>
            </a>
            <a className="mode" href="./apps/sequence/">
                <img src={sequence_logo} alt="sequence" />
                <div className="title">
                    Sequence<br />
                </div>
            </a>
        </div>
    </div>
    );
}