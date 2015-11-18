var BoardObject = require('./board_object');

/**
 * A basic Image object
 */
function ImageObject(id) {
    var that = new BoardObject(id);
    that.xPos = 0;
    that.yPos = 0;
    that.imageObj = new Image();

    that.addData = function addData(results, x, y) {
        that.imageObj.src = results.dataURL;
        that.xPos = x;
        that.yPos = y;
    };

    that.render = function render(ctx) {
        ctx.translate(that.offsetX, that.offsetY);
        if (that.selected) {
            that.drawBorder(ctx);
        }
        ctx.drawImage(that.imageObj, that.xPos, that.yPos);
        ctx.translate(-this.offsetX, -this.offsetY);
    };

    that.drawBorder = function (ctx) {
        ctx.fillRect(that.xPos - 1, that.yPos - 1, that.imageObj.width + 2, that.imageObj.height + 2);
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
            image: that.imageObj.src
        }
    };
    that.constructor = ImageObject;
    return that;
}

ImageObject.newFromData = function(data) {
    var obj = new ImageObject(data.id);
    obj.imageObj.src = data.image;
    obj.xPos = data.xPos;
    obj.yPos = data.yPos;
    // TODO: Set offset
    return obj;
};

module.exports = ImageObject;