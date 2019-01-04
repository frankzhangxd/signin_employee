var serviceURL = "https://www.dmscorp.ca/pm/services/";
var DEMODB = openDatabase('LOCALDB', '1.0', 'Local Database', 5 * 1024 * 1024);
(function ($){
    var status = 1;
    if (localStorage.getItem("signStatus") === null) {var status = localStorage.signStatus;}
    localStorage.clear(); 
    localStorage.signStatus = status; 
    
    console.log('Synchronize...');
    $.holdReady( true );
    synchronize();    
        
    function synchronize(){
        initDatabase();
        //employee
        $.getJSON(serviceURL + 'getData', {table:"projects"}, function(data){
            eps = data.items;
            DEMODB.transaction(
                function (transaction) {
                    transaction.executeSql("DELETE FROM projects WHERE 1", [] , function (t, r) {
                        $.each(eps, function(index, user) {
                            transaction.executeSql("REPLACE INTO projects(project_id, name, shortname, cat, project_scope) VALUES (?, ?, ?, ?, ?)", [user.project_id, user.name, user.shortname, user.cat, user.project_scope], 
                                function(tx, res) {},
                                function (tx, error) {return true;}
                            );
           	            })
                        console.log('sync projects');
                        //sub_employee
                        //update visitlog
                        transaction.executeSql('SELECT * FROM config WHERE 1 LIMIT 1', [], function (tx, results){
                            if(results.rows.length>0){
                                $.getJSON(serviceURL + 'getVisitLogByUser', {user: results.rows.item(0).uID}, function(data){
                              		logs = data.items;
                                    DEMODB.transaction(
                                    function (transaction) {
                                        transaction.executeSql("DELETE FROM visit_log WHERE status_sync=1", [] , function (t, r) {
                                            console.log('Update Log');
                               	            $.each(logs, function(index, user) {
                                                transaction.executeSql("INSERT INTO visit_log(listid, project, firstname, lastname, company, jobtitle, mobile, activity, img, personId, timestamp, signout, signout_time, status_sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [user.listid, user.project, user.firstname, user.lastname, user.company, user.jobtitle, user.mobile, user.activity, user.img, user.personId, user.datetime, user.signout, user.signout_time, 1], function (t, r) {}, function (t, e) {console.log(e.message);});
                               	            }) 
                                            $.holdReady( false );                       
                                        }, function (t, e) {console.log(e.message);}); 
                               	    });
                               	});
                            }else{
                                window.location.replace("page-config-user.html");
                            }
                        }, function (t, e) {console.log(e.message);})
                    }, function (t, e) {console.log(e.message);}); 
           	    });
       	})
        .fail(function(){
            $.holdReady( false );   
        })
    }
    function initDatabase() {
        try {
            createTables();
        } catch(e) {
            if (e == 2) {
                // Version number mismatch.
                console.log("Invalid database version.");
            } else {
                console.log("Unknown error "+e+".");
            }
            return;
        }
    }
    function createTables(){
        DEMODB.transaction(
            function (transaction) {
                transaction.executeSql('CREATE TABLE IF NOT EXISTS config (uID TEXT NOT NULL, type INTEGER, meta TEXT);');
                //activity: 0 sign-in; 1 sign-out
                //transaction.executeSql('DROP TABLE IF EXISTS visit_log', [] , function (t, r) {console.log("Dropped");}, function (t, e) {console.log(e.message);});
                transaction.executeSql('CREATE TABLE IF NOT EXISTS visit_log (id INTEGER NOT NULL PRIMARY KEY, listid TEXT, project INTEGER, firstname TEXT NOT NULL, lastname TEXT NOT NULL, company TEXT, jobtitle TEXT, mobile TEXT, activity INTEGER, img TEXT, personId TEXT, timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, signout INTEGER DEFAULT 0, signout_time TEXT, status_sync INTEGER);');
                transaction.executeSql('CREATE TABLE IF NOT EXISTS projects (project_id INTEGER NOT NULL PRIMARY KEY, name TEXT NOT NULL, shortname TEXT NOT NULL, cat INTEGER, project_scope INTEGER);');
                
            }
        );
    }
    
    $(document).ready(function() {
   	    $("#status").fadeOut(); // will first fade out the loading animation
        $("#preloader").delay(400).fadeOut("slow"); // will fade out the white DIV that covers the website.
        
        DEMODB.transaction(function (tx) {
            tx.executeSql('SELECT * FROM config WHERE 1 LIMIT 1', [], function (tx, results) {
                if(results.rows.length>0){
                    //if configured
                    $meta = JSON.parse(results.rows.item(0).meta);
                    localStorage.device = 'USER';
                    localStorage.listid = results.rows.item(0).uID;
                    localStorage.company = 'DMS';
                    localStorage.fname = $meta.fname;
                    localStorage.lname = $meta.lname;
                    localStorage.title = $meta.title;
                    localStorage.mobile = $meta.mobile;
                    localStorage.personId = $meta.personId;
                    window.location.replace('index-user.html');
                }else{
                    window.location.replace("page-config-user.html");
                }
            }, function (t, e) {console.log(e.message);});
        });  
    })
}(jQuery));