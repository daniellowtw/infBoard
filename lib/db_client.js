var redisClient = require("redis-connection")();
var util = require("util");

var noop = function () {
};

function loadObjects(id, callback) {
    redisClient.SMEMBERS("objects:" + id, function (err, data) {
        data.forEach(function (objectId) {
            redisClient.HGET("object", id + ":" + objectId, function (err, data) {
                    callback(data, err)
                }
            )
        });
    })
}

function updateObjectOffset(roomId, objectId, offsetX, offsetY, redisCallback) {
    redisCallback = redisCallback || noop;
    redisClient.hget("object", util.format("%s:%s", roomId, objectId), function (err, data) {
        if (err) {
            redisCallback(err)
        } else {
            data = JSON.parse(data);
            data.offsetX = offsetX;
            data.offsetY = offsetY;
            redisClient.HMSET("object", util.format("%s:%s", roomId, objectId), JSON.stringify(data), redisCallback);
        }
    })
}

function saveNewObject(roomId, data, errorCallback, callbackWithData) {
    errorCallback = errorCallback || noop;
    callbackWithData = callbackWithData || noop;
    redisClient.INCR("counter:objects:" + roomId, function (err, newObjectId) {
        if (err) {
            return errorCallback(err)
        }
        redisClient.SADD(util.format("objects:%s", roomId), newObjectId);
        data.id = newObjectId;
        redisClient.HMSET("object", util.format("%s:%s", roomId, newObjectId), JSON.stringify(data), callbackWithData(data));
    })
}

function deleteObject(roomId, objectId, errorCallback) {
    errorCallback = errorCallback || noop;
    redisClient.SREM(util.format("objects:%s", roomId), objectId, function (err) {
        if (err) {
            errorCallback(err)
        } else {
            redisClient.HDEL("object", util.format("%s:%s", roomId, newObjectId), function (err) {
                if (err) {
                    errorCallback(err)
                }
            });
        }
    });
}

module.exports = {
    load: loadObjects,
    saveNewObject: saveNewObject,
    updateObjectOffset: updateObjectOffset,
    deleteObject: deleteObject
};