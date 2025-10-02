module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Asegúrate de que esta línea esté aquí
      'react-native-reanimated/plugin',
    ],
  };
};