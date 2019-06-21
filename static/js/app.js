// Set global properties and functions
let mapData = [];
let metroData = [];
let thisMetroIndex = 0;

// Margins for charts
function chartMargin(width)  {
    if (width < 150) {
        return {
            top: 20,
            bottom: 35,
            right: 15,
            left: 35
        }
    }
    else {
        return {
            top: 30,
            bottom: 50,
            right: 20,
            left: 50
        }
    }
  };

// Years to use in charts
const years = [2011, 2012, 2013, 2014, 2015, 2016, 2017];

// Border color text dispatcher
function makeBorderStyle (trendType) {
    switch(trendType) {
        case "00":
            return ("2px solid #c7bc9d")
            break;
        case "0+":
            return ("2px solid #35978f")
            break;
        case "0-":
            return ("2px solid #bf812d")
            break;
        case "+-":
            return ("2px dotted #80cdd1")
            break;
        case "-+":
            return ("2px dotted #dfc27d")
            break;
        case "++":
            return ("4px solid #01665e")
            break;
        case "--":
            return ("4px solid #8c510a")
            break;
        default:
            return ("2px dotted slate")
    }
}

// Circle fill text dispatcher
function trendColor (trendType) {
    switch(trendType) {
        case "00":
            return ("#c7bc9d")
            break;
        case "0+":
            return ("#35978f")
            break;
        case "0-":
            return ("#bf812d")
            break;
        case "+-":
            return ("#80cdd1")
            break;
        case "-+":
            return ("#dfc27d")
            break;
        case "++":
            return ("#01665e")
            break;
        case "--":
            return ("#8c510a")
            break;
        case "na":
            return ("#777")
            break;
        default:
            return ("purple")
    }
}

function fontSize4Chart(width) {
    switch(true) {
        case (width < 200):
            return "75%";
            break;
        default:
            return "100%"
            break;
    }
}

function fontSize4Axis(width) {
    switch(true) {
        case (width < 200):
            return "50%";
            break;
        default:
            return "75%"
            break;
    }
}

function fontSize4Legend(width) {
    let size = width * 0.10;
    if (size < 40) {
        size = 40;
    }
    let sizeString = `${size}%`;
    return sizeString
}

function numXTicks(width) {
    if (width > 200) {
        return 9
    }
    else if (width > 100) {
        return 5
    }
    else {
        return 3
    };
}

function numYTicks(height) {
    if (height > 100) {
        return 6
    }
    else if (height  > 50) {
        return 4
    }
    else {
        return 2
    };
}

