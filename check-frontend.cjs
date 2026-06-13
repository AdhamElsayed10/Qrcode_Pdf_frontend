const http = require('http');
http.get('http://localhost:5173/', function(r) {
  let d = '';
  r.on('data', function(c) { d += c; });
  r.on('end', function() {
    console.log('Status:', r.statusCode);
    console.log('Has root:', d.includes('id="root"'));
  });
});