import './App.css';
import Header from './components/Header';
import SerialConnectionGate from './Components/ConnectionGateModel';
import ControlPanel from "./Components/ControlPanel.jsx";

function App() {
    return (
        <div>
            <Header />
            <div className="main-container">
                <SerialConnectionGate />
                {/*<ControlPanel/>*/}
            </div>
        </div>
    );
}

export default App;
