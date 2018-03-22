var web3, abi, TestingContract, contractInstance;

$(document).ready(function() {
	initWeb3(false);
	loadInsults();

	$('#insults-container').on("click", ".insultVoteButton", function() {
		var id = $(this).parent().attr("insultId");
    voteForInsult(id);
	});

	$('#make-insult-button').on('click', function() {
		var insult = $('#make-insult-text').val();
		if(insult!=undefined && insult!="") {
			makeNewInsult(insult);
			// sleep(2000);
			// loadInsults();
		}
	});
});

function initWeb3(isLocalHost) {
	if(isLocalHost) {
		web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	} else {
		web3 = new Web3(new Web3.providers.HttpProvider("http://188.166.104.12:8501"));
	}
	abi = JSON.parse('[{"constant":false,"inputs":[{"name":"_insultId","type":"uint256"}],"name":"voteForInsult","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_insult","type":"string"}],"name":"addInsult","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_insultId","type":"uint256"}],"name":"getVotesByInsultId","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_insultId","type":"uint256"}],"name":"getInsultById","outputs":[{"name":"","type":"uint256"},{"name":"","type":"string"},{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"insertPrice","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maxLength","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"insultCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"uint256"},{"indexed":false,"name":"text","type":"string"},{"indexed":false,"name":"writer","type":"address"}],"name":"InsultAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"uint256"},{"indexed":false,"name":"voteCount","type":"uint256"}],"name":"VoteAdded","type":"event"}]');

	TestingContract = web3.eth.contract(abi);
	contractInstance = TestingContract.at('0x936c9e82278cc484194c114d05b9c7ba8e599db9');

	// web3.eth.getAccounts((error, accounts) => {
  //   if(accounts[0]) {
  //     this.setState({ isLoggedIn: true });
  //   } else {
  //     this.setState({ isLoggedIn: false });
  //   }
  // });
}

var insultList = [];
var votesPerInsultId = [];

function loadInsults() {
	//clear container
	$('#insults-container').html("");
	insultList = [];
	votesPerInsultId = [];

	contractInstance.insultCount.call(function(err, insultCount){
    // console.log(insultCount);
		var insultByIdPromises = [];
		for(var insultId = 1; insultId <= insultCount; insultId++) {
			insultByIdPromises.push(createInsultByIdPromise(insultId));
		}

		//get votes
		var insultVotesByIdPromises = [];
		for(var insultId = 1; insultId <= insultCount; insultId++) {
			insultVotesByIdPromises.push(createInsultVotesByIdPromise(insultId));
		}

		Promise.all(insultVotesByIdPromises, insultByIdPromises).then(function(values) {
		  console.log(values);
			showInsults(values);
			//set events
			setEvents();
		});
	});
}

function setEvents() {
	// Listen for the `NewZombie` event, and update the UI
	var newInsultEvent = contractInstance.InsultAdded(function(error, result) {
	  if (error) return
	  addNewInsultToList(result.args.id.c[0], result.args.text, result.args.writer);
	})
}

function addNewInsultToList(id, text, address) {
	insultList.push([id, text, address]);
	votesPerInsultId[id] = 1;

	var fontSize = '30px';

	if(text.length > 150) {
		fontSize = '15px';
	} else if(text.length > 50) {
		fontSize = '20px';
	} else if(text.length > 20) {
		fontSize = '25	px';
	}

	var html = '<div class="insult newInsult" insultId="' + id + '" voteCount="1" style="opacity: 1; display: inline-block;">';

		html+= '<div class="insultText" style="font-size: ' + fontSize + ';">"';
		html+= text;
		html+= '"</div>';

		html+= '<div class="insultAddress">Insult by: ';
		html+= address;
		html+= '</div>';

		html+= '<div class="insultVotes"><b>Votes:</b> ';
		html+= 1;
		html+= '</div>';

		html+= '<div class="insultVoteButton"> ';
		html+= '+1';
		html+= '</div>';

	html+= '</div>';

	$('#insults-container').prepend(html);

	// $('#insults-container').html("");
 	// showInsults(insultList);
}

function showInsults(values) {
	//sort on votes
	insultList.sort(
    function(x, y)
    {
			var idx = x[0];
			var idy = y[0];
     	return votesPerInsultId[idy] - votesPerInsultId[idx];
    }
  );
	$.each(insultList, function(index, insult) {
		addInsultToContainer(insult);
	});
	//fade in
	$('.insult').each(function(i, obj) {
    $(obj).delay(i*200).css({
        opacity: 0,
        display: 'inline-block'
    }).animate({opacity:1},400);
	});
}

function addInsultToContainer(insult) {
	var id = insult[0];
	var text = insult[1];
	var address = insult[2];
	var votes = votesPerInsultId[id] != undefined ? votesPerInsultId[id] : 0;
	var fontSize = '30px';

	if(text.length > 150) {
		fontSize = '15px';
	} else if(text.length > 50) {
		fontSize = '20px';
	} else if(text.length > 20) {
		fontSize = '25	px';
	}

	var html = '<div class="insult" insultId="' + id + '" voteCount="' + votes + '">';

		html+= '<div class="insultText" style="font-size: ' + fontSize + ';">"';
		html+= text;
		html+= '"</div>';

		html+= '<div class="insultAddress">Insult by: ';
		html+= address;
		html+= '</div>';

		html+= '<div class="insultVotes"><b>Votes:</b> ';
		html+= votes;
		html+= '</div>';

		html+= '<div class="insultVoteButton"> ';
		html+= '+1';
		html+= '</div>';

	html+= '</div>';

	$('#insults-container').append(html);
}

function createInsultVotesByIdPromise(insultId) {
	var promise = new Promise(function(resolve, reject) {
		contractInstance.getVotesByInsultId(insultId, {from: web3.eth.accounts[0]}, function(err, data) {
			// console.log(data);
			if(data!=null) {
				votesPerInsultId[insultId] = data.c[0];
				resolve(data);
			} else {
				reject(Error("It broke"));
			}
		});
	});
	return promise;
}

function createInsultByIdPromise(insultId) {
	var promise = new Promise(function(resolve, reject) {
			contractInstance.getInsultById(insultId, {from: web3.eth.accounts[0]}, function(err, data) {
			// console.log(data);
			if(data!=null) {
				insultList.push([data[0].c[0], data[1], data[2]]);
				resolve(data);
			} else {
				reject(Error("It broke"));
			}
		});
	});
	return promise;
}

function errooooor() {
	console.log("eroooorrr");
}

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res);
    })
  );

function voteForInsult(insultId) {
	contractInstance.voteForInsult(insultId, {from: web3.eth.accounts[0]}, function(err, data) {
		if(err==null) {
			var currentVoteCount = $('.insult[insultId="' + insultId + '"]').attr("voteCount");
			var newCount = parseInt(currentVoteCount)+1;
			$('.insult[insultId="' + insultId + '"] .insultVotes').html('<b>Votes:</b> '+ newCount);
			$('.insult[insultId="' + insultId + '"]').attr("voteCount", newCount);
			votesPerInsultId[insultId] = newCount;

			//redraw insults
			// $('#insults-container').html("");
			// showInsults(insultList);
		}

	});
}

function makeNewInsult(text) {
	contractInstance.addInsult(text, {from: web3.eth.accounts[0], gas: 300000}, function(err, data) {

	});
}
