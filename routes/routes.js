var routes = function($routeProvider) {

    $routeProvider
        .when('/todo', {
            templateUrl: 'routes/todo/todolist.html',
            controller: 'TodoCtrl',
            controllerAs: 'tc'
        })
        .when('/threejs', {
            templateUrl: 'routes/threejs/threejs.html'
        })

        .when('/test', {
            templateUrl: 'routes/test/test.html'
        })

    .otherwise({
        redirectTo: '/',
        templateUrl: 'routes/welcome/welcome.html'
    })

}

angular
.module("MyApp")
.config(routes, ["$routeProvider"])
