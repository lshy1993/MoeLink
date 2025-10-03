module.exports = {
    devServer: {
        proxy: {
            '/api': {
                // target: 'http://api.moelink.site',
                target: 'http://192.168.1.5:3000',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            },
        }
    }
}