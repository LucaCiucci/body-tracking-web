
import "./Home.css"

import bike_logo from "../bicycle_posture_analyzer/logo.svg";
import sequence_logo from "../sequence/logo.svg";

import { Link } from "react-router-dom"

export function Home(): JSX.Element {
    return (
    <div className="home-app">
        <h1>
            Select a mode
        </h1>

        <div id="modes-container">
            {/*<Link className="mode" to="/apps/bicycle_posture_analyzer/">*/}
            <a className="mode" href="https://lucaciucci.github.io/apps/bicycle_posture_analyzer/">
                <img src={bike_logo} alt="bicycle" />
                <div className="title">
                    Bicycle angles<br/> (old)
                </div>
            </a>
            <Link className="mode" to="/apps/sequence/">
                <img src={sequence_logo} alt="sequence" />
                <div className="title">
                    Sequence<br />
                </div>
            </Link>
        </div>
    </div>
    );
}