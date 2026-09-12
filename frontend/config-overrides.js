module.exports = {
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      // Disable the error overlay entirely
      config.client = {
        ...config.client,
        overlay: false,
      };
      return config;
    };
  },
};