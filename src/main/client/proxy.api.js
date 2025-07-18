const PROXY_CONFIG = {
    "/api/**": {
        "target": "http://localhost:8080/netleteditor/api/",
        "changeOrigin": true,
        "secure": false,
        "logLevel": "debug",
        "pathRewrite": {
            "^/api": ""
        },
        "onProxyRes": function (pr, req, res) {
            if (pr.headers['set-cookie']) {
                // console.log("Replacing cookie "+pr.headers['set-cookie']);
                // const cookies = pr.headers['set-cookie'].map(cookie => 
                //     cookie.replace(/\/insodatawebui/gi, '/')
                // );
                // pr.headers['set-cookie'] = cookies;
                // console.log("Replaced cookie "+pr.headers['set-cookie']);
            }
        }
    }
};

module.exports = PROXY_CONFIG;