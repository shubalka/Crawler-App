exports.ControlExecutionService = ControlExecutionService;

function ControlExecutionService(ls, config){

	var self = this
	,   queueMap = {}
	;

	function configure(cb){
       cb(null,true);
	}

	function pushAndExecute(key, functionToCall, functionArgs){
        
        if(!queueMap[key]){
        	queueMap[key] = new QueueExecuter(key, onCompleteQueue);
        }

        queueMap[key].execute(functionToCall, functionArgs);
	}

	function onCompleteQueue(key){
		if(queueMap[key]){
			delete queueMap[key];
		}
	}

	function QueueExecuter(key, onCompleteQueue){

		var self = this
		,   queueRequests = []
		,   state = 'notRunning'
		,   counter = 0;
		;

		function execute(functionToCall, functionArgs){
            
            function pushAndStartExecution(){
                var info = {};
                info.functionToCall = functionToCall; 
                info.functionArgs = functionArgs;
                queueRequests.push(info);

                if(state == 'notRunning'){
               	   startExecution();
                } 
            }

            pushAndStartExecution();
		}

		function startExecution(){
		    state = 'running';
		    var info = queueRequests.shift();
		    info.functionToCall.call(this, info.functionArgs, function(error, result){
		   	    if(error){
		   	   	  console.log('error while executing queueRequests');
		   	  	  return;
		   	    }
		   	    info.functionToCall = null;
		   	    info = null;
		   	    continueExecution();
		    });
		}

		function continueExecution(){
			if(queueRequests.length > 0){
				setImmediate(function(){
				   startExecution();	
				});
				return;
			}
			state = 'notRunning';
			onCompleteQueue(key);
		}

		this.execute = execute;
	}

	this.configure = configure;
	this.pushAndExecute = pushAndExecute;
}