var redisClient = require("redis-connection")();

function loadObjects(id, callback) {
    redisClient.SMEMBERS("objects:" + id, function (err, data) {
        data.forEach(function (objectId) {
            redisClient.hget("object", id + ":" + objectId, function (err, data) {
                    callback(data, err)
                }
            )
        });
    })
}

function getNextObjectId(roomId) {
    redisPub.INCR("counter:objects:" + id, function (err, res) {
        console.log("Storing", "object:" + id + ":" + res, JSON.stringify(d));
    })
}

module.exports = {
    load: loadObjects
};