'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet = require('helmet');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const db = require('./database/db');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// helmet config
app.use(helmet.hidePoweredBy());

app.use(helmet.frameguard({ action: "deny" }));


app.use(helmet.xssFilter());

app.use(helmet.noSniff());

app.use(helmet.ieNoOpen());

app.use(helmet.hsts({ maxAge: 90 * 24 * 60 * 60, force: true }));

app.use(helmet.dnsPrefetchControl());


app.use(helmet.noCache());

app.use(helmet.contentSecurityPolicy({
  directives: {
    "defaultSrc": ["'self'"],
    "scriptSrc": ["'self'", "trusted-cdn.com"]
  }
}))



//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();        
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 3500);
  }
});
//Start our server and tests!
db.connect(process.env.MONGO)
module.exports = app; //for testing
