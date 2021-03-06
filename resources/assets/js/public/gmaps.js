/*global $, jQuery, alert*/

function highlightAddress(markerId) {
    'use strict';
    // console.log('marker : '+markerId);
    var item = jQuery('#item-' + markerId);
    if (item.length && !item.hasClass('active')) {
        jQuery('.list-agencies .active').removeClass('active');
        item.addClass('active');
    }
}

var onMarkerClick = function () {
    'use strict';
    // console.log(this);
    highlightAddress(this.id);
    infoWindow.setContent(this.html);
    infoWindow.open(map, this);
};

// Gmaps
if (jQuery('#map').length) {
    var infoWindow = new google.maps.InfoWindow(),
        jsonData = [],
        markers = [],
        markersPoints = [],
        markersPos = [],
        noms = [],
        iterator = 0,
        mapOptions = {
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng(50.85, 4.36),
            mapTypeControl: false,
            streetViewControl: false,
            zoom: 12
        },
        markerShape = {
            coord: [0, 0, 27, 0, 27, 37, 0, 37],
            type: 'poly'
        },
        map = new google.maps.Map(document.getElementById('map'), mapOptions);

    google.maps.event.addListener(map, 'click', function () {
        'use strict';
        infoWindow.close();
    });

    jQuery.getJSON(location.search, function (data) {
        'use strict';
        var i = 0,
            coords = [];
        if (!jQuery.isArray(data)) {
            jsonData = [data];
        } else {
            jsonData = data;
        }
        for (i = 0; i < jsonData.length; i += 1) {
            if (jsonData[i].latitude > 0 && jsonData[i].longitude > 0) {
                markersPos[i] = new google.maps.LatLng(jsonData[i].latitude, jsonData[i].longitude);
                markers[i] = {};
                coords = [];
                markers[i].id = jsonData[i].id;
                markers[i].shape = jsonData[i].shape;
                markers[i].html = '<h4>' + jsonData[i].title + '</h4>';
                markers[i].html += '<p>';
                if (jsonData[i].address) { coords.push(jsonData[i].address); }
                if (jsonData[i].phone) { coords.push('T ' + jsonData[i].phone); }
                if (jsonData[i].fax) { coords.push('F ' + jsonData[i].fax); }
                if (jsonData[i].email) { coords.push('<a href="mailto:' + jsonData[i].email + '">' + jsonData[i].email + '</a>'); }
                if (jsonData[i].website) { coords.push('<a href="' + jsonData[i].website + '" target="_blank">' + data[i].website + '</a>'); }
                markers[i].html += coords.join('<br>');
                markers[i].html += '</p>';
            }
        }
        // console.log(markers);
        if (markers.length > 0) {
            drop();
            AutoCenter();
        }
    });

    // Search Postcode
    $('#search-nearest button').click(function () {
        'use strict';

        var address = $('#search-nearest input').val(),
            geocoder;

        if (!address.length) {
            return false;
        }

        geocoder = new google.maps.Geocoder();
        geocoder.geocode(
            {
                address: address
            },
            function (results_array) {
                var p = results_array[0].geometry.location,
                    lat = p.lat(),
                    lng = p.lng();
                setDistancesForMarkers(lat, lng);
            }
        );

        return false;
    });

    // Compute distance between two points
    var rad = function (x) {
        'use strict';
        return x * Math.PI / 180;
    };

    function getDistance(p1_lat, p1_lng, p2_lat, p2_lng) {
        'use strict';
        var R = 6378137, // Earth’s mean radius in meter
            dLat = rad(p2_lat - p1_lat),
            dLong = rad(p2_lng - p1_lng),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rad(p1_lat)) * Math.cos(rad(p2_lat)) *
                Math.sin(dLong / 2) * Math.sin(dLong / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            d = R * c;
        return d; // returns the distance in meter
    }

    // Get the distance between a given point and the markers
    function setDistancesForMarkers(lat, lng) {
        'use strict';
        var i = 0;
        for (i = 0; i < jsonData.length; i += 1) {
            if (jsonData[i].latitude > 0 && jsonData[i].longitude > 0) {
                jsonData[i].distance = getDistance(lat, lng, jsonData[i].latitude, jsonData[i].longitude);
                // var km = (jsonData[i].distance/1000).toFixed(1);
                // var km = (jsonData[i].distance/1000).toFixed(0);
                // $('#item-'+jsonData[i].id).data('data-distance', km);
                // $('#item-'+jsonData[i].id+' .distance').html('(' + km + ' km)');
                jsonData.sort(function (a, b) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                });
                // sortAgenciesList();
            }
        }
        openMarkerId(jsonData[0].id);
    }

    // function sortAgenciesList() {
    //     'use strict';
    //     var items = $('#list-agencies li').get();
    //     items.sort(function (a,b) {
    //       var keyA = parseFloat($(a).data('data-distance'));
    //       var keyB = parseFloat($(b).data('data-distance'));
    //       if (keyA < keyB) return -1;
    //       if (keyA > keyB) return 1;
    //       return 0;
    //     });

    //     var ul = $('#list-agencies');
    //     $.each(items, function (i, li) {
    //         ul.append(li);
    //     });
    // }

}

