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

  //список узлов
  const linksNode = [];

  //сумма в строке матриы R
  let sum = 0;
  const linkMatrixC = [];

  for (let i = 1; i < renderMatrix._size[0] + 1; i++) {
    for (let j = 1; j < renderMatrix._size[1] + 1; j++) {
      sum = sum + renderMatrix._data[i][j];
    }
    linkMatrixC.push({
      name: renderMatrix._data[i][0],
      sum: sum
    });
    sum = 0;
  }

  //поиск элемента-разъема х1 и удаление его из массива для последующей работы
  linkMatrixC.forEach(e => {
    if (e.name === "X1") {
      linksNode.push({
        data: {
          id: e.name
        },
        renderedPosition: {
          x: 0,
          y: 0
        },
        locked: false,
        grabbable: false
      });
      const index = linkMatrixC.indexOf(e);
      linkMatrixC.splice(index, 1);
    }
  });

  //подсчет компонентов, создание матрицы для их разещения
  const sqrElem = Math.ceil(Math.sqrt(linkMatrixC.length));
  const placementMatrix = []

  for (let i = 0; i < sqrElem; i++) {
    const line = [];
    for (let j = 0; j < sqrElem; j++) {
      line.push({
        line: i,
        column: j,
        component: false
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
        fromLine: pI,
        fromColumn: pJ
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
      line: matrixDist[i][0].fromLine,
      column: matrixDist[i][0].fromColumn
    });
    sum = 0;
  }

  //сортировка C по возрастанию
  linkMatrixC.sort((a, b) => a.sum < b.sum ? 1 : -1);

  //сортировка D по убыванию
  lengthMatrixD.sort((a, b) => a.sum > b.sum ? 1 : -1);

  //спихиваем элементы в общий массив
  const solution = []

  counter = 0;
  linkMatrixC.forEach(e => {
    let d = lengthMatrixD[counter];
    solution.push({
      nameNode: e.name,
      nameCell: d.name,
      cellLine: d.line,
      cellColumn: d.column
    });
    counter++;
  });

  //НЕ случайная растановка
  solution.forEach(e =>{
    linksNode.push({
      data: {
        id: e.nameNode
      },
      renderedPosition: {
        x: 100 * (e.cellLine+1),
        y: 100 * (e.cellColumn+1)
      }
    });
  })


  // //случайная растановка
  // counter = 0;
  // for (let i = 0; i < sqrElem; i++) {
  //   for (let j = 0; j < sqrElem; j++) {
  //     if (!(placementMatrix[i][j].component)) {
  //       if (counter >= linkMatrixC.length) {
  //         break;
  //       }
  //       const e = linkMatrixC[counter];
  //       linksNode.push({
  //         data: {
  //           id: e.name
  //         },
  //         renderedPosition: {
  //           x: 100 * (placementMatrix[i][j].line + 1),
  //           y: 100 * (placementMatrix[i][j].column + 1)
  //         }
  //       });
  //       placementMatrix[i][j].component = true;
  //       counter = counter + 1;
  //     }
  //   }
  // }




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