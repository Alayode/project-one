//init.js start
var s = _.isUndefined(s) ? {} : s;
var reporting = {};

(function(r){
	var getRealCookie = function(name) {
		var dc = document.cookie;
		var prefix = name + "=";
		var begin = dc.indexOf("; " + prefix);
		if (begin === -1) {
			begin = dc.indexOf(prefix);
			if (begin !== 0) return null;
		}else {
			begin += 2;
		}
		var end = document.cookie.indexOf(";", begin);
		if (end === -1) {
			end = dc.length;
		}
		return unescape(dc.substring(begin + prefix.length, end));
	};  
	var getPath = function(){
		var originalPath = window.location.pathname;
		var firstSlashRegex = /^\//; //finds first slash in URL
		var lastSlashRegex = /\/$/; //finds last slash in URL
		var nonSectionPath = /\.html$/; //finds non-section path
		var excludePath = /pages/; //exclude path /pages
		var cleanedPath = originalPath.replace(lastSlashRegex, "").replace(firstSlashRegex, "").replace(nonSectionPath, "");
		var splitPath = cleanedPath.split("/");
		var path = [];
		if(splitPath.length > 0 && splitPath[0] !== ""){
			for(var i = 0; i < splitPath.length; i++){
			  if(splitPath[i].match(excludePath) === null){   
				path.push(splitPath[i]);
			  }
			}
		}
		return path;
	};
	var loc = window.location.search;
	var qsParams = new Array();
	if(loc === "") loc = window.location.hash;
	if(loc !== ""){
		if(loc.indexOf('#') === 0) loc = loc.substring(1);
		var querystring = unescape(loc);
		querystring = querystring.substring(1);
		var params = querystring.split('&');
		for (var i=0; i<params.length; i++) {
			var pos = params[i].indexOf('=');
			if (pos > 0) {
				var key = params[i].substring(0,pos);
				var val = params[i].substring(pos+1);
				qsParams[key] = val;
			}
		}
	}

	var actuallySetProps = {};
	var actuallySetEvents = {};
	var rulename='';
	var channel = '';
	var pgName = '';
	var pgName2 = '';
	var path = getPath();
	var user = user=getRealCookie("oolp_");
	var lang = getRealCookie("MP_LANG");
	if(lang === null) lang = 'en';
	r.vars = {};
	r.events = {};
	channel = (typeof reporting_channelName === "undefined" || reporting_channelName === null) ? "" : reporting_channelName;
	if(channel === ''){
		if(path.length > 0){
			channel = path[0];
			channel = channel.toLowerCase().replace(/\b[a-z]/g, function(letter) {
				return letter.toUpperCase();
			});
		}else{
			channel = 'Home';
		}
	}
	pgName = (typeof reporting_pageName === "undefined" || reporting_pageName === null) ? "" : reporting_pageName;
	if(pgName === ''){
		if(path.length > 1){
			pgName = path[1];
			if(path.length > 2){
				pgName += ':' +path[2];
			}
		}else{
			pgName = channel;
		}
	}else if(pgName === "404"){
		r.vars["pageType"] = "errorPage";
		channel = pgName;
	}else if(pgName.match(/Login/i) && document.referrer.match(/reset-password/i)){
        pgName = 'Done-Login';
    }else{
		pgName = pgName.toLowerCase().replace(/\b[a-z]/g, function(letter) {
			return letter.toUpperCase();
		});
		if(pgName.match(/^notification$/i) !== null){
			var notifType = qsParams['type'];
			if(!_.isUndefined(notifType)) pgName += ' - ' + notifType;
			var notifID = qsParams['id'];
			if(!_.isUndefined(notifID)) pgName += ' - ' + notifID;
		}
	}
	pgName2 = pgName;
	if(pgName2 === 'Login'){
		var reauth = qsParams['reauth'];
		if(!_.isUndefined(reauth)){
			pgName2 += '-reauth';
		}else{
			var ref = qsParams['referer'];
			if(!_.isUndefined(ref)){
				if(ref.indexOf('business') !== -1 || ref.indexOf('BIZ') !== -1){
					pgName2 += '-biz';
				}else if(ref.indexOf('pay-bill') !== -1){
					pgName2 += '-billpay';
				}else if(ref.indexOf('router.optimum.net') !== -1){
					pgName2 += '-router';
				}else if(ref.indexOf('voice.optimum.net') !== -1){
					pgName2 += '-ov';
				}
			}
			var area = qsParams['area'];
			if(typeof area !== 'undefined' && area === 'webmail'){
				pgName2 += '-webmail';
			}
		}
	}
	var excludePageLoad = [
		"reset-password",
		"security-questions",
		"recover-id",
	];
	var appendLoggedStatus = [
		"Home","Login","Optimum Webmail"
	];
	r.srchterm = function(st, sCount){
		if(st){
			r.vars["internalSearchTerm"] = st;
			r.events["event8"] = true;
			if(sCount){
				r.vars["internalSearchResultCount"] = sCount;
			}
			rulename = "SearchComplete";
		}
	}
	r.setAttrs = function(props, noprepend) {
		_.forEach(props, function(val, key) {
			var omnval = val;
			if(val.indexOf(pgName) === -1 && !noprepend){
				if(key !== "prop8" || key !== "prop28") omnval = channel + " | " + pgName + " | " + val;
			}
			if(val.indexOf('~') !== -1){
				var splitval = val.split('~');
				var msg = '';
				if(splitval.length > 0 && splitval[0] !== ""){
					var prefix = noprepend ? "" : channel + " | " + pgName + " | ";
					for(var i = 0; i < splitval.length; i++){
						if(msg === ''){
							msg = prefix + splitval[i];
						}else{
							msg += '~' + prefix + splitval[i];
						}
					}
					omnval = msg;
				}
			}
			switch(key){
				case "prop8":
					r.vars["homePageWidget"] = omnval;
					rulename='homePageWidget';
					break;
				case "prop28":
					r.vars["hpWidgetChgValue"] = omnval;
					rulename='hpWidgetChgValue';
					break;
				case "prop10":
				case "eVar10":
					r.vars["trackCustLink"] = omnval;
					rulename='trackCustLink';
					break;
				case "eVar24":
					r.vars["alertDrawerMsg"] = omnval;
					rulename='alertDrawerMsg';
					break;
				case "prop25":
					r.vars["huluId"] = omnval;
					rulename='huluId';
					break;
				case "prop35":
					r.vars["errorMsg"] = omnval;
					rulename='errorMsg';
				break;
				case "prop36":
					r.vars["radioOption"] = omnval;
					rulename='radioOption';
					break;
			}
		});
	};
	r.setEvents = function(evts) {
		r.events = true;
		_.forEach(evts, function(evt) {
			r.events[evt] = true;
			if(evt==="event3"){ 
				rulename='alertDrawerClose';
			}
		});
	};
	r.exclude = function(){
		if((pgName.match(/Home/i) && user !== null) || (_.indexOf(excludePageLoad, pgName.toLowerCase()) !== -1)){
			r.vars["excludePgload"] = 'true';
		}else{
			r.vars["excludePgload"] = 'false';
		}
	}
	//Adobe Dynamic Tag Manager (DTM) related
	r.callDtm = function(rulenm){
		r.exclude(pgName);
		!_.isUndefined(window._satellite) && _satellite.track(rulenm); 
	}
	r.trackClick = function(obj, linkName){
		if(r.vars.pageName.toLowerCase() === "service-appointments"){
			if(linkName.indexOf(r.vars.pageName) === -1){
				linkName = r.vars.channel + " | " + r.vars.pageName + " | " + linkName;
			}
		}
		r.vars["trackCustLink"] = linkName;
		r.callDtm('customLinks');  
	}
	r.sendAttrs = function(obj) {
		r.callDtm(rulename);
	};
	r.pageLoadAjax = function(nm) {
		r.vars["pageName"] = r.setPgname(nm);
		r.vars["optimumPageName"] = nm;
		r.callDtm('pageLoadAjax');
	};
	r.pageLoadAfter = function(){
		r.callDtm('pageLoadAjax');
	};
	r.setPgname = function(pgnm){
		return (r.vars.channel + ':' + pgnm);
	};	
	r.call = function(){
		//deprecated
	};
	r.pageLoad = function(){
		//deprecated
	};
	r.click = function(){
		//deprecated
	}
	r.mixin = function(props){
		for(var prop in props){
			//never been used
		}
	};
	var init = function(){
		var auth = null;
		var encryptedUser = null;
		var bizUser = null;
		var primUser = null;
		var corp = null;
		var usrInfo = null;
		var rememberMe = null;
		var path = getPath();
		var disco = null;
		var btm = null;
		var newCustomer = getRealCookie("newCustomer");;
		if(user === null){
			auth = 'NA';
		}else{
			auth = 'A';
			try{
				rememberMe=getRealCookie("RememberMe");
				var userObj = angular.fromJson(user);
				if(userObj){
					encryptedUser = userObj.eoid;
					bizUser = userObj.p.biz;
					primUser = userObj.primary;
					corp = userObj.corpId;
					disco = userObj.p.disco;
					btm = userObj.p.btm;
				}
			}catch(err){}
        }
		usrInfo = auth;
		if(auth === 'A'){
			if(rememberMe !== null){
				usrInfo += ' | R:Yes';
			}else{
				usrInfo += ' | R:No';
			}
			if(!_.isNull(bizUser) && !_.isUndefined(bizUser)){
				usrInfo += ' | biz';
			}
			if(!_.isNull(primUser) && !_.isUndefined(primUser) && primUser){
				usrInfo += ' | primary';
			}
			if(!_.isNull(corp) && !_.isUndefined(corp)){
				usrInfo += ' | ' +corp;
			}
			if(!_.isNull(disco) && !_.isUndefined(disco) && disco !== 0){
				r.events["event7"] = true; 
			}
			if(!_.isNull(btm) && !_.isUndefined(btm)){
				btm === 0 ? r.vars["behindModem"] = "Not behind the Modem" : r.vars["behindModem"] = "Behind the Modem";
			}
		}
		if(_.indexOf(appendLoggedStatus, pgName) !== -1){
			pgName2 += ':' + auth;
		}
		if(pgName.match(/Search/i)){
			var st = $('#searchText').val();
			if(_.isUndefined(st) || _.isEmpty(st)){
				var srchurl = window.location.href;
				var splitSrch = srchurl.split("/");
				if(splitSrch.length > 0 && splitSrch[0] !== ""){
					for(var i = 0; i < splitSrch.length; i++){
						if(splitSrch[i].match(/optimumSupport/i) !== null){
							st = splitSrch[i+1];
							if(st && st !== '') st = decodeURI(st);
							break;
						}
					}
				}
			}
			r.events["event8"] = true;
			if(st) r.vars["internalSearchTerm"] = st;
		}
		r.vars["channel"] = 'opt:' + lang + ':resi:net:' + channel;
		r.vars["pageName"] = r.setPgname(pgName2);
		r.vars["optimumPageName"] = pgName2;		
		if(encryptedUser) r.vars["userId"] = encryptedUser;
		r.vars["userInfo"] = usrInfo;
		if(newCustomer !== null) {
			if((newCustomer.indexOf('"')) > -1){
				newCustomer=newCustomer.replace(/['"]+/g, '');
			}
			r.vars["tttEncyAccount"] = newCustomer;
		}
		r.exclude();
	};
	init();
})(reporting);