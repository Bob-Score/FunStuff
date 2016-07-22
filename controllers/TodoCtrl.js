
//  run python -m SimpleHTTPServer 8000
//
//
var TodoCtrl = function($scope, $http) {

    var tc = this;

    tc.JsonData = [];

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

    tc.addItem = function (){

      var newItem ={
      "id" :  1,
      "name" :  "",
      "comment": "",
      "done": false
    };

      newItem.name = 'bob';
      newItem.comment = 'test';

      tc.JsonData.push(newItem);

    }

    tc.doneItem = function (selectedObj){

      console.log('selectedObj',selectedObj);
      selectedObj.done = true;
console.log('selectedObj',selectedObj);


    }


};

MyTodoApp.controller("TodoCtrl", ["$scope", "$http", TodoCtrl])
