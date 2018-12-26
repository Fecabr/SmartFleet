﻿var markerGroup;
var map;
var markers = [];
var layout;
var currentVehicleId;
var positionModalOpend = false;
var GpsData = [];
var currentBarId;
var PinStopMarkers = [];
var targetMode = false;
var lastSelectedBar;
var lastLine;
var lastarrowHead;
var reportModalOpend = false;
var timeLineData;
var hub;

$(document).ready(function () {
    initJstree();
    initMap();
    //    $("#accordion").accordion();
    $("#vehicles").select2({
        // width: 175

    });
    $("#vehicles-pos").select2();
    $("#daily-report").tabs();
    //$("#position-sec").tabs();

    //   initSignalR();
    $("#startPeriod").datepicker({
        format: 'yyyy-mm-dd',
        orientation: 'top',
        language: 'fr',
        autoclose: true
    });
    $("#startPeriod-pos").datepicker({
        format: 'yyyy-mm-dd',
        orientation: 'top',
        language: 'fr',
        autoclose: true
    });
    $("#endPeriod").datepicker({
        format: 'yyyy-mm-dd',
        orientation: 'bottom',
        language: 'fr',
        autoclose: true
    });
    $("#dt-driver").datepicker({
        format: 'yyyy-mm-dd',
        orientation: 'top',
        language: 'fr',
        autoclose: true
    });


});


function initMap() {
    map = L.map('map').setView([36.7525000, 3.0419700], 8);
    markerGroup = L.layerGroup().addTo(map);

    layout = L;
    $.ajax({
        url: '/Home/AllVehiclesWithLastPosition',
        success: onGetAllVehiclesSuccess
    });
    loadData(0.67);
    // load a tile layer
    var openStreetMapMapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });
    map.addLayer(openStreetMapMapnik);

    hub = $.connection.signalRHandler;
    hub.client.receiveGpsStatements = onRecieveData;
    $.connection.hub.start().done(joinSignalRGroup);
    //return loadPolygan;
}
function onRecieveData(gpsStatement) {
    var thisIcon = new L.Icon();

    console.log(gpsStatement);
    removeMarker(gpsStatement);
    thisIcon.options.iconUrl = gpsStatement.ImageUri;
    //for (var i = 0; i < markers.length; i++) {
    //    map.removeLayer(markers[i]);
    //}
    var template = "<div><h4><b>" +
        gpsStatement.VehicleName +
        "</b></h4><h5>" +
        gpsStatement.Address +
        "</h5>" +
        "<p>" +
        gpsStatement.Speed +
        "Km/H</p>" +
        "</h5>" +
        "<p>" +
        gpsStatement.Latitude +
        "Km/H</p>" +
        "</h5>" +
        "<p>" +
        gpsStatement.Longitude +
        "Km/H</p>" +
        "</div>";
    var label = "<h5><b>" + gpsStatement.VehicleName + "</b></h5>";
    var marker = L.marker([gpsStatement.Latitude, gpsStatement.Longitude],
            { title: gpsStatement.VehicleId, icon: thisIcon })
        .bindPopup(template,
            {
                permanent: true,
                direction: 'topleft'
            }).bindTooltip(label,
            {
                permanent: true,
                direction: 'top'
            }
        ).addTo(map);
    markers.push(marker);
}
function joinSignalRGroup() {
    var groupeName = $("#client-group").val();
    hub.server.join(groupeName);
    loadData(1);

}
function onGetAllVehiclesSuccess(result) {
    for (var i = 0; i < result.length; i++) {
        var item = result[i];
        var icon = new L.Icon();
        var template = "<div><h4><b> <b>Véhicule</b>: " +
            item.VehicleName +
            "</b></h4> <b>Adresse</b>: " +
            item.Address +
            "" +
            "<p> <b>Vitesse</b>: " +
            item.Speed +
            "Km/H</p>" +
            "</h5>" +
            "<p> <b>Latitude</b>: " +
            item.Latitude +
            "</p>" +
            "</h5>" +
            "<p> <b>Longitude</b>:  " +
            item.Longitude +
            "</p>" +
            "</div>";

        icon.options.iconUrl = item.ImageUri;
        var label = "<h5><b>" + item.VehicleName + "</b></h5>"
        var marker = L.marker([item.Latitude, item.Longitude], { title: item.VehicleId, icon: icon })
            .bindPopup(template,
            {
                permanent: true,
                direction: 'topleft'
            }).bindTooltip(label,
            {
                permanent: true,
                direction: 'top'
            }
            ).addTo(map).on('click', clickZoom);
        console.log(marker.optionss);
        markers.push(marker);
    }

}
function clickZoom(e) {
    map.setView(e.target.getLatLng(), 15);
}