// Generic chart item builder
function buildChart(chartID, metroObj, itemToPlot, chartTitle, yAxisText)   {

    // Get basic dimensions
    const chartArea = document.getElementById(chartID);
    const boxWidth = chartArea.clientWidth;
    const boxHeight = chartArea.clientHeight;
    // Set chart dimensions
    const chartWidth = boxWidth - chartMargin(boxWidth).left - chartMargin(boxWidth).right;
    const chartHeight = boxHeight - chartMargin(boxWidth).top - chartMargin(boxWidth).bottom;
 
    // Extract the data we need into convenient forms
    // Each object item has a one-item array with data attributes
    // Get trendline parameters -- this is always a populated array
    if (metroObj[itemToPlot][0]) {
        var trendParams = metroObj[itemToPlot][0].param_list;
        var dataLists = metroObj[itemToPlot][0].mean_and_cl;
        }
    else {
        var trendParams = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        var dataLists = [[null],[null]];
    };

    const averages = dataLists[0];
    const lowerLimits = dataLists[1];
    const upperLimits = averages.map( function (mean, i) {
        if (mean  && lowerLimits[i]) {
            return (mean + (mean - lowerLimits[i]))
            }
        else {
            return null
            }
        });
    // Filter out null values if they are in either the average or the limit
    const xData = years.filter( function (year,i) {
        return (averages[i]  && lowerLimits[i])
        });
    const yData = averages.filter( function (average,i) {
        return (average && lowerLimits[i])
        });       
    const yLower = lowerLimits.filter( function (lowerLimit,i) {
        return (averages[i]  && lowerLimit)
        });
    const yUpper = upperLimits.filter( function (upperLimit,i) {
        return (averages[i] && upperLimit)
        });  
    // Calculate limits of data, taking into account error bars
    const valueLower = d3.min(yLower);
    const valueUpper = d3.max(yUpper);
    // Calculate a padding equal to 10% of data range, for the axis range
    const yAxisPad = (valueUpper - valueLower) * 0.1;
    const yAxisBottom = valueLower - yAxisPad;
    const yAxisTop = valueUpper + yAxisPad;
    if(xData.length > 0) {
        // Generate point data array
        const pointData = [];
        for(i =0; i < xData.length; i++) {
            pointData.push({x:xData[i], y:yData[i], lo:yLower[i], hi:yUpper[i]})
            };
        // Generate trendline
        const trendLine = [];
        for(i = 0; i < 101; i++) {
            trendx = 2011 + 0.06 * i;
            trendy = trendParams[0] * trendx * trendx + trendParams[1] * trendx + trendParams[2];
            if ((trendx > trendParams[3] - 0.5) && 
                (trendx < trendParams[4] + 0.5) &&
                (trendy > yAxisBottom) && 
                (trendy < yAxisTop)) {
                    trendLine.push({x: trendx, y: trendy})
                }
            };
        // Create SVG
        const svg_1 = d3.select(`#${chartID}`)
            .html("")
            .append("svg")
            .classed(`chart-${itemToPlot}`,true)
			.attr("width", boxWidth)
            .attr("height", boxHeight)
            .style("border", makeBorderStyle(metroObj[itemToPlot][0].trend_class));
        // Append group element
        const chart_g1 = svg_1.append("g")
            .attr("transform", `translate(${chartMargin(boxWidth).left}, ${chartMargin(boxWidth).top})`);
        // create scales

        const xLinearScale = d3.scaleLinear()
          .domain([2010, 2018])
          .range([0, chartWidth]);
  
        const yLinearScale = d3.scaleLinear()
          .domain([yAxisBottom, yAxisTop])
          // Leave some padding in the y-axis
          .range([chartHeight,0]);

        // create axes -- use date format for x-axis
        const xAxis = d3.axisBottom(xLinearScale).ticks(numXTicks(chartWidth)).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yLinearScale).ticks(numYTicks(chartHeight));

        // append axes
        chart_g1.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(xAxis)
            .attr("font-size",`${fontSize4Axis(chartWidth)}`);

        chart_g1.append("g")
            .call(yAxis)
            .attr("font-size",`${fontSize4Axis(chartWidth)}`);

        // append axes titles
        chart_g1.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 0.75 * chartMargin(boxWidth).bottom})`)
            .classed("axis-title", true)
            .attr("font-size",`${fontSize4Chart(chartWidth)}`)
            .text("Year");

        chart_g1.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-0.6 * chartMargin(boxWidth).left}, ${0.5 * chartHeight}) rotate(-90)`)
            .classed("axis-title", true)
            .attr("font-size",`${fontSize4Chart(chartWidth)}`)
            .text(yAxisText);
        //chart title
        chart_g1.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${(chartWidth -chartMargin(boxWidth).left + chartMargin(boxWidth).right) * 0.5}, ${-0.5 * chartMargin(boxWidth).top})`)
            .classed("axis-title", true)
            .attr("font-size",`${fontSize4Chart(chartWidth)}`)
            .text(chartTitle);      
         // error bars - main stem
        chart_g1.selectAll('line.error-main')
            .data(pointData)
            .enter()
            .append('line')
            .attr('class', 'error-main')
            .attr('x1', function(d) { return xLinearScale(d.x) })
            .attr('x2', function(d) { return xLinearScale(d.x) })
            .attr('y1', function(d) { return yLinearScale(d.lo) })
            .attr('y2', function(d) { return yLinearScale(d.hi) })
            .attr("stroke","#293462")
            .attr("stroke-width","1px");
        // error bars - top cap
        chart_g1.selectAll('line.error-top')
            .data(pointData)
            .enter()
            .append('line')
            .attr('class', 'error-top')
            .attr('x1', function(d) { return xLinearScale(d.x) -5 })
            .attr('x2', function(d) { return xLinearScale(d.x) +5 })
            .attr('y1', function(d) { return yLinearScale(d.hi) })
            .attr('y2', function(d) { return yLinearScale(d.hi) })
            .attr("stroke","#293462")
            .attr("stroke-width","1px");
        // error bars - bottom cap
        chart_g1.selectAll('line.error-bottom')
            .data(pointData)
            .enter()
            .append('line')
            .attr('class', 'error-bottom')
            .attr('x1', function(d) { return xLinearScale(d.x) -5 })
            .attr('x2', function(d) { return xLinearScale(d.x) +5 })
            .attr('y1', function(d) { return yLinearScale(d.lo) })
            .attr('y2', function(d) { return yLinearScale(d.lo) })
            .attr("stroke","#293462")
            .attr("stroke-width","1px");
        // trendline       
        const makeLine = d3.line()
            .x(d => xLinearScale(d.x))
            .y(d => yLinearScale(d.y));
        const buildTrendLine = makeLine(trendLine);
        chart_g1.append("path")
            .attr("d", buildTrendLine)
            .attr("fill", "none")
            .attr("stroke", "#0028FF");

        // points
        const symbolGenerator = d3.symbol()
	        .type(d3.symbolTriangle)
            .size(80);
        
        const symbolPath = symbolGenerator();

        const dataPoints = chart_g1.selectAll(".point")
            .data(pointData)
            .enter()
            .append("path")
            .classed("point",true)
            .attr("d", symbolPath)
            .attr("transform", function(d) { return "translate(" + xLinearScale(d.x) + "," + yLinearScale(d.y) + ")"; })
            .attr("fill","#24009C");

        const dataToolTip = d3.tip()
            .attr("class", "tooltip")
            .offset([-5, 0])
            .style("background-color","lightyellow")
            .style("border","1px solid black")
            .style("padding","2px")
            .style("border-radius","5px")
            .html(d => `${d.x}, ${d.y}`);
        
            //Create the tooltip in map.
        dataPoints.call(dataToolTip);
        
            // Event listeners
        dataPoints.on("mouseover", function(d) {
            dataToolTip.show(d, this);
            })
            .on("mouseout", function(d) {
                dataToolTip.hide(d);
            });

        dataPoints.on("click", function (d,i) {
            // Figure out which year this is using non-null count
            // and set up alternative index 'j'
            let j = d.x - 2011;
            const comparatorString = `${years[j]} ${chartTitle}`;
            const svg_map = d3.select("#map_0").select("svg");
            const mapWidth = +svg_map.style("width").slice(0,-2);
            const mapHeight = +svg_map.style("height").slice(0,-2);

            svg_map.selectAll(".comparator-selected")
                .html("");

            svg_map.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", `translate(${mapWidth / 2}, ${0.15 * mapHeight})`)
                .classed("comparator-selected", true)
                .text(comparatorString);     
                
            let circleFills = [];
            let maxValue = 0;
            let minValue = 100;
            metroData.forEach( function(metro) {
                if (metro[itemToPlot].length > 0) {
                    let dataValue = metro[itemToPlot][0].mean_and_cl[0][j];
                    circleFills.push(dataValue);
                    if (dataValue && (dataValue > maxValue)) {
                        maxValue = dataValue;
                    };
                    if (dataValue && (dataValue < minValue)) {
                        minValue = dataValue;
                    };
                }
                else {
                    circleFills.push(-1);
                };
            });

            let viridisColor = d3.scaleSequential().domain([minValue,maxValue])
                .interpolator(d3.interpolateViridis)
            d3.selectAll("circle").each(function (d,i) {
                let dataValue = circleFills[i];
                if ((dataValue < minValue) || !dataValue) {
                    d3.select(this).attr("fill", "#777")
                }
                else {
                d3.select(this).attr("fill",viridisColor(dataValue));
                }
            });

            let cb = colorbarV(viridisColor, 0.03 * mapWidth,0.2 * mapHeight);
            svg_map.selectAll("#colorbar")
                .html("");

             svg_map.append("g")
                .attr("id","colorbar")
                .attr("transform",`translate(${mapWidth * 0.8},${mapHeight * 0.6})`)
                .call(cb);

            svg_map.selectAll("#colorbar-label")
                .html("");

            svg_map.append("text")
                .attr("text-anchor","middle")
                .attr("transform",`translate(${mapWidth * 0.85},${mapHeight * 0.55})`)
                .attr("id","colorbar-label")
                .attr("font-size",`${fontSize4Axis(chartWidth)}`)
                .text(yAxisText);
        }); // End of event listener for data points

        trendButton = svg_1.append("text")
            .attr("id","trend-button")
            .attr("transform", `translate(${chartMargin(boxWidth).left * 0.1}, ${boxHeight - 11})`)
            .attr("font-size", `${fontSize4Axis(chartWidth)}`)
            .style("fill","#0028FF")
            .text("Compare trends");

        trendButtonBox = trendButton.node().getBBox();

        svg_1.append("rect")
            .attr("x",chartMargin(boxWidth).left * 0.1 - 2)
            .attr("y",boxHeight - 11 - trendButtonBox.height + 2)
            .attr("width",trendButtonBox.width + 2)
            .attr("height",trendButtonBox.height + 2)
            .attr("rx","2px")
            .attr("ry","2px")
            .attr("fill","none")
            .attr("stroke","#0028FF")
            .attr("stroke-width","1px");

        trendButton.on("click", function() {
            const comparatorString = `Trends for ${chartTitle}`;
            const svg_map = d3.select("#map_0").select("svg");
            const mapWidth = +svg_map.style("width").slice(0,-2);
            const mapHeight = +svg_map.style("height").slice(0,-2);

            svg_map.selectAll(".comparator-selected")
                .html("");

            svg_map.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", `translate(${mapWidth / 2}, ${0.15 * mapHeight})`)
                .classed("comparator-selected", true)
                .text(comparatorString);     

            let circleFills = [];
            metroData.forEach( function(metro) {
                if (metro[itemToPlot].length > 0) {
                    let trendValue = metro[itemToPlot][0].trend_class;
                    circleFills.push(trendValue);
                }
                else {
                    circleFills.push("na");
                };
            });

            d3.selectAll("circle").each(function (d,i) {
                    d3.select(this).attr("fill",trendColor(circleFills[i]));
            });

            svg_map.selectAll("#colorbar")
                .html("");

            svg_map.selectAll("#colorbar-label")
                .html("");

            svg_map.append("text")
                .attr("text-anchor","middle")
                .attr("transform",`translate(${mapWidth * 0.87},${mapHeight * 0.59})`)
                .attr("id","colorbar-label")
                .attr("font-size",`${fontSize4Axis(chartWidth)}`)
                .text("In terms of health...");
                
            let trendTypes = ["++","0+","+-","00","-+","0-","--","na"]
            let trendLabels = ["Progress speeding up",
                               "Improving steadily",
                               "Progress slowing/reversing",
                               "No trend discernible",
                               "Decline slowing/reversing",
                               "Declining steadily",
                               "Decline speeding up",
                               "No data"]

            for(i=0; i<8; i++) {

                svg_map.append("g")
                    .attr("id","colorbar")
                    .attr("transform",`translate(${mapWidth * 0.72},${mapHeight * 0.6})`)
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", i * 0.04 * mapHeight)
                    .attr("width", 0.03 * mapWidth)
                    .attr("height", 0.04 * mapHeight)
                    .attr("fill",trendColor(trendTypes[i]))
                    .attr("stroke","1 px black");

                svg_map.append("text")
                    .attr("text-anchor","left")
                    .attr("transform",`translate(${mapWidth * 0.75},${mapHeight * (0.63 + 0.04 * i)})`)
                    .attr("id","colorbar-label")
                    .attr("font-size",`${fontSize4Legend(mapWidth)}`)
                    .style("fill",trendColor(trendTypes[i]))
                    .text(trendLabels[i]);
                }; 
            }); // End of event listener for trend button
        }
    // Default for no data present
    else {
        d3.select(`#${chartID}`)
            .style("text-align","center")
            .html(`${chartTitle}<br>No data available`)
        }
}

