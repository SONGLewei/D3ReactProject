import { configureStore } from '@reduxjs/toolkit'
import dataSetReducer from './redux/DataSetSlice'
import selectionReducer from './redux/SelectionSlice'

export default configureStore({
  reducer: {
    dataSet: dataSetReducer,
    selection: selectionReducer
  }
})