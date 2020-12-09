import { useEffect, useState } from 'react';
import {multiply, transpose, matrix, zeros} from 'mathjs';
import './App.css';
import ListComponents from './ListComponents';
import OutputMatrix from './OutputMatrix';
import OutputGraph from './OutputGraph';

function App() {
  


  const [plate, setPlate] = useState(null);
  const [fileData, setFileData] = useState('');
  const [renderMatrixR, setRenderMatrixR] = useState(null);
  const [renderMatrixQ, setRenderMatrixQ] = useState(null);
  const [activeTab, setActiveTab] = useState(0);


  const handleReadFile = (event) => {
    const fileData = event.target.result.trim();
    const data = fileData.split(';').filter((d) => d);
    const plate = data
      .map((item) => {
        if (item) {
          const nodeRow = item.split(' ').filter((i) => i);
          const nodeName = nodeRow[0].trim();
          const components = nodeRow.splice(1);

          return {
            name: nodeName,
            components: components.map((component) => ({
              name: component.split('(')[0],
              nodeName,
              output: component.split('(')[1].replace(')', '').replace("'", ''),
            })),
          };
        }

        return null;
      })
      .filter((t) => t);

    setPlate(null);
    setPlate(plate);
    setFileData(data);
  };

  const handleFileChange = (event) => {
    const sourceFile = event.target.files[0];
    const fileReader = new FileReader();

    fileReader.onload = handleReadFile;
    fileReader.readAsText(sourceFile);
  };

  useEffect(() => {
    if (!plate) {
      return;
    }


    const allNodesNames = plate.map((node) => node.name).filter((t) => t);
    const allComponentsNames = plate
      .map((node) => node.components.map((component) => component.name))
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i);
    const QMatrix = matrix(zeros([allComponentsNames.length, allNodesNames.length]));
    plate.forEach((node, j) => {
      node.components.forEach((component) => {
        const i = allComponentsNames.indexOf(component.name);
        QMatrix._data[i][j] = 1;
      });
    });

    const RMatrix = multiply(QMatrix, transpose(QMatrix));
    RMatrix._data.forEach((_, index) => {
      RMatrix._data[index][index] = 0;
    });
    RMatrix._data.forEach((_, index) => {
      RMatrix._data[index].unshift(allComponentsNames[index]);
    });
    RMatrix._data.unshift(['', ...allComponentsNames]);

    QMatrix._data.forEach((_, index) => {
      QMatrix._data[index].unshift(allComponentsNames[index]);
    });
    QMatrix._data.unshift(['', ...allNodesNames]);

    setRenderMatrixR(RMatrix);
    setRenderMatrixQ(QMatrix);

    return () => {
      setRenderMatrixR(null);
      setRenderMatrixQ(null);
    };
  }, [plate]);


  return (
    <div className="app">
      <div className="block-read">
        <div className="components file">
          <h3>Выбор файла</h3>
              <div className="file-field input-field components">
                <input onChange={handleFileChange} type="file" />
              </div>
              <h3>Содержимое файла</h3>
            <ListComponents data={fileData} />
        </div>
      </div>

      <div className="block-output-matrix">
        <div className="components matrix">
          <button onClick={() => setActiveTab(0)} className="baton switch-tab">Матрица ВГС</button>
          <button onClick={() => setActiveTab(1)} className="baton switch-tab">Отрисовка схемы</button>
          <button className="baton right-baton">Алгоритм и параметры</button>
             {activeTab===0 && <div className="slide"><OutputMatrix renderMatrix={renderMatrixR}/></div>}
             {activeTab===1 && <div className="slide">
              <OutputGraph plate={plate} renderMatrix={renderMatrixR}/>
             </div>}
        </div>
      </div>
    </div>
  );
}

export default App;
