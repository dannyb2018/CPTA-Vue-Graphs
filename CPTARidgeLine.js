/*
Copyright 2017-2019 Advanced Products Limited, 
dannyb@cloudpta.com
github.com/dannyb2018

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/
const CPTARidgeLine =
Vue.component
(
    'cpta-graph-ridgeline', 
    {
        template: 
                `
                <div >
                    <svg v-bind:id="root_element_id" 
                    v-bind:width="total_width" 
                    v-bind:height="total_height"
                    v-bind:style="{backgroundColor: background_colour}">    
                    </svg>
                </div>
                `,
        name: 'cpta-graph-ridgeline',
        props:
            {
                total_height: {default: 400}, 
                total_width: {default: 400},
                fill_colour: {default: "#FFFFFF"},
                x_axis_colour: {default: "#FFFFFF"}, 
                y_axis_colour: {default: "#FFFFFF"},
                stroke_colour: {default: "#FFFFFF"}, 
                background_colour: {default: "#000"},
                root_element_id: {default: "ridgeline_root"},
                margin_top: {default:30},
                margin_right: {default:30},
                margin_bottom: {default:20},
                margin_left: {default:110},
            },
        mounted: function()
        {
            this.plot_graph([{a:80, b:30, c:30}, {a:90, b:90,c:40}]);
        },
        methods:
        {
            plot_graph: function(graph_data)
            {
                // assuming there is any data
                if((typeof graph_data !== "undefined") &&(graph_data.length > 0) )
                {
                    var width = this.total_width - this.margin_left - this.margin_right;
                    var height = this.total_height - this.margin_top - this.margin_bottom;

                    // Find the child of the svg, if there is one and delete it as we are starting from scratch
                    d3.selectAll('#' + this.root_element_id + ' > *').remove();

                    var svg = d3.select('#' + this.root_element_id)
                    .append("g")
                    .attr("transform",
                          "translate(" + this.margin_left + "," + this.margin_top + ")");

                    // Get the different categories and count them
                    var categories = Object.keys(graph_data[0]);
                    var n = categories.length;

                    // Add X axis
                    var x = d3.scaleLinear()
                    .domain([-10, 140])
                    .range([ 0, width ]);
                    svg.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .attr('class', 'x-axis')
                    .call(d3.axisBottom(x));

                    // Create a Y scale for densities
                    var y = d3.scaleLinear()
                    .domain([0, 0.4])
                    .range([ height, 0]);

                    // Create the Y axis for names
                    var yName = d3.scaleBand()
                    .domain(categories)
                    .range([0, height])
                    .paddingInner(1);
                    svg.append("g")
                    .attr('class', 'y-axis')
                    .call(d3.axisLeft(yName));

                    // Recolour the x-axis
                    svg.selectAll('.x-axis > .domain')
                            .attr("stroke", this.x_axis_colour);
                    svg.selectAll('.x-axis > .tick line')
                            .attr("stroke", this.x_axis_colour);
                    svg.selectAll('.x-axis > .tick text')
                            .attr("fill", this.x_axis_colour);

                    // Recolour the x-axis
                    svg.selectAll('.y-axis > .domain')
                            .attr("stroke", this.y_axis_colour);
                    svg.selectAll('.y-axis > .tick line')
                            .attr("stroke", this.y_axis_colour);
                    svg.selectAll('.y-axis > .tick text')
                            .attr("fill", this.y_axis_colour);

                    // Compute kernel density estimation for each column:
                    var kde = this.kernelDensityEstimator(this.kernelEpanechnikov(7), x.ticks(40)) // increase this 40 for more accurate density.
                    var allDensity = [];
                    var i = 0;
                    for (i = 0; i < n; i++) 
                    {
                        var key = categories[i]
                        var density = kde( graph_data.map(function(d){  return d[key]; }) )
                        allDensity.push({key: key, density: density})
                    }

                    // Add areas
                    svg.selectAll("areas")
                    .data(allDensity)
                    .enter()
                    .append("path")
                      .attr("transform", function(d){return("translate(0," + (yName(d.key)-height) +")" )})
                      .datum(function(d){return(d.density)})
                      .attr("fill", this.fill_colour)
                      .attr("stroke", this.stroke_colour)
                      .attr("stroke-width", 1)
                      .attr("d",  d3.line()
                          .curve(d3.curveBasis)
                          .x(function(d) { return x(d[0]); })
                          .y(function(d) { return y(d[1]); })
                          );
                }
            },
            kernelDensityEstimator:function (kernel, X) 
            {
                return function(V) 
                {
                    return X.map
                    (
                        function(x) 
                        {
                            return [x, d3.mean(V, function(v) { return kernel(x - v); })];
                        }
                    );
                };
            },
            kernelEpanechnikov :function (k) 
            {
                return function(v) 
                {
                    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
                };
            }
        }
    }
);
