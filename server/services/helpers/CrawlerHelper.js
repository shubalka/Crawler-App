module.exports = function(ls, throttledRequest, urls, crawlerService){

	var self = this
	,   ne = require('node-each')
	,   _ = require('lodash')
	,   parse = require('url-parse')
	,   EventEmitter = require("events").EventEmitter
	,   event = new EventEmitter()
	,   urlMap = ''
	,   requestMadeMap = {}
	,   finalUrlMap = {}
	,   requestDone = 0
	,   options = {
		    debug: true
		}
	;

	function initiliase(){
		event.on('ON_ALL_RESPONCE_COMPLETED',function(){
			urlMap = urlMap.split('<loc>');
			separateTheUrls();
		});
		startCrawling();
	}

	function separateTheUrls(){
		var parsedUrl,rootUrl,urlMeta = {},counter = 0,finalSaveMap = [];
		console.log('************* started saving all urls***************')
		ne.each(urlMap, function(url, i){
		    if(url.includes('</loc>')){
			    url = url.split('</loc>')[0];
                parsedUrl = parse(url, true);
                rootUrl = parsedUrl.origin+parsedUrl.pathname;
                console.log('******** '+counter+' *******');
                console.log('********App*******');
                console.log('********Is*******');
                console.log('********Running*******');
		   	    console.log('########### Upadting Urls In DB ##########');
                counter += 1;
                if(!finalUrlMap[rootUrl]){
                   finalSaveMap.push({rootUrl:rootUrl,totalReferenceCount:0,uniqueList:[]});	
                   finalUrlMap[rootUrl] = finalSaveMap.length - 1;
                }
                var info = finalSaveMap[finalUrlMap[rootUrl]];
                info.totalReferenceCount += 1;
                info.uniqueList.push(parsedUrl.href);
		    }
		}, options).then(function(debug) {
			crawlerService.updateEntryInDB(finalSaveMap);
		    console.log('captured %s urls', _.size(finalUrlMap));
		    console.log('************* completed crawling ***************');
		});
	}

	function startCrawling(){
		if(crawlerService.appConfig.forHowManyUrls){ // given this for testing purpose
		   urls.length = crawlerService.appConfig.forHowManyUrls;
		}
		console.log('urls',urls.length);
		ne.each(urls, function(url, i){
		    if(url.includes('</loc>')){
			    url = url.split('</loc>')[0];
			    requestMadeMap[url] = new ResponceHandler(url);
		    }
		}, options).then(function(debug) {
		    console.log('Finished', _.size(requestMadeMap));
		});
	}
		
	function ResponceHandler(url){
        var readStrm = throttledRequest(url)
	    .on('data', function (data) {
	      urlMap += data.toString(); 	
	    })
	    .on('end',function(){
	    	console.log('request done',++requestDone);
	    	console.log('end of ResponceHandler',url);
	    	delete requestMadeMap[url];
	    	if(_.size(requestMadeMap) == 0){
               event.emit('ON_ALL_RESPONCE_COMPLETED',true);
	    	}
	    })
	    .on('error',function(error){
	    	console.log(error);
	    	console.log('error while crawling');
	    	delete requestMadeMap[url];
	    	if(_.size(requestMadeMap) == 0){
               event.emit('ON_ALL_RESPONCE_COMPLETED',true);
	    	}
	    });
	    return readStrm;
	}

	initiliase();
}