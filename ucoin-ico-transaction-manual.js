console.log('ICO Transaction v19 - Without reCaptcha - Auto Refresh Captcha');

var defaultPageSize = 8;
var __token = $('input[name="__RequestVerificationToken"]').val();
var COIN_LIMIT = 100;
var REFRESH_PRICE_AT = 5;
var SUBMIT_AFTER = 2;

var remainingTime = 0;
var startTime = 0;
var correctCaptcha = function (t) {
    if ($('#div-captcha-check').length === 0) {
        var html = [];
        html.push('<div class="row-item" id="div-captcha-check">');
        html.push('<div class="left">Input captcha</div>');
        html.push('<div class="right">');
        html.push('<input type="text" name="captcha" class="form-control" placeholder="">');
        html.push('<img class="img-captcha" src="" /><i class="fa fa-refresh refresh-captcha"></i></div>');
        html.push('</div>');
        $(html.join('')).insertBefore('#google-check-bot');
        //$('.refresh-captcha').click();
    }
}

correctCaptcha();

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
    // this.BuyICO = true;
};

$('#div-buy-uch').on('hidden.bs.modal', function (e) {
    $('input[name="amount--coin"]').val('');
    $('input[name="amount--uch"]').val('');
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
        
        console.log(self.ICO());

        var ico_info = new xyz();

        if (data.TotalCoin > 0) {
            var percent = Number(parseFloat(data.SoldCoin * 100 / data.TotalCoin).toFixed(2));
            $('#process--ico').css('width', percent + '%').attr('aria-valuenow', percent).html(percent + '%');
        }
        var eventTime = moment(ico_info.s());//moment(moment(ico_info.s()).format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");// moment(item.TimeICO);
        var currentTime = moment();// moment(moment.utc().format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");
		
        if (data.OpenICOTime) {
            $('#buy--ico--now').removeClass('enabled');
            var diffTime = parseInt(data.TimeLeft);// eventTime.unix() - currentTime.unix();
            diffTime = diffTime < 0 ? 0 : diffTime;
            remainingTime = diffTime;
            var clock2 = $('#buy--ico--time').FlipClock({
                clockFace: 'DailyCounter',
                autoStart: false,
                callbacks: {
                    stop: function () {
                        self.ICO().BuyICO = true;
                        setTimeout(function () {self.Buy();}, SUBMIT_AFTER * 1000);
                    },
                    interval : function (){
                        remainingTime--;
                        console.log(remainingTime);
                        if(remainingTime == REFRESH_PRICE_AT){
                            self.RefreshPrice();
                        }
                    }
                }
            });

            clock2.setTime(diffTime);
            clock2.setCountdown(true);
            clock2.start();

        }
        else {
            var _currentTime = moment();// moment(moment.utc().format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");
            var _diffTime = data.TimeLeft;// eventTime.unix() - _currentTime.unix();
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

                    var diffTime = data.TimeLeft;//  _eventTime.unix() - currentTime.unix();
                    diffTime = diffTime < 0 ? 0 : diffTime;
                    var clock2 = $('#buy--ico--time').FlipClock({
                        clockFace: 'DailyCounter',
                        autoStart: false,
                        callbacks: {
                            stop: function () {
                                window.location.reload();
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

        self.OpenBuyICO();
    };

    this.refreshCaptcha = function () {               
        // if (self.RefreshCaptcha == 1) { return; }
        // self.RefreshCaptcha = 1;
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
                // self.RefreshCaptcha = 0;
                $('.img-captcha').attr('src', data.Data);
                // self.postCaptcha();
            },
            error: function (data) {
                // self.RefreshCaptcha = 0;
                self.refreshCaptcha();
            }
        });
    };
    
    this.postCaptcha = function () {
        startTime = new Date().getTime();
	
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
    				console.log((new Date().getTime() - startTime)/1000);
    				// Submit immediately if ICO Started
    				if(self.ICO().BuyICO){
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

    this.transferCoin = function (type) {
        if (type == 1) {
            var total_coin = parseFloat($('input[name="amount--coin"]').val().trim());
            var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
            var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
            var amount = parseFloat(total_coin * __price / __priceICO).toFixed(8);
            $('input[name="amount--uch"]').val(amount);
        }
        else {
            var total_coin = parseFloat($('input[name="amount--uch"]').val().trim());
            var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
            var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
            var amount = parseFloat(total_coin * __priceICO / __price).toFixed(8);
            $('input[name="amount--coin"]').val(amount);
        }
    };
    this.buyAll = function () {
        if (!self.ICO().BuyICO) {
            return;
        }
        var total_coin = self.Blockchain == "BTC" ? parseFloat(self.UserWallet().BTC).toFixed(8) : parseFloat(self.UserWallet().ETH).toFixed(8);
        var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
        var amount = parseFloat(total_coin * __price / self.ICO().Price).toFixed(8);
        $('input[name="amount--coin"]').val(total_coin);
        $('input[name="amount--uch"]').val(amount);
    };
    this.changeBTC = function () {
        if (!self.ICO().BuyICO) {
            return;
        }
        $('input[name="amount--coin"]').val('');
        $('input[name="amount--uch"]').val('');
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
        $('input[name="amount--coin"]').val('');
        $('input[name="amount--uch"]').val('');
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
            type: 'POST',
            dataType: 'json',
            beforeSend: function () {
                main.ctr_shw_loadng();
                console.log('Open Buy ICO');
            },
            success: function (data) {
                self.Price(data.Data);

                $('#btn-bitcoin').click();
                $("#max--coin-label").click();
                $('#div-buy-uch').modal('show');
                self.refreshCaptcha();
                self.SetBuyMax();
            },
            error: function (data) {
                self.OpenBuyICO();
            }
        });
    };
    
    this.RefreshPrice = function(){
        var datapost = {};
        datapost.__RequestVerificationToken = __token;
        $.ajax({
            url: urlGetPrice,
            data: datapost,
            type: 'POST',
            dataType: 'json',
            beforeSend: function () {
                
            },
            success: function (data) {
                self.Price(data.Data);

                $('#btn-bitcoin').click();
                self.SetBuyMax();
            },
            error: function (data) {
                self.RefreshPrice();
            }
        });
    }
    
    this.SetBuyMax = function(){
        var amountToSet = self.MaxBuy > 0 ? self.MaxBuy : COIN_LIMIT;
        $('input[name="amount--uch"]').val(amountToSet);
        self.transferCoin(2);
    }

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
        var amount = $('input[name="amount--uch"]').val();
        var coinPaid = $('input[name="amount--coin"]').val();

        if (coinPaid == null || coinPaid.trim().length == 0 || isNaN(coinPaid) || coinPaid <= 0) {
            $('input[name="amount--coin"]').css('border', '1px solid red');
            setTimeout(function () {
                $('input[name="amount--coin"]').removeAttr('style');
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
            $('input[name="amount--uch"]').css('border', '1px solid red');
            setTimeout(function () {
                $('input[name="amount--uch"]').removeAttr('style');
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
                    }
                    else {
                        self.HandleSubmissionError(data.Data.Message);
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
                    self.HandleSubmissionError(data.Message);
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
};
