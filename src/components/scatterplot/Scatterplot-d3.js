import * as d3 from 'd3'
// import { getDefaultFontSize } from '../../utils/helper';

class ScatterplotD3 {
    margin = {top: 100, right: 10, bottom: 50, left: 100};
    size;
    height;
    width;
    svg;
    // add specific class properties used for the vis render/updates
    defaultOpacity=0.8;
    transitionDuration=1000;
    circleRadius = 3;
    xScale;
    yScale;


    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

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

        // 4 elements, attributes names
        this.xScale = d3.scaleLinear().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);
        this.rScale = d3.scaleLinear().range([5.5, 0.05]);
        this.colorScale = d3.scaleSequential(d3.interpolateBlues);

        
        // build xAxisG
        this.svg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")")
        ;
        this.svg.append("g")
            .attr("class","yAxisG")
        ;

        // Legend Group
        this.legendGroup = this.svg.append("g")
            .attr("class", "legendGroup")
            .attr("transform", `translate(${this.width - 250}, 20)`);

        // SVG Jian bian
        const defs = this.svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "softPowerGradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "0%");

        gradient.append("stop").attr("offset", "0%").attr("stop-color", d3.interpolateBlues(0.1)); 
        gradient.append("stop").attr("offset", "100%").attr("stop-color", d3.interpolateBlues(0.9));

        // rect of ratio
        this.legendGroup.append("rect")
            .attr("width", 120)
            .attr("height", 12)
            .style("fill", "url(#softPowerGradient)")
            .attr("rx", 2);

        this.legendGroup.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text("Medical Technology Ratio");

        // The left and right ends of the scale
        this.legendMinText = this.legendGroup.append("text")
            .attr("x", 0).attr("y", 26).style("font-size", "10px").style("fill", "#666");
        this.legendMaxText = this.legendGroup.append("text")
            .attr("x", 120).attr("y", 26).attr("text-anchor", "end").style("font-size", "10px").style("fill", "#666");

        // --- Scale of rent to price ratio ---
        this.sizeLegendGroup = this.svg.append("g")
            .attr("class", "sizeLegendGroup")
            .attr("transform", `translate(${this.width - 250}, 80)`);

        this.sizeLegendGroup.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text("Balance Ratio (1 - Rent-to-Price Ratio)");

        const sampleSizes = [2, 6, 12];
        const sampleLabels = ["few", "middle", "large"];

        sampleSizes.forEach((radius, index) => {
            const xPosition = index * 40 + 10; 

            this.sizeLegendGroup.append("circle")
                .attr("cx", xPosition)
                .attr("cy", 25)
                .attr("r", radius)
                .attr("fill", "#a0c4e8")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 0.5)
                .style("opacity", 0.8);

            this.sizeLegendGroup.append("text")
                .attr("x", xPosition)
                .attr("y", 48)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", "#666")
                .text(sampleLabels[index]);
        });
        // --- End of scale of rent to price ratio ---

        // Label
        this.svg.append("text")
            .attr("class", "xAxisLabel")
            .attr("text-anchor", "middle")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40);

        this.svg.append("text")
            .attr("class", "yAxisLabel")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -(this.height / 2))
            .attr("y", -40);

        this.brushGroup = this.svg.append("g").attr("class","brushG");
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
            .transition()
            .duration(this.transitionDuration)
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

    updateAxis = function(visData,xAttribute,yAttribute,rAttribute,colorAttribute){
        // compute min max using d3.min/max(visData.map(item=>item.attribute))
        const xExtent = d3.extent(visData, item => item[xAttribute]);
        const yExtent = d3.extent(visData, item => item[yAttribute]);
        const rExtent = d3.extent(visData, item => Number(item[rAttribute]));

        this.xScale.domain(xExtent);
        this.yScale.domain([0,yExtent[1]]);
        this.rScale.domain(rExtent);
        
        //比例尺
        const colorExtent = d3.extent(visData, item => Number(item[colorAttribute]));
        this.colorScale.domain(colorExtent);
        this.legendMinText.text(colorExtent[0].toFixed(2));
        this.legendMaxText.text(colorExtent[1].toFixed(2));

        const xAxis = d3.axisBottom(this.xScale);
        const yAxis = d3.axisLeft(this.yScale);

        this.svg.select(".xAxisG").transition().duration(this.transitionDuration).call(xAxis);
        this.svg.select(".yAxisG").transition().duration(this.transitionDuration).call(yAxis);

        // create axis with computed scales
        this.svg.select(".xAxisLabel").text(xAttribute);
        this.svg.select(".yAxisLabel").text(yAttribute);
    }


    renderScatterplot = function (visData, xAttribute, yAttribute, rAttribute,colorAttribute, controllerMethods){
        //console.log("render scatterplot with a new data list ...")
        const cleanData = visData.filter(item => {
            return item[xAttribute] !== undefined && item[xAttribute] !== "?" && item[xAttribute] !== null &&
                   item[yAttribute] !== undefined && item[yAttribute] !== "?" && item[yAttribute] !== null &&
                   item[rAttribute] !== undefined && item[rAttribute] !== "?" && item[rAttribute] !== null &&
                   item[colorAttribute] != null && item[colorAttribute] !== "?";
        });

        // build the size scales and x,y axis
        this.updateAxis(cleanData,xAttribute,yAttribute,rAttribute,colorAttribute);

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
                        .attr("transform", item => {
                            const xPixel = this.xScale(Number(item[xAttribute]));
                            const yPixel = this.yScale(Number(item[yAttribute]));
                            return isNaN(xPixel) || isNaN(yPixel) ? "translate(-100,-100)" : `translate(${xPixel},${yPixel})`;
                        })
                        .on("click", (event,itemData)=>{
                            controllerMethods.handleOnClick(itemData);
                        })
                    ;
                    // render element as child of each element "g"
                    itemG.append("circle")
                        .attr("class","markerCircle")
                        .attr("r", d => this.rScale(Number(d[rAttribute])))
                        .attr("fill", d => this.colorScale(Number(d[colorAttribute])))
                        .attr("stroke","green")
                        .attr("stroke-width", 0.2)
                        .style("opacity", 0.85);
                    ;
                    return itemG;
                },
                update=>{
                    update.select(".markerCircle")
                        .transition().duration(this.transitionDuration)
                        .attr("r", d => this.rScale(Number(d[rAttribute])))
                        .attr("fill", d => this.colorScale(Number(d[colorAttribute])));

                    this.updateMarkers(update,xAttribute,yAttribute,colorAttribute)
                },
                exit =>{
                    exit.remove()
                    ;
                }
            );

        // -----------brush---------
        const brush = d3.brush()
            .extent([[0,0], [this.width, this.height]])
            .on("end", (event)=>{
                // click and release
                if (!event.selection) {
                    if (controllerMethods.handleOnBrush) {
                        controllerMethods.handleOnBrush([]);
                    }
                    return;
                }

                // user chose excatement a frame
                const [[x0,y0],[x1,y1]] = event.selection;

                const selectedItems = cleanData.filter(item=>{
                    const cx = this.xScale(Number(item[xAttribute]));
                    const cy = this.yScale(Number(item[yAttribute]));

                    return cx>=x0 && cx<=x1 && cy>= y0 && cy <= y1;
                });

                const selectedIds = selectedItems.map(d=>d.index);
                console.log(`${selectedIds.length} CITIES SELECTED`);

                controllerMethods.handleOnBrush(selectedIds);

            });
        this.brushGroup.call(brush);

        this.brushGroup.raise();

        // double click for desactive the frame
        this.brushGroup.on("dblclick",()=>{
            this.brushGroup.call(brush.move,null);
        });
        //----------------
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}
export default ScatterplotD3;