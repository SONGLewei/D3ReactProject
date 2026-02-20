import * as d3 from 'd3'
// import { getDefaultFontSize } from '../../utils/helper';

class ScatterplotD3 {
    margin = {top: 100, right: 10, bottom: 50, left: 100};
    size;
    height;
    width;
    svg;
    // add specific class properties used for the vis render/updates
    defaultOpacity=0.3;
    transitionDuration=1000;
    circleRadius = 3;
    xScale;
    yScale;


    constructor(el){
        this.el=el;
    };

    create = function (config) {
        const safeWidth = config.size.width > 0 ? config.size.width : 800;
        const safeHeight = config.size.height > 0 ? config.size.height : 500;

        this.size = {width: safeWidth, height: safeHeight};
        //this.size = {width: config.size.width, height: config.size.height};

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // initialize the svg and keep it in a class property to reuse it in renderScatterplot()
        this.svg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","svgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        ;

        this.xScale = d3.scaleLinear().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);

        // build xAxisG
        this.svg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")")
        ;
        this.svg.append("g")
            .attr("class","yAxisG")
        ;
    }

    changeBorderAndOpacity(selection, selected){
        selection.style("opacity", selected?1:this.defaultOpacity)
        ;

        selection.select(".markerCircle")
            .attr("stroke-width",selected?2:0)
        ;
    }

    updateMarkers(selection,xAttribute,yAttribute){
        // transform selection
        selection
            .transition().duration(this.transitionDuration)
            .attr("transform", (item)=>{
                // use scales to return shape position from data values
                if(item[xAttribute] === undefined || item[yAttribute] === undefined){
                    return "translate(0,0)"
                }

                const xPixel = this.xScale(item[xAttribute]);
                const yPixel = this.yScale(item[yAttribute]);

                if (isNaN(xPixel) || isNaN(yPixel)) {
                    return `translate(0, 0)`;
                }

                return `translate(${xPixel},${yPixel})`;
            })
        ;
        this.changeBorderAndOpacity(selection, false)
    }

    highlightSelectedItems(selectedItems){
        // use pattern update to change the border and opacity of objects:
        //      - call this.changeBorderAndOpacity(selection,true) for objects in selectedItems
        //      - this.changeBorderAndOpacity(selection,false) for objects not in selectedItems
    }

    updateAxis = function(visData,xAttribute,yAttribute){
        // compute min max using d3.min/max(visData.map(item=>item.attribute))
        const xExtent = d3.extent(visData, item => item[xAttribute]);
        const yExtent = d3.extent(visData, item => item[yAttribute]);

        this.xScale.domain(xExtent);
        this.yScale.domain([0,yExtent[1]]);

        const xAxis = d3.axisBottom(this.xScale);
        const yAxis = d3.axisLeft(this.yScale);

        this.svg.select(".xAxisG").transition().duration(this.transitionDuration).call(xAxis);
        this.svg.select(".yAxisG").transition().duration(this.transitionDuration).call(yAxis);

        // create axis with computed scales
    }


    renderScatterplot = function (visData, xAttribute, yAttribute, controllerMethods){
        //console.log("render scatterplot with a new data list ...")
        const cleanData = visData.filter(item => {
            return item[xAttribute] !== undefined && item[xAttribute] !== "?" && item[xAttribute] !== null &&
                   item[yAttribute] !== undefined && item[yAttribute] !== "?" && item[yAttribute] !== null;
        });

        // build the size scales and x,y axis
        this.updateAxis(cleanData,xAttribute,yAttribute);

        this.svg.selectAll(".markerG")
            // all elements with the class .cellG (empty the first time)
            .data(cleanData,(itemData)=>itemData.index)
            .join(
                enter=>{
                    // all data items to add:
                    // doesn’exist in the select but exist in the new array
                    const itemG=enter.append("g")
                        .attr("class","markerG")
                        .style("opacity",this.defaultOpacity)
                        .on("click", (event,itemData)=>{
                            controllerMethods.handleOnClick(itemData);
                        })
                    ;
                    // render element as child of each element "g"
                    itemG.append("circle")
                        .attr("class","markerCircle")
                        .attr("r",this.circleRadius)
                        .attr("stroke","red")
                    ;
                    this.updateMarkers(itemG,xAttribute,yAttribute);
                },
                update=>{
                    this.updateMarkers(update,xAttribute,yAttribute)
                },
                exit =>{
                    exit.remove()
                    ;
                }

            )
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}
export default ScatterplotD3;