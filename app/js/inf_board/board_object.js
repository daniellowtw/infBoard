function BoardObject(id) {
    this.offsetX = 0; // When this is moved after it's been drawn
    this.offsetY = 0;
    this.selected = false;
    this.id = id;
}

BoardObject.prototype.render = function render() {
    throw new Error("Not implemented");
};


BoardObject.prototype.toggleSelected = function toggleSelected(value) {
    if (value !== undefined) {
        this.selected = value;
    } else {
        this.selected = !this.selected;
    }
};


BoardObject.prototype.translate = function translate(x, y) {
    this.offsetX += x;
    this.offsetY += y;
};

module.exports = BoardObject;