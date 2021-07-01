var Chat = function(socket) {
    this.socket = socket
}
// 发送消息 参数 当前房间 消息内容
Chat.prototype.sendMessage = function (room, text) {
    var message = {
        room: room,
        text: text
    }
    this.socket.emit('message', message)
}
// 解析命令 换昵称 换房间
Chat.prototype.processCommand = function (command) {
    var words = command.split(' ')
    var command = words[0].substring(1, words[0].length).toLowerCase()
    console.log(command)
    var message = ''

    switch (command) {
        case 'nick':
            socket.emit('nameAttempt', words[1])
            break;
        case 'join':
            socket.emit('join', {'newRoom':words[1]})
            break;
        default:
            message='无法识别命令'
            break;
    }
    return message
}