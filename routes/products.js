
var   express = require('express')
    , router = express.Router();

module.exports = function (client) {

    router.get('/', function(req, res){
		var sstr = req.query.txt,
		    rows = req.query.rows,
		    filters = req.query.filters,
            facets = req.query.facets;
	
		console.log ('searching for  : ' + sstr + ', rows : ' + rows + ', filters : ' + JSON.stringify(filters) + ' facets: ' + facets);
	
		if (sstr == null || sstr == '') sstr = '*'; 
		else if (sstr.indexOf('*', sstr.length - 1) === -1) sstr = sstr + '*'; 
	
		var query = client.createQuery()
			.q(sstr)
			.edismax()
			//.qf({Name_s:1,Codes__ss:1,Title_s:1,CV_Details_s:0.5,Phone_s:0.5,Email_s:0.5})
			.qf({Name:1,Title_s:1})
			.fl('*')
            //.facet({field: ['Make__c', 'Type__c', 'Available_Tariffs__c', 'Operating_system__c', 'Colour__c']})
            .facet({field: facets})
                .rows(rows)
			.set('lowercaseOperators=true');
	
	
		if (filters != null) {
			var filts = JSON.parse(filters);
			for (var filenm in filts){
				for (var val in filts[filenm]){
					console.log ('adding filter ' + filenm + ' : ' +  filts[filenm][val]);
					query.matchFilter(filenm, '"'+filts[filenm][val]+'"');
				}
			}
		}
	
		client.search(query,function(err,obj){
			if(err){
			   	res.send(500, { error: 'something blew up' + err});
			}else{
				console.log ('searching got  : ' + JSON.stringify(obj));
			   	res.json(obj);
			}
		});
	});


    router.post('/account/:id', function(req, res){
		var acc = req.body;
		console.log ('Saving Document : ' + JSON.stringify(acc));
		client.add(acc, function(err,obj) {
			if(err){
				res.send(500, { error: 'something blew up' + err});
			}else{
	
				client.commit(commitoptions);
				console.log ('Saving Document Success : ' + JSON.stringify(obj));
				res.send(200);
			}
		});
	
	});

    router.post('/account', function(req, res){
		var accs = req.body;
		console.log ('Saving Documents : ' + JSON.stringify(accs));
		client.add(accs, function(err,obj) {
			if(err){
				res.send(500, { error: 'something blew up' + err});
			}else{
				console.log ('Saving Documents Success : ' + JSON.stringify(obj));
				res.send(200);
			}
		});
	
	});

    return router;
}