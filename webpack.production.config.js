const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isObfuscated = process.env.OBFUSCATE === 'true';
  
  return {
    entry: {
      main: './src/js/main.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].bundle.js' : '[name].bundle.js',
      clean: true,
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
        minify: isProduction ? {
          removeComments: false,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: false,
          minifyCSS: true,
          minifyURLs: true,
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
      // 条件性代码混淆
      ...(isProduction && isObfuscated ? [
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
              drop_console: isObfuscated, // 混淆时删除 console
              drop_debugger: true,
              pure_funcs: isObfuscated ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : [],
              keep_fargs: !isObfuscated, // 不混淆时保留函数参数
              keep_fnames: !isObfuscated  // 不混淆时保留函数名
            },
            mangle: {
              keep_fnames: !isObfuscated,
              keep_classnames: !isObfuscated
            },
            format: {
              comments: !isObfuscated,
              beautify: false
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
    devtool: isProduction ? (isObfuscated ? false : 'source-map') : 'source-map',
  };
};
