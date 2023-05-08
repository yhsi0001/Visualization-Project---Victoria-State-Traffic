let vm = {}
d3InitSet(vm)
drawTicks(vm)
dataLoad(vm)

function d3InitSet(vm){
    
    let margin = {top: 20, right: 20, bottom: 40, left: 40}
    vm.width = 600 - margin.left - margin.right
    vm.height = 270 - margin.top - margin.bottom

    
    vm.svg = d3.select("#heatmap")
        .append("svg")
        .attr("id",'my_heatmap')
        .attr("width", vm.width + margin.left + margin.right)
        .attr("height", vm.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform","translate(" + margin.left + "," + margin.top + ")")


    // set heatmap x,y label
    let labelX = []
    let labelY = []
    labelY = ['Jan','Feb','March','April','May','June','July','Aug','Sept','Oct','Nov','Dec']
    for(let i = 1; i <=12; i++){
        //labelY.push(''+i)
        labelX.push(''+(2*i-2)+('hr'))
        labelX.push(''+(2*i-1)+('hr'))
    } 


    // scaleBand define to range 
    vm.X = d3.scaleBand()
        .range([ 0, vm.width ])
        .domain(labelX)
        .padding(0.01)

    vm.Y = d3.scaleBand()
        .range([vm.height,0])
        .domain(labelY)
        .padding(0.01)

    // set up color scaler
    vm.color = d3.scaleLinear()
        .range(["#DFF5EE", "#984a59"])
        .domain([0,1])
    vm.labelY = labelY
}
function drawTicks(vm){
    // set label information
    vm.Xaxis = d3.axisBottom(vm.X)
    vm.Yaxis = d3.axisLeft(vm.Y)


    vm.svg.append("g").attr("id","axis").attr("transform", "translate(0," + vm.height + ")").call(vm.Xaxis).call(g => g.select(".domain").remove())
    vm.svg.append("g").call(vm.Yaxis).call(g => g.select(".domain").remove())
}
function dataLoad(vm){
    d3.csv("./data/ALL-NO.csv",data=>{
        vm.svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d) { return vm.X(d.HOUR+'hr') })
            .attr("y", function(d) { return vm.Y(vm.labelY[d.MONTH-1]) })
            .attr("width", vm.X.bandwidth() )
            .attr("height", vm.Y.bandwidth() )
            .style("fill", function(d) { return vm.color(d.percent)} )         
    })           
}
function updateData(filename){
    d3.csv(filename,data =>{
        vm.svg.selectAll("rect").data(data).style("fill", function(d) { return vm.color(d.percent)} )      
    })        
}   



d3.csv("./data/cleaned_accident.csv",data => createVis(data));



