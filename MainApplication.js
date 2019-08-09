exports.MainApplication = MainApplication;

function MainApplication(config){

	var self = this
	,   async = require('async')
  ,   pathLib = require('path')
	,   coreServicesMap = {}
	;

	function configure(cb){
      
       function step1(){
       	   configureServices(function(err,result){
                if(err){
               	  cb(err,null);
               	  return;
                }
                onConplete();
       	   }); 
       }

       function onConplete(){
       	  cb(null,true);
       }

       step1();
	}

	function configureServices(cb){
        async.mapSeries(config.services,configureCoreService,function(err,result){
            if(err){
           	  cb(err,null);
           	  return;
            }
            cb(null,true);
	    }); 
	}

	function configureCoreService(service,done){
        var path = getServicePath(service.name)
        ,   sClass
        ,   sClassInstance
        ;
        try{
          console.log(path)
          sClass = require(path);
        	sClassInstance = new sClass[service.name](self, service);
        	sClassInstance.configure(function(err,result){
        		if(err){
        		   done({reason:err},null);
        		   return;
        		}
        		coreServicesMap[service.name] = sClassInstance;
        		done(null,true);
        	});
        }catch(e){
        	console.log(e);
          console.log('error while configuring service');
        	done({reason:"error while configuring service"},null);
        }
	} 

	function getServicePath(serviceName){
    return pathLib.resolve(config.serviceLocations+serviceName+'.js');
	}

	function getService(serviceName, cb){
		if(coreServicesMap[serviceName]){
			return cb(coreServicesMap[serviceName]);
		}
    configureCoreService({name:serviceName},function(error, result){
        if(error){
          cb(null);
          return;
        }
        return cb(coreServicesMap[serviceName]);
    });
	}

  function getAppConfig(){
    return config;
  }

	this.configure = configure;
	this.getService = getService;
  this.getAppConfig = getAppConfig;
	return this;
}