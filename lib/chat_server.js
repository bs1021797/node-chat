var socketio = require('socket.io');
var io;
var guestNumber=1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

// 启动socketio服务器
exports.listen = function(server){
    // 启动socket服务，允许搭载到以后http服务 
    io = socketio.listen(server)
    io.set('log level', 1)
    io.sockets.on('connection', function(socket){
        // 分配访客名 记录访客数
        guestNumber = assignGuessNumber(socket, guestNumber, nickNames, namesUsed)
        // 用户进入房间‘lobby’
        joinRoom(socket, 'lobby')
        // 处理用户消息
        handleMessageBroadcasting(socket, nickNames)
        // 变成昵称
        handleNameChangeAttempts(socket, nickNames, namesUsed)
        // 聊天室创建和变更
        handleRoomJoining(socket)
        // 用户断开连接
        handleClientDisconnect(socket, nickNames, namesUsed)

        // 提供已占用聊天室的列表
        socket.on('rooms', function(){
            socket.emit('rooms', io.sockets.manager.rooms)
        })

    })   
}

// 分配用户昵称
function assignGuessNumber(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber
    // 用户昵称和客户端id关联
    nickNames[socket.id] = name
    // 让用户知道昵称
    socket.emit('nameResult', {
        success: true,
        name: name
    })
    namesUsed.push(name)
    return guestNumber+1
}

// 进入聊天室
function joinRoom(socket, room){
    //进入房间
    socket.join(room)
    // 记录当前房间
    currentRoom[socket.id] = room
    // 发送 当前房间
    socket.emit('joinResult', {
        room: room
    })
    // 让房间用户知道有新用户进入
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + '进入房间' + room
    })

    // 当前用户知道 房间都有谁
    var userInRoom = io.sockets.clients(room)
    if (userInRoom.length > 0) {
        var userInRoomSummery = '当前房间用户有：'
        for (var index in userInRoom) {
            var userSocketId = userInRoom[index].id
            if (userSocketId != socket.id) {
                if (index > 0) {
                    userInRoomSummery += ', '
                }
                userInRoomSummery += nickNames[userSocketId]
            }
        }
        // 发送 当前房间人
        socket.emit('message', {
            text: userInRoomSummery
        })
    }
}

// 处理用户消息 接收用户消息通知房间内其他用户
function handleMessageBroadcasting(socket, nickNames) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text: currentRoom[socket.id] + ': ' + message.text
        })
    })
}

// 变更昵称
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name) {
        // 命名不能以Guest开头
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: '用户名不能以Guest开头'
            })
        } else {
            // 已用昵称中是否存在新昵称
            if (namesUsed.indexOf(name) == -1) {
                var preNickName = nickNames[socket.id]
                console.log(preNickName)
                var preNickNameIndex = namesUsed.indexOf(preNickName)
                namesUsed.push(name)
                nickNames[socket.id] = name
                delete namesUsed[preNickNameIndex]
                console.log(name,'----------')
                socket.emit('nameResult', {
                    success: true,
                    name: name
                })
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: preNickName + '已更名为' + name
                })
            } else {
                socket.emit('nameResult', {
                    success: false,
                    name: '该昵称已被占用'
                })
            }
        }
    })
    
}

// 聊天室创建和变更
function handleRoomJoining(socket) {
    socket.on('join', function(room){
        //离开现有房间
        socket.leave(currentRoom[socket.id])
        //进入新房间
        joinRoom(socket, room.newRoom)
    })
}

// 用户断开连接
function handleClientDisconnect(socket, nickNames, namesUsed) {
    socket.on('disconnect', function(){
        var nameIndex = namesUsed.indexOf(nickNames[socket.id])
        var _name = nickNames[socket.id]
        delete namesUsed[nameIndex]
        delete nickNames[socket.id]
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
            text: _name + '离开房间'
        })
    })
}