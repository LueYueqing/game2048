const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './src/js/main.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].bundle.js',
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
      // SEO 优化：保留所有重要的 meta 标签
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
      minify: {
        // SEO 友好压缩配置
        removeComments: false, // 保留注释
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: false, // 不压缩内联 JS
        minifyCSS: true,
        minifyURLs: true,
        preserveLineBreaks: false,
        conservativeCollapse: true,
        // 保留重要的 SEO 属性
        caseSensitive: false,
        removeAttributeQuotes: false,
        removeScriptTypeAttributes: false,
        removeStyleLinkTypeAttributes: false
      }
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].bundle.css',
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
    })
  ],
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false, // 保留 console 用于调试
            drop_debugger: true,
            pure_funcs: [], // 不删除任何函数
            // SEO 友好压缩
            keep_fargs: true,
            keep_fnames: true,
            // 禁用可能导致问题的优化
            side_effects: false,
            unused: false
          },
          mangle: {
            // 不混淆函数名，保持 SEO 友好
            keep_fnames: true,
            keep_classnames: true
          },
          format: {
            comments: true, // 保留注释
            beautify: false
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              // SEO 友好 CSS 压缩
              discardComments: false, // 保留注释
              normalizeWhitespace: true,
              minifyFontValues: true,
              minifySelectors: true
            }
          ]
        }
      }),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  // SEO 优化：生成 source map 用于调试
  devtool: 'source-map',
  // 性能优化
  performance: {
    hints: 'warning',
    maxEntrypointSize: 500000, // 500KB
    maxAssetSize: 500000, // 500KB
  }
};
