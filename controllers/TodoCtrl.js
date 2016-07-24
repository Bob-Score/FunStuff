//  run python -m SimpleHTTPServer 8000
//
//
var TodoCtrl = function($scope, $http) {

    var tc = this;

    tc.JsonData = [];
    tc.idNumbers = 0;
    tc.newItem = {
        "id": tc.idNumbers,
        "name": "",
        "comment": "",
        "done": false,
        "removed": false
    };


    var JsonSuccess = function(response) {
            tc.JsonData = response.data;
        },
        JsonError = function(response) {
            alert("something wrong with Json Data load");
        };

    $http.get('data/jsonData.json').then(
        JsonSuccess,
        JsonError
    );

    tc.addItem = function() {

        tc.idNumbers++; // update id number
        tc.JsonData.push(tc.newItem) // push changes to json

        //clear new item for further use
        tc.newItem = {
            "id": tc.idNumbers,
            "name": "",
            "comment": "",
            "done": false,
            "removed": false
        };

    }

    tc.removeItem = function(selectedObj) {

        selectedObj.removed = true;

    }


    tc.doneItem = function(selectedObj) {

        selectedObj.done = selectedObj.done ? false : true;

    }

};

MyApp.controller("TodoCtrl", ["$scope", "$http", TodoCtrl])
