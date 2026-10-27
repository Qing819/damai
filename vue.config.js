const path = require('path');
const { name } = require('./package');
const CompressionPlugin = require('compression-webpack-plugin');

function resolve(dir) {
  return path.join(__dirname, dir);
}

const port = 7000; // dev port
const title = '积分系统'
module.exports = {
  publicPath: '/point/',
  outputDir: 'point',
  assetsDir: 'static',
  filenameHashing: true,
  productionSourceMap: false,
  devServer: {
    hot: true,
    disableHostCheck: true,
    port,
    overlay: {
      warnings: false,
      errors: true
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    proxy: {
      '/api': {
        // target: "http://172.16.43.186:8080",
        // target: "http://172.16.43.156:38080",
        target: 'http://192.168.137.235:8002',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  lintOnSave: false,
  // 自定义webpack配置
  configureWebpack: {
    plugins:
        [
          new CompressionPlugin({
            test: /\.js$|\.css$|\.html/, // 匹配文件名
            threshold: 10240, // 对超过10k的数据压缩
            deleteOriginalAssets: false // 不删除源文件
          })
        ],
    resolve: {
      alias: {
        './utils/createSocketUrl': path.resolve(__dirname, 'node_modules/webpack-dev-server/client/utils/createSocketUrl.js'),
        '@': resolve('src'),
        src: resolve('src'),
        api: resolve('src/api'),
        views: resolve('src/views'),
        assets: resolve('src/assets'),
        components: resolve('src/components'),
        store: resolve('src/store'),
        utils: resolve('src/utils')
      }
    },
    output: {
      // 把子应用打包成 umd 库格式
      library: `${name}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${name}`
    }
  },
  chainWebpack: config => {
    config.module.rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    // 设置svg-sprite-loader处理icons目录中的svg
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({ symbolId: 'icon-[name]' })
      .end()
    config.plugin('html')
      .tap(args => {
        args[0].title = title
        return args
      })
  },
  pwa: {
    iconPaths: {
      favicon32: 'favicon.ico',
      favicon16: 'favicon.ico',
      appleTouchIcon: 'favicon.ico',
      maskIcon: 'favicon.ico',
      msTileImage: 'favicon.ico'
    }
  }
};
