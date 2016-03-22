// public/js/controllers/AgendaCtrl.js

(function() {
    'use strict';

    angular
        .module('AgendaCtrl', [])
        .controller('AgendaController', AgendaController);

        AgendaController.$inject = ['$scope', '$http', '$routeParams', '$location', 'agendaService', 'FileSaver', 'Blob', 'namedParamService'];

        function AgendaController($scope, $http, $routeParams, $location, agendaService, FileSaver, Blob, namedParamService) {

            $scope.title = "IT production reports";

            $scope.generateReport = function() {
                $scope.isLoading = true;
                agendaService.generate ()
                .success(function(data){
                    agendaService.get('/api/agendareports')
                                .success(function(data2) {
                                    $scope.reports = data2;
                                })
                                .error(function(data2) {
                                    console.log('Error: ' + data2);
                                })
                                .finally(function() {
                                    $scope.isLoading = false;
                                });
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                    $scope.isLoading = false;
                });
            }

            // if requested to download a file
            if ($routeParams.id)
            {
                agendaService.getId($routeParams.id)
                .success(function(data){
                    var blob = new Blob([data], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        });

                    var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                    var filename = "report " + date + ".xlsx";
                    FileSaver.saveAs(blob, filename);
                    $location.path('/reports');
                }).error(function(data) {
                    console.log('Error: ' + data);
                });

            }
            //all reports lists
            else
            {
                // when landing on the page, get all reports and show them
                var data = namedParamService.getByKey('last_leankit_synchro')
                .success(function(data){
                    if (data.length > 0)
                        $scope.lastLeankitDate = data[0].param_value_date
                }).error(function(data) {
                    console.log('Error: ' + data);
                });

                //show progress bar
                $scope.isLoading = true;
                agendaService.get('/api/agendareports')
                    .success(function(data) {
                        $scope.reports = data;
                    })
                    .error(function(data) {
                        console.log('Error: ' + data);
                    })
                    .finally(function() {
                        $scope.isLoading = false;
                    });
            }
        };

})();