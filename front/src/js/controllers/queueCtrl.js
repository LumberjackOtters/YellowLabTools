var queueCtrl = angular.module('queueCtrl', ['runsFactory']);

queueCtrl.controller('QueueCtrl', ['$scope', '$routeParams', '$location', 'Runs', function($scope, $routeParams, $location, Runs) {
    $scope.runId = $routeParams.runId;

    var numberOfTries = 0;
    
    function getRunStatus () {
        Runs.get({runId: $scope.runId}, function(data) {
            $scope.status = data.status;
            if (data.status.statusCode === 'running' || data.status.statusCode === 'awaiting') {
                numberOfTries ++;

                // Retrying in 2 seconds (and increasing the delay a bit more each time)
                setTimeout(getRunStatus, 2000 + (numberOfTries * 100));

            } else if (data.status.statusCode === 'complete') {
                $location.path('/result/' + $scope.runId);
            } else {
                // Handled by the view
            }
        });
    }
    
    getRunStatus();
}]);

    