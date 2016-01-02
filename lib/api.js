// This registers the api endpoints to be attached to a router. It is to be used like a router

var dbClient = require("./db_client");
var router = require("express").Router();

// create new room
router.post('/rooms', function (req, res) {
    var roomId = req.params.roomId;
    if (roomId === undefined) {
        res.status(403).send("No room ID");
    }
    dbClient.createNewRoom(roomId, function (err, data) {
        if (err) {
            console.log(err);
            res.status(500).send(err)
        } else {
            console.log("Created room %s, redirecting now", roomId, data)
            res.status(200).send(roomId);
            redirect()
        }
    });
});


module.exports = router;