function iniJBOXPositionSearch() {

    return new jBox('Modal',
        {
            content: $("#posi-search"),
            width: 300,
            height: 150,
            overlay: false,
            position: { x: 'left', y: 'top' },
            offset: { x: 330, y: 65 },
        });

}
function iniJBOXDriver() {
    $("#driver-frm").PopupWindow({
        title: "Nouveau conducteur",
        modal: false,
        autoOpen: false,
        height: $('#map').height(),
        width: 400,
        top: 60,
        left: 320
    });
    $("#driver-frm").PopupWindow("open");
}


function initReportBox() {
    var width = $('#map').width();
    var height = $('#map').height();
    $("#daily-report").show();
    $("#daily-report").PopupWindow({
        title: "Rapport",
        modal: false,
        autoOpen: false,
        height: height,
        resizable :false,
        width: width,
        top: 60,
        left: 320
    });
    $("#daily-report").PopupWindow("open");

}
function initPositionWind() {
    var width = $('#map').width() + 15;
    var top =  $('#map').height() -130;
    $("#tachy-dashboard").PopupWindow({
        title: "Position",
        modal: false,
        autoOpen: false,
        height: 200,
        width: width,
        top: top,
        left: 320
    });
    $("#tachy-dashboard").PopupWindow("open");

}

function initJstree() {
    loadData(0.33);
    $('#container').jstree({
        "core": {
            "data": { "url": "/Home/LoadNodes" }
        },
        "search": {
            "case_insensitive": true,
            "show_only_matches": true
        },
        'contextmenu': {
            'items': customMenu
        },

        "plugins": ['theme', "html_data", "search", "contextmenu"]
    });
    $(document).on('click',
        '.jstree-anchor',
        function (e) {
            var anchorId = $(this).parent().attr('id');
            console.log(anchorId);
            currentVehicleId = anchorId;
            if (anchorId != 'vehicles-00000000-0000-0000-0000-000000000000'
                && anchorId != 'drivers-00000000-0000-0000-0000-000000000000') {
                markerFunction(anchorId);

                initPositionWind();
                positionModalOpend = true;
                initWait();

                $.ajax({
                    url: '/Home/GetTargetByPeriod/?vehicleId=' + anchorId,
                    dataType: 'json',
                    success: onGetTargetsSuccess,
                    error: onGetTargetsSuccess
                });
            } //
        });
}
function onGetTargetsSuccess(result) {
    if (result.responseText != undefined) {
        result = JSON.stringify(result.responseText);
        result = jQuery.parseJSON(result);
        console.log(result);
    }

    removeLineMarckers();
    $("#gps-activity").html("");
    $("#vehicle").html("");
    $("#date").html("");
    if (result.length == 0) {
        $("#map").waitMe("hide");

        return;

    }
    $("#vehicle-name").html("Véhicule: " + result.Periods[0].VehicleName);
    $("#date-pos").html("Date: " + result.Periods[0].CurrentDate);
    initGpsData(result.Periods, result.GpsCollection, "gps-activity");
    $("#map").waitMe("hide");;
}
function initWait() {
    $("#map").waitMe({
        effect: 'bounce',
        text: 'Téléchargement en cours ...',
        color: '#000',
        maxSize: '',
        waitTime: -1,
        textPos: 'vertical',
        fontSize: '',
        source: '',
        onClose: function () { }
    });
}

