console.log('ICO Transaction v33 - Auto');

var defaultPageSize = 8;
var __token = $('input[name="__RequestVerificationToken"]').val();
var COIN_LIMIT = 100;

var correctCaptcha = function (t) {
    var datapost = {};
    datapost.Code = $('input[name="robot-check"]').val();
    if (datapost.Code == null || datapost.Code.trim().length < 5) {
        $('input[name="robot-check"]').css('border', '1px solid #ac2925');
        bootbox.dialog({
            size: 'small',
            message: "Captcha is invalid. Please try again",
            title: "Warning",
            buttons: {
                confirm: {
                    label: '<i class="fa fa-times"></i> Close',
                    className: "btn-warning button-bootbox-close"
                }
            }
        });
        return;
    }
    datapost.__RequestVerificationToken = __token;
    $.ajax({
        url: urlRobotCheck,
        data: datapost,
        type: 'POST',
        dataType: 'json',
        beforeSend: function () {

        },
        success: function (data) {
            if (data.Result == "OK") {

                var footer = [];
                footer.push('<div class="modal-footer"><button class="btn btn-default btn-ico-custome" data-dismiss="modal">Cancel</button><button class="btn btn-warning btn-ico-custome" id="btn-submit-buy">Buy</button></div>');
                if ($('#div-modal-content-buy-ico').find('.modal-footer').length == 0) {
                    $('#div-modal-content-buy-ico').append(footer.join(''));
                }
                if ($('#div-captcha-check').length == 0) {
                    var html = [];
                    html.push('<div class="row-item" id="div-captcha-check">');
                    html.push('<div class="left">Input captcha</div>');
                    html.push('<div class="right">');
                    html.push('<input type="text" name="captcha" class="form-control" placeholder="">');
                    html.push('<img class="img-captcha" src="'+data.Data+'" /><i class="fa fa-refresh refresh-captcha"></i></div>');
                    html.push('</div>');
                    $(html.join('')).insertBefore('#google-check-bot');
                    $('#google-check-bot').remove();
                }
            }
            else {
                bootbox.dialog({
                    size: 'small',
                    message: "Captcha is invalid. Please try again",
                    title: "Warning",
                    buttons: {
                        confirm: {
                            label: '<i class="fa fa-times"></i> Close',
                            className: "btn-warning button-bootbox-close"
                        }
                    }
                });
            }

        },
        error: function (data) {
			correctCaptcha(t);
        }
    });
}

var ICOItem = function (item) {
    var self = this;
    this.Id = item.Id;
    this.TotalCoin = parseFloat(item.TotalCoin);
    this.SoldCoin = parseFloat(item.SoldCoin);
    if (this.SoldCoin > this.TotalCoin) {
        this.SoldCoin = this.TotalCoin;
    }
    this.TimeICO = item.TimeICO;
    this.TimeBuyICO = item.TimeBuyICO;
    this.OpenBuyTime = item.OpenBuyTime;
    this.OpenICOTime = item.OpenICOTime;
    this.Price = item.Price;
    this.Limit = Number(parseFloat(item.Limit).toFixed(8));
    this.TimeLeft = item.TimeLeft;

    //this.Day = ko.observable();
    //this.Hour = ko.observable();
    //this.Minute = ko.observable();
    //this.Second = ko.observable();
    this.BuyICO = false;
};

$('#div-buy-uch').on('hidden.bs.modal', function (e) {
    $('input[name="amount--coin--ver2"]').val('');
    $('input[name="amount--uch--ver2"]').val('');
});

