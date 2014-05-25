function circularHeatChart() {
   

  
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
    innerRadius = 40,
    numSegments = 60,
    segmentHeight = 20,
    domain = null,
    ampleurDecalage = 10,
    accessor = function(d) {return d;},
    competitions = ["cdm","euro","c1","c3"]
    radialLabels = segmentLabels = [];

    function chart(selection) {
      

        // Légende
        $("#legende div").mouseover(function(d){
            d3.selectAll(".circular-heat path")
                .style({
                    "opacity":"0.3"
                }); 
            pays = $(this).attr("data-pays");

            tableau = [];
            $.each(datum, function(k,v) {

                if(pays == "Russie/URSS") {
                    if(v[3] == "Russie") {
                        tableau.push(v[0])
                    }
                    if(v[3] == "URSS") {
                        tableau.push(v[0])
                    }
                }
                else if(v[3] == pays) {

                        tableau.push(v[0])
                }
            })       

            for(var g = 0; g < tableau.length; g++) {
                    d3.select("path#bande"+tableau[g])
                        .style({
                            "opacity":"1",
                            "stroke-width":"2px",
                            "stroke":"#FFF"
                        });
            }  
        });
        $("#legende div").mouseout(function(d){
            d3.selectAll(".circular-heat path")
                .style({
                    "opacity":"1",
                    "stroke-width":"",
                    "stroke":""
            });  
        })

       
      
        
        
        


        selection.each(function(data) {
            var svg = d3.select(this);

                    var offset = innerRadius + Math.ceil(data.length / numSegments) * segmentHeight;
                    g = svg.append("g")
                        .classed("circular-heat", true)
                        .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

                    var autoDomain = false;
                    if (domain === null) {
                        domain = d3.extent(data, accessor);
                        autoDomain = true;
                    }
                    var color = d3.scale.linear().domain(domain).range(range);
                    if(autoDomain)
                        domain = null;


    


                   
                   /* ir_u = innerRadius + j * segmentHeight;
                    or_u = innerRadius + (j+1) * segmentHeight;*/

                    g.selectAll("path").data(datum)
                        .enter().append("path")
                        .attr("id", function(d, i) { return "bande"+i;})
                        .attr("title", function(d, i) { 
                            tableau = [d[2]]
                            $.each(datum, function(k,v) {
                                if(v[2] == d[2]) tableau.push(v[3],v[4])
                            })
                            html = "<p class=\"tt3_capital\">"+tableau[0]+" :</h2><ul>";
                            if(tableau[1]) {
                                html += "<li style=\"border-left-color:"+couleurs[tableau[1]]+"\">World Cup: <strong>"+tableau[1]+"</strong></li>";
                            }
                            else {
                                html += "<p>No competition played this year</p>"
                            }
                            if(tableau[3]) {
                                html += "<li style=\"border-left-color:"+couleurs[tableau[3]]+"\">European Championship: <strong>"+tableau[3]+"</strong></li>";
                            }
                            if(d[2] > 1991) { c1 = "Champions League"}
                            else { c1 = "European Champion Clubs' Cup"}
                            if(tableau[5]) {
                                html += "<li style=\"border-left-color:"+couleurs[tableau[5]]+"\">"+c1+" (C1): <strong>"+tableau[6]+" ("+tableau[5]+")</strong></li>";
                            }
                            if(d[2] > 2009) { c3 = "Europea League"}
                            else { c3 = "UEFA Cup"}
                            if(tableau[7]) {
                                html += "<li style=\"border-left-color:"+couleurs[tableau[7]]+"\">"+c3+" (C3): <strong>"+tableau[8]+" ("+tableau[7]+")</strong></li>";
                            }
                            html += "</ul>";
                            
                            return html;
                        })
                        .attr("d", d3.svg.arc().innerRadius(function(d,i){ return ir(d,i) }).outerRadius(function(d,i){ return or(d,i)}).startAngle(function(d,i){ return sa(d,i) }).endAngle(function(d,i){ return ea(d,i) }))
                        .attr("stroke-width", function(d) { 
                            if(d[3]) {
                                return "0.3";
                            }
                            else {
                                return "0";
                            }
                            
                        })
                        .attr("fill", function(d) { 
                            if(d[3]) {
                                if(couleurs[d[3]]) {
                                    return couleurs[d[3]] 
                                } 
                                else {
                                        return "#ccc";
                                }
                            }
                            else {
                                return "#FFF";
                            }
                        })
                        .on('mouseover', function(d){ 
                            d3.selectAll(".circular-heat path")
                                .style({
                                    "opacity":"0.3"
                            });   

                            tableau = []
                            $.each(datum, function(k,v) {
                                if(v[2] == d[2]) {
                                    tableau.push(v[0])
                                }
                            })
                            
                            for(var g = 0; g < tableau.length; g++) {
                                d3.select("path#bande"+tableau[g])
                                .style({
                                    "opacity":"1",
                                    "stroke-width":"2px",
                                    "stroke":"#FFF"
                                });
                            }    
                        })
                        .on('mouseout', function(d){ 
                            d3.selectAll(".circular-heat path")
                                .style({
                                    "opacity":"1",
                                    "stroke-width":"",
                                    "stroke":""
                                });    
                        });

                

                // Indications
                indications = svg.append("g")
                    .attr("id","indications")
                indications.append("path")
                .attr({
                    "d":"M232.393,579.371c0.66,5.961,2.422,13.593,5.031,18.702l-8.309-5.588l-9.96,1.021C223.862,590.226,229.007,584.32,232.393,579.371z",
                        "title":"In 1975, Germany won the four titles, with its national team, Bayern Munich and Borussia Mönchengladbach."
                    });
                indications.append("line")
                .attr({
                    "x1":"224.528",
                    "y1": "610.831",
                    "x2": "229.495",
                    "y2": "591.964",
                    "stroke": "#000",
                    "stroke-width": "3px",
                    "title":"In 1975, Germany won the four titles, with its national team, Bayern Munich and Borussia Mönchengladbach."
                });
                indications.append("path")
                .attr({
                    "d":"M144.197,38.007c-5.96,0.67-13.588,2.445-18.694,5.062l5.574-8.319l-1.038-9.958C133.328,29.494,139.242,34.629,144.197,38.007z",
                        "title":"In 2012, Spain has kept the four titles for 10 days."
                    });
                indications.append("line")
                .attr({
                    "x1":"112.724",
                    "y1": "30.195",
                    "x2": "132.599",
                    "y2": "35.128",
                    "stroke": "#000",
                    "stroke-width": "3px",
                    "title":"In 2012, Spain has kept the four titles for 10 days."
                });
                indications.append("path")
                .attr({
                    "d":"M204.883,17.601c4.823-3.565,10.537-8.921,13.646-13.744l-0.659,9.992l5.885,8.1C218.554,19.526,210.864,18.042,204.883,17.601z",
                        "title":"Since May 24<sup>th</sup> 2014, and until a hypothetical defeat in the World Cup, Spain holds the four titles."
                    });
                indications.append("line")
                .attr({
                    "x1":"236",
                    "y1": "8.6",
                    "x2": "216.4",
                    "y2": "14.3",
                    "stroke": "#000",
                    "stroke-width": "3px",
                    "title":"Since May 24<sup>th</sup> 2014, and until a hypothetical defeat in the World Cup, Spain holds the four titles."
                });
                indications.append("text")
                    .text("Germany 1975")
                    .attr({
                        "x":"187.4497",
                        "y":"625",
                        "title":"In 1975, Germany won the four titles, with its national team, Bayern Munich and Borussia Mönchengladbach."
                    })
                indications.append("text")
                    .text("Spain 2012")
                    .attr({
                        "x":"35.5",
                        "y":"32",
                        "title":"In 2012, Spain has kept the four titles for 10 days."
                    })
                indications.append("text")
                    .text("Spain 2014")
                    .attr({
                        "x":"242",
                        "y":"10.6",
                        "title":"Since May 24<sup>th</sup> 2014, and until a hypothetical defeat in the World Cup, Spain holds the four titles."
                    })
      
            // Unique id so that the text path defs are unique - is there a better way to do this?
            var id = d3.selectAll(".circular-heat")[0].length;

            //Radial labels
            var lsa = -0.2; //Label start angle
            var labels = svg.append("g")
                .classed("labels", true)
                .classed("radial", true)
                .classed("radial", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            labels.selectAll("def")
                .data(radialLabels).enter()
                .append("def")
                .append("path")
                .attr("id", function(d, i) {return "radial-label-path-"+id+"-"+i;})
                .attr("d", function(d, i) {
                    var r = innerRadius + ((i + 1.45) * segmentHeight);
                    return "m" + r * Math.sin(lsa) + " -" + r * Math.cos(lsa) + 
                            " a" + r + " " + r + " 0 1 1 -1 0";
                });

            labels.selectAll("text")
                .data(radialLabels).enter()
                .append("text")
                .append("textPath")
                .classed("tt2_capital",true)
                .attr("xlink:href", function(d, i) {return "#radial-label-path-"+id+"-"+i;})
                .text(function(d) {return d;});

            //Segment labels
            var segmentLabelOffset = 2;
            var r = innerRadius + 5 * segmentHeight + segmentLabelOffset;
            labels = svg.append("g")
                .classed("labels", true)
                .classed("segment", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            labels.append("def")
                .append("path")
                .attr("id", "segment-label-path-"+id)
                .attr("d", "m0 -" + r + " a" + r + " " + r + " 0 1 1 -1 0");

            labels.selectAll("text")
                .data(datum).enter()
                .append("text")
                .append("textPath")
                .attr("xlink:href", "#segment-label-path-"+id)
                .attr("transform", "rotate(180)")
                .attr("startOffset", function(d, i) {
                    return ampleurDecalage*50/(numSegments+ampleurDecalage) + i * 100 / (numSegments+ampleurDecalage) + "%";
                })
                .text(function(d) { 
                    if(d[0] == 0 || d[0] == 84) return d[2];
                    else if(d[0] < 84 && d[0] > 1) return d[2].toString().substring(2);
                });
        });

    }

    /* Arc functions */
    ir = function(d, i) {
        niveau = competitions.indexOf(d[1]) + 1
         return innerRadius + niveau * segmentHeight;
       /* return innerRadius + Math.floor(i/numSegments) * segmentHeight;*/
    }
    or = function(d, i) {
        return innerRadius + (niveau+1)*segmentHeight;
    }
   
    var decalage = 0;
    sa = function(d, i) { 

        if(i%(numSegments) == 0 && i != 0) {
            decalage += ampleurDecalage*(2*Math.PI) / (numSegments+ampleurDecalage);
        }
        return (i * 2 * Math.PI) / (numSegments+ampleurDecalage) + decalage + (ampleurDecalage*Math.PI)/(numSegments+ampleurDecalage);
    }
    ea = function(d, i) {
        return ((((i + 1) * 2 * Math.PI)) / (numSegments+ampleurDecalage) + decalage + (ampleurDecalage*Math.PI)/(numSegments+ampleurDecalage));
    }
    label = function(d, i) {
        return ((((i + 1) * 2 * Math.PI)) / (numSegments+ampleurDecalage) + decalage + (ampleurDecalage*Math.PI)/(numSegments+ampleurDecalage));
    }

     /* Anciennes fonctions */
/*    ir = function(d, i) {
        return innerRadius + Math.floor(i/numSegments) * segmentHeight;
    }
    or = function(d, i) {
        return innerRadius + segmentHeight + Math.floor(i/numSegments) * segmentHeight;
    }
   
    var decalage = 0;
    sa = function(d, i) { 
        if(i%(numSegments) == 0 && i != 0) {
            decalage += ampleurDecalage*(2*Math.PI) / (numSegments+ampleurDecalage);
        }
        return (i * 2 * Math.PI) / (numSegments+ampleurDecalage) + decalage + (ampleurDecalage*Math.PI)/(numSegments+ampleurDecalage);
    }
    ea = function(d, i) {
        return ((((i + 1) * 2 * Math.PI)) / (numSegments+ampleurDecalage) + decalage + (ampleurDecalage*Math.PI)/(numSegments+ampleurDecalage));
    }
    label = function(d, i) {
        return ((((i + 1) * 2 * Math.PI)) / (numSegments+ampleurDecalage) + decalage + (ampleurDecalage*Math.PI)/(numSegments+ampleurDecalage));
    }*/

    $( document ).tooltip({
              track: true,
              show: { effect: "fadeIn", duration: 0 },
              hide: { effect: "fadeOut", duration: 0 },
              content: function() {
                   var element = $( this );
                   return element.attr( "title" );
                 }
            });

    function deg(d){
        return d*180/Math.PI;
    }

    /* Configuration getters/setters */
    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.innerRadius = function(_) {
        if (!arguments.length) return innerRadius;
        innerRadius = _;
        return chart;
    };

    chart.numSegments = function(_) {
        if (!arguments.length) return numSegments;
        numSegments = _;
        return chart;
    };

    chart.segmentHeight = function(_) {
        if (!arguments.length) return segmentHeight;
        segmentHeight = _;
        return chart;
    };

    chart.domain = function(_) {
        if (!arguments.length) return domain;
        domain = _;
        return chart;
    };

    chart.range = function(_) {
        if (!arguments.length) return range;
        range = _;
        return chart;
    };

    chart.radialLabels = function(_) {
        if (!arguments.length) return radialLabels;
        if (_ == null) _ = [];
        radialLabels = _;
        return chart;
    };

    chart.segmentLabels = function(_) {
        if (!arguments.length) return segmentLabels;
        if (_ == null) _ = [];
        segmentLabels = _;
        return chart;
    };

    chart.accessor = function(_) {
        if (!arguments.length) return accessor;
        accessor = _;
        return chart;
    };

    return chart;
}
