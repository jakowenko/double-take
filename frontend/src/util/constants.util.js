export default () => ({
  api: `${`${window.location.origin}${window.ingressUrl || window.publicPath || ''}`}/api`,
  socket: {
    path: window.ingressUrl || window.publicPath ? `${window.ingressUrl || window.publicPath}/socket.io/` : '',
  },
});
