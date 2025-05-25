import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import "../AtomicComponentsCSS/ChannelGraph.css";
import ButtonModel from "./ButtonModel.jsx";

/**
 * Componente che mostra un grafico in tempo reale per un determinato canale.
 *
 * Props:
 * - data: Array di oggetti con chiavi 'time' e 'value' per il grafico.
 * - channel: Indice del canale (da 0 in su).
 * - onExpand: Funzione chiamata per espandere o minimizzare il grafico.
 * - isExpanded: Booleano che indica se il grafico è espanso.
 * - graphType: Tipo di grafico ("Inertial data" o altro).
 */
const ChannelGraph = ({ data, channel, onExpand, isExpanded, graphType }) => {
    return (
        <div className={`channel-graph ${isExpanded ? "expanded" : ""}`}>
            {/* Intestazione con titolo e pulsanti espandi/riduci */}
            <div className="channel-header">
                <h4 className="channel-title">Channel {channel + 1}</h4>

                {/* Pulsante per espandere (visibile solo se non espanso) */}
                {!isExpanded && (
                    <ButtonModel
                        className="expand-btn"
                        buttonText={
                            <i className="bi bi-arrows-angle-expand" style={{ color: "#03314F" }}></i>
                        }
                        onClick={() => onExpand(channel)}
                    />
                )}

                {/* Pulsante per ridurre (visibile solo se espanso) */}
                {isExpanded && (
                    <ButtonModel
                        className="minimize-btn"
                        buttonText={
                            <i className="bi bi-fullscreen-exit" style={{ color: "#03314F" }}></i>
                        }
                        onClick={() => onExpand(null)}
                    />
                )}
            </div>

            {/* Area del grafico */}
            <div className="graph-wrapper">
                <div className="graph-inner-box">
                    {/* Etichette degli assi */}
                    <span className="axis-label-y">mV</span>
                    <span className="axis-label-x">s</span>

                    {/* Linee e frecce decorative degli assi */}
                    <div className="axis-line-y">
                        <div className="arrow-y"></div>
                    </div>
                    <div className="axis-line-x">
                        <div className="arrow-x"></div>
                    </div>

                    {/* Contenitore reattivo del grafico */}
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid stroke="#ccc" />

                            {/* Asse X nascosto (tempo) */}
                            <XAxis dataKey="time" stroke="#000" hide={true} />

                            {/* Asse Y nascosto con range dinamico in base al tipo di grafico */}
                            <YAxis
                                stroke="#000"
                                domain={graphType === "Inertial data" ? [0, 100] : [0, 4100]}
                                hide={true}
                            />

                            {/* Tooltip al passaggio del mouse */}
                            <Tooltip />

                            {/* Linea principale del grafico */}
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ChannelGraph;
