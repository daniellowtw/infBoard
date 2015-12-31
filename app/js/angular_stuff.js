var infBoard = angular.module("infBoard", ["ui.bootstrap", "colorpicker.module", "ngRoute"]);
var helper = require('./helper.js');
var client = require("./client.js");

infBoard.controller('MainCtrl', ['$scope', "$document", function ($scope, $document) {

    var CanvasClient;
    $document.ready(function () {
        $("#infBoard").each(function () {
            var canvasEle = helper.createCanvas(9, 'localCanvas');
            var tempCanvasEle = helper.createCanvas(8, 'tempCanvas');
            var readOnlyCanvasEle = helper.createCanvas(7, 'readOnlyCanvas');
            $(this).append(canvasEle).append(tempCanvasEle).append(readOnlyCanvasEle);
            CanvasClient = new client(canvasEle[0], tempCanvasEle[0], readOnlyCanvasEle[0]);
            CanvasClient.init();

            // Add hock for image readerclipboard.js
            $("html").pasteImageReader(function (results) {
                CanvasClient.addImageObject(results.dataURL);
            });
        });

        CanvasClient.scope = $scope;

        CanvasClient.socket.on("magic-received", function (data) {
            console.log("magic-recieved", data)
        });

        $scope.magic = function () {
            CanvasClient.socket.emit("magic", "blah");
            console.log(CanvasClient.objectStore);
        };

        $scope.forceUpdate = function () {
            $scope.$apply(function () {
                $scope.objectStack = CanvasClient.objectStore;
                $scope.readOnlyStack = CanvasClient.readOnlyObjectStore;
            })
        };

        $scope.objectStack = CanvasClient.objectStore;
        $scope.readOnlyStack = CanvasClient.readOnlyObjectStore;

        $(CanvasClient.canvas)
            .mouseup(function () {
                $scope.$apply($scope.objectStack = CanvasClient.objectStore)
            });
        $scope.removeObj = function removeObj(obj) {
            CanvasClient.deleteObject(obj);
        };
        $scope.toggleSelectObj = function toggleSelectObj(obj) {
            $scope.changeMode(client.modes.MOVE);
            obj.toggleSelected();
            if (obj.selected) {
                CanvasClient.addSelected(obj.id);
            } else {
                CanvasClient.removeSelected(obj.id);
            }
            CanvasClient.update()
        };
        $scope.unselectAll = function () {
            CanvasClient.unselectAll()
        };
        $scope.modes = client.modes;
        $scope.strokeStyle = "";
        $scope.strokeWidth = 1;
        $scope.mode = $scope.modes.NONE;

        $scope.changeMode = function changeMode(x) {
            switch (x) {
                case client.modes.NONE:
                    break;
                case client.modes.DRAW:
                    $scope.unselectAll();
                    break;
                case client.modes.MOVE:
                    break;
                case client.modes.PAN:
                    $scope.unselectAll();
                    break;
                case client.modes.CLEAR:
                    CanvasClient.clearBoard();
                    break;
                case client.modes.TEXT:
                    CanvasClient.unselectAll();
                    var ele = $('#MyHiddenText');
                    ele.val("");
                    CanvasClient.addTextObject(ele.val()); // creates a new text object
                    ele.focus().keyup(function () {
                        CanvasClient.addTextObject($(this).val()); // updates the text object
                    });
                    break;
                default:
                    console.log("ERROR!!");
                    break;
            }
            $scope.mode = x;
            CanvasClient.changeMode(x)
        };

        $scope.changeWidth = function changeWidth() {
            CanvasClient.updateWidth($scope.strokeWidth)
        };

        $scope.changeColour = function changeColour() {
            CanvasClient.updateStyle($scope.strokeStyle)
        }
    });

}]);

// Configure our client object
infBoard.config(function ($routeProvider) {
    $routeProvider.when('/:roomId', {
        templateUrl: 'templates/room.html',
        controller: 'MainCtrl'
    })
        .when('/', {
            templateUrl: 'templates/lobby.html',
            controller: 'MainCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
});

module.exports = infBoard;