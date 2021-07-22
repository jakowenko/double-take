export default () => ({
  api: `${
    process.env.NODE_ENV === 'development'
      ? `${window.location.origin.replace(':8080', ':3000')}`
      : window.location.origin
  }/api`,
});
