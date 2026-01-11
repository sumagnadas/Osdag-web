import { useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist-min'

function OptimizationGraph({ data, onClose, optimizationDone }) {
    const graphRef = useRef(null);
    const savePlotRef = useRef(null);
    useEffect(() => {
        if (graphRef.current)
            savePlotRef.current.onclick = () => { Plotly.downloadImage(graphRef.current.el, { format: 'png', width: 800, height: 600, filename: 'pso_visualization' }) }
        console.log('Graph ref is set:', graphRef);
    }, [graphRef]
    );

    return (<div className='flex flex-col w-full flex-1'>
        <div className='flex flex-col w-full h-[95%]'>
            <div className='flex flex-row h-fit p-4 font text-white' style={{ backgroundColor: "#6b7d20" }}>
                <div className='flex-1 content-center font-black'>PSO OPTIMIZATION SPACE</div><div className='flex w-auto gap-5'>
                    <div className='w-auto m-auto font-extrabold'>ITERATION: {data.current_iter}</div>
                    <div className='w-auto m-auto font-black text-[#ffd708] '>BEST: {data.best.found ? data.best.y[0] : "---"}</div>
                    <div className='w-auto m-auto '>Particle: {data.best.found ? `${data.best.particle} @ Iter ${data.best.iter}` : "---"}</div>
                    <div className='w-auto flex items-center justify-center'>
                        <button className="flex h-fit box-content justify-center px-4 py-2 items-center bg-osdag-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-opacity" onClick={() => { onClose(); console.log("should close") }}>CLOSE</button>
                    </div>
                </div>
            </div>
            <div className='flex flex-1 z-0 flex-row'>
                <div className="flex items-center w-[65%] justify-center">
                    <Plot
                        ref={graphRef}
                        data={[
                            {
                                name: 'Utilization > 1',
                                x: data.non_fease.x,
                                y: data.non_fease.y,
                                z: data.non_fease.z,
                                type: 'scatter3d',
                                mode: 'markers',
                                marker: {
                                    size: 2,
                                    color: "rgba(189, 0, 0, 0.83)",
                                    opacity: 1
                                },
                            },
                            {
                                name: 'Utilization ≤ 1',
                                x: data.fease.x,
                                y: data.fease.y,
                                z: data.fease.z,
                                type: 'scatter3d',
                                mode: 'markers',
                                marker: {
                                    size: 2,
                                    color: 'rgba(34, 255, 0,1)',
                                    opacity: 1
                                },
                            },
                            {
                                name: 'Gloabl Best',
                                x: data.best.x,
                                y: data.best.y,
                                z: data.best.z,
                                type: 'scatter3d',
                                mode: 'markers',
                                marker: {
                                    size: 2,
                                    color: 'rgba(255, 215, 0,1)',
                                    opacity: 1
                                },
                            }
                        ]}
                        config={{ displayModeBar: false, responsive: true }}
                        className="w-[80%] flex h-full pt-10 box-border"
                        useResizeHandler={true}
                        layout={{
                            legend: { orientation: 'v', itemsizing: "constant", itemwidth: 30, y: 0.9, x: 0.6, font: { size: 10 }, bordercolor: "rgba(0,0,0,1)", borderwidth: 1 },
                            margin: { l: 10, r: 10, t: 30, b: 60 },
                            title: { text: "3D Scatter Plot: Utilization Ratio vs Depth vs Width", font: { weight: 800 } },
                            autosize: true,
                            scene: {
                                zaxis: { showspikes: false, title: { text: "Weight (kg)" }, tickangle: 0 },
                                yaxis: {
                                    showspikes: false,
                                    title: {
                                        text: "Depth (mm)"
                                    },
                                    tickangle: 0
                                },
                                xaxis: {
                                    showspikes: false,
                                    title: {

                                        text: "Utilization Ratio",
                                    },
                                    tickangle: 0
                                },
                                aspectmode: 'cube', dragmode: false, hovermode: false,
                                camera: {
                                    eye: { x: -2, y: -2, z: 1 },
                                    up: { x: 0, y: 0, z: 1 }
                                }
                            },
                            annotations: [{ align: "left", bgcolor: "rgba(255,255,227,1)", bordercolor: "rgba(0,0,0,1)", y: 0.8, x: 0.3, text: `<b>Global Best:</b><br>Iter: 10 | Particle: 13<br>Depth: ${data.best.y}<br>Weight: ${data.best.z}<br>UR: ${data.best.x}` }]
                        }}
                    />
                </div>
                <div className="w-[35%] flex flex-col justify-center text-5xl">
                    <div className='h-fit font-black py-5 flex justify-center text-xl'>Best Cross-Section (I-Beam) </div>
                    <div className='min-h-[50%] text-gray-500 items-center text-center flex justify-center font-medium'>No Feasible Solution Yet<br />(Searching...)</div>
                </div>
            </div>

        </div>
        <div className='flex justify-between box-border flex-row h-[5%] z-10 px-4 font w-full border-t-[1px] border-t-gray-700'>
            <div className='content-center items-center flex'>{optimizationDone ? "Optimization Complete" : "Optimizing"}</div>
            <div className='w-auto flex items-center justify-center'>
                <button ref={savePlotRef} className="flex h-fit box-content justify-center px-4 py-1 items-center  bg-gray-200 text-black font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-opacity">Save Plot</button>
            </div>
        </div>
    </div>
    );
}

export default OptimizationGraph;