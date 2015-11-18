var BoardObject = require('./board_object'),
    helper = require("./../helper");

/**
 * A basic line object
 */
function TextObject(id, x, y, text) {
    // Trying to use parasitic inheritance by crockford
    var that = new BoardObject();
    that.id = id;
    that.text = "";
    that.x = x; // world x
    that.y = y; // world y

    that.translate = function translate(x, y) {
        that.offsetX += x;
        that.offsetY += y;
    };

    that.render = function render(ctx) {
        ctx.translate(that.offsetX, that.offsetY);
        ctx.fillText(that.text, that.x, that.y);
        if (that.selected) {
            that.drawBorder(ctx);
        }
        ctx.translate(-that.offsetX, -that.offsetY);
    };

    that.drawBorder = function (ctx) {
        helper.drawPolygon([that.minx, that.maxx, that.maxx, that.minx],
            [that.miny, that.miny, that.maxy, that.maxy], ctx);
    };

    that.finalize = function finalize() {
        that.minx = that.x - 3;
        that.miny = that.y - 12;
        that.maxx = that.minx + 8 * that.text.length;
        that.maxy = that.y + 3;
    };

    that.serialize = function serialize() {
        return {
            id: that.id,
            x: that.x,
            y: that.y,
            offsetX: that.offsetX,
            offsetY: that.offsetY
        }
    };
    that.constructor = TextObject;
    return that;
}

TextObject.deserialize = function (that) {
    var temp = new TextObject(that.id);
    temp.id = that.id;
    temp.x = that.x;
    temp.y = that.y;
    temp.offsetX = that.offsetX;
    temp.offsetY = that.offsetY;
    return temp;
};

module.exports = TextObject;