var redisClient = require("redis-connection")();
var util = require("util");
var config = require("../app/config");

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

function deleteObject(roomId, objectId, redisCallback) {

    redisCallback = redisCallback || noop;
    redisClient.SREM(util.format("objects:%s", roomId), objectId, function (err) {
        if (err) {
            if (config.debug) {
                console.log("cannot delete from redis: srem objects:%s, %s", roomId, objectId, err);
            }
            redisCallback(err)
        } else {
            redisClient.HDEL("object", util.format("%s:%s", roomId, objectId), redisCallback)
        }
    });
}

// Rooms are stored as a hashmap object room:roomId {}
function createNewRoom(roomId, redisCallback) {
    redisCallback = redisCallback || noop;
    var roomKey = util.format("room:%s", roomId);
    // Check if room exists
    redisClient.EXISTS(roomKey, function (err, data) {
        if (err) {
            redisCallback(err)
        } else if (data === 1) {
            // Error
            redisCallback("Room already exists")
        } else {
            redisClient.HMSET(roomKey, "created", new Date().getTime(), redisCallback)
        }
    });
}

module.exports = {
    load: loadObjects,
    saveNewObject: saveNewObject,
    updateObjectOffset: updateObjectOffset,
    deleteObject: deleteObject,
    createNewRoom: createNewRoom
};