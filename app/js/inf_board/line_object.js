var BoardObject = require('./board_object'),
    helper = require("./../helper");

/**
 * A basic line object
 */
function LineObject(id, style, width) {
    // Trying to use parasitic inheritance by crockford
    var that = new BoardObject();
    that.storeX = [];
    that.storeY = [];
    that.id = id;
    that.selected = false;
    that.offsetX = 0;
    that.offsetY = 0;
    that.strokeStyle = style;
    that.lineWidth = width;

    that.addData = function addData(x, y) {
        that.storeX.push(x);
        that.storeY.push(y);
    };


    that.render = function render(ctx) {
        // Save ctx brush stuff
        // TODO(DAN): Do this one another context! So we don't have to save old stuff
        var oldStyle = ctx.strokeStyle;
        var oldWidth = ctx.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth;

        ctx.translate(that.offsetX, that.offsetY);
        var startX = that.storeX[0],
            startY = that.storeY[0];
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        that.storeX.forEach(function (_, i) {
            ctx.lineTo(that.storeX[i], that.storeY[i]);
            ctx.stroke();
            startX = that.storeX[i];
            startY = that.storeY[i];
        });
        if (that.selected) {
            that.drawBorder(ctx);
        }
        ctx.translate(-that.offsetX, -that.offsetY);
        ctx.strokeStyle = oldStyle;
        ctx.lineWidth = oldWidth;
    };

    that.drawBorder = function (ctx) {
        helper.drawPolygon([that.minx, that.maxx, that.maxx, that.minx],
            [that.miny, that.miny, that.maxy, that.maxy], ctx);
    };

    that.finalize = function finalize() {
        that.minx = that.storeX.reduce(function (a, b) {
            return Math.min(a, b)
        });
        that.miny = that.storeY.reduce(function (a, b) {
            return Math.min(a, b)
        });
        that.maxx = that.storeX.reduce(function (a, b) {
            return Math.max(a, b)
        });
        that.maxy = that.storeY.reduce(function (a, b) {
            return Math.max(a, b)
        })
    };

    // TODO: Optimise wire transmission
    that.serialize = function serialize() {
        return {
            id: that.id,
            storeY: that.storeY,
            storeX: that.storeX,
            offsetX: that.offsetX,
            offsetY: that.offsetY
        }
    };

    that.constructor = LineObject;
    return that;
}

LineObject.newFromData = function(that) {
    var temp = new LineObject(that.id, that.style, that.width);
    temp.id = that.id;
    temp.storeY = that.storeY;
    temp.storeX = that.storeX;
    temp.offsetX = that.offsetX;
    temp.offsetY = that.offsetY;
    temp.strokeStyle = that.strokeStyle;
    temp.lineWidth = that.lineWidth;
    return temp;
};

module.exports = LineObject;