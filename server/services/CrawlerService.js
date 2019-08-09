exports.CrawlerService = CrawlerService;

function CrawlerService(ls, config){

	var self = this
	,   request = require('request')
	,   pathLib = require('path')
	,   throttledRequest = require('throttled-request')(request)
	,   CrawlerHelper = require('./helpers/CrawlerHelper')
	,   mongoDB = null
	,   controlExecutionService = null
	,   siteMap = ''
	;
	
	self.appConfig = {};

	function configure(cb){

	    self.appConfig = require(pathLib.resolve(config.path));	

	    console.log('appConfig',self.appConfig);

	    function step1(){
            throttledRequest.configure({
			  requests: self.appConfig.requestCount,
			  milliseconds: self.appConfig.requestPerMillisecond
			});
			getMongoDBService();
	    }

	    function getMongoDBService(){
            ls.getService('MongoDBService',function(service){
            	if(!service){
            	   console.log('error while getting MongoDBService');
            	   cb(service, null);
            	   return;
            	}
            	mongoDB = service;
            	getControlExecutionService();
            });
	    }

	    function getControlExecutionService(){
            ls.getService('ControlExecutionService',function(service){
            	if(!service){
            	   console.log('error while getting ControlExecutionService');
            	   cb(service, null);
            	   return;
            	}
            	controlExecutionService = service;
            	onComplete();
            });
	    }

	    function onComplete(){
	      console.log(config.name+' service started');	
          cb(null,true); 
	    }

	    step1();
	}

	function start(){
		var readStrm = throttledRequest(self.appConfig.url+'/sitemap/sitemap.xml');
	    
	    readStrm.on('data', function (data) {
	      siteMap += data.toString(); 	
	    });

	    readStrm.on('end',function(){
	    	siteMap = siteMap.split('<loc>');
	    	new CrawlerHelper(ls, throttledRequest, siteMap, self);
	    	console.log('end for response');
	    });

	    readStrm.on('error',function(error){
           console.log(error);
           console.log('error while requesting url : %s',self.appConfig.url);
	    });
	}

	function updateEntryInDB(urlMeta){
        controlExecutionService.pushAndExecute(self.appConfig.url, updateCrawledUrlInDB, urlMeta);
	}

	function updateCrawledUrlInDB(urlMeta, callBack){
        mongoDB.inserMany('CrawlerDB', 'CrawlerCollection', urlMeta, {}, callBack);
	}

	this.start = start;
	this.configure = configure;
	this.updateEntryInDB = updateEntryInDB;
	this.updateCrawledUrlInDB = updateCrawledUrlInDB;
}