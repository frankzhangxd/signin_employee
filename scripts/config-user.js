var serviceURL = "https://www.dmscorp.ca/pm/services/";
var DEMODB = openDatabase('LOCALDB', '1.0', 'Local Database', 5 * 1024 * 1024);

// PhoneGap is loaded and it is now safe to make calls PhoneGap methods
/*
function onDeviceReady() {
    navigator.network.isReachable("google.com", reachableCallback, {});
}
*/
(function ($) {
    //employee
    $.getJSON(serviceURL + 'getData', {table:"employee"}, function(data) {
        eps = data.items;
        $.each(eps, function(index, user) {
            $('#list').append('<option value="'+ user.listid +'" data-personid="'+ user.personId +'" data-title="'+ user.jobtitle +'" data-mobile="'+ user.mobile +'" data-fname="'+ user.firstname +'" data-lname="' + user.lastname  +'">'+ user.firstname +' ' + user.lastname  +'</option>');
        })
        $("#status").fadeOut(); // will first fade out the loading animation
        $("#preloader").delay(400).fadeOut("slow"); // will fade out the white DIV that covers the website.
   	}).fail(function() {
        alert("There is a connection problem while loading data, please check if wifi or cellular data is turned on in the setting");
        window.location.replace("index.html");
    });
    
    $(document).ready(function() { 
        $(document).on('change', '#list', function(){
            $('#fname').val($(this).find('option:selected').data('fname'));
            $('#lname').val($(this).find('option:selected').data('lname'));
            $('#mobile').val($(this).find('option:selected').data('mobile'));
            $('#jobtitle').val($(this).find('option:selected').data('title'));
            $('#personid').val($(this).find('option:selected').data('personid'));
        });
        $(document).on('click', 'a.ui-icon-home', function(e){
            e.preventDefault();
            window.location.replace('index.html');
        })
        $('.ui-footer a.ui-btn').click(function(){
            if($('#fname').val()!='' && $('#lname').val()!=''){
                DEMODB.transaction(
                    function (transaction) {
                        transaction.executeSql('DELETE FROM config WHERE 1', [] , function (t, r) {
                            $meta = {fname: $('#fname').val(), lname: $('#lname').val(), title: $('#jobtitle').val(), mobile: $('#mobile').val(), company: 'DMS', personId: $('#personid').val()};
                            transaction.executeSql("INSERT INTO config (uID, type, meta) VALUES (?, ?, ?)", [$('#list').val(), 1, JSON.stringify($meta)] , function (t, r) {
                                window.location.replace("index.html");
                            }, function (t, e) {alert(e.message);});    
                        }, function (t, e) {console.log(e.message);});
                    }
                );
            }else{
                window.plugins.toast.showLongCenter('Please fill out your information.');
            }
        })
    })
}(jQuery));