function createVis(data) {

  // severity - 3 unique values
  var severityTypes = ["Fatal", "Severe", "Slight"];
  // speed zone - 13 unique values
  var speedZone = ["30 km/hr", "40 km/hr", "50 km/hr", "60 km/hr", "70 km/hr", "75 km/hr", "80 km/hr", "90 km/hr", "100 km/hr", "110 km/hr","Camping grounds or off road","Other speed limit","Not known"];

  // RMA - 3 unique values

  var RMA = ["Arterial Highway", "Arterial Other", "Freeway", "Local Road", ""]

  var regionName = ["EASTERN REGION,EASTERN REGION",
                    "METROPOLITAN NORTH WEST REGION",
                    "METROPOLITAN NORTH WEST REGION,METROPOLITAN SOUTH EAST REGION",
                    "METROPOLITAN SOUTH EAST REGION",
                    "METROPOLITAN SOUTH EAST REGION,EASTERN REGION,EASTERN REGION",
                    "NORTH EASTERN REGION",
                    "NORTHERN REGION",
                    "NORTHERN REGION,NORTH EASTERN REGION",
                    "NORTHERN REGION,WESTERN REGION",
                    "SOUTH WESTERN REGION",
                    "SOUTH WESTERN REGION,WESTERN REGION",
                    "WESTERN REGION",
                    "UNKNOWN"]

  // vis panel attr
  var width = 300;
  var height = 300;

  var severityColorRange = ['#984a59', '#ff5959', '#ff8f56'];

  var tip = d3.tip().attr('class', 'd3-tip').html(d => d);

  // as default show only first two sections
  var initialData = data.filter(d => d.severity === 'Fatal' || d.severity === 'Severe');
  toggleAbout();

  positionWrapper();
  var severityVis = createSeverityVis(severityTypes); 
  var speedVis = createSpeedVis(initialData);
  var regionVis = createRegionVis(initialData);
  
  var map = createMapVis(initialData.sort((pre,cur) => cur.TOTAL_PERSONS-pre.TOTAL_PERSONS));
  var accidentVis = createAccidentVis();

  var filter = resetFilter();



  function positionWrapper() {
    if (window.innerHeight > 750) {
      d3.select('#wrapper-body').style('top', (window.innerHeight/2-375)+'px')
    }
  }

  function toggleAbout() {
    d3.select('#about-title').style('opacity', '0');
    d3.select('#toggle-about')
      .on('click', () => {
        hideAbout();
      });

    d3.select('#about-title')
      .on('click', () => {
        d3.select('#about-title').transition().style('opacity', '0').style('right', '-500px');
        d3.select('#about').transition().style('opacity', '1').style('right', '0');
        d3.select('#vis-accident').transition().style('opacity', '0').style('right', '-500px');
      });
  }

  function hideAbout() {
    d3.select('#about').transition().style('opacity', '0').style('right', '-500px');
    d3.select('#about-title').transition().style('opacity', '1').style('right', '0');
  }

  function updateAllVis(type = undefined, value) {

    // reset data
    var filteredData = data;

    if (type) {
      // update value of changed filter
      filter[type] = value;
    } else {
      // reset all values
      filter = resetFilter();
      severityVis.resetAll();
      d3.selectAll('.rect-selected').classed('rect-selected', false);
    }
    
    // filter severity
    filteredData = filteredData.filter(d => filter.severity.indexOf(d.severity) !== -1 );
    
      
    // filter speed
    filteredData = (typeof filter.speed === 'object') ? filteredData : filteredData.filter(d => filter.speed === d.SPEED_ZONE);

    if (type !== 'region') {
        
      regionVis.update(filteredData);
    }

    // lastly update data according to the selected region
    filteredData = (typeof filter.region === 'object') ? filteredData : filteredData.filter(d => filter.region === d.REGION_NAME_ALL);
     
    speedVis.update(filteredData);

    map.update(filteredData);

  }

  function resetFilter() {
    return {
      severity: ['Fatal', 'Severe'],
      region: regionVis.vicRegion,
      speed: speedVis.speedTypes
    };
  }

  function createAccidentVis() {

    var vis = {};

    var svgWidth = 300;
    var svgHeight = 300;

    var centerHeight = svgHeight / 2 + 20;
    var centerWidth = svgWidth / 2 - 10;

    var severityColor = d3.scaleOrdinal()
      .domain(severityTypes)
      .range(severityColorRange);

    var svg = d3.select('#vis-accident')
      .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight);

    svg.call(tip);

    // quick replacement for button
    svg.append('text')
      .attr('class', 'label label-pointer label-brown')
      .attr('x', 20)
      .attr('y', 20)
      .text('✖')
      .on('click', () => {
        d3.select('#vis-accident')
          .transition()
          .style('right', '-500px');
      });

    vis.update = accidentId => {
      // reset style of wrapper
      d3.select('#vis-accident').style('right', '0');

      var accident = data.find(d => d.OBJECTID === accidentId);

      var angle = 360 / 7;
      var r = 50;
      var iconSize = 30;
        
      dateTimeLabel(true);
      dateTimeLabel(false);
      locationHeading();
      
      casualtyInfo(1);
      casualtyInfo(2);
      casualtyInfo(3);
      casualtyInfo(4);
      casualtyInfo(5);
      casualtyInfo(6);
      casualtyInfo(7);
      casualtyInfo(8);
        
      function casualtyInfo(order){
        var className= 'accident-info'+order.toString();
        var fontSize = '12px';

        var info = svg.selectAll('.'+ className)
          .data([accident]);

        info.exit()
          .style('opacity', '0')
          .style('font-size', '0px')
          .remove();

        info.enter()
          .append('text')
          .attr('class', className+' label NEW')
          .attr('x', centerWidth +20 )
          .attr('y', 85+order*20)
          .style('text-anchor', 'middle')
          .style('opacity', '0')
          .style('font-size', fontSize)
          .transition(d3.transition().duration(3000))
          .style('opacity', '1')
          .text(text);

        info.transition()
          .style('opacity', '0')
          .transition(d3.transition().duration(3000))
          .attr('x', centerWidth +20 )
          .attr('y', 85+order*20)
          .style('opacity', '1')
          .style('font-size', fontSize)
          .text(text);
          
          function text(d){
              switch(order) {
                  case 1:
                    return "Total persons: " + accident.TOTAL_PERSONS;
                    break;
                  case 2:
                    return "Fatality: " + accident.FATALITY;
                    break;
                  case 3:
                    return "Serious injury: " + accident.SERIOUSINJURY;
                    break;
                  case 4:
                    return "Other injury: " + accident.OTHERINJURY;
                    break;
                  case 5:
                    return "Non-injured: " + accident.NONINJURED;
                    break;
                  case 6:
                    return "Total persons: " + accident.TOTAL_PERSONS;
                    break;
                  case 7:
                    return "Speed zone: " + accident.SPEED_ZONE;
                    break;
                  default:
                    return "Drunk or not: " + accident.ALCOHOLTIME;
                    break;
                  
              }
          }

      }

      function locationHeading() {

        var locationHeading = d3.selectAll('.accident-location')
          .data([accident]);

        locationHeading.exit()
          .style('opacity', '0')
          .remove();

        locationHeading.enter()
          .append('span')
            .attr('class', 'accident-location label')
            .style('opacity', 0)
          .transition(d3.transition().duration(3000))
            .style('opacity', 1)
            .text(accident.REGION_NAME_ALL);

        locationHeading.transition()
          .transition(d3.transition().duration(3000))
            .style('opacity', 1)
            .text(accident.REGION_NAME_ALL);
      }

      function dateTimeLabel(dateToggle) {
        var className = dateToggle ? 'accident-date' : 'accident-time';
        var shift = dateToggle ? 0 : 17;
        var fontSize = dateToggle ? '10px' : '9px';

        var dateTime = svg.selectAll('.'+className)
          .data([accident]);

        dateTime.exit()
          .style('opacity', '0')
          .style('font-size', '0px')
          .remove();

        dateTime.enter()
          .append('text')
          .attr('class', className+' label NEW')
          .attr('x', centerWidth +20 )
          .attr('y', 65 + shift)
          .style('text-anchor', 'middle')
          .style('opacity', '0')
          .style('font-size', fontSize)
          .transition(d3.transition().duration(3000))
          .style('opacity', '1')
          .text(dateTimeText);

        dateTime.transition()
          .style('opacity', '0')
          .transition(d3.transition().duration(3000))
          .attr('x', centerWidth +20 )
          .attr('y', 65 + shift)
          .style('opacity', '1')
          .style('font-size', fontSize)
          .text(dateTimeText);

        function dateTimeText(d) {
          if (dateToggle) {
            return accident.ACCIDENT_DATE;
          } else {
            return accident.ACCIDENT_TIME;
          }
        }
      }
    }

    return vis;

    function pointOnCircle(angle, radius, i) {
      var center = [centerWidth, centerHeight];

      var shift = (i < 6) ? 0 : 1;
      var angleShift = shift === 1 ? -angle/2 : 0;

      var rads = (angle+angleShift) * Math.PI / 180;

      var x = center[0] + (radius+shift*radius) * Math.cos(rads);
      var y = center[1] + (radius+shift*radius) * Math.sin(rads);

      return [x, y];
    }

  }

  function createMapVis(data) {

    var mapData = data;

    var severityColor = d3.scaleOrdinal()
      .domain(severityTypes)
      .range(severityColorRange);

    var mapObj = {};

    var map = initMap();

    var geoJSONdata = format2geoJSON(mapData);

    map.data.addGeoJson(geoJSONdata);

    map.data.addListener('click', event => {
      hideAbout();
      accidentVis.update(event.feature.getProperty('id'));
    });

    map.data.addListener('mouseover', event => {
      map.data.revertStyle();
      map.data.overrideStyle(event.feature, mapIcon(event.feature, true));
    });

    map.data.addListener('mouseout', event => map.data.revertStyle());

    map.addListener('mouseup', () => mapObj.update(mapData));

    map.addListener('zoom_changed', () => mapObj.update(mapData));

    map.data.setStyle(feature => mapIcon(feature, false));

    mapObj.map = map;

    mapObj.update = data => {

      mapData = data.sort((pre,cur) => cur.TOTAL_PERSONS-pre.TOTAL_PERSONS);

      var ne = map.getBounds().getNorthEast();
      var sw = map.getBounds().getSouthWest();
        
      var latBounds = [sw.lat(), ne.lat()];
      var lonBounds = [sw.lng(), ne.lng()];

      var dataWithinBounds = mapData.filter( d => inBounds(d.Y, d.X, latBounds, lonBounds)).slice(0, 3500);
      var oldData = [];

      map.data.forEach(feature => {
        var remaining = dataWithinBounds.find( d => d.id === feature.getProperty('id'));
        if (remaining) {
          oldData.push(remaining);
        } else {
          map.data.remove(feature);
        }
      });

      var newData = dataWithinBounds.filter(x => oldData.indexOf(x) === -1).slice(0, 3500);
      map.data.addGeoJson(format2geoJSON(newData));

    }

    return mapObj;

    function mapIcon(feature, hover) {
      return ({
        title: 'click for details',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: feature.getProperty('total_persons')*5,
          fillColor: severityColor(feature.getProperty('severity')),
          fillOpacity: 0.5,
          strokeColor: hover ? '#05ffa7' : 'white',
          strokeWeight: hover ? 2 : .7
        }
      })
    }

    function inBounds(lat, lon, latBounds, lonBounds) {
      return (lat < latBounds[1] && lat > latBounds[0]) && (lon < lonBounds[1] && lon > lonBounds[0]);
    }

    function format2geoJSON(data) {
      var features = data.map( (d,i) => {
        return {
          "type": "Feature",
          "properties": {
            "id": d.OBJECTID,
            "total_persons": d.TOTAL_PERSONS,
            "severity": d.severity
          },
          "geometry": {
            "type": "Point",
            "coordinates": [Number(d.X), Number(d.Y)]
          }
        }
      });

      return {
        "type": "FeatureCollection",
        "features": features
      };
    }

    function initMap() {
      var options = [
          {
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#ebe3cd"
              }
            ]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#523735"
              }
            ]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [
              {
                "color": "#f5f1e6"
              }
            ]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [
              {
                "color": "#c9b2a6"
              }
            ]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "geometry.stroke",
            "stylers": [
              {
                "color": "#dcd2be"
              }
            ]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "labels",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#ae9e90"
              }
            ]
          },
          {
            "featureType": "landscape.natural",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#dfd2ae"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#dfd2ae"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#93817c"
              }
            ]
          },
          {
            "featureType": "poi.business",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "color": "#a5b076"
              }
            ]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#447530"
              }
            ]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#f5f1e6"
              }
            ]
          },
          {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#fdfcf8"
              }
            ]
          },
          {
            "featureType": "road.arterial",
            "elementType": "labels",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#f8c967"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [
              {
                "color": "#e9bc62"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "road.highway.controlled_access",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#e98d58"
              }
            ]
          },
          {
            "featureType": "road.highway.controlled_access",
            "elementType": "geometry.stroke",
            "stylers": [
              {
                "color": "#db8555"
              }
            ]
          },
          {
            "featureType": "road.local",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "road.local",
            "elementType": "labels",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#806b63"
              }
            ]
          },
          {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#dfd2ae"
              }
            ]
          },
          {
            "featureType": "transit.line",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#8f7d77"
              }
            ]
          },
          {
            "featureType": "transit.line",
            "elementType": "labels.text.stroke",
            "stylers": [
              {
                "color": "#ebe3cd"
              }
            ]
          },
          {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#dfd2ae"
              }
            ]
          },
          {
            "featureType": "water",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "color": "#b9d3c2"
              }
            ]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#92998d"
              }
            ]
          }
        ];

        return new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: new google.maps.LatLng(-37.81, 144.94),
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        styles: options
      });
    }
  }

  function createSpeedVis(data) {

    var speedVis = {};

    speedVis.speedTypes;

    speedVis.vis = createHorBarVis(preprocessData(data), 'vis-speeds', 11*22);

    speedVis.update = data => speedVis.vis.update(preprocessData(data));

    return speedVis;

    function preprocessData(data) {

      var casultySpeeds = [
        { groupType: 'speed', type: '30 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '40 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '50 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '60 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '70 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '75 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '80 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '90 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '100 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: '110 km/hr', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: 'Camping grounds or off road', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: 'Other speed limit', Slight: 0, Severe: 0, Fatal: 0, total: 0},
        { groupType: 'speed', type: 'Not known', Slight: 0, Severe: 0, Fatal: 0, total: 0},
      ];

      speedVis.speedTypes = casultySpeeds.map(d => d.type);

      casultySpeeds.forEach( speed => {
        data.forEach( data => {
          if (speed.type === data.SPEED_ZONE) {
            speed[data.severity] += 1;
          } 
        });

        speed.total = speed.Slight + speed.Severe + speed.Fatal;
      });

      return casultySpeeds.sort((pre, cur) => cur.total-pre.total);
    }
  }

  function createHorBarVis(data, idElement, height) {

    var tip2 = d3.tip()
      .attr('class', 'd3-tip d3-tip2')
      .html(d => d)
      .direction('e')
      .offset([0,5])

    var horBarVis = {};

    var margin = 20;
    var shift = 40;
    var visWidth = width - margin*2;
    var visHeight = height - margin*2;

    var stack = d3.stack();

    var yScale = d3.scaleBand()
      .domain(data.map(d => d.type))
      .rangeRound([0, visHeight])
      .padding(0.1)
      .align(0.1);

    var xScale = d3.scaleLinear()
      .domain([1, d3.max(data, d => d.total)]).nice()
      .range([shift, visWidth]);

    var severityColor = d3.scaleOrdinal()
      .domain(severityTypes)
      .range(severityColorRange);

    horBarVis.svg = d3.select('#'+idElement)
      .append('svg')
      .attr('width', visWidth + margin*2)
      .attr('height', visHeight + margin)
        .append('g')
        .attr('transform', 'translate('+margin+','+margin+')');

    appendBackground(horBarVis.svg, visWidth, visHeight);

    var xAxis = d3.axisTop(xScale)
      .ticks('4');

    horBarVis.svg.append('g')
        .attr('class', 'axis axis--x')
        .call(xAxis);

    horBarVis.update = function(data) {

      var max = d3.max(data, d => d.total);
      xScale.domain([0, max]).nice();

      var ticks = (max <= 5) ? (max <= 1 ? '1' : '2') : '4';
      xAxis.ticks(ticks);

      horBarVis.svg.select('.axis--x')
        .transition()
        .call(xAxis);

      horBarVis.svg.call(tip2);

      var bars = horBarVis.svg.selectAll('.serie')
        .data(stack.keys(severityTypes)(data), d => d);

      bars.selectAll('rect')
        .transition()
        .style('fill-opacity', 1)
        .attr('x', d => Math.max(shift, xScale(d[0])))
        .attr('width', d => (xScale(d[1]) - xScale(d[0]) === 0) ? 0 : Math.max(1, xScale(d[1]) - xScale(d[0])))

      bars.enter()
        .append('g')
          .attr('class', d => 'serie serie--'+d.key)
          .attr('fill', d => severityColor(d.key))
          .style('fill-opacity', 0)
        .selectAll('rect')
          .data(d => d)
          .enter()
          .append('rect')
            .attr('y', d => yScale(d.data.type))
            .attr('x', d => Math.max(shift, xScale(d[0])))
            .attr('height', yScale.bandwidth())
            .on('mouseover', d => tip2.show('Casualties: '+(d3.format(',')(d[1]-d[0])) ))
            .on('mouseout', tip2.hide)
          .transition()
            .attr('width', d => (xScale(d[1]) - xScale(d[0]) === 0) ? 0 : Math.max(1, xScale(d[1]) - xScale(d[0])))
            .style('fill-opacity', 1);

      bars.exit()
        .transition()
          .attr('width', 0)
          .remove();
    };

    var groupData = horBarVis.svg.selectAll('.g-bar')
      .data(data);

    var group = groupData.enter()
      .append('g')
        .attr('class', 'g-bar')
        .on('click', function(d) {
          horBarVis.svg.selectAll('.rect-background')
            .classed('rect-selected', false);

          toggleClass(d3.select(this), '.rect-background', 'rect-selected', true);

          updateAllVis("speed", d.type);
        })
        .on('mouseover', function (d) {
          toggleClass(d3.select(this), '.rect-background', 'rect-hover', true);
        })
        .on('mouseout', function (d) {
          toggleClass(d3.select(this), '.rect-background', 'rect-hover', false);
        });

    
      group.append('rect')
        .attr('class', 'rect-background')
        .attr('x', -8)
        .attr('y', d => yScale(d.type))
        .attr('width', yScale.bandwidth()*3)
        .attr('height', yScale.bandwidth())
        .attr('fill', 'transparent');

      group.append('text')
          .attr('class', 'label-bar label')
          //.on('mouseover', d => tip.show('Age range: '+d.type[0]+'-'+d.type[1]+'<br/> (click to show only<br/>casualties where this<br/>group participated)'))
          .on('mouseover', d => tip2.show('Speed range: <br/>'+d.type))
          .on('mouseout', tip2.hide)
          .attr('x', margin/3*2)
          .attr('y', d => yScale(d.type)+yScale.bandwidth()/4*3)
          .text(d => {
            if(d.type === "Not known") {
                return "Unknown";
            } else if (d.type === "Camping grounds or off road"){
                return "CG or OR";
            }else if (d.type === "Other speed limit"){
                return "OSL";
            } else {
                return d.type;
            }
            
          });
    

    horBarVis.update(data);

    return horBarVis;

  }

  function createRegionVis(data) {

    var regionVis = {};

    var margin = 5;
    var visWidth = width - margin*2;
    var visHeight = height - margin*2;

                    
                  
                  
                   
                    
                
               


    var vicRegion = [
      { pos: [-10, -10], nameShort: 'bug', name: 'dummy element'      }, 
      { pos: [2, 3], nameShort: 'EE', name: 'EASTERN REGION,EASTERN REGION'   },
      { pos: [2, 2], nameShort: 'MNW', name: 'METROPOLITAN NORTH WEST REGION'  },
      { pos: [5, 3], nameShort: 'MNS', name: 'METROPOLITAN NORTH WEST REGION,METROPOLITAN SOUTH EAST REGION'                 },
      { pos: [2, 4], nameShort: 'MSE', name: 'METROPOLITAN SOUTH EAST REGION'                  },
      { pos: [4, 2], nameShort: 'MSE', name: 'METROPOLITAN SOUTH EAST REGION,EASTERN REGION,EASTERN REGION'                },
      { pos: [3, 3], nameShort: 'NER', name: 'NORTH EASTERN REGION'                 },
      { pos: [3, 4], nameShort: 'N', name: 'NORTHERN REGION'         },
      { pos: [3, 2], nameShort: 'NNE', name: 'NORTHERN REGION,NORTH EASTERN REGION'                },
      { pos: [4, 3], nameShort: 'SW', name: 'SOUTH WESTERN REGION'                 },
      { pos: [4, 4], nameShort: 'NW', name: 'NORTHERN REGION,WESTERN REGION'                },
      { pos: [3, 1], nameShort: 'SWW', name: 'SOUTH WESTERN REGION,WESTERN REGION'                },
      { pos: [3, 5], nameShort: 'W', name: 'WESTERN REGION'                },
      { pos: [1, 3], nameShort: 'UNK', name: 'UNKNOWN'              }
    ];

    regionVis.vicRegion = vicRegion;

    regionVis.vis = createVis(preprocessData(data), 'vis-regions');

    regionVis.update = data => regionVis.vis.update(preprocessData(data));

    return regionVis;

    function preprocessData(data) {

      vicRegion.forEach( region => {
        var casualties = 0;

        data.forEach( data => {
            if (data.REGION_NAME_ALL === region.name) {
              casualties += 1;
            }
        });

        region.casualties = casualties;
      });

      return vicRegion;
    }

    function createVis(vicRegion, idElement) {

      var regionVis = {};

      var boxWidth = (visWidth <= visHeight) ? (visWidth / 6.5) : (visHeight / 4.5);
      var shift = boxWidth / 20;

      var casualtiesScale = d3.scaleLinear()
        .domain(d3.extent(vicRegion.map(d => d.casualties)))
        .range(['#aedadd', '#6e7da2']);

      regionVis.svg = d3.select('#'+idElement)
        .append('svg')
          .attr('width', visWidth + margin)
          .attr('height', visHeight + margin)
        .append('g')
          .attr('transform', 'translate('+ margin +','+ margin +')');

      regionVis.svg.call(tip);

      appendBackground(regionVis.svg, visWidth, visHeight);

      regionVis.update = function(data) {

        casualtiesScale.domain(d3.extent(data.map(d => d.casualties)));

        var groupData = regionVis.svg.selectAll('.g-region')
          .data(data, d => d);

        var group = groupData.enter()
          .append('g')
            .attr('class', 'g-region')
          .on('click', function(d) {
            regionVis.svg.selectAll('.rect-selected')
              .classed('rect-selected', false);

            toggleClass(d3.select(this), '.region-rect', 'rect-selected', true);

            updateAllVis('region', d.name);
          })
          .on('mouseover', function (d) {
            toggleClass(d3.select(this), '.region-rect', 'rect-hover', true);
            tip.show(d.name+'<br/>Number of casualties: '+d.casualties);
            //tip.show(d.name+'<br/>Number of casualties: '+d.casualties+'<br/><br/>(click to filter)');
          })
          .on('mouseout', function (d) {
            toggleClass(d3.select(this), '.region-rect', 'rect-hover', false);
            tip.hide();
          });

        var rect = group.append('rect')
          .attr('class', 'region-rect');

        rect.exit()
          .transition()
            .style('opacity', 1e-6)
            .remove();

        rect.transition()
          .attr('fill', d => casualtiesScale(d.casualties));

        rect.attr('id', d => 'region-rect-'+d.nameShort)
            .attr('class', 'region-rect')
            .attr('x', d => d.pos[0]*boxWidth + d.pos[0]*shift)
            .attr('y', d => d.pos[1]*boxWidth + d.pos[1]*shift)
            .attr('width', boxWidth)
            .attr('height', boxWidth)
            .style('fill-opacity', 0)
          .transition()
            .attr('fill', d => casualtiesScale(d.casualties))
            .style('fill-opacity', 1);

        group.append('text')
            .attr('id', d => 'region-num-'+d.nameShort)
            .attr('class', 'region-num label')
            .attr('x', d => d.pos[0]*boxWidth + d.pos[0]*shift + boxWidth - shift*2)
            .attr('y', d => d.pos[1]*boxWidth + d.pos[1]*shift + boxWidth - shift*2)
            .style('font-size', d => (boxWidth < 40) ? '10px' : '13px' )
          .text(d => d.casualties);

        group.append('text')
            .attr('id', d => 'region-label-'+d.nameShort)
            .attr('class', 'region-label label')
            .attr('x', d => d.pos[0]*boxWidth + d.pos[0]*shift + shift*2)
            .attr('y', d => d.pos[1]*boxWidth + d.pos[1]*shift + shift*6)
            .style('font-size', d => (boxWidth < 40) ? '9px' : '13px' )
          .text(d => d.nameShort.toUpperCase());

      }

      regionVis.update(vicRegion);

      return regionVis;
    }
  }

  function toggleClass(selection, selectClass, classed, toggle) {
    selection.select(selectClass)
      .classed(classed, toggle);
  }

  function appendBackground(svg, width, height) {
    svg.append('rect')
      .attr('class', 'svg-background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('click', () => updateAllVis());
  }

  function createSeverityVis(types) {

    var severityVis = {};

    var severityTypes = types.map( d => {
      if (d === 'Slight') {
        return { type: d, selected: false };
      } else {
        return { type: d, selected: true };
      }
    });
      
    var boxWidth = 20;

    var severityColor = d3.scaleOrdinal()
      .domain(types)
      .range(severityColorRange);

    var margin = 10;
    var visWidth = width - margin*4;
    var visHeight = 70 - margin*2;

    var svg = d3.select('#options-severity')
      .append('svg')
        .attr('width', visWidth + margin*4)
        .attr('height', visHeight + margin)
      .append('g')
        .attr('transform', 'translate('+ margin*4 +','+ margin +')');

    var options = svg.selectAll('.option-severity')
      .data(severityTypes)
      .enter()
      .append('rect')
        .attr('class', 'option-severity')
        .attr('x', (d, i) => i*80 + boxWidth)
        .attr('y', 5)
        .attr('width', boxWidth)
        .attr('height', boxWidth)
        .attr('stroke', d => severityColor(d.type))
        .attr('stroke-width', 5)
        .attr('fill', d => d.selected ? severityColor(d.type) : 'transparent')
      .on('click', function(d) {
        d3.select(this).attr('fill', () => d.selected ? 'transparent' : severityColor(d.type));
        d.selected = !d.selected;
        updateAllVis('severity', severityTypes.filter(d => d.selected).map(d => d.type));
      });

    var labels = svg.selectAll('.label-severity')
      .data(types)
      .enter()
      .append('text')
        .attr('class', 'label label-severity')
        .attr('x', (d, i) => i*80 + boxWidth*2 + 10)
        .attr('y', 20)
        .text(d => d);

    severityVis.severityTypes = types;

    severityVis.resetAll = () => {
      options.each(function(d) {
        if (d.type === 'Slight') {
          d3.select(this).attr('fill', 'transparent');
          d.selected = false;
        } else {
          d3.select(this).attr('fill', severityColor(d.type));
          d.selected = true;
        }
      });
    };

    return severityVis;
  }
}
