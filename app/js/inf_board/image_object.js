var BoardObject = require('./board_object');

/**
 * A basic Image object
 */
function ImageObject(id, src, x, y) {
    var that = new BoardObject(id);
    that.xPos = x;
    that.yPos = y;
    that.image = new Image();
    that.image.src = src;
    that.loaded = false;

    that.render = function render(ctx) {
        // Render only if image is loaded
        var draw = function () {
            ctx.translate(that.offsetX, that.offsetY);
            if (that.selected) {
                that.drawBorder(ctx);
            }
            ctx.drawImage(that.image, that.xPos, that.yPos);
            ctx.translate(-that.offsetX, -that.offsetY);
        };
        if (that.loaded) {
            draw();
        } else {
            that.image.onload = function() {
                that.loaded = true;
                draw();
            }
        }
    };

    that.drawBorder = function (ctx) {
        ctx.fillRect(that.xPos - 1, that.yPos - 1, that.image.width + 2, that.image.height + 2);
    };

    that.finalize = function finalize() {

    };

    that.serialize = function serialize() {
        return {
            id: that.id,
            xPos: that.xPos,
            yPos: that.yPos,
            offsetX: that.offsetX,
            offsetY: that.offsetY,
            imageSrc: that.image.src
        }
    };
    that.constructor = ImageObject;
    return that;
}

ImageObject.newFromData = function (data) {
    var obj = new ImageObject(data.id, data.imageSrc);
    obj.xPos = data.xPos;
    obj.yPos = data.yPos;
    // TODO: Set offset
    return obj;
};

module.exports = ImageObject;