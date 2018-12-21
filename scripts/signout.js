var serviceURL = "https://www.dmscorp.ca/pm/services/";
var DEMODB = openDatabase('LOCALDB', '1.0', 'Local Database', 5 * 1024 * 1024);
(function ($) {

    $(document).ready(function() {
        $("#status").fadeOut(); // will first fade out the loading animation
        $("#preloader").delay(400).fadeOut("slow"); // will fade out the white DIV that covers the website.

        var sql_query_person = 'SELECT * FROM visit_log WHERE project="'+localStorage.projectID+'" AND activity=0 AND timestamp > datetime("now", "-1 days") ORDER BY id';
        DEMODB.transaction(function (tx) {
            tx.executeSql(sql_query_person, [], function (tx, results) {
                if(results.rows.length>0){
                    var len = results.rows.length, i;
                    $('div.form-wrapper').html('<table><thead><tr class="label"><th>Name</th><th>Company</th><th>Mobile</th><th>Time</th></tr></thead><tbody></tbody></table>');
                    for (i = 0; i < len; i++){
                        $('div.form-wrapper table tbody').append('<tr><td>'+results.rows.item(i).firstname+' '+results.rows.item(i).lastname+'</td><td>'+results.rows.item(i).company+'</td><td>'+results.rows.item(i).mobile+'</td><td>'+results.rows.item(i).timestamp+'</td></tr>');
                    }
                }else{
                    $('div.form-wrapper').text('No one signed in yet.')
                }
            }, function (t, e) {console.log(e.message);});
        });
        $(document).on('click', 'div.form-wrapper table tbody tr td', function(){
            window.plugins.toast.showLongCenter('Sign me out');
        })
    })
}(jQuery));