function buildUSMap() {
// Build US map for metro area projection

//Code for US states based on the following source:
//Michelle Chandra’s Block 0b2ce4923dc9b5809922
//Updated May 29, 2019, on bl.ocks.org -- modified 

    const mapObj = document.getElementById("map_0")
    const map0Width = mapObj.clientWidth;
    const map0Height = mapObj.clientHeight;
    // D3 Projection
    const projection = d3.geoAlbersUsa()
                    .translate([map0Width * 0.45, map0Height * 0.5])    // translate to center of screen
                    .scale([map0Width]);          // scale things down so see entire US
            
    // Define path generator
    const path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
                .projection(projection);  // tell path generator to use albersUsa projection
                
    //Create SVG element and append map to the SVG
    const svg_0 = d3.select("#map_0")
                .append("svg")
                .attr("width", map0Width)
                .attr("height", map0Height);

    d3.json("../static/data/gz_2010_us_040_00_20m.json").then( function(usMap) { 
    // Bind the data to the SVG and create one path per state
    svg_0.selectAll("path")
        .classed("states",true)
        .data(usMap.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill","#777")
        .attr("stroke","#FFF")
        .attr("stroke-width",1);
    // Save this data for redraw without the need to reload
    mapData = usMap.features;

    // Extract location data
   return d3.csv("../static/data/location_data.csv")
    }).then (function(metros){

    // Correctly format the GeoLocation data
       metros.forEach( function(metro) {
           metro.GeoLocation = metro.GeoLocation.replace("(","").replace(")","").split(",").reverse()
       });
       metros.forEach( metro => {
           metro.GeoLocation[0] = +metro.GeoLocation[0];
           metro.GeoLocation[1] = +metro.GeoLocation[1]
       });
       // Save the data for later use
       metroData = metros;
       return d3.csv("../static/data/BRFSS_2011_to_2017.csv")
    }).then ( function(trends) {
        // Parse the mean_and_cl and trend_params of each line of data
        // turning them into arrays
        trends.forEach( function(trend) {
            let dataString = trend.mean_and_cl;
            dataString = dataString.replace(/nan/gi,"null");
            let dataLists = JSON.parse(dataString);
            trend.mean_and_cl = dataLists;
            let trend_params = JSON.parse(trend.param_list);
            trend.param_list = trend_params;
        });
        // Incorporate the health data attributes

        metroData.forEach( function(metro) {
            questionSet = trends.filter( function(trend) {
            return (trend.Locationabbr == metro.Locationabbr)
            });
            // Behaviors - set 1
            metro['hasInsurance'] = questionSet.filter( function (question) {
                return (question.QuestionID == "_HCVU651");
            });
            metro['getsChecked'] = questionSet.filter( function (question) {
                return (question.QuestionID == "BLOODCHO");
            });
            metro['exercise'] = questionSet.filter( function (question) {
                return (question.QuestionID == "_TOTINDA");
            });
            metro['alcohol'] = questionSet.filter( function (question) {
                return (question.QuestionID == "DRNKANY5");
            });
            metro['smoking'] = questionSet.filter( function (question) {
                return (question.QuestionID == "_RFSMOK3");
            });
            // Risk factor outcomes -- set 2
            metro['genHealth'] = questionSet.filter( function (question) {
                return (question.QuestionID == "_RFHLTH");
            });
            metro['overweight'] = questionSet.filter( function (question) {
                return (question.QuestionID == "Custom_9");
            });
            metro['diabetes'] = questionSet.filter( function (question) {
                return (question.QuestionID == "DIABETE3");
            });
            metro['highBP'] = questionSet.filter( function (question) {
                return (question.QuestionID == "_RFHYPE5");
            });
            metro['highChol'] = questionSet.filter( function (question) {
                return (question.QuestionID == "Custom_8");
            });
        });
   
        const selectedMet = svg_0.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${map0Width / 2}, ${0.1 * map0Height})`)
            .classed("metro-selected", true)
            .text("No metro selected yet");     

        const metroGroup = svg_0.append("g")
            .attr("id","metros");                   

        const circlesGroup = metroGroup.selectAll("circle")
            .data(metroData)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                let coords = projection(d.GeoLocation);
                return (coords ? +coords[0] : map0Width - 20) 
            })
            .attr("cy", function (d, i) {
                let coords = projection(d.GeoLocation);
                return (coords ? +coords[1] : map0Height * 0.4 + 0.2 * i / metroData.length )
            })
            .attr("r","5px")
            .attr("fill","purple")
            .attr("stroke","#FFF")
            .attr("stroke-width","1px");
        
        const toolTip = d3.tip()
            .attr("class", "tooltip")
            .offset([40, 40])
            .style("background-color","lightyellow")
            .style("border","1px solid black")
            .style("border-radius","5px")
            .html(function(d) {
                return (d.Simpledesc);
            });
        
            //Create the tooltip in map.
        circlesGroup.call(toolTip);
        
            // Event listeners
        circlesGroup.on("mouseover", function(d) {
            toolTip.show(d, this);
            })
            .on("mouseout", function(d) {
                toolTip.hide(d);
            });
        
        circlesGroup.on("click", function(d,i) {
            selectedMet.text(`${d.Simpledesc} selected`);
            thisMetroIndex = i;
            const displayChoice = d3.select('input[name="displaySet"]:checked').node().value;
            if (displayChoice == "risks") {
                buildChart("ts_1", d, "genHealth", "Health Status", "Felt Good (%)");
                buildChart("ts_2", d, "overweight", "Overweight/Obesity", "BMI > 25 (%)");
                buildChart("ts_3", d, "diabetes","Diabetes", "Had Diabetes (%)");
                buildChart("ts_4", d, "highBP", "Hypertension","Had High B.P. (%)");
                buildChart("ts_5", d, "highChol", "High Cholesterol", "Had High Chol. (%)");
                }
            else {
                buildChart("ts_1", d, "hasInsurance", "Health Insurance", "Covered (%)");
                buildChart("ts_2", d, "getsChecked", "Cholesterol Screening", "Checked (%)");
                buildChart("ts_3", d, "exercise","Physical Activity", "Active (%)");
                buildChart("ts_4", d, "alcohol", "Alcohol Use","Drinkers (%)");
                buildChart("ts_5", d, "smoking", "Smoking", "Smokers (%)");
                };
            });

        d3.selectAll('input[name="displaySet"]').on("change", function () {
            const displayChoice = this.value;
            selectedMet.text(`${metroData[thisMetroIndex].Simpledesc} selected`);
            if (displayChoice == "risks") {
                buildChart("ts_1", metroData[thisMetroIndex], "genHealth", "Health Status", "Felt Good (%)");
                buildChart("ts_2", metroData[thisMetroIndex], "overweight", "Overweight/Obesity", "BMI > 25 (%)");
                buildChart("ts_3", metroData[thisMetroIndex], "diabetes","Diabetes", "Had Diabetes (%)");
                buildChart("ts_4", metroData[thisMetroIndex], "highBP", "Hypertension","Had High B.P. (%)");
                buildChart("ts_5", metroData[thisMetroIndex], "highChol", "High Cholesterol", "Had High Chol. (%)");
                }
            else {
                buildChart("ts_1", metroData[thisMetroIndex], "hasInsurance", "Health Insurance", "Covered (%)");
                buildChart("ts_2", metroData[thisMetroIndex], "getsChecked", "Cholesterol Screening", "Checked (%)");
                buildChart("ts_3", metroData[thisMetroIndex], "exercise", "Physical Activity", "Active (%)");
                buildChart("ts_4", metroData[thisMetroIndex], "alcohol", "Alcohol Use","Drinkers (%)");
                buildChart("ts_5", metroData[thisMetroIndex], "smoking", "Smoking", "Smokers (%)");
            };
        });
    });
}

function redrawAll(metroIndex) {

    const mapObj = document.getElementById("map_0")
    const map0Width = mapObj.clientWidth;
    const map0Height = mapObj.clientHeight;
    // D3 Projection
    const projection = d3.geoAlbersUsa()
                    .translate([map0Width * 0.45, map0Height * 0.5])    // translate to center of screen
                    .scale([map0Width]);          // scale things down so see entire US
            
    // Define path generator
    const path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
                .projection(projection);  // tell path generator to use albersUsa projection
                
    //Create SVG element and append map to the SVG
    const svg_0 = d3.select("#map_0")
                .html("")
                .append("svg")
                .attr("width", map0Width)
                .attr("height", map0Height);

    // Bind the data to the SVG and create one path per state
    svg_0.selectAll("path")
        .classed("states",true)
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill","#777")
        .attr("stroke","#FFF")
        .attr("stroke-width",1);
    
    const selectedMet = svg_0.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${map0Width / 2}, ${0.1 * map0Height})`)
        .classed("metro-selected", true)
        .text(`${metroData[thisMetroIndex].Simpledesc} selected`);    

    const metroGroup = svg_0.append("g")
        .attr("id","metros");                   

    const circlesGroup = metroGroup.selectAll("circle")
        .data(metroData)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            let coords = projection(d.GeoLocation);
            return (coords ? +coords[0] : map0Width - 20) 
        })
        .attr("cy", function (d, i) {
            let coords = projection(d.GeoLocation);
            return (coords ? +coords[1] : map0Height * 0.4 + 0.2 * i / metroData.length )
        })
        .attr("r","5px")
        .attr("fill","purple")
        .attr("stroke","#FFF")
        .attr("stroke-width","1px");
            
    const toolTip = d3.tip()
        .attr("class", "tooltip")
        .offset([40, 40])
        .style("background-color","lightyellow")
        .style("border","1px solid black")
        .style("border-radius","5px")
        .html(function(d) {
            return (d.Simpledesc);
        });
    
        //Create the tooltip in map.
    circlesGroup.call(toolTip);
            
        // Event listeners
    circlesGroup.on("mouseover", function(d) {
        toolTip.show(d, this);
        })
        .on("mouseout", function(d) {
            toolTip.hide(d);
        });
        
    circlesGroup.on("click", function(d,i) {
        selectedMet.text(`${d.Simpledesc} selected`);
        thisMetroIndex = i;
        const displayChoice = d3.select('input[name="displaySet"]:checked').node().value;
        if (displayChoice == "risks") {
            buildChart("ts_1", d, "genHealth", "Health Status", "Felt Good (%)");
            buildChart("ts_2", d, "overweight", "Overweight/Obesity", "BMI > 25 (%)");
            buildChart("ts_3", d, "diabetes","Diabetes", "Had Diabetes (%)");
            buildChart("ts_4", d, "highBP", "Hypertension","Had High B.P. (%)");
            buildChart("ts_5", d, "highChol", "High Cholesterol", "Had High Chol. (%)");
        }
        else {
            buildChart("ts_1", d, "hasInsurance", "Health Insurance", "Covered (%)");
            buildChart("ts_2", d, "getsChecked", "Cholesterol Screening", "Checked (%)");
            buildChart("ts_3", d, "exercise","Physical Activity", "Active (%)");
            buildChart("ts_4", d, "alcohol", "Alcohol Use","Drinkers (%)");
            buildChart("ts_5", d, "smoking", "Smoking", "Smokers (%)");
        };
    });      

    let displayChoice = d3.selectAll('input[name="displaySet"]').value;
    console.log(displayChoice);

    if (displayChoice == "risks") {
        buildChart("ts_1", metroData[thisMetroIndex], "genHealth", "Health Status", "Felt Good (%)");
        buildChart("ts_2", metroData[thisMetroIndex], "overweight", "Overweight/Obesity", "BMI > 25 (%)");
        buildChart("ts_3", metroData[thisMetroIndex], "diabetes","Diabetes", "Had Diabetes (%)");
        buildChart("ts_4", metroData[thisMetroIndex], "highBP", "Hypertension","Had High B.P. (%)");
        buildChart("ts_5", metroData[thisMetroIndex], "highChol", "High Cholesterol", "Had High Chol. (%)");
        }
    else {
        buildChart("ts_1", metroData[thisMetroIndex], "hasInsurance", "Health Insurance", "Covered (%)");
        buildChart("ts_2", metroData[thisMetroIndex], "getsChecked", "Cholesterol Screening", "Checked (%)");
        buildChart("ts_3", metroData[thisMetroIndex], "exercise", "Physical Activity", "Active (%)");
        buildChart("ts_4", metroData[thisMetroIndex], "alcohol", "Alcohol Use","Drinkers (%)");
        buildChart("ts_5", metroData[thisMetroIndex], "smoking", "Smoking", "Smokers (%)");
    };
}

// Main program
buildUSMap();

window.addEventListener("resize",redrawAll);