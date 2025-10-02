const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      main: './src/js/main.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].bundle.js' : '[name].bundle.js',
      clean: true,
      // SEO 优化：确保文件名对搜索引擎友好
      assetModuleFilename: 'assets/[name].[contenthash][ext]',
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[contenthash][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[contenthash][ext]'
          }
        }
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
        // SEO 优化配置
        meta: {
          viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no',
          'robots': 'index, follow',
          'googlebot': 'index, follow',
          'bingbot': 'index, follow',
          'revisit-after': '1 days',
          'rating': 'general',
          'distribution': 'global',
          'language': 'en',
          'geo.region': 'US',
          'geo.placename': 'United States'
        },
        minify: isProduction ? {
          removeComments: false, // 保留注释以支持 SEO
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: false, // 不压缩 JS 注释，保持 SEO 友好
          minifyCSS: true,
          minifyURLs: true,
          // 保留重要的 SEO 属性
          preserveLineBreaks: false,
          conservativeCollapse: true
        } : false
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].[contenthash].bundle.css' : '[name].bundle.css',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'src/assets',
            to: 'assets',
            noErrorOnMissing: true
          },
          {
            from: 'manifest.json',
            to: 'manifest.json'
          },
          {
            from: 'robots.txt',
            to: 'robots.txt'
          },
          {
            from: 'sitemap.xml',
            to: 'sitemap.xml'
          },
          {
            from: 'privacy.html',
            to: 'privacy.html'
          }
        ],
      }),
      // 生产环境下启用代码混淆
      ...(isProduction ? [
        new JavaScriptObfuscator({
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.4,
          debugProtection: true,
          debugProtectionInterval: 2000,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: true,
          renameGlobals: false,
          selfDefending: true,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 10,
          stringArrayEncoding: ['base64'],
          stringArrayIndexShift: true,
          stringArrayWrappersCount: 2,
          stringArrayWrappersChainedCalls: true,
          stringArrayWrappersParametersMaxCount: 4,
          stringArrayWrappersType: 'function',
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false
        }, ['**/main.*.bundle.js'])
      ] : [])
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
            },
            mangle: true,
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new (require('css-minimizer-webpack-plugin'))(),
      ],
      splitChunks: isProduction ? {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      } : false,
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3000,
      open: true,
      hot: true,
    },
    devtool: isProduction ? false : 'source-map',
  };
};
