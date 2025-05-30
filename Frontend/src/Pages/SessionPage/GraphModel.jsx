import React, { useState, useEffect } from "react";
import ChannelGraph from "../../AtomicComponents/ChannelGraph.jsx";
import "../../ComponentsCSS/GraphModel.css";

const GraphModel = ({ data, type }) => {
    const [expandedChannel, setExpandedChannel] = useState(null);

    // Gestione della visualizzazione del body blur quando un grafico è espanso
    useEffect(() => {
        if (expandedChannel !== null) {
            document.body.classList.add("modal-open");
        } else {
            document.body.classList.remove("modal-open");
        }
    }, [expandedChannel]);

    // Se il tipo di grafico non è stato selezionato
    if (type === "Graph type") return null;

    return (
        <>
            {/* Contenitore per i grafici */}
            <div
                key={`${type}-${data.length}`}
                className={`graphGrid-wrapper ${expandedChannel !== null ? "blur" : ""}`}
            >
                <div className={`graphGrid ${type === "Inertial data" ? "inertial-grid" : "semg-grid"}`}>
                    {data.map((channelData, index) => (
                        <ChannelGraph
                            key={index}
                            data={channelData}
                            channel={index}
                            onExpand={setExpandedChannel}
                            isExpanded={false}
                            graphType={type}
                        />

                    ))}
                </div>
            </div>

            {/* Overlay per grafico espanso */}
            {expandedChannel !== null && (
                <div className="graphOverlay">
                    <ChannelGraph
                        data={data[expandedChannel]}
                        channel={expandedChannel}
                        onExpand={setExpandedChannel}
                        isExpanded={true}
                        graphType={type}
                    />

                </div>
            )}
        </>
    );
};

export default GraphModel;
