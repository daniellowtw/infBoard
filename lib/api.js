// This registers the api endpoints to be attached to a router. It is to be used like a router

var dbClient = require("./db_client");
var router = require("express").Router();
var bodyParser = require('body-parser');

// Apparently this is how you get post data
router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// create new room
router.post('/rooms', function (req, res) {
    var roomId = req.body.roomId;
    if (roomId === undefined) {
        res.status(403).send("No room ID");
        return
    }
    dbClient.createNewRoom(roomId, function (err, data) {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(roomId);
        }
    });
});


module.exports = router;