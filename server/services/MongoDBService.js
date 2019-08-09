exports.MongoDBService = MongoDBService;

function MongoDBService(ls, config){

	var self = this
	,   mongo = require('mongodb').MongoClient
  ,   _     = require('lodash')
  ,   ObjectID = mongo.ObjectID
  ,   connectionCache = {}
	,   urlToMap = {}
	;

	function configure(cb){
      createDBConnection(function(err,res){
    	    if(err){
    	  	  cb(err,null);
    	  	  return;
    	    }
    	    console.log(config.name+' service started');
    	    cb(null,true);
      });
	}

	function set(key,value){
    	self[key] = value;
  }

  function get(key){
    	return self[key] ? self[key] : null;
  }

	function createDBConnection(onComplete){
		getConnectionFromServerInfo(config.connectionJSON,function(connection){
        if(connection){
        	set('indexedDBConnection',connection);
        	onComplete(null,true);
        	return;
        }else{
          onComplete({'error':'error while getting getIndexDBConnection : '},null);
          return;
        }
	  });
	}

	function getConnectionFromServerInfo(dbServerInfo,cb){
     var obj = dbServerInfo.connectionJSON || {}
     ,   config = _.extend(dbServerInfo,obj)
     ,   url = generateMongoUrl(config)
     ,   connection
     ;

     if(urlToMap[url+config.database] && urlToMap[url+config.database]._state == 2){
         connection = urlToMap[url];
         cb(connection);
     }else{
     	   getMongoDBConnectionObjFromUrl(url,config.database,function(db){
     	   	  connectionCache[config.database] = db;
            cb(db); 
         });
     }
  }

  function connectToDB(url,dbName,cb){
      mongo.connect(url, { useNewUrlParser: true },function(err, db) {
          if(err){
            console.log(err);
            console.log('error while creating db connection');
            console.log('you may have to install mongo db or start mongod deamon');
            return;
          };
          console.log('connection created on url : %s ,db : %s',url,dbName);
          var dbo = db.db(dbName);
          cb(dbo);
      });
  }

  function generateMongoUrl(info){
      var str = 'mongodb://'+info.ip+':'+info.port+'/';
      return str;
  }

  function getMongoDBConnectionObjFromUrl(url,database,cb){
      connectToDB(url,database,function(db){
          urlToMap[url+database] = db;
          cb(db);
      });
  }

  function getConnection(key,cb){
  	if(connectionCache[key]){
  	  	cb(null,connectionCache[key]);
  	  	return;
  	}
  }

  function afterQueryExecution(meta,cb,dberr,dbRes){
      if(dberr){
       	console.log('DBERROR in for '+meta.identifier);
       	cb(dberr,dbRes);
       	return;
      }
      cb(null,dbRes);
  }

  function find(identifier,collection,query,option,cb){
      getConnection(identifier,function(err,db){
          var meta = {'identifier':identifier,timeStamp:new Date()};
          if(err){
              log.error('%s ERROR '+err+','+JSON.stringify(meta));
              cb(err,null);
              return; 
          }
          db.collection(collection).find(query,option).toArray(afterQueryExecution.bind(self,meta,cb));
      });
  }

  function findOne(identifier,collection,query,option,cb){
	 	getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).findOne(query,option,afterQueryExecution.bind(self,meta,cb));
    });
	}

  function save(identifier,collection,data,cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            console.log('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).insertOne(data,afterQueryExecution.bind(self,meta,cb));
    });
	}

  function inserMany(identifier,collection,data,option,cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            console.log('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).insertMany(data,option,afterQueryExecution.bind(self,meta,cb));
    });
  }

	function update(identifier,collection,query,field,option,cb){
	 	getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            console.log('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).updateOne(query,field,option,afterQueryExecution.bind(self,meta,cb));
    });
	}

	function createTextIndex(identifier,collection,field,cb){
		getConnection(identifier,function(err,db){
	      var meta = {'identifier':identifier,timeStamp:new Date()};
	      if(err){
	          console.log('%s ERROR '+err+','+JSON.stringify(meta));
	          cb(err,null);
	          return; 
	      }
	      db.collection(collection).createIndex(field,afterQueryExecution.bind(self,meta,cb));
    });
	}

	this.find = find;
	this.save = save;
	this.update = update;
  this.findOne = findOne;
  this.inserMany = inserMany;
	this.createTextIndex = createTextIndex;
	this.configure = configure;
}