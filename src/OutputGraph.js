import React, {useRef, useEffect} from 'react';
import cytoscape from 'cytoscape';

export default function ComponentsGraph({ plate, renderMatrix }) {
    const graphRef = useRef(null)
    useEffect(() => {
        deployGraph()
    }, [graphRef])

    if (!plate || !renderMatrix) {
      return null;
    }

  
    // const allComponents = plate.map((node) => node.components).flat();
    // const components = [...new Set(allComponents.map((component) => component.name))].map((name) => ({
    //   showName: `c-${name}`,
    //   name,
    //   outputs: [],
    // }));
  
    // allComponents.forEach((component) => {
    //   const findC = components.find((c) => c.name === component.name);
  
    //   if (findC) {
    //     const indexOfFoundC = components.findIndex((c) => c.name === component.name);
  
    //     components[indexOfFoundC].outputs.push({
    //       showName: component.output.trim(),
    //       name: `${findC.name}::${component.output.trim()}`,
    //       node: component.nodeName.trim(),
    //       component: findC.name,
    //     });
    //   }
    // });
  
    // const outputs = components.map((c) => c.outputs).flat();
    // const nodes = outputs
    //   .map((c) => c.node)
    //   .flat()
    //   .filter((v, i, a) => a.indexOf(v) === i);
  
    // const links = [];
  
    // outputs.forEach((o) => {
    //   links.push({ source: o.name, target: o.node });
    //   links.push({ source: o.component, target: o.name });
    // });
  
    // const renderComponents = components?.map((c) => ({
    //   id: c.name,
    //   symbolType: 'square',
    //   label: c.showName,
    //   color: 'hotpink',
    //   size: 4000,
    // }));
    // const renderNodes = nodes?.map((n) => ({
    //   id: n,
    //   symbolType: 'circle',
    //   color: 'brown',
    //   size: 4000,
    // }));
    // const renderOutputs = outputs?.map((o) => ({
    //   id: o.name,
    //   symbolType: 'cross',
    //   color: 'seagreen',
    //   size: 1800,
    // }));

    const linksEdge = [];
    
    for (let i = renderMatrix._size[0]; i > 1; i--) {
        for (let j = i; j > 1; j--) {
          if (renderMatrix._data[i][j - 1] > 0) {
            const s = renderMatrix._data[0][j - 1];
            const t = renderMatrix._data[i][0];
            linksEdge.push({ data:{id: String(s)+String(t), source: s, target: t} });
          }
        }
      }

    const allComponentsNames = plate
      .map((node) => node.components.map((component) => component.name))
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i);
    
    const linksNode = [];


    allComponentsNames.forEach(e=> {
        linksNode.push({ data:{id: e} });
    });

   function deployGraph() {
    cytoscape({

        container: graphRef.current, // container to render in
    
        elements: [ ...linksNode, ...linksEdge ],
        
        style: [ 
            {
                selector: 'node',
                style: {
                  'background-color': '#698aa9',
                  'label': 'data(id)',
                  'shape': 'barrel',
                }
              },
              {
                selector: 'edge',
                style: {
                  'line-color': '#800000',
                  'width': 1,
                }
              }, 
        ],
        layout: { name: 'circle'},

        // initial viewport state:
        zoom: 1,
        pan: { x: 0, y: 0 },

        // interaction options:
        minZoom: 1e-50,
        maxZoom: 1e50,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        selectionType: 'single',
        touchTapThreshold: 8,
        desktopTapThreshold: 4,
        autolock: false,
        autoungrabify: false,
        autounselectify: false,

        // rendering options:
        headless: false,
        styleEnabled: true,
        hideEdgesOnViewport: false,
        textureOnViewport: false,
        motionBlur: false,
        motionBlurOpacity: 0.2,
        wheelSensitivity: 1,
        pixelRatio: 'auto'
      
      });
   }

   
  
    return (
      plate && (
        <div ref={graphRef} id="cy"></div>
      )
    );
  }
  