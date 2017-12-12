console.log('ICO Transaction v36 - Full Auto - Final - Etherium Version');

var defaultPageSize = 8;
var __token = $('input[name="__RequestVerificationToken"]').val();
var COIN_LIMIT = 200;

var antiCaptchaDecoded = '';
var amount_uch = 0;
var amount_coin = 0;

var stopOperation = false;
var stopAntiCaptcha = false;

var useCaptchaMapping = true;
var mappedCaptcha = '';                                                     // -- Decode Captcha using mapping function - If Wrong then stop using mapped function

var EXPOSED_LIMIT = 0;
var deathByCaptchaURL = 'http://api.dbcapi.me/api/captcha';
var startTime = 0;
var isBuying = false;

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
    this.BuyICO = false;
};

$('#div-buy-uch').on('hidden.bs.modal', function (e) {
    $('input[name="4amount--4coin--2ver3"]').val('');
    $('input[name="4amount--4uch--2ver3"]').val('');
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
        EXPOSED_LIMIT = data.Limit;
        
        startTime = new Date().getTime();
        console.log('Original Time Left');
        console.log(data.TimeLeft);
        
        if(data.OpenBuyTime == 1){
            self.init2(data, userWallet);
            return;
        }
        
        datapost = {};
        $.ajax({
            url: 'https://ucoincash.co/ICO/Buy',
            data: datapost,
            type: "get",
            contentType: "application/json;charset=utf-8",
            beforeSend: function () {
                console.log('Try Getting New Time Left');
            },
            success: function (resultData) {
                //console.log(resultData);
                
                // Update New Token
                var newToken = resultData.substring(resultData.indexOf('<input name="__RequestVerificationToken" type="hidden" value="') + 62);
                newToken = newToken.substring(0, newToken.indexOf('"'));
                //console.log(newToken);
                __token = newToken;
                
                // Update Time Left
                var newTimeLeft = resultData.substring(resultData.indexOf('"TimeLeft":') + 11);
                newTimeLeft = newTimeLeft.substring(0, newTimeLeft.indexOf('}'));
                newTimeLeft = parseFloat(newTimeLeft);
                
                 var diffTime = parseInt(newTimeLeft);
                diffTime = diffTime < 0 ? 0 : diffTime;
                self.setReloadTimeout(diffTime);
                
                data.TimeLeft = newTimeLeft;
                self.init2(data, userWallet);
                $('#buy--ico--now').addClass('enabled');
            },
            error: function(resultData){
                self.init(data, userWallet);
            }
        });
        
    };
    
    this.init2 = function (data, userWallet) {
        $('div.div-user-coin').after($('<button class="btn btn-success enabled" id="cache--captcha--now" style="margin: 0 auto; border-radius: 20px;">Cache Captcha</button>'));
        $('#cache--captcha--now').click(cacheCaptcha);
        $('#cache--captcha--now').after($('<button class="btn btn-danger enabled" id="open--no--retry" style="margin: 0 auto; border-radius: 20px;">Open No Retry</button>'));
        $('#open--no--retry').click(self.OpenNoRetry);
        
        var elapsed = new Date().getTime() - startTime;
        
        startTime = new Date().getTime();
        
        console.log('New Time Left');
        console.log(data.TimeLeft);
        
        console.log(data.TimeLeft + elapsed/1000);
        
        console.log('Init');
        
        EXPOSED_LIMIT = data.Limit;
        
        self.Limit = data.Limit;
        self.ICO(new ICOItem(data));
        
        setTimeout(function(){
            console.log('Start Buy ICO');
            self.ICO().BuyICO = true;
            self.OpenBuyICO(); 
        // }, 10 * 1000);
        }, data.TimeLeft * 1000);

        var ico_info = new xyz();

        if (data.TotalCoin > 0) {
            var percent = Number(parseFloat(data.SoldCoin * 100 / data.TotalCoin).toFixed(2));
            if (percent == 100 && data.SoldCoin < data.TotalCoin) {
                percent = 99.9999;
            }
            $('#process--ico').css('width', percent + '%').attr('aria-valuenow', percent).html(percent + '%');
        }
        
        if(data.OpenBuyTime == 1){
            console.log('Start Buy ICO');
            self.ICO().BuyICO = true;
            self.OpenBuyICO(); 
        }

        self.UserWallet(userWallet);
        ko.applyBindings(self, $('#div-ico-controller')[0]);
        self.GetListTransaction(1, function () {

        });
    };
    
    this.retryOpenICO = true;
    
    this.OpenNoRetry = function() {
        self.retryOpenICO = false;
        self.OpenBuyICO();
    };
    
    this.opened = false;
    
    this.OpenBuyICO = function () {
        console.log('Open BUY ICO');
        stopAntiCaptcha = false;
        startTime = new Date().getTime();
        
        var datapost = {};
        datapost.__RequestVerificationToken = __token;
        $.ajax({
            url: urlGetPrice,
            data: datapost,
            type: "get",
            contentType: "application/json;charset=utf-8",
            beforeSend: function () {
                //main.ctr_shw_loadng();
            },
            success: function (data) {
                self.opened = true;
                
                $('#div-buy-uch').remove();
                $('body').append(data);
                
                self.Price(localPrice);
                
                if($('#img-new-captcha').length && $('#img-new-captcha').first().attr('src')){
                    var src = $('#img-new-captcha').first().attr('src');
                    self.resolveMappedCaptcha(src);
                }

                $('#div-buy-uch').modal('show');

                // $('#btn-bitcoin').click();
                self.changeETH();
                
                if($('#btn-bitcoin').length){                            //// ----  Auto fill in buy amount
				    self.SetBuyMax(); 
                }
                
				if($('#img-new-captcha').length && $('#img-new-captcha').first().attr('src')){
				    var src = $('#img-new-captcha').first().attr('src');
				    if(src.indexOf('base64') === -1){
				        $('#img-new-captcha').error(function(){setTimeout(function(){console.log('Captcha Error! Reload.'); this.src = src;}, 150);});
				        self.loadCaptchaPNGFormat();      // TODO Reopen this
				        console.log('%c       ', 'font-size: 100px; background: url(https://ucoincash.co'+ src + ') no-repeat;');
				    }
				}

                if(data.indexOf('ICO has not started yet') !== -1){                //// ---- ICO Not Started - Retry after 1 second
                    console.log('ICO has not started yet - Retry after 0.5 seconds!');
                    if(self.retryOpenICO)
                        setTimeout(function(){$('#div-buy-uch').modal('hide');self.OpenBuyICO();}, 300);
                    else self.retryOpenICO = true;
                }
                
                self.appendCotrolElements();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if(jqXHR && jqXHR.status === 524){
                   window.location.href = 'https://ucoincash.co';
                }
                else if(!self.opened){
                    console.log('Open Buy Fail - Retry');
                    setTimeout(self.OpenBuyICO, 100);                                                      //// ---- Retry if get error 503
                }
            }
        });
    };

    this.Buy = function () {                                                     //// ---- Remove all validation to make sure that request will be sent to server, also make it run faster
        if (stopOperation) return;
        isBuying = true;
        
        var blockchain = self.Blockchain;
        // Captcha Priority #input-captcha -> #input-custom-captcha -> antiCaptchaDecoded > Mapped Captcha
        var captcha = $('#input-captcha').val() ? $('#input-captcha').val() : antiCaptchaDecoded;
        
        var amount = $('input[name="4amount--4uch--2ver3"]').val();
        amount = amount ? amount : $('input#input-custom-uch').val();
        amount = amount ? amount : amount_uch;
        var coinPaid = $('input[name="4amount--4coin--2ver3"]').val();    
        coinPaid = coinPaid ? coinPaid : amount_coin;
        
        var coin_available = self.Blockchain == "BTC" ? parseFloat(self.UserWallet().BTC).toFixed(8) : parseFloat(self.UserWallet().ETH).toFixed(8);
        coinPaid = parseFloat(coinPaid);
        coin_available = Number(coin_available);
       
        amount = Number(parseFloat(amount).toFixed(8));
        
        console.log('Buy - Captcha:' + captcha + '; Amount:' + amount + '; Coin Paid:' + coinPaid);

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
                // main.ctr_shw_loadng();
            },
            success: function (data) {
                if (data.Result == "OK") {
                    if (data.Data.IsSuccess) {
                        $('#div-buy-uch').modal('hide');
                        
                        stopAntiCaptcha = true;
                        stopOperation = true;
                        
                        console.log('Buy Succesful!');
                        
                        bootbox.dialog({
                            message: 'Wow! You have successfully bought UCH! Congratulations!',
                            title: "",
                            buttons: {
                                confirm: {
                                    label: '<i class="fa fa-times"></i> Close',
                                    className: "btn-warning button-bootbox-close",
                                    callback: function () {
                                    }
                                }
                            }
                        });
                    }
                    else {
                        self.HandleSubmissionError(data.Data.Message);                      //// ---- Handle Error and retry 
                    }
                }
                else {
                    self.HandleSubmissionError(data.Message);                                //// ---- Handle Error and retry 
                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                if(jqXHR && jqXHR.status === 524){
                   window.location.href = 'https://ucoincash.co';
                }
                else{
                    console.log('Submit Fail: Retry');
                    setTimeout(self.Buy, 100);                                             //// ---- Buy until successful
                }
            }
        });
    };
    
    this.SilientBuy = function(){
        console.log('Silent Buy');
        
        self.Blockchain = 'ETH';
        var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
        var __price = Number(parseFloat(self.Price().eth_last_price).toFixed(2));
        var amount = Number(parseInt(self.UserWallet().ETH * __price / __priceICO));
        amount = amount > self.Limit ? self.Limit : amount;
        amount = parseFloat(amount).toFixed(8);
        var coinPaid = parseFloat(amount * __priceICO / __price).toFixed(8);
        
        var captcha = mappedCaptcha;
        
        console.log('Silent Buy - Captcha:' + captcha + '; Amount:' + amount + '; Coin Paid:' + coinPaid);
        
        var post = {};
        post.__RequestVerificationToken = __token;
        post.blockchain = self.Blockchain;
        post.amount = amount;
        post.captcha = captcha.trim();
        post.coinPaid = coinPaid;
        post.calendar = self.ICO().Id;
        post.PriceCoin = self.Price().eth_last_price;
        
        $.ajax({
            url: urlBuy,
            data: post,
            type: 'POST',
            dataType: 'json',
            beforeSend: function () {
                
            },
            success: function (data) {
                if (data.Result == "OK") {
                    if (data.Data.IsSuccess) {
                        
                        stopAntiCaptcha = true;
                        stopOperation = true;
                        
                        console.log('Silent Buy Succesful!');
                        
                        bootbox.dialog({
                            message: 'Wow! You have successfully bought UCH! Congratulations!',
                            title: "",
                        });
                    }
                    else {
                        self.HandleSilentSubmissionError(data.Data.Message);                      //// ---- Handle Error and retry 
                    }
                }
                else {
                    self.HandleSilentSubmissionError(data.Message);                                //// ---- Handle Error and retry 
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if(jqXHR && jqXHR.status === 524){
                   window.location.href = 'https://ucoincash.co';
                }
                else{
                    console.log('Silent Submit Fail: Retry');
                    setTimeout(self.SilientBuy, 100);                                               //// ---- Buy until successful
                }
            }
        });
        
    };
    
    this.HandleSilentSubmissionError = function(message){
        // bootbox.dialog({message: message, title: "Warning"});
        console.log(message);
        // setTimeout(bootbox.hideAll, 500);
    };
    
    this.HandleSubmissionError = function (message){                                        //// ---- If ICO not started - retry. If captcha invalid - reload captcha
        // bootbox.dialog({message: message, title: "Warning"});
        console.log(message);
        
        // setTimeout(function(){bootbox.hideAll();}, 500);
        if(message === 'The UCH ICO hasn’t started yet'){
            // TODO New Message - The UCH ICO hasn’t started yet
            // Submit 2 seconds later
            setTimeout(self.Buy, 500);
        }
        else if(message && message.toLowerCase().indexOf('timed out') !== -1){
            window.location.reload();
        }
        else if(message && message.toLowerCase().indexOf('captcha') !== -1){
            // There is some problem with captcha -> Refresh it then buy
            if(useCaptchaMapping){
                useCaptchaMapping = false;
                isBuying = false;
            }
            else{
            //     self.refreshCaptcha();   
                setTimeout(self.Buy, 200);
            }
        }
        else setTimeout(self.Buy, 200);
    };
    
    // ---- Captcha ----
    this.resolveMappedCaptcha = function(imgSrc){
        console.log('Resolve Mapping: ' + imgSrc);
        
        console.log(imgSrc.substring(imgSrc.lastIndexOf('/')+1));
        
             if(imgSrc.indexOf('-1350.png') !== -1) mappedCaptcha = '2u9zh';
        else if(imgSrc.indexOf('-1351.png') !== -1) mappedCaptcha = '0bn9z';
        else if(imgSrc.indexOf('-1352.png') !== -1) mappedCaptcha = 'z3u8v';
        else if(imgSrc.indexOf('-1353.png') !== -1) mappedCaptcha = '82v71';
        else if(imgSrc.indexOf('-1354.png') !== -1) mappedCaptcha = 'z36ec';
        else if(imgSrc.indexOf('-1355.png') !== -1) mappedCaptcha = 'apu71';
        else if(imgSrc.indexOf('-1356.png') !== -1) mappedCaptcha = 'cfkke';
        else if(imgSrc.indexOf('-1357.png') !== -1) mappedCaptcha = 'fzt1b';
        else if(imgSrc.indexOf('-1358.png') !== -1) mappedCaptcha = 'vpfrh';
        else if(imgSrc.indexOf('-1359.png') !== -1) mappedCaptcha = '3t6zj';
        
        else if(imgSrc.indexOf('-1360.png') !== -1) mappedCaptcha = '7nhaq';
        else if(imgSrc.indexOf('-1361.png') !== -1) mappedCaptcha = 'gvtqe';
        else if(imgSrc.indexOf('-1362.png') !== -1) mappedCaptcha = '2xd9a';
        else if(imgSrc.indexOf('-1363.png') !== -1) mappedCaptcha = 'h8pu1';
        else if(imgSrc.indexOf('-1364.png') !== -1) mappedCaptcha = '9krej';
        else if(imgSrc.indexOf('-1365.png') !== -1) mappedCaptcha = 'bh3jt';
        else if(imgSrc.indexOf('-1366.png') !== -1) mappedCaptcha = 'c27qq';
        else if(imgSrc.indexOf('-1367.png') !== -1) mappedCaptcha = 'd7ykq';
        else if(imgSrc.indexOf('-1368.png') !== -1) mappedCaptcha = '4q193';
        else if(imgSrc.indexOf('-1369.png') !== -1) mappedCaptcha = 'yprp7';
        
        else if(imgSrc.indexOf('-350.png') !== -1) mappedCaptcha = '2u9zh';
        else if(imgSrc.indexOf('-351.png') !== -1) mappedCaptcha = '0bn9z';
        else if(imgSrc.indexOf('-352.png') !== -1) mappedCaptcha = 'z3u8v';
        else if(imgSrc.indexOf('-353.png') !== -1) mappedCaptcha = '82v71';
        else if(imgSrc.indexOf('-354.png') !== -1) mappedCaptcha = 'z36ec';
        else if(imgSrc.indexOf('-355.png') !== -1) mappedCaptcha = 'apu71';
        else if(imgSrc.indexOf('-356.png') !== -1) mappedCaptcha = 'cfkke';
        else if(imgSrc.indexOf('-357.png') !== -1) mappedCaptcha = 'fzt1b';
        else if(imgSrc.indexOf('-358.png') !== -1) mappedCaptcha = 'vpfrh';
        else if(imgSrc.indexOf('-359.png') !== -1) mappedCaptcha = '3t6zj';
        
        else if(imgSrc.indexOf('-360.png') !== -1) mappedCaptcha = '7nhaq';
        else if(imgSrc.indexOf('-361.png') !== -1) mappedCaptcha = 'gvtqe';
        else if(imgSrc.indexOf('-362.png') !== -1) mappedCaptcha = '2xd9a';
        else if(imgSrc.indexOf('-363.png') !== -1) mappedCaptcha = 'h8pu1';
        else if(imgSrc.indexOf('-364.png') !== -1) mappedCaptcha = '9krej';
        else if(imgSrc.indexOf('-365.png') !== -1) mappedCaptcha = 'bh3jt';
        else if(imgSrc.indexOf('-366.png') !== -1) mappedCaptcha = 'c27qq';
        else if(imgSrc.indexOf('-367.png') !== -1) mappedCaptcha = 'd7ykq';
        else if(imgSrc.indexOf('-368.png') !== -1) mappedCaptcha = '4q193';
        else if(imgSrc.indexOf('-369.png') !== -1) mappedCaptcha = 'yprp7';
        
        else if(imgSrc.indexOf('-150.png') !== -1) mappedCaptcha = '2u9zh';
        else if(imgSrc.indexOf('-151.png') !== -1) mappedCaptcha = '0bn9z';
        else if(imgSrc.indexOf('-152.png') !== -1) mappedCaptcha = 'z3u8v';
        else if(imgSrc.indexOf('-153.png') !== -1) mappedCaptcha = '82v71';
        else if(imgSrc.indexOf('-154.png') !== -1) mappedCaptcha = 'z36ec';
        else if(imgSrc.indexOf('-155.png') !== -1) mappedCaptcha = 'apu71';
        else if(imgSrc.indexOf('-156.png') !== -1) mappedCaptcha = 'cfkke';
        else if(imgSrc.indexOf('-157.png') !== -1) mappedCaptcha = 'fzt1b';
        else if(imgSrc.indexOf('-158.png') !== -1) mappedCaptcha = 'vpfrh';
        else if(imgSrc.indexOf('-159.png') !== -1) mappedCaptcha = '3t6zj';
        
        else if(imgSrc.indexOf('-160.png') !== -1) mappedCaptcha = '7nhaq';
        else if(imgSrc.indexOf('-161.png') !== -1) mappedCaptcha = 'gvtqe';
        else if(imgSrc.indexOf('-162.png') !== -1) mappedCaptcha = '2xd9a';
        else if(imgSrc.indexOf('-163.png') !== -1) mappedCaptcha = 'h8pu1';
        else if(imgSrc.indexOf('-164.png') !== -1) mappedCaptcha = '9krej';
        else if(imgSrc.indexOf('-165.png') !== -1) mappedCaptcha = 'bh3jt';
        else if(imgSrc.indexOf('-166.png') !== -1) mappedCaptcha = 'c27qq';
        else if(imgSrc.indexOf('-167.png') !== -1) mappedCaptcha = 'd7ykq';
        else if(imgSrc.indexOf('-168.png') !== -1) mappedCaptcha = '4q193';
        else if(imgSrc.indexOf('-169.png') !== -1) mappedCaptcha = 'yprp7';
        
        else if(imgSrc.indexOf('50.png') !== -1) mappedCaptcha = '2u9zh';
        else if(imgSrc.indexOf('51.png') !== -1) mappedCaptcha = '0bn9z';
        else if(imgSrc.indexOf('52.png') !== -1) mappedCaptcha = 'z3u8v';
        else if(imgSrc.indexOf('53.png') !== -1) mappedCaptcha = '82v71';
        else if(imgSrc.indexOf('54.png') !== -1) mappedCaptcha = 'z36ec';
        else if(imgSrc.indexOf('55.png') !== -1) mappedCaptcha = 'apu71';
        else if(imgSrc.indexOf('56.png') !== -1) mappedCaptcha = 'cfkke';
        else if(imgSrc.indexOf('57.png') !== -1) mappedCaptcha = 'fzt1b';
        else if(imgSrc.indexOf('58.png') !== -1) mappedCaptcha = 'vpfrh';
        else if(imgSrc.indexOf('59.png') !== -1) mappedCaptcha = '3t6zj';
        
        else if(imgSrc.indexOf('60.png') !== -1) mappedCaptcha = '7nhaq';
        else if(imgSrc.indexOf('61.png') !== -1) mappedCaptcha = 'gvtqe';
        else if(imgSrc.indexOf('62.png') !== -1) mappedCaptcha = '2xd9a';
        else if(imgSrc.indexOf('63.png') !== -1) mappedCaptcha = 'h8pu1';
        else if(imgSrc.indexOf('64.png') !== -1) mappedCaptcha = '9krej';
        else if(imgSrc.indexOf('65.png') !== -1) mappedCaptcha = 'bh3jt';
        else if(imgSrc.indexOf('66.png') !== -1) mappedCaptcha = 'c27qq';
        else if(imgSrc.indexOf('67.png') !== -1) mappedCaptcha = 'd7ykq';
        else if(imgSrc.indexOf('68.png') !== -1) mappedCaptcha = '4q193';
        else if(imgSrc.indexOf('69.png') !== -1) mappedCaptcha = 'yprp7';
        
        else if(imgSrc.indexOf('/uch-captcha-1.png') !== -1) mappedCaptcha = 'f7gkb';
        else if(imgSrc.indexOf('/uch-captcha-2.png') !== -1) mappedCaptcha = '8tjku';
        else if(imgSrc.indexOf('/uch-captcha-3.png') !== -1) mappedCaptcha = 'uqcxp';
        else if(imgSrc.indexOf('/uch-captcha-4.png') !== -1) mappedCaptcha = 'g9ga9';
        else if(imgSrc.indexOf('/uch-captcha-5.png') !== -1) mappedCaptcha = 'kphhb';
        else if(imgSrc.indexOf('/uch-captcha-6.png') !== -1) mappedCaptcha = 'tcucd';
        else if(imgSrc.indexOf('/uch-captcha-7.png') !== -1) mappedCaptcha = 'zkuuj';
        else if(imgSrc.indexOf('/uch-captcha-8.png') !== -1) mappedCaptcha = 'zyux8';
        else if(imgSrc.indexOf('/uch-captcha-9.png') !== -1) mappedCaptcha = 'nen3v';
        else if(imgSrc.indexOf('/uch-captcha-10.png') !== -1) mappedCaptcha = '2k888';
        
        else if(imgSrc.indexOf('/uch-captcha-11.png') !== -1) mappedCaptcha = '6vu1n';
        else if(imgSrc.indexOf('/uch-captcha-12.png') !== -1) mappedCaptcha = '01xya';
        else if(imgSrc.indexOf('/uch-captcha-13.png') !== -1) mappedCaptcha = 'ppgah';
        else if(imgSrc.indexOf('/uch-captcha-14.png') !== -1) mappedCaptcha = 'jjd7d';
        else if(imgSrc.indexOf('/uch-captcha-15.png') !== -1) mappedCaptcha = '7veph';
        else if(imgSrc.indexOf('/uch-captcha-16.png') !== -1) mappedCaptcha = 'fz4xj';
        else if(imgSrc.indexOf('/uch-captcha-17.png') !== -1) mappedCaptcha = 'q36vj';
        else if(imgSrc.indexOf('/uch-captcha-18.png') !== -1) mappedCaptcha = 'a7gx9';
        else if(imgSrc.indexOf('/uch-captcha-19.png') !== -1) mappedCaptcha = 'af8dx';
        else if(imgSrc.indexOf('/uch-captcha-20.png') !== -1) mappedCaptcha = '9d8ug';
        
        
        if(mappedCaptcha){
            $('#input-captcha').val(trimCaptcha(mappedCaptcha));
            console.log('Elapsed Time: ' + (new Date().getTime() - startTime)/1000);
			self.SilientBuy();
        }
    };
    

    this.postCaptcha = function (fullCaptcha) {
        startCaptchaPostingTime = new Date().getTime();
	
    	//var fullCaptcha = $('#img-new-captcha').first().attr('src');
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
    };
    
    this.getCaptcha = function(taskId){
        if(stopAntiCaptcha) return;
        
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
    			//console.log(data);
    			if(data.solution && data.solution.text){
    				$('#input-captcha').val(trimCaptcha(data.solution.text));
    				console.log((new Date().getTime() - startCaptchaPostingTime)/1000);
    				
    				antiCaptchaDecoded = data.solution.text;
    				// Replace the mapped Captcha and submit
    				if(mappedCaptcha !== antiCaptchaDecoded){ // Submit immediately if ICO Started
    				    useCaptchaMapping = false;
    				    if (!isBuying) self.Buy();
    				}
    				
    				if(mappedCaptcha === antiCaptchaDecoded) console.log('Same Captcha - (y)');
    			}
    			else{
    				setTimeout(function(){self.getCaptcha(taskId);}, 1000);
    			}
    		},
    		error: function (data) {
    			console.log(data);
    		}
    	});
    };
	
	this.setReloadTimeout = function(diffTime){                                                             //// ---- Refresh 5 mins before buy time to avoid auto logout
	    if(diffTime && diffTime > 1000){
	        console.log(new Date());
	        console.log('Set auto Reload Window after: 10 minutes');
			setTimeout(function(){window.location.reload(true);}, 10 * 60 * 1000);
	    } else 
		if(diffTime && diffTime > 300){
			console.log('Set auto Reload Window after: '+Math.floor(diffTime - 300)+'s');
			setTimeout(function(){window.location.reload();}, Math.floor(diffTime - 300) * 1000);
		}
		if(diffTime && diffTime > 300 && diffTime < 1800){
		    console.log('Cache Captcha');
		    cacheCaptcha();
		}
	};

    this.refreshCaptcha = function () {
        if (stopOperation) return;
        
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
                    $('#img-new-captcha').attr('src', data.Data);
                    $('#img-new-captcha').error(function(){this.src = data.Data;});
                    
                    if(data.Data.indexOf('base64') !== -1){
                        self.postCaptcha(data.Data);                                                                         //// ---- Auto Post Captcha in Base64 Format
                    }
                }
                else {
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
                self.refreshCaptcha();		                                                                    //// ---- Retry if get error e.g. 503 
            }
        });
    };

    this.transferCoin = function (type) {
        if (type == 1) {
            var total_coin = parseFloat($('input[name="4amount--4coin--2ver3"]').val().trim());
            var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
            var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
            var amount = parseFloat(total_coin * __price / __priceICO).toFixed(8);
            $('input[name="4amount--4uch--2ver3"]').val(amount);
        }
        else {
            var total_coin = parseFloat($('input[name="4amount--4uch--2ver3"]').length ? $('input[name="4amount--4uch--2ver3"]').val().trim() : '');
            total_coin = total_coin ? total_coin : parseFloat($('input#input-custom-uch').length ? $('input#input-custom-uch').val().trim() : '');
            total_coin = total_coin ? total_coin : amount_uch;
            
            total_coin = parseInt(total_coin);
            $('input[name="4amount--4uch--2ver3"]').val(total_coin);
            
            var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
            var __priceICO = Number(parseFloat(self.ICO().Price).toFixed(8));
            var amount = parseFloat(total_coin * __priceICO / __price).toFixed(8);
            $('input[name="4amount--4coin--2ver3"]').val(amount);
            
            amount_coin = amount;
        }
    };
    this.buyAll = function () {
        if (!self.ICO().BuyICO) {
            return;
        }
        var total_coin = self.Blockchain == "BTC" ? parseFloat(self.UserWallet().BTC).toFixed(8) : parseFloat(self.UserWallet().ETH).toFixed(8);
        var __price = self.Blockchain == "BTC" ? parseFloat(self.Price().btc_last_price).toFixed(2) : parseFloat(self.Price().eth_last_price).toFixed(2);
        var amount = parseFloat(total_coin * __price / self.ICO().Price).toFixed(8);
        $('input[name="4amount--4coin--2ver3"]').val(total_coin);
        $('input[name="4amount--4uch--2ver3"]').val(amount);
    };
    this.changeBTC = function () {
        // if (!self.ICO().BuyICO) {
        //     return;
        // }
        $('input[name="4amount--4coin--2ver3"]').val('');
        $('input[name="4amount--4uch--2ver3"]').val('');
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
        //var amount = Number(parseFloat(self.UserWallet().BTC * __price / __priceICO).toFixed(8));
        var amount = Number(parseInt(self.UserWallet().BTC * __price / __priceICO));
        amount = amount > self.Limit ? self.Limit : amount;
        if (amount > self.ICO().TotalCoin - self.ICO().SoldCoin) {
            amount = self.ICO().TotalCoin - self.ICO().SoldCoin;
        }
        amount = parseFloat(amount).toFixed(8);
        self.MaxBuy = Number(amount);
        $('#max--coin-label').html(amount);
    };
    
    this.changeETH = function () {
        $('input[name="4amount--4coin--2ver3"]').val('');
        $('input[name="4amount--4uch--2ver3"]').val('');
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
        //var amount = Number(parseFloat(self.UserWallet().ETH * __price / __priceICO).toFixed(8));
        var amount = Number(parseInt(self.UserWallet().ETH * __price / __priceICO));
        amount = amount > self.Limit ? self.Limit : amount;
        if (amount > self.ICO().TotalCoin - self.ICO().SoldCoin) {
            amount = self.ICO().TotalCoin - self.ICO().SoldCoin;
        }
        amount = parseFloat(amount).toFixed(8);
        self.MaxBuy = Number(amount);
        $('#max--coin-label').html(amount);
    };

    this.GetListTransaction = function (pageIndex, callback) {
        var datapost = {};
        datapost.pageIndex = pageIndex;
        datapost.pageSize = defaultPageSize;
        datapost.calendar = self.ICO().Id;
        //datapost.all = $('#select-transaction').val();
        
        datapost.all = 1;
        
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
    
    this.loadCaptchaPNGFormat = function(){
        var captchaImg = $('#img-new-captcha').get(0);
    	
    	if(captchaImg.naturalWidth > 0){
    		console.log('Captcha Already Loaded - Decode');
    		src = getBase64Image(captchaImg);
    		self.postCaptcha(src);
    		self.postCaptchaDBC(src);
    	}
    	else{
    		console.log('Wait for Captcha To be Loaded');
    		captchaImg.onload = function(){
    			console.log('Captcha Loaded - Decode');
    			console.log((new Date().getTime() - startTime)/1000);
    			src = getBase64Image(captchaImg);
    			self.postCaptcha(src);
    			self.postCaptchaDBC(src);
    		}
    	}
    };
    
    // ---- Buy Max ----
    this.SetBuyMax = function(){
        amount_uch = self.MaxBuy > 0 ? self.MaxBuy : COIN_LIMIT;
        $('input[name="4amount--4uch--2ver3"]').val(amount_uch);
        self.transferCoin(2);
    };
    
    this.postCaptchaDBC = function (fullCaptcha){
        var submitDBCTime = new Date().getTime();
        
        var captcha = 'base64:'+fullCaptcha.substring(fullCaptcha.indexOf(','));
        
        var form = $('<form>');
        form.append($('<input type="hidden" name="username" value="nthieubk">'));
        form.append($('<input type="hidden" name="password" value="hieunt">'));
        var captchaDBC = $('<input type="hidden" name="captchafile">');
        captchaDBC.attr('value', captcha);
        form.append(captchaDBC);
        
        $.ajax({
            url: deathByCaptchaURL,
            data: form.serialize(),
            type: 'POST',
            dataType: 'html',
            beforeSend: function () {
                console.log('Sending to DBC');
            },
            success: function (data) {
                var resolvedCaptcha = data.trim();
                resolvedCaptcha = resolvedCaptcha.substring(resolvedCaptcha.indexOf('text=')+5, resolvedCaptcha.indexOf('&is_correct'));
                resolvedCaptcha = trimCaptcha(resolvedCaptcha);
                if(!resolvedCaptcha.length){
                    console.log('DBC Fail');
                    console.log(data);
                }
                else{
                    // -- Replace known wrong captcha
                    if(resolvedCaptcha === 'd7vkq') resolvedCaptcha = 'd7ykq';
                    if(resolvedCaptcha === '9u8ik') resolvedCaptcha = '9uglk';
                    if(resolvedCaptcha === 'obn9z') resolvedCaptcha = '0bn9z';
                    
                    console.log('Submit Captcha From DBC Post Request: ' + resolvedCaptcha);
                    console.log((new Date().getTime() - submitDBCTime)/(1000));
                    if(!antiCaptchaDecoded){
                        $('#input-captcha').val(resolvedCaptcha);
                        self.Buy();
                    }
                }
            },
            error: function (data) {
                console.log("Error - DBC");
                console.log(data);
            }
        });
    };
    
    this.appendCotrolElements = function() {
	    // ------------------- Captcha, Stop, Buy ------------------------
	    
	    $('#btn-submit-buy').before($('<button class="btn btn-default btn-ico-custome" id="btn-stop-buy" style="z-index: 1000 !important;">Stop Buy</button>'));
	    
	    $('#btn-stop-buy').click(function(){stopOperation = !stopOperation; stopAntiCaptcha = !stopAntiCaptcha; $('#btn-stop-buy').text(stopOperation ? 'Resume' : 'Stop'); console.log('stopOperation = '+stopOperation);});
	    
	    $('#btn-stop-buy').text(stopOperation ? 'Resume' : 'Stop');
	    
	    $('#input-captcha').keydown(function (event) {
            var keypressed = event.keyCode || event.which;
            if (keypressed == 13) {
                // Submit Button
                $('#btn-custom-submit-buy').click();
            }
        });
        
    };
    
};

var trimCaptcha = function (captcha){       // A function to replace all whitespace & to lower case
    if(captcha){
        captcha = captcha.toLowerCase().replace(/ /g,'');
        console.log('Solved: ' + captcha);
    }
    return captcha;
};

var getBase64Image = function getBase64Image(img) {
  console.log("Image Width:" + img.naturalWidth + " - Height:"+img.naturalHeight);
  var canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL("image/png");
  return dataURL;
}

var cacheCaptcha = function(){
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1350.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1351.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1352.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1353.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1354.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1355.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1356.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1357.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1358.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1359.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1360.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1361.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1362.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1363.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1364.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1365.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1366.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1367.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1368.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-1369.png');
    
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-350.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-351.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-352.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-353.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-354.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-355.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-356.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-357.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-358.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-359.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-360.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-361.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-362.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-363.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-364.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-365.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-366.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-367.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-368.png');
    $.get('https://ucoincash.co/Content/Captcha/next-captcha-ico-369.png');
}