function customMenu(context) {
    var items = {
        aclRole: {
            label: "Ajouter un conducteur",
            action: function (obj) {
                console.log(obj);
                iniJBOXDriver();
                //window.location.href = '<?= Url::to(['role/acl']) ?>' + '?name=' + node.li_attr.name
            },
            icon: "fa fa-user"
        },
        deleteRole: {
            label: "Position par période",
            action: function (obj) {
                console.log(obj);
                iniJBOXPositionSearch().open();
            },
            icon: "fa fa-map-marker"
        }
    }
    return items;
}

function markerFunction(id) {
    for (var i in markers) {
        if (markers[i].options == undefined)
            continue;
        var markerID = markers[i].options.title;
        var position = markers[i].getLatLng();
        if (markerID == id) {
            map.setView(position, 15);
            markers[i].openPopup();
        };
    }
}

function removeLineMarckers() {
    if (lastLine != null && lastLine != undefined)
        map.removeLayer(lastLine);
    if (lastarrowHead != null && lastarrowHead != undefined)
        map.removeLayer(lastarrowHead);
}

function removeMarker(gpsStatement) {
    //console.log(markers);
    for (var i = 0; i < markers.length; i++) {
        var marker = markers[i];
        var markerID = marker.options.title;
        // console.log(markerID, gpsStatement.VehicleId);
        if (_guidsAreEqual("" + markerID + "", "" + gpsStatement.VehicleId + "") == 0) {
            map.removeLayer(markers[i]);
            //markers.splice(i, 1);
        }
    }

}

function _guidsAreEqual(left, right) {

    return left.localeCompare(right);
};

function loadData(percent) {
    $('body').loadie(percent);
}


function initGpsData(periods, gpsCollection, divName) {
    // CleanTracePeriod();
    GpsData = gpsCollection;
    // console.log(periods);
    var container = document.getElementById(divName);
    var data = [];
    var end;
    if (periods.length === 0) return;
    if (periods[periods.length - 1] != undefined)
        end = periods[periods.length - 1].EndPeriod;
    var start = periods[0].StartPeriod;
    console.log(end);
    $.each(periods,
        function (i, v) {
            var activity = "";
            var style = "";
            // console.log(v.Activity);
            switch (v.MotionStatus) {
                case "Stopped":
                    {
                        activity = "Arrêt";
                        style =
                            "background-color:#DC143C;height:9px; border-radius:0;margin-top: 20px;border-color:transparent!important;border-width:0!important;";

                    }
                    break;
                case "Moving":
                    {
                        activity = "Conduite";
                        style =
                            "background-color:#048b9a;height:30px;border-color:transparent!important; border-radius:0;margin-top: 20px;border-width:0!important;";
                    }
                    break;
                default:
                    {
                        activity = "Ralenti";
                        style =
                            "background-color:#dab30a;height:30px;border-color:transparent!important; border-radius:0;margin-top: 20px;border-width:0!important;";
                    }
                    break;
            }
            var startTime = v.StartPeriod.split('T')[1].split(':')[0] +
                ':' +
                v.StartPeriod.split('T')[1].split(':')[1];
            var endTime = v.EndPeriod.split('T')[1].split(':')[0] +
                ':' +
                v.EndPeriod.split('T')[1].split(':')[1];
            var duration = "";
            if (v.Duration !== "")
                duration = secondsToHms(v.Duration);
            var template = '' + activity + ' de ' + startTime + ' à ' + endTime;
            if (duration !== "") {
                template = template + ' (Durée : ' + duration + ')';
            }
            // console.log(v.DurationInSeconds);
            template = template + '\r';
            if (v.MotionStatus !== 'Stopped') {
                template = template + "Départ : " + v.StartAddres + '\r';

                template = template + "Arrivée : " + v.ArrivalAddres + '\r';

                template = template + "Vitesse moyenne : " + v.AvgSpeed + ' km/h\r';
            } else if (v.MotionStatus === 'Stopped' && v.StartAddres != null) {
                template = template + "Lieu : " + v.StartAddres + '\r';

            } else {
                template = template + "Lieu : " + v.ArrivalAddres + '\r';

            }
            if (v.MotionStatus !== 'Stopped') template = template + "Distance : " + v.Distance + " km." + '\r';

            data.push({
                id: i,
                group: null,
                content: v.MovementState,
                style: style,
                start: v.StartPeriod,
                end: v.EndPeriod,
                title: template
            });

        });
    var result = new vis.DataSet(data);
    //  console.log(end);
    InitTimelineChart(container, result, start, end, 83);
}

