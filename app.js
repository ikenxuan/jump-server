import fastify from "fastify"
//开鸡
const serverPort = 3001
const server = fastify({
  logger: true,
})
server.listen(serverPort, '0.0.0.0', err => {
  if (err) throw err
  console.log(`开始监听 ${serverPort} 端口`)
})

let targetUrl
server.post('/createverify', (req, reply) => {
  const requesBody = JSON.parse(req.body)
  targetUrl = requesBody.url
  const token = getRandomString(12)
  reply.send({
    token
  })
})
server.get('/geetest', (req, reply) => {

  const token = req.query.e

  const valid = verifyToken(token)
  if (valid) {
    //重定向
    reply
      .code(301) 
      .header('Location', targetUrl) // 设置重定向地址
      .send(); 
  } else {
    reply.code(403).send(JSON.stringify({
      code: 403,
      message: 'Token不存在或已过期'
    }, null, 2))
  }
})


//在服务端生成token时,同时保存到字典中
const tokenMap = {};

/**
 * 随机生成字符串
 * @param len 指定生成字符串长度
 */
function getRandomString(len) {
  let _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789',
    min = 0,
    max = _charStr.length - 1,
    _str = '';                    //定义随机字符串 变量
  //判断是否指定长度，否则默认长度为15
  len = len || 15;
  //循环生成字符串
  for (var i = 0, index; i < len; i++) {
    index = (function (randomIndexFunc, i) {
      return randomIndexFunc(min, max, i, randomIndexFunc);
    })(function (min, max, i, _self) {
      let indexTemp = Math.floor(Math.random() * (max - min + 1) + min),
        numStart = _charStr.length - 10;
      if (i == 0 && indexTemp >= numStart) {
        indexTemp = _self(min, max, i, _self);
      }
      return indexTemp;
    }, i);
    _str += _charStr[index];
  }
  tokenMap[_str] = {
    createTime: Date.now()
  }

  return _str;
}


//验证token
function verifyToken(token) {
  const now = Date.now()
  const tokenData = tokenMap[token];

  if (!tokenData || now - tokenData.createTime > 60 * 1000) {
    return false; //不存在则无效
  }

  return true; //有效
}