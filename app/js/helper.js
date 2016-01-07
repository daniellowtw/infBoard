var config = require('../config')

function Helper(config) {
    // Returns a jquery canvas object
    this.createCanvas = function createCanvas(z, name) {
        if (z === undefined) z = 0;
        return $('<canvas class="myCanvas"' + ' id="' + name + '">' +
            'Your browser does not support canvas :(' +
            '</canvas>').css("z-index", z);
    };

    // Draws the given polygon in the context
    this.drawPolygon = function drawPolygon(arrX, arrY, ctx) {
        var startX = arrX[arrX.length - 1],
            startY = arrY[arrY.length - 1];
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        arrX.forEach(function (_, i) {
            ctx.lineTo(arrX[i], arrY[i]);
            ctx.stroke();
            startX = arrX[i];
            startY = arrY[i];
        });
    }
}

// Our custom stack of one change
Helper.prototype.saveContextStyle = function (ctx) {
    this.style = ctx.strokeStyle;
    this.lineWidth = ctx.lineWidth;
};

Helper.prototype.restoreContextStyle = function (ctx) {
    ctx.strokeStyle = this.style;
    ctx.lineWidth = this.lineWidth;
};

Helper.prototype.cleanContext = function(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

// Assume spread argument of canvases
Helper.prototype.resizeCanvasBasedOnWindow = function() {
    $(".myCanvas").css("width", "100vw").css("height", "100vh");
    for (var i = 0; i<arguments.length; i++){
        var canvas = arguments[i];
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;
    }
};

Helper.prototype.resizeCanvasBasedOnConfig = function() {
    $(".myCanvas").css("width", config.canvasWidth).css("height", config.canvasHeight);
    for (var i = 0; i<arguments.length; i++){
        var canvas = arguments[i];
        canvas.height = config.canvasHeight;
        canvas.width = config.canvasWidth;
    }

};

module.exports = new Helper(config);