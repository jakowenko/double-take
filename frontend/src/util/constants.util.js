export default () => ({
  api: `${
    process.env.NODE_ENV === 'production'
      ? `${window.location.origin}${window.ingressUrl || ''}`
      : `${window.location.origin.replace(':8080', ':3000')}`
  }/api`,
  socket:
    process.env.NODE_ENV === 'production'
      ? { path: `${window.ingressUrl}/socket.io/` || '' }
      : `${window.location.origin.replace(':8080', ':3000')}`,
});
