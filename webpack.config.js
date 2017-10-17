const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './public/src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public/dist')
    },

    devtool: 'source-map',
    
    module: {
        loaders: [

            // javascript/jsx
            {
                test: /.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react'],
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
