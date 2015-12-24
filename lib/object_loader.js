var redisClient = require("redis-connection")();

function loadObjects(id, callback) {
    redisClient.SMEMBERS("objects:" + id, function (err, data) {
        data.forEach(function (objectId) {
            redisClient.hget("object", id + ":" + objectId, function (err, data) {
                    console.log("hget returned", err, data)
                    callback(data, err)
                }
            )
        });
    })
}

module.exports = {
    load: loadObjects
};