function secondsToHms(seconds) {
    var d = Number(seconds);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " heure, " : " heures, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : "";
    //  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    if (hDisplay !== "" || mDisplay !== "")
        return hDisplay + mDisplay;
    return "moins d'1 min";

}


function InitTimelineChart(container, data, start, end, height) {
    var today = new Date();
    timeLineData = data;
    today.setHours(24, 0, 0, 0);
    var max;
    if (sameDay(new Date(end), new Date())) {
        // ...
        max = today;
        end = today;
    } else max = end;
    //console.log(today);
    //console.log(today);
    var options = {
        width: '100%',
        locale: 'fr',
        height: height,
        editable: false,
        margin: {
            item: 10
        },
        selectable: true,
        start: start,
        zoomable: true,
        //maxZoom: 20,
        min: start,
        max: max,
        end: end,
        showCurrentTime: false,
        template: function (item) {
            var template = item.content;
            return "";
        },
        stack: false,
        format: {
            minorLabels: {
                minute: 'HH:mm',
                hour: 'HH'

            }
        }

    }

    // Create a Timeline
    var timeline = new vis.Timeline(container, null, options);
    timeline.setItems(data);
    timeline.on("click",
        function (properties) {
            onPeriodClick("click", properties);
        });


}

function onPeriodClick(event, properties) {
    if (properties.what != "item") return;
    var item = properties.item;
    var bar = $(properties.event.target);
    if (lastSelectedBar != null)
        lastSelectedBar.css("border", "color:transparent!important");
    lastSelectedBar = bar;
    bar.parent().css("border", "solid 2px #ff8000");
    var start = new Date(timeLineData.get(item).start);
    var end = new Date(timeLineData.get(item).end);
    var listOfGpsPoints = [];

    var s = -1;
    var e = -1;
    if (GpsData == null) return;
    for (var i = 0; i < GpsData.length; i++) {
        if (new Date(GpsData[i].GpsStatement).getTime() - start.getTime() >= 0 && s == -1) {
            s = i;
        }
        if (new Date(GpsData[i].GpsStatement).getTime() - end.getTime() > 0) {
            e = i - 1;
            break;
        }
    }

    if (e === -1 && s > -1) e = GpsData.length - 1;
    else if (s === -1 && e > -1) s = e;

    // console.log(s + " " + e);
    for (var j = s; j <= e; j++) {
        if (GpsData[j] != undefined)
            listOfGpsPoints.push(GpsData[j]);
    }
    if (listOfGpsPoints.length > 0) {

        var polygonArray = "[";
        for (var k = 0; k < listOfGpsPoints.length; k++) {
            var array = [];
            var gps = listOfGpsPoints[k];
            array.push(gps.Latitude, gps.Longitude);
            if (k < listOfGpsPoints.length - 1)
                polygonArray = polygonArray + "[" + gps.Latitude + " , " + gps.Longitude + "]" + ",";
            else polygonArray = polygonArray + "[" + gps.Latitude + " , " + gps.Longitude + "]";

        }
        polygonArray = polygonArray + "]";
        var arrow = L.polyline(JSON.parse(polygonArray), { color: 'blue' }).addTo(map);
        if (lastLine != null)
            map.removeLayer(lastLine);
        lastLine = arrow;
        if (lastarrowHead != null)
            map.removeLayer(lastarrowHead);
        var arrowHead = L.polylineDecorator(arrow,
            {
                patterns: [
                    {
                        offset: 25,
                        repeat: 50,
                        symbol: L.Symbol.arrowHead(
                            { pixelSize: 15, pathOptions: { fillOpacity: 1, weight: 0 } })
                    }
                ]
            }).addTo(map);
        map.fitBounds(JSON.parse(polygonArray));
        lastarrowHead = arrowHead;
    }

    //data.get(properties.time);
}
function sameDay(d1, d2) {
    return d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate();
}
function parseDate(input) {
    var parts = input.match(/(\d+)/g);
    // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1] - 1, parts[2]); // months are 0-based
}