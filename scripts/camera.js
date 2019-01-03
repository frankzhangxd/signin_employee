var serviceURL = "https://www.dmscorp.ca/pm/services/";
var DEMODB = openDatabase('LOCALDB', '1.0', 'Local Database', 5 * 1024 * 1024);

(function ($) {
    $(document).ready(function() { 
        document.addEventListener('deviceready', function () {
              console.log('device ready');
              console.log(typeof navigator.camera)  // returns undefined
              console.log(typeof CameraPreview)  // returns 'function'
              CameraPreview.startCamera({ x: 0, y: 0, width: screen.width, height: screen.height, toBack: true, previewDrag: false, tapPhoto: false, disableExifHeaderStripping: true, storeToFile: true }) // camera is displayed. remember to set the background to transparent for the html and body tags
             // some more code
        }, false)
        var sec = 5;
        var timer = setInterval(function() { 
        $('#secs').text(sec--);
            if (sec == 0) {
                  
                  CameraPreview.takePicture({width:600, height:800, quality: 85}, function(myBase64){
                    var contentType = "image/jpeg";
                    // The path where the file will be saved
                    var folderpath = cordova.file.externalDataDirectory;
                    // The name of your file
                    var filename = $.now()+".jpeg";
                    savebase64AsImageFile(folderpath,filename,myBase64,contentType);
                  });
                  
                  //test();
                  clearInterval(timer);
            } 
        }, 1000);
        /**
         * Convert a base64 string in a Blob according to the data and contentType.
         * 
         * @param b64Data {String} Pure base64 string without contentType
         * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
         * @param sliceSize {Int} SliceSize to process the byteCharacters
         * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
         * @return Blob
         */
        function b64toBlob(b64Data, contentType, sliceSize) {
                contentType = contentType || '';
                sliceSize = sliceSize || 512;
                var byteCharacters = atob(b64Data);
                var byteArrays = [];
                for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    var slice = byteCharacters.slice(offset, offset + sliceSize);
                    var byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
              var blob = new Blob(byteArrays, {type: contentType});
              return blob;
        }
        
        /*** for test ***/
        function test(){
            // Convert the base64 string in a Blob
            $('.countdown-wrapper h4 span').remove();
            $('.countdown-wrapper h4').html('Waiting for verify...');
            localStorage.signStatus = 0;
            switch(localStorage.company){
                case 'DMS':
                    $page = "page-project-signin.html";
                    localStorage.signType = 0;
                    break;
                case 'SIGNOUT':
                    $page = "page-project-signout.html";
                    localStorage.company = 'DMS';
                    localStorage.signType = -1;
                    localStorage.signStatus = 1;
                    break;
            }
            var fd = new FormData();
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://www.dmscorp.ca/pm/services/upload', true);
            xhr.onload = function (oEvent) {
                if (this.status == 200) {
                    localStorage.image = "http://dmscorp.ca/upload_documents/temp/20181109164228.jpg";
                    $.ajax({
                        url: "https://canadacentral.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true",
                        beforeSend: function (xhrObj) {
                            xhrObj.setRequestHeader("Content-Type","application/json");
                            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "b62de5e5fb964732b97b43e85e0161ae");
                        },
                        type: "POST",
                        data: "{'url': '"+localStorage.image+"'}"
                    })
                    .done(function (data) {
                        if(data.length>0){
                            localStorage.faceID = data[0].faceId;
                            window.location.replace($page);
                        }else{
                            function alertDismissed() {
                                $.post(serviceURL + 'fileDelete', {'file': localStorage.image}, function(data) {})
                                //window.location.replace('page-camera.html');
                                window.location.reload(true);
                            }
                            navigator.notification.alert("Failed in Face Detect, Please make sure your face is in the box.", alertDismissed, "Warning", 'Take Again');
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        console.log("Failed in Face Detect, Details:  Status:: " + jqXHR.status + "  ResponseText:: " + jqXHR.statusText + "");
                        window.location.replace($page);
                    })
                    .always(function(){
                        CameraPreview.stopCamera();
                    });
                };
            }
            xhr.send(fd);
        }
        /**
         * Create a Image file according to its database64 content only.
         * 
         * @param folderpath {String} The folder where the file will be created
         * @param filename {String} The name of the file that will be created
         * @param content {Base64 String} Important : The content can't contain the following string (data:image/png[or any other format];base64,). Only the base64 string is expected.
         */
        function savebase64AsImageFile(folderpath,filename,content,contentType){
            // Convert the base64 string in a Blob
            $('.countdown-wrapper h4 span').remove();
            $('.countdown-wrapper h4').html('Waiting for verify...');
            var DataBlob = b64toBlob(content,contentType);
            localStorage.signStatus = 0;
            switch(localStorage.company){
                case 'DMS':
                    $page = "page-project-signin.html";
                    localStorage.signType = 0;
                    break;
                case 'SIGNOUT':
                    $page = "page-project-signout.html";
                    localStorage.company = 'DMS';
                    localStorage.signType = -1;
                    localStorage.signStatus = 1;
                    break;
            }
            var fd = new FormData();
            fd.append("file", DataBlob);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://www.dmscorp.ca/pm/services/upload?plat='+device.platform, true);
            xhr.onload = function (oEvent) {
                if (this.status == 200) {
                    var resp = JSON.parse(this.response);
                    localStorage.image = resp.url;
                    $.ajax({
                        url: "https://canadacentral.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true",
                        beforeSend: function (xhrObj) {
                            xhrObj.setRequestHeader("Content-Type","application/json");
                            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "b62de5e5fb964732b97b43e85e0161ae");
                        },
                        type: "POST",
                        data: "{'url': '"+resp.url+"'}"
                    })
                    .done(function (data) {
                        if(data.length>0){
                            localStorage.faceID = data[0].faceId;
                            window.location.replace($page);
                        }else{
                            function alertDismissed() {
                                $.post(serviceURL + 'fileDelete', {'file': resp.url}, function(data) {})
                                //window.location.replace('page-camera.html');
                                window.location.reload(true);
                            }
                            navigator.notification.alert("Failed in Face Detect, Please make sure your face is in the box.", alertDismissed, "Warning", 'Take Again');
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        console.log("Failed in Face Detect, Details:  Status:: " + jqXHR.status + "  ResponseText:: " + jqXHR.statusText + "");
                        window.location.replace($page)
                    })
                    .always(function(){
                        CameraPreview.stopCamera();
                    });
                };
            }
            xhr.send(fd);
        }
        
        $('a.ui-icon-home').click(function(e){
            e.preventDefault();
            $home = "index-user.html";
            window.location.replace($home);
        })
    })
}(jQuery));