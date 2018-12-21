var serviceURL = "https://www.dmscorp.ca/pm/services/";
var DEMODB = openDatabase('LOCALDB', '1.0', 'Local Database', 5 * 1024 * 1024);

(function ($){
    function signLog() {
         var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
         };
         navigator.geolocation.getCurrentPosition(
            function(position){
                $meta = {Latitude: position.coords.latitude, Longitude: position.coords.longitude, Accuracy: position.coords.accuracy, Heading: position.coords.heading, Speed: position.coords.speed, Timestamp: position.timestamp};
                localStorage.GEO = JSON.stringify($meta);
            },
            function(error){
                alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
            },
            options
         );
        //PersonGroup Person - Add Face
        $.ajax({
            url: "https://canadacentral.api.cognitive.microsoft.com/face/v1.0/persongroups/dmscorp/persons/"+localStorage.personId+"/persistedFaces",
            beforeSend: function (xhrObj) {
                xhrObj.setRequestHeader("Content-Type","application/json");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "b62de5e5fb964732b97b43e85e0161ae");
            },
            type: "POST",
            data: "{'url': '"+localStorage.image+"'}"
        })
        .done(function (data) {})
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Failed in Face Add, Details:  Status:: " + jqXHR.status + "  ResponseText:: " + jqXHR.statusText + "");
        })
        .always(function(data){
            DEMODB.transaction(function (transaction){
                if(localStorage.signStatus<1){
                    //If sign in, then signout all previous sign in first
                    transaction.executeSql("UPDATE visit_log SET signout=1 WHERE signout=0 AND firstname=? AND lastname=? AND company=? AND listid=?", [localStorage.fname, localStorage.lname, localStorage.company, localStorage.listid]
                    , function(t, r){
                        //then sign in
                        transaction.executeSql("INSERT INTO visit_log(listid, project, firstname, lastname, company, jobtitle, mobile, activity, img, personId, signout) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [localStorage.listid, localStorage.projectID, localStorage.fname, localStorage.lname, localStorage.company, localStorage.title, localStorage.mobile, localStorage.signStatus, localStorage.image, localStorage.personId, 0], function (t, r) {
                            var newID = r.insertId;
                            if(localStorage.getItem("listid") === null){
                                localStorage.listid = '';
                            }
                            $.post(serviceURL + 'visitLogSync', {'listid': localStorage.listid, 'project':localStorage.projectID, 'fname':localStorage.fname, 'lname':localStorage.lname, 'company':localStorage.company, 'title':localStorage.title, 'mobile':localStorage.mobile, 'activity':localStorage.signStatus, 'img':localStorage.image, 'datetime': $.now(), 'personId':localStorage.personId, 'geo': localStorage.GEO, 'device': localStorage.device}, function(data) {
                                console.log('log synced');
                                DEMODB.transaction(function (tx){
                                    tx.executeSql("UPDATE visit_log SET status_sync=1 WHERE id =?", [newID], function (tx, results) {console.log('updated');}, function (t, e) {console.log(e.message);}); 
                                });
                            }).always(function (data) {
                                localStorage.clear(); 
                                localStorage.signStatus = 0;
                                window.location.replace('index.html');
                            })    
                        }, function (t, e) {console.log(e.message);});    
                    }, function (t, e) {console.log(e.message);});
                }
            });
        });        
    }
    $.holdReady( true );
    DEMODB.transaction(function (tx) {
        tx.executeSql('SELECT * FROM projects WHERE 1 ORDER BY name', [], function (t, results){
            if(results.rows.length>0){
                var len = results.rows.length, i;
                for (i = 0; i < len; i++){
                    $('#list').append('<option value="'+ results.rows.item(i).project_id +'">'+ results.rows.item(i).name +'</option>');
                }
            }
            if(localStorage.getItem("personId") === null || localStorage.personId=='' || localStorage.personId=='null'){
                //PersonGroup Person - Create
                $.ajax({
                    url: "https://canadacentral.api.cognitive.microsoft.com/face/v1.0/persongroups/dmscorp/persons",
                    beforeSend: function (xhrObj) {
                        xhrObj.setRequestHeader("Content-Type","application/json");
                        xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "b62de5e5fb964732b97b43e85e0161ae");
                    },
                    type: "POST",
                    data: "{'name': '"+localStorage.fname+' '+localStorage.lname+"', 'userData': '"+localStorage.listid+"'}"
                })
                .done(function (data){
                    localStorage.personId = data.personId;
                    $meta = {fname: localStorage.fname, lname: localStorage.lname, title: localStorage.title, mobile: localStorage.mobile, company: 'DMS', personId: localStorage.personId};
                    DEMODB.transaction(function (transaction) {
                        transaction.executeSql("UPDATE config SET meta =?", [JSON.stringify($meta)] , function (t, r) {
                            $.holdReady( false );
                        }, function (t, e) {alert(e.message);}); 
                    })   
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log("Failed in Person - Create, Details:  Status:: " + jqXHR.status + "  ResponseText:: " + jqXHR.statusText + "");
                })
            }else{
                $.holdReady( false );
            }
        }, function (t, e) {console.log(e.message);});
    });

    $(document).ready(function() { 
        $("#status").fadeOut(); // will first fade out the loading animation
        $("#preloader").delay(400).fadeOut("slow"); // will fade out the white DIV that covers the website.
                
        $(document).on('click', 'a.ui-icon-home', function(e){
            e.preventDefault();
            window.location.replace('index.html');
        })
        
        $('.ui-footer a.ui-btn').click(function(e){
            e.preventDefault();
            if($('#list').val()!=''){
                localStorage.projectID = $('#list').val();
                $(this).text('Signing In ...').addClass('ui-state-disabled');
                //window.plugins.toast.showLongCenter('Thank you for signing in, please remember to sign out when you leave the site.');
                signLog();
            }else{
                window.plugins.toast.showLongCenter('Please fill out your information.');
            }
        })
    })
}(jQuery));