var config = require('../config')

function Helper(config) {
    // Returns a jquery canvas object
    this.createCanvas = function createCanvas(z) {
        if (z === undefined) z = 0;
        return $('<canvas class="myCanvas" width="' + config.canvasWidth +
            '" height="' + config.canvasHeight + '">' +
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
            console.log(arrX[i], arrY[i]);
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
    ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
};

module.exports = new Helper(config);