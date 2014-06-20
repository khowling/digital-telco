var   express = require('express')
    , router = express.Router()
    , https = require('https')
    , url = require ('url')
    , https = require ('https')
    , querystring = require ('querystring');

module.exports = function (secret) {


    /* NON-Canvas entry point - unauthenticated consumer facing, need to setup access_token session
    * https://help.salesforce.com/apex/HTViewHelpDoc?id=remoteaccess_oauth_username_password_flow.htm&language=en_US
    */

    var _currentSFsession;
    var getSession = function (callback) {

        if (_currentSFsession) {
            return callback(_currentSFsession);
        } else {

            var oauth2req = https.request({
                hostname: 'login.salesforce.com',
                port: 443,
                path: '/services/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }, function (oauth2res) {
                console.log('STATUS: ' + oauth2res.statusCode + '   HEADERS: ' + JSON.stringify(oauth2res.headers));
                oauth2res.setEncoding('utf8');
                oauth2res.on('data', function (chunk) {
                    console.log('got : ' + chunk);
                    _currentSFsession = chunk;
                    callback(_currentSFsession);
                });
            });

            oauth2req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
                callback(e);
            });

            var qs = querystring.stringify({
                grant_type: 'password',
                //    response_type: 'token',
                username: process.env.USERNAME,
                password: process.env.PASSWORD,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET});
            console.log(JSON.stringify(qs));
            oauth2req.write(qs);
            oauth2req.end();
        }
    }


    router.get('/sfsession', function(req, res){
        getSession(function(chunk) {res.send (chunk)});
	});


    /*
     * User request the app from a salesforce URL (tab, vfpage etc)
     * salesforce service post singed data to here
     * we reply with the start page
     *
     * Access point for
     *  - Agents (Employee License)
     *  - Retail (Community Partner License)
     *  - Partners (Community Parnter License)
     *  - Authenticated Consumer (Community License)
     *
     */
    router.post('/',  function(req, res){


		console.log ('got the post from salesforce');

		var   sreq = req.body.signed_request
			, sreq_split = sreq.split('.')
			, encodedSig = sreq_split[0]
			, encodedEnvelope = sreq_split[1]
			, crypto = require('crypto');

		var json_envelope = new Buffer(encodedEnvelope, 'base64').toString('utf8');
		console.log ('json envelope : ' + json_envelope);

		/*  verify signature  */
		var algorithm, canvasRequest;
		try {
			canvasRequest = JSON.parse(json_envelope);
			algorithm = canvasRequest.algorithm ? "HMACSHA256" : canvasRequest.algorithm;
		} catch (e) {
			throw 'Error deserializing JSON: '+ e;
		}

		// check algorithm - not relevant to error
		if (!algorithm || algorithm.toUpperCase() !== 'HMACSHA256') {
			throw 'Unknown algorithm '+algorithm+'. Expected HMACSHA256';
		}
  
		expectedSig = crypto.createHmac('sha256', secret).update(encodedEnvelope).digest('base64');
		if (encodedSig !== expectedSig) {
			throw 'Bad signed JSON Signature!';
		}

		res.render('index', {title: 'hello', signedreq : json_envelope});
	});
	
	
	
    /* pass throu proxy to the v30 rest API (chatter & data) */
    router.get('/proxy/:apipath/:optional1?/:optional2?', function(proxyReq, proxyResp) {
        var apipath = proxyReq.params.apipath,
            apiquery = proxyReq.query;

        /* construct the path including the optional routes */
        if (proxyReq.params.optional1) apipath+= '/' + proxyReq.params.optional1;
        if (proxyReq.params.optional2) apipath+= '/' + proxyReq.params.optional2;
        /* construct the query string */
        if (Object.keys(apiquery).length !== 0)  {
            apiquery = '?' + querystring.stringify(apiquery);
        } else {
            apiquery = '';
        }

        var callsf =  function() {
            getSession(function(oauthres) {
                var oauthres = JSON.parse(oauthres);

                var reqOptions = {
                    host: oauthres.instance_url.split('//')[1],
                    port: 443,
                    path: '/services/data/v30.0/' + apipath + apiquery,
                    method: "GET",
                    headers: {
                        'Authorization': 'OAuth ' + oauthres.access_token,
                        'X-Connect-Bearer-Urls': true
                    }
                };

                console.log('calling : ' + JSON.stringify(reqOptions));
                var req = https.request(reqOptions, function (res) {

                    res.on('data', function (chunk) {
                        console.log('got data ');
                        proxyResp.write(chunk);
                    });

                    res.on('end', function () {

                        console.log('got end');
                        proxyResp.end();
                    });
                });

                req.on('error', function (e) {
                    console.log('An error occured: ' + e.message);
                    proxyResp.writeHead(503);
                    proxyResp.write("Error!");
                    proxyResp.end();
                });
                req.end();
            });
        }
        callsf();

	});

	return router;
};
