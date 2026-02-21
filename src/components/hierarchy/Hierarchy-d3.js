import * as d3 from 'd3';

class HierarchyD3 {
    margin = {top: 40, right: 10, bottom: 50, left: 100};
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
            .attr("width", "90%")
            .attr("height", "90%")
            .attr("viewBox", `-${this.width / 2} -${this.height / 2} ${this.width} ${this.height}`)
            .style("display", "block")
            .style("background", "#f8f9fa")
            .style("cursor", "pointer");

        this.nodeGroup = this.svg.append("g");
        this.labelGroup = this.svg.append("g");
    }

    renderHierarchy = function (visData) {

        const cleanData = visData.filter(d => d.state != null && d.communityname != null);

        // Create a tree
        const groupedData = d3.group(cleanData, d => d.state);
        const hierarchyData = {
            name: "USA",
            children: Array.from(groupedData, ([state, communities]) => ({
                name: state,
                children: communities
            }))
        };

        const root = d3.hierarchy(hierarchyData)
            .sum(d => 1)
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
            .attr("fill", d => d.children ? color(d.depth) : "white")
            .on("mouseover", function() { d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5); })
            .on("mouseout", function() { d3.select(this).attr("stroke", null); })
            .on("click", (event, d) => {
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
            .style("display", d => d.parent === root ? "inline" : "none")
            .text(d => d.data.name || d.data.communityname); 

        this.zoomTo([root.x, root.y, root.r * 2]);
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

        const transition = this.svg.transition()
            .duration(750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(this.view, [this.focus.x, this.focus.y, this.focus.r * 2]);
                return t => this.zoomTo(i(t));
            });

        this.label
            .filter(function(d) { return d.parent === targetFocus || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => d.parent === targetFocus ? 1 : 0)
            .on("start", function(d) { if (d.parent === targetFocus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== targetFocus) this.style.display = "none"; });
    }

    highlightSelectedItems = function(selectedIds) {
        if (!this.node) return;

        if (!selectedIds || selectedIds.length === 0) {
            this.nodeGroup.selectAll(".node--leaf")
                .attr("fill", "white")
                .attr("stroke", null);
            return;
        }

        this.nodeGroup.selectAll(".node--leaf")
            .attr("fill", d => selectedIds.includes(d.data.index) ? "#ff7f0e" : "#e0e0e0")
            .attr("stroke", d => selectedIds.includes(d.data.index) ? "#d62728" : null)
            .attr("stroke-width", d => selectedIds.includes(d.data.index) ? 1.5 : 0);
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}

export default HierarchyD3;