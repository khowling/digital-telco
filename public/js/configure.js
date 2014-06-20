/**
 * Created by keith on 19/06/2014.
 */
var configureCtrl =  function ($sce, $http, $routeParams,  $resource, $scope, $rootScope, $location) {

    angular.element(document).ready(function () {
        jQuery(".ng-view").foundation();
    });

    $http.get('/proxy/query/?q=' + "select id, name, ThumbImage69Id__c,  Description__c from product__c where id = '" + $routeParams.id + "'")
        .success(function (data) {

            $scope.product = data.records[0];
            $scope.getRichDescroption =  function() {
                return $sce.trustAsHtml($scope.product.Description__c);
            };
            $http.get('/proxy/chatter/files/' + $scope.product.ThumbImage69Id__c)
                .success(function (cdata) {

                        $scope.product.imgsrc = 'https://eu2.salesforce.com' + cdata.downloadUrl;

            });

        });

    $scope.toggleAccordion = function(val) {
        if ($scope.accordion[val] == true) {
            $scope.accordion[val] = false;
            $("#panelContent" + val).slideToggle("slow");

        } else {
            $scope.accordion[val] = true;
            $("#panelContent" + val).slideToggle("slow");
            for (var i in $scope.accordion) {
                if (i !== val) {
                    if ($scope.accordion[i] == true) {
                        $("#panelContent" + i).slideToggle("slow");
                        $scope.accordion[i] = false;
                    }
                }
            }
        }
    }

    $scope.configJson = [
        {   name: 'Memory',
            imgsrc: 'http://www.hantsfire.gov.uk/computer-chip-2.jpg',
            desc: 'How much memory?',
            values: [
                {name: '64Mb' },
                {name: '128Mb'}
                ]
        },
        {   name: 'Tarrif',
            imgsrc: 'http://files.softicons.com/download/application-icons/qetto-icons-2-by-ampeross/png/256x256/sim%20card.png',
            desc: 'How much memory?',
            values: [
                {name: '4G Unlimited', data: '400Gb', type: '4G' },
                {name: '300 Unlimited', data: '400Gb', type: '3G' },
                {name: '500 Unlimited',  data: '400Gb', type: '3G'}
            ]
        }
        ];
    $scope.productConfig = {};
}
