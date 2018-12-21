var serviceURL = "https://www.dmscorp.ca/pm/services/";
var DEMODB = openDatabase('LOCALDB', '1.0', 'Local Database', 5 * 1024 * 1024);
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        /*
        var callbackFn = function(location) {
            jQuery.post(serviceURL + 'geotrack', {'listid': localStorage.listid, 'lat':location.latitude, 'lng':location.longitude}, function(data) {})
            backgroundGeolocation.finish();
        };
     
        var failureFn = function(error) {
            alert('BackgroundGeolocation error'+error);
        };
     
        backgroundGeolocation.configure(callbackFn, failureFn, {
            desiredAccuracy: 0,
            stationaryRadius: 100,
            distanceFilter: 200,
            debug: false,
            interval: 600000,
            fastestInterval: 600000,
            locationProvider: backgroundGeolocation.provider.RAW_PROVIDER,
            stopOnTerminate: false,
            pauseLocationUpdates: false,
        });
        backgroundGeolocation.start();
        */
        
         
        var BackgroundFetch = window.BackgroundFetch;
        var fetchCallback = function() {
            var options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
             };
             navigator.geolocation.getCurrentPosition(
                function(position){
                    jQuery.post(serviceURL + 'geotrack', {'listid': localStorage.listid, 'lat':position.coords.latitude, 'lng':position.coords.longitude}, function(data) {})
                },
                function(error){
                    console.log('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
                },
                options
             );
            
         
            // Required: Signal completion of your task to native code
            // If you fail to do this, the OS can terminate your app
            // or assign battery-blame for consuming too much background-time
            BackgroundFetch.finish();
         };
         var failureCallback = function(error) {
            console.log('- BackgroundFetch failed '+error);
         };
          
         BackgroundFetch.configure(fetchCallback, failureCallback, {
            minimumFetchInterval: 15, // <-- default is 15
            stopOnTerminate: false,   // <-- Android only
            startOnBoot: true,        // <-- Android only
            forceReload: true         // <-- Android only
         });
         
         if(localStorage.signStatus==1){
            backgroundFetch.stop();
         }
    }
};
(function ($) {
    $(document).ready(function() { 
        app.initialize();
        $.ajax({
            url: "https://canadacentral.api.cognitive.microsoft.com/face/v1.0/persongroups/dmscorp/train",
            beforeSend: function (xhrObj) {
                xhrObj.setRequestHeader("Content-Type","application/json");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "b62de5e5fb964732b97b43e85e0161ae");
            },
            type: "POST",
        })
        .done(function (data) {})
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Failed in PersonGroup - Train, Details:  Status:: " + jqXHR.status + "  ResponseText:: " + jqXHR.statusText + "");
        })
        .always(function(data){
            $("#status").fadeOut(); // will first fade out the loading animation
            $("#preloader").delay(400).fadeOut("slow"); // will fade out the white DIV that covers the website.
        })
        
        $('ul li a').click(function(){
            localStorage.company = $(this).attr('id');
            if($(this).attr('id')=='SIGNOUT'){
                DEMODB.transaction(function (tx) {
                    tx.executeSql("SELECT * FROM visit_log WHERE signout=0 AND listid=? AND cast((strftime('%s',datetime('now','localtime'))-strftime('%s',timestamp)) AS real)/60/60<15 ORDER BY id DESC LIMIT 1", [localStorage.listid], function (tx, results) {
                        if(results.rows.length>0){
                            localStorage.projectID = results.rows.item(0).project;
                            window.location.replace('page-camera.html');
                        }else{
                            window.plugins.toast.showLongCenter('You have not signed in yet, please remember to sign in whenever entering job site.');
                            //alert('You have not signed in yet, please remember to sign in whenever entering job site.');
                        }
                    }, function (t, e) {consile(e.message);});
                });
            }else{
                window.location.replace('page-camera.html');
            } 
        })
    })
}(jQuery));