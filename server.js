require('dotenv').config();
const http = require('http');
const app = require('./src/app');

const port = process.env.PORT || 3000;

console.log(process.env);

http.Server(app).listen(port, () => {
  console.log(`listening on 0.0.0.0:${port}`);
});
