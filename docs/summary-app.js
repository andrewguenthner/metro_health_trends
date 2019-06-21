// Global constants

const trendTypeLabels = ["Accelerating decline",
                   "Steady decline",
                   "Slowing / reversing decline",
                   "Little change",
                   "Slowing / reversing improvement",
                   "Steady improvement",
                   "Accelerating improvement"];

const trendTypeClass = ["neg-acc",
                    "neg-steady",
                    "neg-rev",
                    "trend-neutral",
                    "pos-rev",
                    "pos-steady",
                    "pos-acc"]

function getGraphTitle(itemKey) {
    switch (itemKey) {
        case "insurance":
            return "Health Insurance Coverage Trend (Adults 18-64)";
            break;
        case "med_check":
            return "Cholesterol Testing Prevalence Trend";
            break;
        case "alcohol_use":
            return "Alcohol Use (Past 30 Days) Trend";
            break;
        case "smoking":
            return "Smoking Prevalence Trend";
            break;
        case "exercise":
            return "Physical Activity Trend";
            break;
        case "general_health":
            return "Self-Reported General Health Trend";
            break;
        case "overweight":
            return "Overweight / Obeseity Prevalence Trend";
            break;
        case "diabetes":
            return "Diabetes Prevalence Trend";
            break;
        case "high_blood_pressure":
            return "Hypertension Prevalence Trend";
            break;
        case "high_cholesterol":
            return "High Cholesterol Prevalence Trend";
            break;
        default:
            return "Error -- Unrecognized Data Set";
    }
}
// Fetch file
function drawGraphs() {
    d3.csv("../static/data/trend_data.csv").then( function(trendTypeData) {
        // Convert from array of objects to object of arrays, skipping blank keys
        // and converting text to numbers
        let trendArrays = {};
        trendTypeData.forEach(trendType => {
            Object.keys(trendType).forEach(key => {
                if(key) {
                trendArrays[key] = (trendArrays[key] || []).concat([+trendType[key]])
                }
            });
        });

        // Note that in trend arrays, the as-fetched data is in the order 
        // ++, +-, -+, --, 0+, 0-, 00.  For graphing, we'd like them from
        // worst to best, left to right, so we need to remake the order as:
        // --, 0-, -+, 00, +-, 0+, ++
        let tempHolder = {}
        Object.keys(trendArrays).forEach(key => {
            tempHolder[key] = [trendArrays[key][3]];
            tempHolder[key].push(trendArrays[key][5]);
            tempHolder[key].push(trendArrays[key][2]);
            tempHolder[key].push(trendArrays[key][6]);
            tempHolder[key].push(trendArrays[key][1]);
            tempHolder[key].push(trendArrays[key][4]);
            tempHolder[key].push(trendArrays[key][0]);
        });
        trendArrays = tempHolder;
        
        Object.keys(trendArrays).forEach((itemToGraph,i) => {
            const graphArea = document.getElementById(`graph-${i+1}`);   
            const graphWidth = graphArea.clientWidth;
            const graphHeight = graphArea.clientHeight;
            const graphMargin = {
                top: Math.round(0.05 * graphHeight),
                bottom: Math.round(0.45 * graphHeight),
                right: Math.round(0.05 * graphWidth),
                left: Math.round(0.1 * graphWidth)
            };
            const xValues = trendTypeLabels;
            const yValues = trendArrays[itemToGraph];
            const svg_item = d3.select(`#graph-${i+1}`)
                .html("")
                .append("svg")
                .classed(`chart-${itemToGraph}`,true)
                .attr("width", graphWidth)
                .attr("height", graphHeight);

            const chart_g1 = svg_item.append("g")
                .attr("transform", `translate(${graphMargin.left}, ${graphMargin.top})`);
            // create scales
            // Calculate limits of data
            valueLower = 0;
            valueUpper = d3.max(yValues);
            // Calculate a padding equal to 10% of data range, for the axis range
            yAxisPad = (valueUpper - valueLower) * 0.1;
            yAxisBottom = valueLower;
            yAxisTop = valueUpper + yAxisPad;

            const xCategoryScale = d3.scaleBand()
            .domain(xValues)
            .range([0, graphWidth - graphMargin.left - graphMargin.right])
            .paddingInner(0.05);
    
            const yLinearScale = d3.scaleLinear()
            .domain([yAxisBottom, yAxisTop])
            // Leave some padding in the y-axis
            .range([graphHeight - graphMargin.top - graphMargin.bottom,0]);

            // create axes -- use date format for x-axis
            const xAxis = d3.axisBottom(xCategoryScale).ticks(7);
            const yAxis = d3.axisLeft(yLinearScale).ticks(5);

            // append axes
            chart_g1.append("g")
                .attr("transform", `translate(0, ${graphHeight - graphMargin.top - graphMargin.bottom})`)
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor","end")
                .style("font-size", "125%")
                .attr("dx","1em")
                .attr("dy","1.5em")
                .attr("transform",function (d) {return "rotate(-45)"});

            chart_g1.append("g")
                .call(yAxis)
                .selectAll("text")
                .attr("font-size", "125%");

            // append axes title
            chart_g1.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", `translate(${-0.7 * graphMargin.left}, ${0.5 * (graphHeight - graphMargin.top - graphMargin.bottom)}) rotate(-90)`)
                .classed("axis-title", true)
                .text("# of Metros");

            //chart title
            chart_g1.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", `translate(${(graphWidth - graphMargin.left - graphMargin.right) / 2}, ${-0.2 * graphMargin.top})`)
                .classed("axis-title", true)
                .text(getGraphTitle(itemToGraph));      
            
            //chart bars
            metroBars = chart_g1.selectAll("rect")
                .data(yValues)
                .enter()
                .append("rect")
                .attr("class", function(d,i) {return `bar ${trendTypeClass[i]}`})
                .attr("x", function(d,i) {return xCategoryScale(trendTypeLabels[i])})
                .attr("y", function(d) {return yLinearScale(d)})
                .attr("width", xCategoryScale.bandwidth)
                .attr("height", d => yLinearScale(0) - yLinearScale(d));

            const barToolTip = d3.tip()
                .attr("class", "tooltip")
                .offset([-10, 0])
                .style("background-color","lightyellow")
                .style("border","1px solid black")
                .style("border-radius","5px")
                .html(d => `${d} metros`);
            
                //Create the tooltip in map.
            metroBars.call(barToolTip);


            metroBars.on("mouseover", function(d) {
                barToolTip.show(d, this);
                })
                .on("mouseout", function(d) {
                    barToolTip.hide(d);
                });
        });
    });
}

// Main program
drawGraphs();

window.addEventListener("resize",drawGraphs);