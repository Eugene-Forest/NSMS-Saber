module.exports = {
  lintOnSave: true,
  productionSourceMap: false,
  chainWebpack: (config) => {
    //忽略的打包文件
    config.externals({
      'vue': 'Vue',
      'vue-router': 'VueRouter',
      'vuex': 'Vuex',
      'axios': 'axios',
      'element-ui': 'ELEMENT',
    })
    const entry = config.entry('app')
    entry
      .add('babel-polyfill')
      .end()
    entry
      .add('classlist-polyfill')
      .end()
    entry
      .add('@/mock')
      .end()
  },
  devServer: {
    // 端口配置
    port: 80,
    https: true,
    // 反向代理配置
    proxy: {
      '/api/*': {
        target: 'https://127.0.0.1:8080',
        ws: false,
        changeOrigin: true, //支持跨域
        pathRewrite: {
          '^/api': '/'
        },
        // 在之前的服务器测试中，路径重写为
        // '^/api': '/api'
        // todo 但是这个配置在本地运行会出错，尝试现有重写方法以观察会不会导致服务器中的请求出现问题
      }
    },
  },
}
