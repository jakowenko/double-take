function buildApiUrl() {
  if (process.env.DOUBLETAKE_HOST) {
    return `http://${process.env.DOUBLETAKE_HOST}:${process.env.DOUBLETAKE_PORT}/api`;
  }
  const basePath = window.ingressUrl || window.publicPath || '';
  return `${window.location.origin}${basePath}/api`;
}

function buildSocketPath() {
  if (process.env.DOUBLETAKE_HOST) {
    return `http://${process.env.DOUBLETAKE_HOST}:${process.env.DOUBLETAKE_PORT}/socket.io/`;
  }
  const basePath = window.ingressUrl || window.publicPath;
  return basePath ? `${basePath}/socket.io/` : '';
}

const config = () => ({
  api: buildApiUrl(),
  socket: {
    path: buildSocketPath(),
  },
});

export default config;
