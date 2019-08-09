function startApplication(config){
    
	this.inheritFrom = require('./MainApplication').MainApplication;
	this.inheritFrom(config);

    var self = this;

    self.configure(function(err,result){
    	if(err){
    		console.log(err);
    		return;
    	}
        self.getService('CrawlerService',function(service){
            if(!service){
                console.log('error while getting CrawlerService');
                return;
            }
            service.start();
        });
        console.log('application configured');
    });
}

var config = {
	'name':"testApp",
    "baseAppDir":__dirname,
	"serviceLocations":__dirname+'/server/services/',
	"services":{
        "MongoDBService":{
            "name":"MongoDBService",
            "connectionJSON":{
               "ip":'127.0.0.1',
               "port":'27017',
               'database':'CrawlerDB'
            }
        },
		'CrawlerService':{
			"name":"CrawlerService",
			"path":__dirname+'/appConfig.json'
		}
	}
}

new startApplication(config);
