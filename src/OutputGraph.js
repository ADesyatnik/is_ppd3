import React, {
  useRef,
  useEffect
} from 'react';
import cytoscape from 'cytoscape';
import Matrix from './OutputMatrix';

export default function ComponentsGraph({
  plate,
  renderMatrix
}) {
  const graphRef = useRef(null)
  useEffect(() => {
    deployGraph()
  }, [graphRef])

  if (!plate || !renderMatrix) {
    return null;
  }

  //список связей
  const linksEdge = [];

  for (let i = renderMatrix._size[0]; i > 1; i--) {
    for (let j = i; j > 1; j--) {
      if (renderMatrix._data[i][j - 1] > 0) {
        const s = renderMatrix._data[0][j - 1];
        const t = renderMatrix._data[i][0];
        linksEdge.push({
          data: {
            id: String(s) + String(t),
            source: s,
            target: t
          }
        });
      }
    }
  }

  //список узлов для отображения графа
  const linksNode = [];

  //сумма в строке матриы R
  const matrixR = [];

  let sum = 0;
  for (let i = 1; i < renderMatrix._size[0] + 1; i++) {
    for (let j = 1; j < renderMatrix._size[1] + 1; j++) {
      sum = sum + renderMatrix._data[i][j];
    }
    matrixR.push({
      name: renderMatrix._data[i][0],
      sum: sum,
      position: null,
    });
    sum = 0;
  }

  //поиск элемента-разъема х1 и удаление его из массива для последующей работы
  matrixR.forEach(e => {
    if (e.name === "X1") {
      linksNode.push({
        data: {
          id: e.name
        },
        renderedPosition: {
          x: 0,
          y: 300
        },
        locked: false,
        grabbable: false
      });
      const index = matrixR.indexOf(e);
      matrixR.splice(index, 1);
    }
  });

  //подсчет компонентов, создание матрицы для их разещения
  const sqrElem = Math.ceil(Math.sqrt(matrixR.length));
  const placementMatrix = []

  for (let i = 0; i < sqrElem; i++) {
    const line = [];
    for (let j = 0; j < sqrElem; j++) {
      line.push({
        line: i,
        column: j,
      })
    }
    placementMatrix.push(line);
  }

  //Подсчет длины путей D
  const allDistance = [];
  const allElemForCountDistance = placementMatrix.flat();
  allElemForCountDistance.forEach(primaryE => {
    const pI = primaryE.line;
    const pJ = primaryE.column;
    const pName = "x" + String(pI) + String(pJ);
    allElemForCountDistance.forEach(secondaryE => {
      const sI = secondaryE.line;
      const sJ = secondaryE.column;
      const sName = "x" + String(sI) + String(sJ);

      const distanceBetween = Math.abs((pI - sI)) + Math.abs((pJ - sJ));
      allDistance.push({
        fromNode: pName,
        toNode: sName,
        distance: distanceBetween,
        lineFrom: pI,
        columnFrom:pJ,
      });
    });
  });

    //Создание матрицы D из строки элементов allDistance
    const sqrDistance = Math.sqrt(allDistance.length);
    const matrixDist = [];
  
    let counter = 0;
    for (let i = 0; i < sqrDistance; i++) {
      const line = [];
      for (let j = 0; j < sqrDistance; j++) {
        line.push(allDistance[counter]);
        counter = counter + 1;
      }
      matrixDist.push(line);
    }
  
    //сумма в строках матрицы D подобно матрице C, то, что необходимо для алгоритма
    const lengthMatrixD = [];
  
    for (let i = 0; i < sqrDistance; i++) {
      for (let j = 0; j < sqrDistance; j++) {
        sum = sum + matrixDist[i][j].distance;
      }
      lengthMatrixD.push({
        name: matrixDist[i][0].fromNode,
        sum: sum,
        line: matrixDist[i][0].lineFrom,
        column: matrixDist[i][0].columnFrom,
      });
      sum = 0;
    }

  //сортировка D 
  lengthMatrixD.sort((a, b) => a.sum > b.sum ? 1 : -1);

  //сортировка R
  matrixR.sort((a, b) => a.sum < b.sum ? 1 : -1)

  counter = 0;
  matrixR.forEach( e=> {
    e.position = lengthMatrixD[counter];
    counter++;
  });

  let store = [];
  let f = 0;
  let tmpName = "";
  let tmpSum = 0; 
  let index = -1;
  matrixR.forEach(e=> {
    store= [];
    matrixR.forEach(i =>{
      f = (e.sum-i.sum)*((e.position.column-i.position.column)+(e.position.line-i.position.line));
      store.push({data:i, res: f});
    });

    store.sort((a, b) => a.res < b.res ? 1 : -1);
    if (store[0].res>0)
    {
      tmpName = store[0].data.name;
      tmpSum = store[0].data.sum;
      index = matrixR.findIndex(element => element.name === store[0].data.name);

      matrixR[index].name = e.name;
      matrixR[index].sum = e.sum;

      e.sum = tmpSum;
      e.name = tmpName;
    }
  })

  matrixR.forEach(e => {

    linksNode.push({
      data: {
        id: e.name
      },
      renderedPosition: {
        x: 150*(e.position.column+1),
        y: 150*(e.position.line+1)
      },
    });

  })

  function deployGraph() {
    cytoscape({

      container: graphRef.current, // container to render in

      elements: [
        ...linksNode, ...linksEdge
      ],

      style: [{
          selector: 'node',
          style: {
            'background-color': '#115066',
            'label': 'data(id)',
          }
        },

        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#7ACDE9',
          }
        }
      ],
      layout: {
        name: 'preset'
      },

      // initial viewport state:
      zoom: 1,
      pan: {
        x: 0,
        y: 0
      },

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
    plate && ( <div ref = {graphRef}id = "cy"> </div> )
    );
  }