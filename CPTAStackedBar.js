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
const CPTAStackedBar =
Vue.component
(
    'cpta-graph-stacked-bar', 
    {
        template: 
                `
                <div >
                    <svg v-bind:id="root_element_id" 
                    v-bind:viewBox="viewbox" 
                    preserveAspectRatio="none"
                    v-bind:style="{backgroundColor: background_colour}">    
                    </svg>
                </div>
                `,
        name: 'cpta-graph-stacked-bar',
        props:
        {
            total_height: {default: 400}, 
            total_width: {default: 400},
            x_axis_colour: {default: "#FFFFFF"}, 
            y_axis_colour: {default: "#FFFFFF"},
            background_colour: {default: "#000"},
            root_element_id: {default: "ridgeline_root"},
            margin_top: {default:30},
            margin_right: {default:30},
            margin_bottom: {default:20},
            margin_left: {default:110},
        },
        computed:
        {
            viewbox:
            {
                get: function()
                {
                    return '0 0 ' + this.total_width + ' ' + this.total_height;
                }
            }
        },        
        mounted: function()
        {
            var test_data = 
                    {
                        groups:['First', 'Second', 'Third'],
                        subgroups:['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                        values:[[12,1,13,11,2,5,22],[6,6,33,19,5,5,11],[11,28,12,8,2,7,31],],
                        colours:["#FF0000", "#00FF00", "#0000FF" ]
                    };
            this.plot_graph(test_data);
        },
        methods:
        {
            plot_graph: function(graph_data)
            {
                // assuming there is any data
                if((typeof graph_data !== "undefined") )
                {
                    var width = this.total_width - this.margin_left - this.margin_right;
                    var height = this.total_height - this.margin_top - this.margin_bottom;

                    // Find the child of the svg, if there is one and delete it as we are starting from scratch
                    d3.selectAll('#' + this.root_element_id + ' > *').remove();

                    var svg = d3.select('#' + this.root_element_id)
                    .append("g")
                    .attr("transform",
                          "translate(" + this.margin_left + "," + this.margin_top + ")");
                    // List of subgroups
                    var subgroups = graph_data.subgroups;
                    var converted_data = this.convertDataIntoFormStackWants(graph_data);
  
                    //stack the data
                    var stackedData = d3.stack().keys(subgroups)(converted_data);
                    // List of groups show them on the X axis
                    var groups = graph_data.groups;

                    // Add X axis
                    var x = d3.scaleBand()
                    .domain(groups)
                    .range([0, width])
                    .padding([0.2])
                    svg.append("g")
                    .attr('class', 'x-axis')            
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x).tickSizeOuter(0));

                    // Add Y axis
                    var y = d3.scaleLinear()
                    .domain([0, 120])
                    .range([ height, 0 ]);
                    svg.append("g")
                    .attr('class', 'y-axis')
                    .call(d3.axisLeft(y));

                    // Set the colour palette for the groups, colours can be an array or scale
                    var colour = d3.scaleOrdinal()
                    .domain(subgroups)
                    .range(graph_data.colours);

                    // This is to highlight the same subgroups on mouse over
                    // What happens when user hover a bar
                    var mouseover = function(d) 
                    {
                        // find the subgroups
                        var nameOfSubgroupToHighlight = d3.select(this.parentNode).datum().key; // This was the tricky part
                        // Reduce opacity of all rect to 0.2 so they face into the background
                        d3.selectAll(".myRect").style("opacity", 0.2);
                        // Highlight all rects of this subgroup with opacity 0.8. It is possible to select them since they have a specific class = their name.
                        d3.selectAll("." + nameOfSubgroupToHighlight)
                        .style("opacity", 1);
                    };

                    // When user do not hover anymore
                    var mouseleave = function(d) 
                    {
                        // Back to normal opacity: 0.8
                        d3.selectAll(".myRect")
                        .style("opacity",0.8);
                    };

                    // Show the bars
                    svg.append("g")
                    .selectAll("g")
                    // Enter in the stack data = loop key per key = group per group
                    .data(stackedData)
                    .enter().append("g")
                    .attr("fill", function(d) { return colour(d.key); })
                    .attr("class", function(d){ return "myRect " + d.key; }) // Add subgroup name to the class as we'll use this later to highlight
                    .selectAll("rect")
                    // enter a second time = loop subgroup per subgroup to add all rectangles
                    .data(function(d) { return d; })
                    .enter().append("rect")
                    .attr("x", function(d) { return x(d.data.group); })
                    .attr("y", function(d) { return y(d[1]); })
                    .attr("height", function(d) { return y(d[0]) - y(d[1]); })
                    .attr("width",x.bandwidth())
                    .attr("stroke", "grey")
                    .on("mouseover", mouseover)
                    .on("mouseleave", mouseleave);

                    // Recolour the axis
                    this.recolour_axis(svg);
                }
            },
            
            recolour_axis: function(rootElement)
            {
                // Recolour the x-axis
                rootElement.selectAll('.x-axis > .domain')
                .attr("stroke", this.x_axis_colour);
                rootElement.selectAll('.x-axis > .tick line')
                .attr("stroke", this.x_axis_colour);
                rootElement.selectAll('.x-axis > .tick text')
                .attr("fill", this.x_axis_colour);

                // Recolour the x-axis
                rootElement.selectAll('.y-axis > .domain')
                .attr("stroke", this.y_axis_colour);
                rootElement.selectAll('.y-axis > .tick line')
                .attr("stroke", this.y_axis_colour);
                rootElement.selectAll('.y-axis > .tick text')
                .attr("fill", this.y_axis_colour);                
            },
            convertDataIntoFormStackWants: function (data)
            {
                // stack wants array of objects with arrays of key values
                // Our array is keys then array of values
                var subgroups = data.subgroups;
                var values = data.values;
                var groups = data.groups;

                var converted_data = [];

                // For each groups
                groups.forEach
                (
                   function(currentGroup, groupIndex)
                  {
                      var groupEntry = {};
                      groupEntry.group = currentGroup;
                      // get the relevent data from the values
                      var releventValues = values[groupIndex];
                      // Now add keys
                      subgroups.forEach
                      (
                              function(currentSubgroup, subgroupIndex)
                      {
                          groupEntry[currentSubgroup] = releventValues[subgroupIndex];
                      }
                      );
                      converted_data.push(groupEntry);
                  }
              );

              return converted_data;
            }            
        }
    }
);
