import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import HierarchyD3 from './Hierarchy-d3';
import './Hierarchy.css';

function HierarchyContainer() {
    
    const visData = useSelector(state => state.dataSet);
    
    const selectedIds = useSelector(state => state.selection.selectedIds); 

    const divContainerRef = useRef(null);
    
    const d3Ref = useRef(null);

    const getChartSize = function() {
        let width;
        let height;
        if(divContainerRef.current !== undefined){
            width = divContainerRef.current.offsetWidth;
            height = divContainerRef.current.offsetHeight;
        }
        return { width, height };
    }

    useEffect(() => {
        const hierarchyD3 = new HierarchyD3(divContainerRef.current);
        hierarchyD3.create({ size: getChartSize() });
        d3Ref.current = hierarchyD3;
        
        return () => {
            hierarchyD3.clear();
        }
    }, []);

    useEffect(() => {
        if (d3Ref.current && visData && visData.length > 0) {
            d3Ref.current.renderHierarchy(visData);
        }
    }, [visData]);

    useEffect(() => {
        if (d3Ref.current) {
            d3Ref.current.highlightSelectedItems(selectedIds);
        }
    }, [selectedIds]);

    return (
        <div ref={divContainerRef} className="hierarchyDivContainer col2">
        </div>
    );
}

export default HierarchyContainer;