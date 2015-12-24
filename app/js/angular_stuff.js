var infBoard = angular.module("infBoard", ["ui.bootstrap", "colorpicker.module"]);
var helper = require('./helper.js');
var client = require("./client.js");

infBoard.controller('MainCtrl', ['$scope', "CanvasClient", function ($scope, CanvasClient) {
    CanvasClient.scope = $scope;

    CanvasClient.socket.on("magic-received", function(data){
        console.log("magic-recieved", data)
    })

    $scope.magic = function() {
        CanvasClient.socket.emit("magic", "blah")
        console.log(CanvasClient.socket)
    }

    $scope.forceUpdate = function() {
        $scope.$apply(function(){
            $scope.objectStack = CanvasClient.objectStore;
            $scope.readOnlyStack = CanvasClient.readOnlyObjectStore;
        })
    }

    $scope.objectStack = CanvasClient.objectStore;
    $scope.readOnlyStack = CanvasClient.readOnlyObjectStore;

    $(CanvasClient.canvas)
        .mouseup(function () {
            $scope.$apply($scope.objectStack = CanvasClient.objectStore)
        });
    $scope.removeObj = function removeObj(obj) {
        delete $scope.objectStack[obj.id]
        CanvasClient.update()
    };
    $scope.toggleSelectObj = function toggleSelectObj(obj) {
        $scope.changeMode(client.modes.MOVE)
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
                $('#MyHiddenText').val("");
                CanvasClient.addTextObject($('#MyHiddenText').val()); // creates a new text object
                $('#MyHiddenText').focus().keyup(function () {
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

}]);

infBoard.provider("CanvasClient", function () {
    this.client = null;
    this.$get = function () {
        return this.client;
    };
});

// Configure our client object
infBoard.config(function (CanvasClientProvider) {
    $(document).ready(function () {
        $("#infBoard").each(function () {
            var canvasEle = helper.createCanvas(9, 'localCanvas');
            var tempCanvasEle = helper.createCanvas(8, 'tempCanvas');
            var readOnlyCanvasEle = helper.createCanvas(7, 'readOnlyCanvas');
            $(this).append(canvasEle).append(tempCanvasEle).append(readOnlyCanvasEle);
            CanvasClientProvider.client = new client(canvasEle[0], tempCanvasEle[0], readOnlyCanvasEle[0]);
            CanvasClientProvider.client.init();

            // Add hock for image readerclipboard.js
            $("html").pasteImageReader(function (results) {
                CanvasClientProvider.client.addImageObject(results.dataURL);
            });
        });
    });
});

module.exports = infBoard;