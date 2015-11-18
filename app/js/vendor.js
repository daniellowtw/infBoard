module.exports = function () {
  require("bootstrap-webpack");
  require('jquery');
  require('angular');
  require('angular-ui-bootstrap');

  // For angular bootstrap colour picker
  require("../../node_modules/angular-bootstrap-colorpicker/css/colorpicker.min.css");
  require("../../node_modules/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min");

  require('./clipboard.js');
};