function getMarkerIcon(shape) {
    'use strict';
    if (!shape) {
        shape = '/img/marker.png';
    }
    return new google.maps.MarkerImage(shape,
        new google.maps.Size(34, 44),
        new google.maps.Point(0, 0),
        new google.maps.Point(14, 36));
}

function addMarker(animation) {
    'use strict';

    // decaler un marker s'il y a déjà un point à la même position
    var dedans = 0,
        i = 0,
        latLng;
    for (i = markers.length - 1; i >= 0; i -= 1) {
        // console.log(markers[iterator].lat());
        if (markersPos[iterator].lat() === markersPos[i].lat() && markersPos[iterator].lng() === markersPos[i].lng()) {
            // markers[i]['html'] += markers[iterator]['html'];
            dedans += 1;
        }
    }
    if (dedans >= 2) {
        // console.log(dedans+' '+iterator);
        // Il y a au moins deux points ayant la même position, alors on décale un des deux
        latLng = new google.maps.LatLng(markersPos[iterator].lat(), markersPos[iterator].lng() + Math.random() / 4000 + 0.00001);
    } else {
        latLng = markersPos[iterator];
    }

    markersPoints[iterator] = new google.maps.Marker({
        // icon: getMarkerIcon('/img/marker.png'),
        shape: markerShape,
        position: latLng,
        map: map,
        draggable: false,
        animation: animation
    });
    // console.log(markers[iterator]);
    markersPoints[iterator].html = markers[iterator].html;
    markersPoints[iterator].id = markers[iterator].id;
    google.maps.event.addListener(markersPoints[iterator], 'click', onMarkerClick);
    if (markers.length === 1) {
        google.maps.event.trigger(markersPoints[iterator], 'click');
    }
    iterator += 1;
}

function drop() {
    'use strict';
    var i = 0;
    if (markers.length <= 3) {
        for (i = 0; i < markers.length; i += 1) {
            setTimeout(function () {
                addMarker(google.maps.Animation.DROP);
            }, i * 200);
        }
    } else {
        for (i = 0; i < markers.length; i += 1) {
            addMarker(false);
        }
    }
}

function AutoCenter() {
    'use strict';
    var bounds = new google.maps.LatLngBounds(),
        listener;
    jQuery.each(markers, function (index) {
        bounds.extend(markersPos[index]);
    });
    map.fitBounds(bounds);
    listener = google.maps.event.addListener(map, 'idle', function () {
        if (map.getZoom() > 17) {
            map.setZoom(17);
        }
        google.maps.event.removeListener(listener);
    });
}

function openMarkerId(id) {
    'use strict';
    var i = 0,
        latLng;
    // console.log('click : '+id );
    for (i = markers.length - 1; i >= 0; i -= 1) {
        // console.log(markers[i].id );
        if (markers[i].id === id) {
            latLng = new google.maps.LatLng(markersPos[i].lat(), markersPos[i].lng());
            map.panTo(latLng);
            map.setZoom(13);
            google.maps.event.trigger(markersPoints[i], 'click');
        }
    }
    return false;
}
