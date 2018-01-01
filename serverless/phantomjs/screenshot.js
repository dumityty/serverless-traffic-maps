// phantomjs  --ignore-ssl-errors=true screenshot.js s3_url output.png

var system = require('system');
var args = system.args;
var page = require('webpage').create();

console.log("Args: ", args);

url = args[1];
output = args[2];

page.onResourceReceived = function(response) {
  valid = [200, 201, 301, 302]
  if(response.id == 1 && valid.indexOf(response.status) == -1 ){
    console.log('Received a non-200 OK response, got: ', response.status);
    phantom.exit(1);
  }
}

function loadmap() {
  page.open(url);

  page.onLoadFinished = function(status) {
    console.log(status);

    if (status !== 'success') {
      console.log('Unable to load the address!');
      phantom.exit();
    }
    else {
      map_wait();
    }
  };

  function map_wait() {
    console.log(output);
    setTimeout(function() {
      page.render(output);
      phantom.exit();
    }, 3000);
  }
}

loadmap();
