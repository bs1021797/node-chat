// HTTP服务
var http = require('http');
// 获取文件系统  路径
var fs = require('fs');
var path = require('path');
// 文件类型
var mime = require('mime');
// 缓存文件数据
var cache = {}

/* 以下为辅助函数 */
/*************************************************/
// 404
function send404(response){
    response.writeHead(404, {'Content-Type': 'text/plain'})
    response.write('sorry 404,the resource not found')
    response.end()
}

// 提供文件数据服务
function sendFile(response, filePath, fileContent) {
    response.writeHead(200, {'content-type': mime.lookup(path.basename(filePath))});
    response.end(fileContent)
}

// 提供静态文件服务
// 缓存策略 读取缓存(RAM内存)快
function serverStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath])
    } else {
        fs.readFile(absPath, function(err, data){
            if (err) {
                send404(response)
            } else {
                // 缓存进来
                cache[absPath] = data
                sendFile(response, absPath, cache[absPath])
            }
        })
    }
}

var server = http.createServer(function(request, response){
    var filePath = false
    if (request.url == '/') {
        filePath = 'public/index.html'
    } else {
        filePath = 'public' + request.url
    }
    // 转化为相对路径
    var absPath = './' + filePath
    serverStatic(response, cache, absPath)
})

//启动
server.listen(3000, function(){
    console.log('server listening on port 3000')
})

var chatServer = require('./lib/chat_server.js')
chatServer.listen(server)
