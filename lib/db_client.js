var redisClient = require("redis-connection")();
var util = require("util");

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

function updateObjectOffset(roomId, objectId, offsetX, offsetY, redisCallback) {
    redisClient.hget("object", util.format("%s:%s", roomId, objectId), function (err, data) {
        if (err) {
            redisCallback(err)
        } else {
            data.offsetX = offsetX;
            data.offsetY = offsetY;
            saveObject(roomId, data, redisCallback)
        }
    })
}

function saveObject(roomId, data, errorCallback, callbackWithData) {
    redisClient.INCR("counter:objects:" + roomId, function (err, newObjectId) {
        if (err) {
            return errorCallback(err)
        }
        redisClient.SADD(util.format("objects:%s", roomId), newObjectId);
        data.id = newObjectId;
        redisClient.HMSET("object", util.format("%s:%s", roomId, newObjectId), JSON.stringify(data), callbackWithData(data));
    })
}

function getNextObjectId(roomId) {
    redisPub.INCR("counter:objects:" + id, function (err, res) {
        console.log("Storing", "object:" + id + ":" + res, JSON.stringify(d));
    })
}

module.exports = {
    load: loadObjects,
    saveObject: saveObject,
    updateObjectOffset: updateObjectOffset
};