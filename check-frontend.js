import http from 'http';
const req = http.get('http://localhost:5173/', (res) => { 
  let d=''; 
  res.on('data',c=>d+='' + c); 
  res.on('end',()=>{
    console.log('Status:',res.statusCode); 
    console.log('Has index.html:', d.includes('<div id="root">'));
  }); 
});