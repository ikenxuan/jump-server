import fastify from "fastify"
//开鸡
const server = fastify({
  logger: true,
})
server.get('/', (req, reply) => {
  reply.send({
    code: 200,
    message: '请在 data 中传递值 url 发送 POST 请求到/createverify后返回Token。并带上请携带参数 e 访问 /geetest 从而重定向到新的网址',
    info: 'bbs手动验证地址重定向服务'
  })
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
server.get('/createverify', (req, reply) => {
  reply
  .code(200)
  .send({
    code: 200,
    message: '请在 data 中传递值 url 发送 POST 请求到此页面后返回Token',
    info: 'bbs手动验证地址重定向服务'
  })
})
server.get('/geetest', (req, reply) => {
  const token = req.query.e
  if(token === undefined) {
    reply
    .code(403)
    .send({
      code: 403,
      message: '传递参数不完整！缺少参数 e',
      info: 'bbs手动验证地址重定向服务'
    })
  }

  const valid = verifyToken(token)

  if (valid) {
    //构建HTML响应
    const popupHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>重定向页面</title>
        </head>
      <body>
        <script>
          // 弹出浏览器弹窗
          alert('确定后将会跳转到验证地址，请一定要进行验证，不然这个验证码就失效了，需重新获取');
          
          // 等待用户点击确认后进行重定向
          window.location.href = '${targetUrl}';
        </script>
      </body>
      </html>
    `
    reply
      .code(200)
      .type('text/html')
      .send(popupHTML)
  } else {
    // Token验证失败的响应
    reply
    .code(403)
    .send({
      code: 403,
      message: `Token: ${token} 不存在或已过期`,
      info: 'bbs手动验证地址重定向服务'
    })
  }
})


//在服务端生成token时,同时保存到字典中
const tokenMap = {}

/**
 * 随机生成字符串
 * @param len 指定生成字符串长度
 */
function getRandomString(len) {
  let _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789',
    min = 0,
    max = _charStr.length - 1,
    _str = '' //定义随机字符串 变量
  //判断是否指定长度，否则默认长度为15
  len = len || 15
  //循环生成字符串
  for (var i = 0, index; i < len; i++) {
    index = (function (randomIndexFunc, i) {
      return randomIndexFunc(min, max, i, randomIndexFunc)
    })(function (min, max, i, _self) {
      let indexTemp = Math.floor(Math.random() * (max - min + 1) + min),
        numStart = _charStr.length - 10;
      if (i == 0 && indexTemp >= numStart) {
        indexTemp = _self(min, max, i, _self)
      }
      return indexTemp
    }, i)
    _str += _charStr[index]
  }
  tokenMap[_str] = {
    createTime: Date.now()
  }

  return _str
}


//验证token
function verifyToken(token) {
  const now = Date.now()
  const tokenData = tokenMap[token]

  if (!tokenData || now - tokenData.createTime > 120 * 1000) {
    return false //不存在则无效
  }

  return true //有效
}
export default server