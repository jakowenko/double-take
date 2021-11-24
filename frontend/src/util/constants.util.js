export default () => ({
  api: `${
    process.env.NODE_ENV === 'production'
      ? `${window.location.origin}${window.ingressUrl || window.publicPath || ''}`
      : `${window.location.origin.replace(':8080', ':3000')}`
  }/api`,
  socket:
    process.env.NODE_ENV === 'production'
      ? { path: window.ingressUrl || window.publicPath ? `${window.ingressUrl || window.publicPath}/socket.io/` : '' }
      : `${window.location.origin.replace(':8080', ':3000')}`,
});
