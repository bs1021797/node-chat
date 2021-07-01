//在用户页面中显示消息及可用房间
function divEscapedContentElement(message, isRoom) {
    if(isRoom){
        return '<div id="message-content">'+ message +'</div>'
    }else{
        return '<div>' +
            '<div id="userNameContent" class="text-info">' + userName + ':' + '</div>' +
            '<div id="message-content" class="text-warning">'+ message +'</div>' +
            '</div>'
    }
}

//用来显示系统创建的受信内容
function divSystemContentElement(message) {
    return $('<div id="systemMessage-content"></div>').html('<i>'+message+"</i>");
}

function processUserInput (chatApp, socket) {
    //获取输入内容
    var message = $('#send-message').val();
    // 判断输入内容是不是命令 命令包含'/'
    if (message.charAt(0) == '/') {
        var systemMessage = chatApp.processCommand(message)
        if (systemMessage) {
            socket.emit('message', {
                text: systemMessage
            })
        }
    } else {
        chatApp.sendMessage($('#room').text(), message)
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    }
    
    $('#send-message').val('');
}
// //客户端程序初始化逻辑
var socket = io.connect();
$(function () {
    var chatApp = new Chat(socket);

    //显示更名尝试的结果
    socket.on('nameResult', function (result) {
        var message;
        if(result.success){
            userName = result.name;
            message = '你的用户名为: ' + result.name + '.';
        }else{
            message = result.message;
        };
        $('#messages').append(divSystemContentElement(message));
    });

    //显示房间变更的结果
    socket.on('joinResult', function (result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('已进入房间: ' + result.room));
    });

    //显示接收到的消息
    socket.on('message', function (message) {
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    //显示可用房间列表
    socket.on('rooms',function (rooms) {
        $('#room-list').empty();
        // debugger;

        for(var room in rooms){
            room = room.substring(1, room.length);
            if(room != ''){
                $('#room-list').append(divEscapedContentElement(room,true));
            }
        }
        //点击房间名可用换到那个房间中
        $('#room-list div').click(function () {
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(function () {
        socket.emit('rooms')
    }, 1000);

    $('#send-message').focus();

    $('#send-button').on('click', function () {
        processUserInput(chatApp, socket);
        return false;
    });
})