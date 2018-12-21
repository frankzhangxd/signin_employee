var serviceURL = "https://www.dmscorp.ca/pm/services/";
var DEMODB = openDatabase('LOCALDB', '1.0', 'Local Database', 5 * 1024 * 1024);

(function ($) {
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
                console.log('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
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
        .then(function( data, textStatus, response ){
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
                            }).done(function (data) {
                                if(localStorage.company!='DMS'){
                                    localStorage.clear(); 
                                    window.location.replace("index.html");
                                }else{
                                    localStorage.clear(); 
                                    $('a.btn').removeClass('disabled');
                                }
                            })    
                        }, function (t, e) {console.log(e.message);});    
                    }, function (t, e) {console.log(e.message);});
                     
                }else{
                    //IF signout
                    transaction.executeSql("SELECT * FROM visit_log WHERE signout=0 AND project=? AND firstname=? AND lastname=? AND company=? AND listid=?", [localStorage.projectID, localStorage.fname, localStorage.lname, localStorage.company, localStorage.listid] , function (t, results) {
                        if(results.rows.length>0){
                            $sql_update = "UPDATE visit_log SET signout = 1, signout_time=? WHERE id = (SELECT MAX(id) FROM visit_log WHERE signout=0 AND project=? AND firstname=? AND lastname=? AND company=? AND listid=?)";
               	                transaction.executeSql($sql_update, [$.now(), localStorage.projectID, localStorage.fname, localStorage.lname, localStorage.company, localStorage.listid], function(t, r){
               	                    $.post(serviceURL + 'visitLogSync', {'listid': localStorage.listid, 'project':localStorage.projectID, 'fname':localStorage.fname, 'lname':localStorage.lname, 'company':localStorage.company, 'title':localStorage.title, 'mobile':localStorage.mobile, 'activity':localStorage.signStatus, 'img':localStorage.image, 'datetime': $.now(), 'personId':localStorage.personId, 'geo': localStorage.GEO, 'device': localStorage.device}, function(data) {
                                        DEMODB.transaction(function (tx){
                                            tx.executeSql("UPDATE visit_log SET status_sync=1 WHERE id =?", [newID], function (tx, results) {console.log('updated');}, function (t, e) {console.log(e.message);}); 
                                        });
                                    }).done(function (data) {
                                        localStorage.clear(); 
                                        window.location.replace("index.html");}
                                    )
               	                }, function (t, e) {console.log(e.message);});
               	            }else{
               	                transaction.executeSql("INSERT INTO visit_log(listid, project, firstname, lastname, company, jobtitle, mobile, activity, img, personId, signout, signout_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [localStorage.listid, localStorage.projectID, localStorage.fname, localStorage.lname, localStorage.company, localStorage.title, localStorage.mobile, 0, localStorage.image, localStorage.personId, 1, $.now()], function (t, r) {
                                    var newID = r.insertId;
                                    if(localStorage.getItem("listid") === null){
                                        localStorage.listid = '';
                                    }
                                    $.post(serviceURL + 'visitLogSync', {'listid': localStorage.listid, 'project':localStorage.projectID, 'fname':localStorage.fname, 'lname':localStorage.lname, 'company':localStorage.company, 'title':localStorage.title, 'mobile':localStorage.mobile, 'activity':localStorage.signStatus, 'img':localStorage.image, 'datetime': $.now(), 'personId':localStorage.personId, 'geo': localStorage.GEO, 'device': localStorage.device}, function(data) {
                                        console.log('log synced');
                                        DEMODB.transaction(function (tx){
                                            tx.executeSql("UPDATE visit_log SET status_sync=1 WHERE id =?", [newID], function (tx, results) {console.log('updated');}, function (t, e) {console.log(e.message);}); 
                                        });
                                    }).done(function (data) {
                                        localStorage.clear(); 
                                        window.location.replace("index.html");}
                                    )    
                                }, function (t, e) {console.log(e.message);});
               	            }
                        }, function (t, e) {console.log(e.message);
                    });
                }
            });
        });        
    }
    
    if(localStorage.signStatus==1){
        $('h1').text('Signed Out!');
        if(localStorage.listid!='-1'){
            $('h4').text('Thank you for signing out, please remember to sign in whenever entring site.');    
        }else{
            $('h4').text('Thank you for visiting DMS.');  
        }
        
        $("#status").fadeOut(); // will first fade out the loading animation
        $("#preloader").delay(400).fadeOut("slow"); // will fade out the white DIV that covers the website.
    }
    $(document).ready(function(){
        if(localStorage.getItem("faceID") !== null){
            $.ajax({
                url: "https://canadacentral.api.cognitive.microsoft.com/face/v1.0/identify",
                beforeSend: function (xhrObj) {
                    xhrObj.setRequestHeader("Content-Type","application/json");
                    xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "b62de5e5fb964732b97b43e85e0161ae");
                },
                type: "POST",
                data: "{'personGroupId': 'dmscorp','faceIds': ['"+localStorage.faceID+"'],'maxNumOfCandidatesReturned': 1,'confidenceThreshold': 0.6}"
            })
            .done(function (data) {
                if(data[0].candidates.length>0){
                    localStorage.personId = data[0].candidates[0].personId;
                }
            })
            .complete(function(data){
                if(localStorage.personId==''){
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
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        console.log("Failed in Person - Create, Details:  Status:: " + jqXHR.status + "  ResponseText:: " + jqXHR.statusText + "");
                    })
                    .then( function( data, textStatus, response ) {
                        signLog();
                    });
                }else{
                    if(localStorage.signStatus==1){
                        $('h1').text('Signed Out!');
                        
                        var sql_query_person = "SELECT * FROM visit_log WHERE personId='"+localStorage.personId+"' AND activity=1 AND signout=0 AND project='"+localStorage.projectID+"' AND cast((strftime('%s',datetime('now','localtime'))-strftime('%s',timestamp)) AS real)/60/60<15 ORDER BY id DESC LIMIT 1";
                        DEMODB.transaction(function (tx) {
                            tx.executeSql(sql_query_person, [], function (tx, results) {
                                if(results.rows.length>0){
                                    localStorage.fname = results.rows.item(0).firstname
                                    localStorage.lname = results.rows.item(0).lastname;
                                    localStorage.mobile = results.rows.item(0).mobile;
                                    localStorage.title = results.rows.item(0).jobtitle;
                                    localStorage.company = results.rows.item(0).company; 
                                    localStorage.listid = results.rows.item(0).listid; 
                                    setTimeout(function() {
                                        signLog();    
                                    }, 2000);
                                }else{
                                    alert('Have you signed in? We can not find you.');
                                    window.location.replace('page-signout.html');
                                }
                            }, function (t, e) {console.log(sql_query_person+e.message);});
                        });
                    }else{ 
                        setTimeout(function() {
                            signLog();    
                        }, 2000);
                    }
                }
            })
        }
    })
}(jQuery));