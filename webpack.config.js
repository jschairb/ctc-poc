const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './public/src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public/dist')
    },
    module: {
        loaders: [

            // javascript
            {
                test: /.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015'],
                },
            },

            // jsx
            {
                test: /.jsx$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['react'],
                },
            },

            // css
            {
                test: /\.css$/,
                use: [
                  'style-loader',
                  'css-loader',
                ],
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Popper: ['popper.js', 'default'],
        }),
    ],
};