var ICOTransaction = function () {
    var self = this;
    self.RefreshCaptcha = 0;
    self.Limit = 0;
    self.MaxBuy = 0;
    self.ICO = ko.observable();
    self.Price = ko.observable();
    self.UserWallet = ko.observable();
    self.Blockchain = 'BTC';
    self.transactionList = ko.observableArray([]);

    self.pagination = new pagination();

    self.pagination.pageChanged(function (pageIndex) {
        self.GetListTransaction(pageIndex);
    });
    this.init = function (data, userWallet) {
        self.Limit = data.Limit;
        self.ICO(new ICOItem(data));

        var ico_info = new xyz();

        if (data.TotalCoin > 0) {
            var percent = Number(parseFloat(data.SoldCoin * 100 / data.TotalCoin).toFixed(2));
            if (percent == 100 && data.SoldCoin < data.TotalCoin) {
                percent = 99.9999;
            }
            $('#process--ico').css('width', percent + '%').attr('aria-valuenow', percent).html(percent + '%');
        }
        var eventTime = moment(ico_info.s());//moment(moment(ico_info.s()).format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");// moment(item.TimeICO);
        var currentTime = moment();// moment(moment.utc().format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");
        if (data.OpenICOTime) {
            $('#buy--ico--now').removeClass('enabled');
            var diffTime = parseInt(data.TimeLeft);// eventTime.unix() - currentTime.unix();
            diffTime = diffTime < 0 ? 0 : diffTime;
			
			self.setReloadTimeout(diffTime);	// Reload 5 minutes before ICO to avoid timeout
			
            var clock2 = $('#buy--ico--time').FlipClock({
                clockFace: 'DailyCounter',
                autoStart: false,
                callbacks: {
                    stop: function () {
                        var html = [];
                        html.push('<h4 class="buy-ico-title-time"><img src="/Content/images/time-buy-ico.png" />ICO STARTS NOW: </h4>');
                        html.push('<div class="ico-action text-center enabled">');
                        html.push('<button class="btn btn-warning enabled" id="buy--ico--now">BUY UCH</button>');
                        html.push('</div>');
                        $('#div-time-count-down').html(html.join(''));
                        self.ICO().BuyICO = true;
                        
                        self.OpenBuyICO();   // Auto Open Buy Menu after timeout
                    }
                }
            });

            clock2.setTime(diffTime);
            clock2.setCountdown(true);
            clock2.start();

        }
        else {
            var _currentTime = moment();// moment(moment.utc().format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");
            var _diffTime = parseInt(data.TimeLeft);// eventTime.unix() - _currentTime.unix();
            if (_diffTime < 0) {
                $('#div-time-count-down').removeClass('enabled');
                $('#div-time-count-down-open').removeClass('enabled');
                $('#div-time-count-down-close').addClass('enabled');
                $('#buy--ico--now').removeClass('enabled');
            }
            else {
                if (data.OpenBuyTime == 1) {
                    //on going
                    self.ICO().BuyICO = true;
                }
                else if (data.OpenBuyTime == 2) {
                    //next ico
                    $('#buy--ico--now').removeClass('enabled');
                    $('#div-time-count-down').addClass('enabled');
                    $('#div-time-count-down-open').removeClass('enabled');
                    var _eventTime = moment(ico_info.e());// moment(moment(ico_info.e()).format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");// moment(item.TimeBuyICO);

                    var diffTime = parseInt(data.TimeLeft);//  _eventTime.unix() - currentTime.unix();
                    diffTime = diffTime < 0 ? 0 : diffTime;
					
					self.setReloadTimeout(diffTime);	// Reload 5 minutes before ICO to avoid timeout
					
                    var clock2 = $('#buy--ico--time').FlipClock({
                        clockFace: 'DailyCounter',
                        autoStart: false,
                        callbacks: {
                            stop: function () {
                                var html = [];
                                html.push('<h4 class="buy-ico-title-time"><img src="/Content/images/time-buy-ico.png" />ICO STARTS NOW: </h4>');
                                html.push('<div class="ico-action text-center enabled">');
                                html.push('<button class="btn btn-warning enabled" id="buy--ico--now">BUY UCH</button>');
                                html.push('</div>');
                                $('#div-time-count-down').html(html.join(''));
                                self.ICO().BuyICO = true;
                                
                                self.OpenBuyICO();  // Auto Open Buy Menu after timeout
                            }
                        }
                    });

                    clock2.setTime(diffTime);
                    clock2.setCountdown(true);
                    clock2.start();

                }
                else {
                    $('#buy--ico--now').removeClass('enabled');
                    $('#div-time-count-down').removeClass('enabled');
                    $('#div-time-count-down-open').removeClass('enabled');
                    $('#div-time-count-down-close').addClass('enabled');
                }
            }
        }

        self.UserWallet(userWallet);
        ko.applyBindings(self, $('#div-ico-controller')[0]);
        self.GetListTransaction(1, function () {

        });

    };
	
	this.setReloadTimeout = function(diffTime){
		//if(diffTime && diffTime > 300){
		//	console.log('Set auto Reload Window after: '+Math.floor(diffTime - 300)+'s');
		//	setTimeout(function(){window.location.reload();}, Math.floor(diffTime - 300) * 1000);
		//}
	}

    this.refreshCaptcha = function () {
        var datapost = {};
        datapost.__RequestVerificationToken = __token;
        $.ajax({
            url: urlRefresh,
            data: datapost,
            type: 'POST',
            dataType: 'json',
            beforeSend: function () {
                console.log('Sending Refresh Captcha Request');
            },
            success: function (data) {
                if (data.Result == "OK") {
                    $('.img-captcha').attr('src', data.Data);
                    //self.postCaptcha();     // Auto Post Captcha
                }
                else {
                    setTimeout(function(){self.refreshCaptcha(); bootbox.hideAll();}, 1000); // Retry refreshing captcha after 1 second
                    
                    bootbox.dialog({
                        message: data.Message,
                        title: "Warning",
                        buttons: {
                            confirm: {
                                label: '<i class="fa fa-times"></i> Close',
                                className: "btn-warning button-bootbox-close"
                            }
                        }
                    });
                }
            },
            error: function (data) {
                self.refreshCaptcha();		// Resend Captcha Request
            }
        });
    };

    this.refreshRobotCaptcha = function () {
        var datapost = {};
        datapost.__RequestVerificationToken = __token;
        $.ajax({
            url: urlRefreshRobot,
            data: datapost,
            type: 'POST',
            dataType: 'json',
            beforeSend: function () {
                console.log('Sending Refresh Robot Captcha Request');
            },
            success: function (data) {
                if (data.Result == "OK") {
                    $('.img-robot-captcha').attr('src', data.Data);
                    //self.postRobotCaptcha(data.Data);
                }
                else {
                    if(data.Message === 'The UCH ICO hasn’t started yet'){
                        setTimeout(function(){self.refreshRobotCaptcha(); bootbox.hideAll();}, 1000); // Retry refreshing robot captcha after 1 second
                    }
                    bootbox.dialog({
                        message: data.Message,
                        title: "Warning",
                        buttons: {
                            confirm: {
                                label: '<i class="fa fa-times"></i> Close',
                                className: "btn-warning button-bootbox-close"
                            }
                        }
                    });
                }
            },
            error: function (data) {
                self.refreshRobotCaptcha();
            }
        });
    };

    this.transferCoin = function (type) {
        if (type == 1) {
            var total_coin = parseFloat($('input[name="amount--coin--ver2"]').val().trim());
            var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
            var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
            var amount = parseFloat(total_coin * __price / __priceICO).toFixed(8);
            $('input[name="amount--uch--ver2"]').val(amount);
        }
        else {
            var total_coin = parseFloat($('input[name="amount--uch--ver2"]').val().trim());
            var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
            var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
            var amount = parseFloat(total_coin * __priceICO / __price).toFixed(8);
            $('input[name="amount--coin--ver2"]').val(amount);
        }
    };
    this.buyAll = function () {
        if (!self.ICO().BuyICO) {
            return;
        }
        var total_coin = self.Blockchain == "BTC" ? parseFloat(self.UserWallet().BTC).toFixed(8) : parseFloat(self.UserWallet().ETH).toFixed(8);
        var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
        var amount = parseFloat(total_coin * __price / self.ICO().Price).toFixed(8);
        $('input[name="amount--coin--ver2"]').val(total_coin);
        $('input[name="amount--uch--ver2"]').val(amount);
    };
    this.changeBTC = function () {
        if (!self.ICO().BuyICO) {
            return;
        }
        $('input[name="amount--coin--ver2"]').val('');
        $('input[name="amount--uch--ver2"]').val('');
        self.Blockchain = 'BTC';
        $('#div--amount--coin').html(self.Blockchain + ' amount');
        $('#btn-bitcoin').addClass('btn-success').removeClass('btn-default');
        $('#btn-ethereum').removeClass('btn-success').addClass('btn-default');
        $('#total--coin--can').html(parseFloat(self.UserWallet().BTC).toFixed(8));
        $('#price--coin').html(parseFloat(self.Price().btc_last_price).toFixed(2));
        $('#span--blockchain').html(self.Blockchain);
        $('#price--coin-label').html('1 BTC');
        var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
        var __price = Number(parseFloat(self.Price().btc_last_price).toFixed(2));
        var amount = Number(parseFloat(self.UserWallet().BTC * __price / __priceICO).toFixed(8));
        amount = amount > self.Limit ? self.Limit : amount;
        if (amount > self.ICO().TotalCoin - self.ICO().SoldCoin) {
            amount = self.ICO().TotalCoin - self.ICO().SoldCoin;
        }
        amount = parseFloat(amount).toFixed(8);
        self.MaxBuy = Number(amount);
        $('#max--coin-label').html(amount);
    };

    this.changeETH = function () {
        if (!self.ICO().BuyICO) {
            return;
        }
        $('input[name="amount--coin--ver2"]').val('');
        $('input[name="amount--uch--ver2"]').val('');
        self.Blockchain = 'ETH';
        $('#div--amount--coin').html(self.Blockchain + ' amount');
        $('#total--coin--can').html(parseFloat(self.UserWallet().ETH).toFixed(8));
        $('#btn-ethereum').addClass('btn-success').removeClass('btn-default');
        $('#btn-bitcoin').removeClass('btn-success').addClass('btn-default');
        $('#span--blockchain').html(self.Blockchain);
        $('#price--coin-label').html('1 ETH');
        $('#price--coin').html(parseFloat(self.Price().eth_last_price).toFixed(2));

        var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
        var __price = Number(parseFloat(self.Price().eth_last_price).toFixed(2));
        var amount = Number(parseFloat(self.UserWallet().ETH * __price / __priceICO).toFixed(8));
        amount = amount > self.Limit ? self.Limit : amount;
        if (amount > self.ICO().TotalCoin - self.ICO().SoldCoin) {
            amount = self.ICO().TotalCoin - self.ICO().SoldCoin;
        }
        amount = parseFloat(amount).toFixed(8);
        self.MaxBuy = Number(amount);
        $('#max--coin-label').html(amount);
    };

    this.OpenBuyICO = function () {
        var datapost = {};
        datapost.__RequestVerificationToken = __token;
        $.ajax({
            url: urlGetPrice,
            data: datapost,
            type: "get",
            contentType: "application/json;charset=utf-8",
            beforeSend: function () {
                main.ctr_shw_loadng();
                
            },
            success: function (data) {
                $('#div-buy-uch').remove();
                $('body').append(data);
                $('#div-buy-uch').modal('show');
                self.Price(localPrice);			

                $('#btn-bitcoin').click();
				
				self.SetBuyMax(); // Auto fill in buy amount
                
                //if($('.img-robot-captcha').length){		// If there is robot captcha then submit it to Anti-captcha
                //    postRobotCaptcha($('.img-robot-captcha').first().attr('src'));
                //}
                //else 
					
				if(data.indexOf('ICO has not started yet') !== -1){
                    console.log('ICO has not started yet - Retry after 1 seconds!');
                    setTimeout(function(){self.OpenBuyICO();}, 1000);
                }
            },
            error: function (data) {
                self.OpenBuyICO();
            }
        });
    };

    this.Buy = function () {
        var blockchain = self.Blockchain;
        var captcha = $('input[name="captcha"]').val();
        if (captcha == null || captcha.trim().length < 5) {
            $('input[name="captcha"]').css('border', '1px solid #ac2925');
            bootbox.dialog({
                size: 'small',
                message: "Captcha is invalid. Please try again",
                title: "Warning",
                buttons: {
                    confirm: {
                        label: '<i class="fa fa-times"></i> Close',
                        className: "btn-warning button-bootbox-close"
                    }
                }
            });
            return;
        }
        var amount = $('input[name="amount--uch--ver2"]').val();
        var coinPaid = $('input[name="amount--coin--ver2"]').val();

        if (coinPaid == null || coinPaid.trim().length == 0 || isNaN(coinPaid) || coinPaid <= 0) {
            $('input[name="amount--coin--ver2"]').css('border', '1px solid red');
            setTimeout(function () {
                $('input[name="amount--coin--ver2"]').removeAttr('style');
            }, 3000);
            bootbox.dialog({
                size: 'small',
                message: "Amount " + self.Blockchain + " is invalid",
                title: "Warning",
                buttons: {
                    confirm: {
                        label: '<i class="fa fa-times"></i> Close',
                        className: "btn-warning button-bootbox-close"
                    }
                }
            });
            return;
        }
        if (amount == null || amount.trim().length == 0 || isNaN(amount) || amount <= 0) {
            $('input[name="amount--uch--ver2"]').css('border', '1px solid red');
            setTimeout(function () {
                $('input[name="amount--uch--ver2"]').removeAttr('style');
            }, 3000);
            bootbox.dialog({
                size: 'small',
                message: "UCH amount is invalid",
                title: "Warning",
                buttons: {
                    confirm: {
                        label: '<i class="fa fa-times"></i> Close',
                        className: "btn-warning button-bootbox-close"
                    }
                }
            });
            return;
        }
        var coin_available = self.Blockchain == "BTC" ? parseFloat(self.UserWallet().BTC).toFixed(8) : parseFloat(self.UserWallet().ETH).toFixed(8);
        coinPaid = parseFloat(coinPaid);
        coin_available = Number(coin_available);
        if (coinPaid > coin_available) {
            bootbox.dialog({
                size: 'small',
                message: "Your wallet " + self.Blockchain + "'s balance is not enough",
                title: "Warning",
                buttons: {
                    confirm: {
                        label: '<i class="fa fa-times"></i> Close',
                        className: "btn-warning button-bootbox-close"
                    }
                }
            });
            return;
        }

        var _limit = self.ICO().Limit;
        if (self.ICO().Limit > self.ICO().TotalCoin - self.ICO().SoldCoin) {
            _limit = self.ICO().TotalCoin - self.ICO().SoldCoin;
        }
        amount = Number(parseFloat(amount).toFixed(8));
        _limit = Number(parseFloat(_limit).toFixed(8));
        if (amount > _limit) {
            bootbox.dialog({
                size: 'small',
                message: "The maximum amount of UCH that you can buy: " + Number(_limit),
                title: "Warning",
                buttons: {
                    confirm: {
                        label: '<i class="fa fa-times"></i> Close',
                        className: "btn-warning button-bootbox-close"
                    }
                }
            });
            return;
        }



        var post = {};
        post.__RequestVerificationToken = __token;
        post.blockchain = blockchain;
        post.amount = amount;
        post.captcha = captcha.trim();
        post.coinPaid = coinPaid;
        post.calendar = self.ICO().Id;
        post.PriceCoin = self.Blockchain == "BTC" ? self.Price().btc_last_price : self.Price().eth_last_price;
        $.ajax({
            url: urlBuy,
            data: post,
            type: 'POST',
            dataType: 'json',
            beforeSend: function () {
                main.ctr_shw_loadng();
            },
            success: function (data) {
                if (data.Result == "OK") {
                    if (data.Data.IsSuccess) {
                        //$('#div-buy-uch').modal('hide');
                        self.refreshCaptcha(); // Get a new Captcha & try buying again
                        bootbox.dialog({
                            message: 'Wow! You have successfully bought UCH! Congratulations!',
                            title: "",
                            buttons: {
                                confirm: {
                                    label: '<i class="fa fa-times"></i> Close',
                                    className: "btn-warning button-bootbox-close",
                                    callback: function () {
                                        window.location.reload();
                                    }
                                }
                            }
                        });
                        //setTimeout(function () { window.location.reload(); }, 2000);
                    }
                    else {
                        self.HandleSubmissionError(data.Data.Message); // Handle Error and retry 
                        
                        bootbox.dialog({
                            message: data.Data.Message,
                            title: "Warning",
                            buttons: {
                                confirm: {
                                    label: '<i class="fa fa-times"></i> Close',
                                    className: "btn-warning button-bootbox-close"
                                }
                            }
                        });
                    }
                }
                else {
                    self.HandleSubmissionError(data.Message);       // Handle Error and retry 
                    
                    bootbox.dialog({
                        message: data.Message,
                        title: "Warning",
                        buttons: {
                            confirm: {
                                label: '<i class="fa fa-times"></i> Close',
                                className: "btn-warning button-bootbox-close"
                            }
                        }
                    });
                }

            },
            error: function (data) {
                self.Buy();
            }
        });
    };
    
    this.HandleSubmissionError = function (message){
        console.log(message);
        setTimeout(function(){bootbox.hideAll();}, 2000);
        if(message === 'ICO has not started yet'){
            // Submit 2 seconds later
            setTimeout(function(){self.Buy();}, 2000);
        }
        if(message && message.toLowerCase().indexOf('captcha') !== -1){
            // There is some problem with captcha -> Refresh it then buy
            self.refreshCaptcha();
        }
    }

    this.GetListTransaction = function (pageIndex, callback) {
        var datapost = {};
        datapost.pageIndex = pageIndex;
        datapost.pageSize = defaultPageSize;
        datapost.calendar = self.ICO().Id;
        datapost.all = $('#select-transaction').val();
        datapost.__RequestVerificationToken = __token;
        $.ajax({
            url: urlTransaction,
            data: datapost,
            type: 'POST',
            dataType: 'json',
            beforeSend: function () {
                //main.ctr_shw_loadng();
                $('#select-transaction').attr('disabled', true);
            },
            success: function (data) {
                if (data.Result == "OK") {
                    $('#select-transaction').removeAttr('disabled');
                    self.transactionList.removeAll();
                    //var _totalPage = Math.floor(data.Records.TotalCount / defaultPageSize);
                    //if (_totalPage * defaultPageSize < data.Records.TotalCount) {
                    //    _totalPage++;
                    //}
                    //self.pagination.initData(pageIndex, defaultPageSize, _totalPage);
                    var index = 0;
                    $.each(data.Records.Records, function (key, val) {
                        index++;
                        val.Amount = parseFloat(val.Amount).toFixed(8);
                        var utcTime = moment(val.CreatedDate).format('YYYY-MM-DD HH:mm:ss');
                        val.DateCreated = utcTime;
                        self.transactionList.push(val);

                    });

                    if (index == 0) {
                        $('#no-item-found-alert').addClass('enabled');
                        var html = "";

                        html = "You have not made any transactions. Once you do, they will appear here.";
                        $('#no-item-found-alert td').html('<div class="text-center">' + html + '</div>');
                    }
                    else {
                        $('#no-item-found-alert').removeClass('enabled');
                    }
                    if (callback) {
                        callback();
                    }
                }
            },
            error: function (data) {
                $('#select-transaction').removeAttr('disabled');
            }
        });

    };
    
    
    
    // ================================= Custom Functions =========================================
    
    // ---- Buy Max ----
    this.SetBuyMax = function(){
        var amountToSet = self.MaxBuy > 0 ? self.MaxBuy : COIN_LIMIT;
        $('input[name="amount--uch--ver2"]').val(amountToSet);
        self.transferCoin(2);
    }
    
    // ---- Captcha ----
    this.postCaptcha = function () {
        startCaptchaPostingTime = new Date().getTime();
	
    	var fullCaptcha = $('img.img-captcha').first().attr('src');
    	var captcha = fullCaptcha.substring(fullCaptcha.indexOf(','));
    	
    	var datapost = {};
    	datapost.clientKey = '2f44bb12ea547e79dbc2f4d692f736cf';
    	datapost.task = {};
    	datapost.task.type = 'ImageToTextTask';
    	datapost.task.body = captcha;
    	datapost.task.phrase = false;
    	datapost.task.case = false;
    	datapost.task.numeric = false;	
    	
    	$.ajax({
    		url: 'https://api.anti-captcha.com/createTask ',
    		data: JSON.stringify(datapost),
    		type: 'POST',
    		dataType: 'json',
    		beforeSend: function () {
    			console.log('Sending Captcha to Anti-captcha');
    		},
    		success: function (data) {				
    			if(data.taskId){
    				console.log('Task Created:' + data.taskId);
    				setTimeout(function(){self.getCaptcha(data.taskId);}, 2000);
    			}else{
    				console.log(data);
    			}				
    		},
    		error: function (data) {
    			console.log(data);
    		}
    	});
    }
    
    this.getCaptcha = function(taskId){
        var datapost = {};
    	datapost.clientKey = '2f44bb12ea547e79dbc2f4d692f736cf';
    	datapost.taskId = parseInt(taskId);
    	
    	$.ajax({
    		url: 'https://api.anti-captcha.com/getTaskResult',
    		data: JSON.stringify(datapost),
    		type: 'POST',
    		dataType: 'json',
    		beforeSend: function () {
    			console.log('Try getting Anti-captcha');
    		},
    		success: function (data) {
    			console.log(data);
    			if(data.solution && data.solution.text){
    				console.log('Solved: ' + data.solution.text.toLowerCase());
    				$('input[name="captcha"]').val(data.solution.text.toLowerCase());
    				console.log((new Date().getTime() - startCaptchaPostingTime)/1000);
    				
    				if(self.ICO().BuyICO){	// Submit immediately if ICO Started
    				    self.Buy();
    				}
    				
    			}else{
    				setTimeout(function(){self.getCaptcha(taskId);}, 1000);
    			}
    		},
    		error: function (data) {
    			console.log(data);
    		}
    	});
    }
    
    // ---- Robot Captcha ---     
    this.postRobotCaptcha = function (fullCaptcha) {
        startCaptchaPostingTime = new Date().getTime();
	
    	var captcha = fullCaptcha.substring(fullCaptcha.indexOf(','));
    	
    	var datapost = {};
    	datapost.clientKey = '2f44bb12ea547e79dbc2f4d692f736cf';
    	datapost.task = {};
    	datapost.task.type = 'ImageToTextTask';
    	datapost.task.body = captcha;
    	datapost.task.phrase = false;
    	datapost.task.case = false;
    	datapost.task.numeric = false;	
    	
    	$.ajax({
    		url: 'https://api.anti-captcha.com/createTask ',
    		data: JSON.stringify(datapost),
    		type: 'POST',
    		dataType: 'json',
    		beforeSend: function () {
    			console.log('Sending Robot Captcha to Anti-captcha');
    		},
    		success: function (data) {				
    			if(data.taskId){
    				console.log('Task Created:' + data.taskId);
    				setTimeout(function(){self.getRobotCaptcha(data.taskId);}, 2000);
    			}else{
    				console.log(data);
    			}				
    		},
    		error: function (data) {
    			console.log(data);
    		}
    	});
    }
    
    this.getRobotCaptcha = function(taskId){
        var datapost = {};
    	datapost.clientKey = '2f44bb12ea547e79dbc2f4d692f736cf';
    	datapost.taskId = parseInt(taskId);
    	
    	$.ajax({
    		url: 'https://api.anti-captcha.com/getTaskResult',
    		data: JSON.stringify(datapost),
    		type: 'POST',
    		dataType: 'json',
    		beforeSend: function () {
    			console.log('Try getting Anti-captcha for Robot Captcha');
    		},
    		success: function (data) {
    			console.log(data);
    			if(data.solution && data.solution.text){
    				console.log('Solved: ' + data.solution.text.toLowerCase());
    				$('input[name="robot-check"]').val(data.solution.text.toLowerCase());
    				self.correctRoboCaptcha();
    				console.log((new Date().getTime() - startCaptchaPostingTime)/1000);
    			}else{
    				setTimeout(function(){self.getCaptcha(taskId);}, 1000);
    			}
    		},
    		error: function (data) {
    			console.log(data);
    		}
    	});
    }
	
	this.correctRoboCaptcha = function () {
		var datapost = {};
		datapost.Code = $('input[name="robot-check"]').val();
		if (datapost.Code === null || datapost.Code.trim().length < 5) {
			$('input[name="robot-check"]').css('border', '1px solid #ac2925');
			bootbox.dialog({
				size: 'small',
				message: "Captcha is invalid. Please try again",
				title: "Warning",
				buttons: {
					confirm: {
						label: '<i class="fa fa-times"></i> Close',
						className: "btn-warning button-bootbox-close"
					}
				}
			});
			$('.refresh-robot-captcha').click(); // Auto refresh Robot Captcha if Invalid
			return;
		}
		datapost.__RequestVerificationToken = __token;
		$.ajax({
			url: urlRobotCheck,
			data: datapost,
			type: 'POST',
			dataType: 'json',
			beforeSend: function () {

			},
			success: function (data) {
				if (data.Result == "OK") {

					var footer = [];
					footer.push('<div class="modal-footer"><button class="btn btn-default btn-ico-custome" data-dismiss="modal">Cancel</button><button class="btn btn-warning btn-ico-custome" id="btn-submit-buy">Buy</button></div>');
					if ($('#div-modal-content-buy-ico').find('.modal-footer').length == 0) {
						$('#div-modal-content-buy-ico').append(footer.join(''));
					}
					if ($('#div-captcha-check').length == 0) {
						var html = [];
						html.push('<div class="row-item" id="div-captcha-check">');
						html.push('<div class="left">Input captcha</div>');
						html.push('<div class="right">');
						html.push('<input type="text" name="captcha" class="form-control" placeholder="">');
						html.push('<img class="img-captcha" src="'+data.Data+'" /><i class="fa fa-refresh refresh-captcha"></i></div>');
						html.push('</div>');
						$(html.join('')).insertBefore('#google-check-bot');
						$('#google-check-bot').remove();
					}
				}
				else {
					$('.refresh-robot-captcha').click(); // Auto refresh Robot Captcha if Invalid
					bootbox.dialog({
						size: 'small',
						message: "Captcha is invalid. Please try again",
						title: "Warning",
						buttons: {
							confirm: {
								label: '<i class="fa fa-times"></i> Close',
								className: "btn-warning button-bootbox-close"
							}
						}
					});
				}
			},
			error: function (data) {
				self.correctRoboCaptcha();            // Resend post request
			}
		});    
	}
};
