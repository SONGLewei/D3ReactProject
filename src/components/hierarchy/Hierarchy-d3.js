import * as d3 from 'd3';

class HierarchyD3 {
    margin = {top: 40, right: 10, bottom: 50, left: 10};
    svg;
    width;
    height;
    view;
    focus;
    nodeGroup;
    labelGroup;

    constructor(el){
        this.el = el;
    };

    create = function (config) {
        this.width = config.size.width;
        this.height = config.size.height;

        this.svg = d3.select(this.el).append("svg")
            .attr("width", "95%")
            .attr("height", "95%")
            .attr("viewBox", `-${this.width / 2} -${this.height / 2} ${this.width} ${this.height}`)
            .style("display", "block")
            .style("background", "white")
            .style("cursor", "pointer");

        this.nodeGroup = this.svg.append("g");
        this.labelGroup = this.svg.append("g");

        this.tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", 1000)
            .style("left", "-1000px")
            .style("top", "-1000px");

        this.legendGroup = this.svg.append("g")
            .attr("class", "size-legend")
            .style("pointer-events", "none");
    }

    renderHierarchy = function (visData,controllerMethods) {

        const cleanData = visData.filter(d => d.state != null && d.communityname != null);

        // Create a tree
        const groupedData = d3.group(cleanData, d => `${d.state}`);
        const hierarchyData = {
            name: "USA",
            children: Array.from(groupedData, ([state, communities]) => ({
                name: state,
                children: communities
            }))
        };

        const root = d3.hierarchy(hierarchyData)
            .sum(d => Number(d.population))
            .sort((a, b) => b.value - a.value);

        const pack = d3.pack()
            .size([this.width, this.height])
            .padding(3);

        const nodes = pack(root).descendants();

        this.focus = root;

        const color = d3.scaleLinear()
            .domain([0, 1])
            .range(["#e1ebf5", "#b3cde3"])
            .interpolate(d3.interpolateHcl);

        // up
        this.svg.on("click", (event) => this.zoom(event, root));

        this.node = this.nodeGroup.selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("class", d => d.children ? "node node--internal" : "node node--leaf")
            .attr("fill", d => d.children ? color(d.depth) : "#ecf0f3")
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5);
                if (controllerMethods && controllerMethods.handleOnMouseEnter) {
                    controllerMethods.handleOnMouseEnter(d.data);
                }
                if (!d.children && this.focus !== d) {
                    this.tooltipTimeout = setTimeout(() => {
                        this.tooltip.transition().duration(200).style("opacity", 1);
                        this.tooltip.html(`
                            <div style="font-weight:bold; margin-bottom:4px; font-size:14px;">${d.data.communityname}</div>
                            <div style="color:#aaa; margin-bottom:4px;">State Code: ${d.data.state}</div>
                            <div>Income: <span style="color:#ff7f0e;">${d.data.medIncome || '?'}</span></div>
                            <div>Crime: <span style="color:#ff7f0e;">${d.data.ViolentCrimesPerPop || '?'}</span></div>
                        `);
                    }, 750);
                }
            })
            .on("mousemove", (event) => {
                this.tooltip.style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", (event, d) => {

                clearTimeout(this.tooltipTimeout);
                
                this.tooltip.transition().duration(200).style("opacity", 0);
                
                const isSelected = this.currentSelectedIds && this.currentSelectedIds.includes(d.data.index);
                d3.select(event.currentTarget)
                    .attr("stroke", isSelected ? "#d62728" : null)
                    .attr("stroke-width", isSelected ? 1.5 : 0);

                if (controllerMethods && controllerMethods.handleOnMouseLeave) {
                    controllerMethods.handleOnMouseLeave();
                }
            })
            .on("click", (event, d) => {
                // avoid zoom in progress
                clearTimeout(this.tooltipTimeout);
                this.tooltip.style("opacity", 0);

                if (this.focus !== d) {
                    this.zoom(event, d);
                    event.stopPropagation();
                }
            });

        this.label = this.labelGroup
            .style("font", "10px sans-serif")
            .style("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => d.parent === root ? "inline" : "none");

        this.label.selectAll("*").remove();

        this.label.append("tspan")
            .attr("x", 0)
            .attr("y", d => d.children ? "0" : "-1.2em") 
            .style("font-size", d => d.children ? "12px" : "30px")
            .style("font-weight", "bold")
            .text(d => d.children ? `State ${d.data.name}` : d.data.communityname);
        
        
        // Detail data
        const detailMetrics = [
            { y: "0.5em", label: "Pop:", valueFn: d => `${d.data.population || 'N/A'}` },
            { y: "1.8em",  label: "Income:", valueFn: d => `${d.data.medIncome || 'N/A'}` },
            { y: "3.1em",  label: "Unemploy:", valueFn: d => `${d.data.PctUnemployed || 'N/A'}` },
            { y: "4.4em",  label: "Own Home:", valueFn: d => `${d.data.PctHousOwnOcc || 'N/A'}` },
            { y: "5.7em",  label: "Crime:", valueFn: d => `${d.data.ViolentCrimesPerPop || 'N/A'}` }
        ];

        detailMetrics.forEach(metric => {
            
            this.label.filter(d => !d.children).append("tspan")
                .attr("class", "node-detail")
                .attr("x", -4)
                .attr("y", metric.y)
                .attr("text-anchor", "end")
                .style("font-size", "20px")
                .style("fill", "#777")
                .style("display", "none")
                .text(metric.label);

            this.label.filter(d => !d.children).append("tspan")
                .attr("class", "node-detail")
                .attr("x", 4)
                .attr("y", metric.y)
                .attr("text-anchor", "start")
                .style("font-size", "20px")
                .style("fill", "#333")
                .style("font-weight", "bold")
                .style("display", "none")
                .text(metric.valueFn);
        });

        this.zoomTo([root.x, root.y, root.r * 2]);

        // ------------- legend ---------
        this.legendGroup.selectAll("*").remove();

        const legendX = this.width / 2 - 80;
        const legendY = this.height / 2 - 30;

        const legend = this.legendGroup
            .attr("transform", `translate(${legendX}, ${legendY})`);

        legend.append("text")
            .attr("x", 0)
            .attr("y", -75)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("fill", "#777")
            .text("Size = Population");

        const legendRadii = [10, 20, 30];

        legend.selectAll("circle")
            .data(legendRadii)
            .join("circle")
            .attr("cy", d => -d)
            .attr("r", d => d)
            .style("fill", "none")
            .style("stroke", "#ccc")
            .style("stroke-width", 1);

        legend.selectAll("line")
            .data(legendRadii)
            .join("line")
            .attr("x1", 0)
            .attr("y1", d => -2 * d)
            .attr("x2", 40)
            .attr("y2", d => -2 * d)
            .style("stroke", "#ccc")
            .style("stroke-dasharray", "2,2");

        legend.selectAll("text.legend-val")
            .data(legendRadii)
            .join("text")
            .attr("class", "legend-val")
            .attr("x", 45)
            .attr("y", d => -2 * d)
            .attr("dy", "0.3em")
            .style("font-size", "10px")
            .style("fill", "#777")
            .text(d => {
                if (d === 30) return "Large";
                if (d === 10) return "Small";
                return "";
            });
    }

    zoomTo = (v) => {
        const minDimension = Math.min(this.width, this.height);
        const k = minDimension / v[2];
        this.view = v;
        this.label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        this.node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        this.node.attr("r", d => d.r * k);
    }

    zoom = (event, d) => {
        this.focus = d;
        
        const targetFocus = this.focus;

        const checkShow = (node) => {
            if (targetFocus.depth === 0) {
                return node.parent === targetFocus; 
            } else if (!targetFocus.children) {
                return node === targetFocus; 
            } else {
                return false; 
            }
        };

        const isLeaf = !targetFocus.children;
        this.label.selectAll(".node-detail")
            .style("display", function() {
                const parentData = this.parentNode.__data__; 
                return (isLeaf && parentData === targetFocus) ? "inline" : "none";
            });

        const transition = this.svg.transition()
            .duration(750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(this.view, [this.focus.x, this.focus.y, this.focus.r * 2]);
                return t => this.zoomTo(i(t));
            });

        this.label
            .filter(function(d) { return checkShow(d) || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => checkShow(d) ? 1 : 0)
            .on("start", function(d) { if (checkShow(d)) this.style.display = "inline"; })
            .on("end", function(d) { if (!checkShow(d)) this.style.display = "none"; });
    }

    highlightSelectedItems = function(selectedIds) {
        if (!this.node) return;

        this.currentSelectedIds = selectedIds || [];

        if (!selectedIds || selectedIds.length === 0) {
            this.nodeGroup.selectAll(".node--leaf")
                .attr("fill", "#ecf0f3")
                .attr("stroke", null)
                .attr("stroke-width", 0);
            return;
        }

        this.nodeGroup.selectAll(".node--leaf")
            .attr("fill", d => selectedIds.includes(d.data.index) ? "#ff7f0e" : "#e0e0e0")
            .attr("stroke", d => selectedIds.includes(d.data.index) ? "#d62728" : null)
            .attr("stroke-width", d => selectedIds.includes(d.data.index) ? 1.5 : 0);
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
        if (this.tooltip) this.tooltip.remove();
    }
}

export default HierarchyD3;