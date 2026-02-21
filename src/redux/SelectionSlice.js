import { createSlice } from '@reduxjs/toolkit';

export const selectionSlice = createSlice({
    name: 'selection',
    initialState: {
        selectedIds: [] 
    },
    reducers: {
        updateSelectedIds: (state, action) => {
            state.selectedIds = action.payload;
        }
    }
});

export const { updateSelectedIds } = selectionSlice.actions;

export default selectionSlice.reducer;