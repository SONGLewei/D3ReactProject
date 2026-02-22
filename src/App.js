import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { useEffect} from 'react';
import { getDataSet } from './redux/DataSetSlice';
import ScatterplotContainer from './components/scatterplot/ScatterplotContainer';
import HierarchyContainer from './components/hierarchy/HierarchyContainer';

// here import other dependencies

// a component is a piece of code which render a part of the user interface
function App() {

  const dispatch = useDispatch();

  const data = useSelector(state => state.dataSet);
  // every time the component re-render
  useEffect(()=>{
      //console.log("App useEffect (called each time App re-renders)");
      dispatch(getDataSet());
  },[dispatch]); // if no second parameter, useEffect is called at each re-render

  useEffect(()=>{
    //console.log("App : change in cangku ->", data);
  },[data]);

  return (
    <div className="App">
      <h1>US cities : Where to Settle Down ?</h1>
        <div id={"MultiviewContainer"} className={"row"}>

            <ScatterplotContainer 
              xAttributeName="medIncome"
              yAttributeName="ViolentCrimesPerPop"
              rAttributeName="MedRentPctHousInc"
              colorAttributeName="PctEmplProfServ"
            />

            <HierarchyContainer />
          
        </div>
    </div>
  );
}

export default App;
