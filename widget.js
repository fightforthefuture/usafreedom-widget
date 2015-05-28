/*
 @licstart  The following is the entire license notice for the
    JavaScript code in this page.

 Copyright (C) 2014 Center for Rights in Action
 Copyright (C) 2014 Jeff Lyon

 The JavaScript code in this page is free software: you can
 redistribute it and/or modify it under the terms of the GNU
 General Public License (GNU GPL) as published by the Free Software
 Foundation, either version 3 of the License, or (at your option)
 any later version. The code is distributed WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY or FITNESS
 FOR A PARTICULAR PURPOSE. See the GNU GPL for more details.

 As additional permission under GNU GPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 @licend  The above is the entire license notice
    for the JavaScript code in this page.
*/

(function(){ // :)

// Default URL for animation iframe. This gets overlay'ed over your page.
var dfurl = 'https://fightforthefuture.github.io/usafreedom-widget/iframe';


/**
--------------------------------------------------------------------------------
CONFIGURATION OPTIONS
--------------------------------------------------------------------------------
These are default configuration values for the widget. You can override any of
these by pre-defining an object named _cc_options and setting the appropriate
properties as desired.
--------------------------------------------------------------------------------
*/

// The _cc_options object is created if it isn't already defined by you
if (typeof _cc_options == "undefined")
	_cc_options = {};

// The path to the iframe that gets injected over your page
if (typeof _cc_options.iframe_base_path == "undefined")
	_cc_options.iframe_base_path = dfurl;

// Which design to show, either "modal" or "banner" (see _cc_animations below)
if (typeof _cc_options.animation == "undefined")
	_cc_options.animation = 'modal';

// How long to delay before showing the widget
if (typeof _cc_options.delay == "undefined")
	_cc_options.delay = 0;

// If set to true, we will log stuff to the console
if (typeof _cc_options.debug == "undefined")
	_cc_options.debug = false;

// Usually a cookie is used to only show the widget once. You can override here.
if (typeof _cc_options.always_show_widget == "undefined")
	_cc_options.always_show_widget = false;

/**
--------------------------------------------------------------------------------
ANIMATION DEFINITIONS
--------------------------------------------------------------------------------
Here's where the functionality and defaults for each of the animations (just
"modal" for now). Each animation has its own options property,
which is an object containing default behaviors for that animation. These can be
overridden by passing the appropriately-named properties into the _cc_options
object (above). This will get merged over the defaults when init is called.
--------------------------------------------------------------------------------
*/
var _cc_animations = {

	// MODAL ANIMATION
	modal: {

		// Default options: Override these wit h _cc_options object (see above)
		options: {
			modalAnimation: 'modal',
			skipEmailSignup: false,
			skipCallTool: false,
			boxUnchecked: false,
			org: null
		},

		// init copies the _cc_options properties over the default options
		init: function(options) {
			for (var k in options) this.options[k] = options[k];
			return this;
		},

		// what to do when the animation starts
		start: function() {
			var css = '#_cc_iframe { position: fixed; left: 0px; top: 0px; \
				width: 100%; height: 100%; z-index: 100001; }'

			_cc_util.injectCSS('_cc_iframe_css', css);

			var iframe = _cc_util.createIframe(this.options.modalAnimation);
			_cc_util.bindIframeCommunicator(iframe, this);
		},

		// what to do when the animation stops
		stop: function() {
			_cc_util.destroyIframe();
		}
	},

	// BANNER ANIMATION
	banner: {

		// Default options: Override these with _cc_options object (see above)
		options: {
			modalAnimation: 'banner',
			position: 'bottom',
			height: 78,
			url: 'https://www.sunsetthepatriotact.com/?ref=fftf'
		},

		// init copies the _cc_options properties over the default options
		init: function(options) {
			for (var k in options) this.options[k] = options[k];
			return this;
		},

		// what to do when the animation starts
		start: function() {


			switch (this.options.position) {

				case 'bottom':
					var pos = 'top: 0px; left: 0px;';
					var stripPos = 'bottom';
					break;

			}

			// The window must be a certain width to show the floating banner
			// otherwise it will be fixed to the top / bottom
			var minFloatWidth = this.options.width-1;

			var css = '#_cc_iframe { \
					position: fixed; '+pos+' \
					width: 100%; \
					height: '+this.options.height+'px; \
					z-index: 100001; \
				} \
				@media (min-width:1001px) { \
					body._cc_margin { \
						margin-top: 78px; \
					} \
				} \
				@media (max-width:1000px) { \
					#_cc_iframe { \
						display: none !important; \
					} \
				}';

			_cc_util.injectCSS('_cc_iframe_css', css);
			document.body.className = document.body.className += ' _cc_margin';

			var iframe = _cc_util.createIframe(this.options.modalAnimation);
			_cc_util.bindIframeCommunicator(iframe, this);
		},

		// what to do when the animation stops
		stop: function() {
			_cc_util.destroyIframe();
			document.body.className = document.body.className.replace(
				'_cc_margin', '');
		}
	}
}

/**
--------------------------------------------------------------------------------
UTILITY FUNCTIONS
--------------------------------------------------------------------------------
*/
var _cc_util = {

	// Inject CSS styles into the page
	injectCSS: function(id, css)
	{
		var style = document.createElement('style');
		style.type = 'text/css';
		style.id = id;
		if (style.styleSheet) style.styleSheet.cssText = css;
		else style.appendChild(document.createTextNode(css));
		document.head.appendChild(style);
	},

	// Create the iframe used to display the animation  
	createIframe: function(animation) {
		var iframe = document.createElement('iframe');
		iframe.id = '_cc_iframe';
		iframe.src = _cc_options.iframe_base_path + '/' + animation + '.html';
		iframe.frameBorder = 0;
		iframe.allowTransparency = true; 
		iframe.style.display = 'none';
		document.body.appendChild(iframe);
		return iframe;
	},

	// Destroy the iframe used to display the animation
	destroyIframe: function() {
		var iframe = document.getElementById('_cc_iframe');
		iframe.parentNode.removeChild(iframe);
	},

	// Sends / receives event messages to the iframe (IE9+)
	// Necessary because the iframe lives on a different domain and we can't
	// just call Javascript functions to/from it due to XSS protections.
	bindIframeCommunicator: function(iframe, animation) {
		var sendMessage = function(requestType, data)
		{
			data || (data = {});
			data.requestType = requestType;
			data.CC_WIDGET_MSG = true;
			data.HOST_NAME = hostname;
			iframe.contentWindow.postMessage(data, '*');
		}

		var method = window.addEventListener ? "addEventListener":"attachEvent";
		var eventer = window[method];
		var messageEvent = method == "attachEvent" ? "onmessage":"message";

		var hostname = this.getHostname();

		eventer(messageEvent,function(e) {
			if (!e.data || !e.data.CC_IFRAME_MSG)
				return;

			delete e.data.CC_IFRAME_MSG;

			switch (e.data.requestType) {
				case 'getAnimation':
					iframe.style.display = 'block';
					sendMessage('putAnimation', animation.options);
					break;
				case 'stop':
					animation.stop();
					break;
			}
		}, false);

	},

	// Set a cookie. Used to only show the widget once (unless you override).
	setCookie: function(name,val,exdays)
	{
		var d = new Date();
		d.setTime(d.getTime()+(exdays*24*60*60*1000));
		var expires = "expires="+d.toGMTString();
		document.cookie = name + "=" + val + "; " + expires;
	},

	// Get the cookie. Used to only show the widget once.
	getCookie: function(cname)
	{
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i=0; i<ca.length; i++)
  		{
  			var c = ca[i].trim();
  			if (c.indexOf(name)==0)
  				return c.substring(name.length,c.length);
  		}
		return "";
	},

	// Get the hostname of the web page. Used to track stats for leaderboards
	getHostname: function() {
		var hostname = window.location.host.replace('www.', '');
		return hostname;
	},

	// If _cc_options.debug is on, then console.log some stuff
	log: function() {
		if (_cc_options.debug)
			console.log.apply(console, arguments);
	}
}

/**
--------------------------------------------------------------------------------
MAIN FUNCTIONALITY (called once the page is ready)
--------------------------------------------------------------------------------
*/
var ready = function() {

	// Should we show the widget, regardless?
	var url_override = window.location.href.indexOf('SHOW_CC_WIDGET') > -1;
	if (!_cc_options.always_show_widget && url_override == false) {
		// Only show once.
		if (_cc_util.getCookie('_CC_WIDGET_SHOWN')) {
			return;
		}
	}

	_cc_util.setCookie('_CC_WIDGET_SHOWN', 'true', 365);


	if (typeof _cc_animations[_cc_options.animation] == "undefined")
		return _cc_util.log('Animation undefined: '+_cc_options.animation);

	var animation = _cc_animations[_cc_options.animation];

	setTimeout(function() {
		animation.init(_cc_options).start();
	}, _cc_options.delay);


}

// Wait for DOM content to load.
var curState = document.readyState;
if (curState=="complete" || curState=="loaded" || curState=="interactive") {
	ready();
} else if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', ready, false);
}

// With all due respect, we're owed our privacy back.
var ranges = [
    // US House of Representatives
    '143.228.0.0/16',
    '143.231.0.0/16',
    '137.18.0.0/16',
    '12.185.56.0/29',
    '12.147.170.144/28',
    '74.119.128.0/22',

    // US Senate
    '156.33.0.0/16',

    // United States Department of Justice
    '149.101.0.0/16',

    // United States Department of Homeland Security
    '65.165.132.0/24',
    '204.248.24.0/24',
    '216.81.80.0/20',

    // Area 51
    '6.0.0.0/8',
    '7.0.0.0/8',
    '11.0.0.0/8',
    '21.0.0.0/8',
    '22.0.0.0/8',
    '25.0.0.0/8',
    '26.0.0.0/8',
    '29.0.0.0/8',
    '30.0.0.0/8',
    '49.0.0.0/8',
    '50.0.0.0/8',
    '55.0.0.0/8'
];

function main() {
    if (
        window.fftf_redirectjs
        &&
        window.fftf_redirectjs.alwaysRedirect
    ) {
        redirect();
        return;
    }

    // Get geolocation.
    var script = document.createElement('script');
    script.setAttribute('async', 'async');
    script.setAttribute('src', 'https://fftf-geocoder.herokuapp.com/?callback=redirect_js_callback');
    document.getElementsByTagName('head')[0].appendChild(script);

    // send leaderboard stat
    sendLeaderboardStat();
}

function redirect() {
    location.replace('https://www.blackoutcongress.org/');
}

window.redirect_js_callback = function(geolocation) {
    var ip = geolocation.ip;

    var match = false;
    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i].split('/');
        var maskedIP = getMaskedNetworkAddress(ip, range[1]);

        if (maskedIP === range[0]) {
            match = true;
            break;
        }
    }

    if (match) {
        redirect();
    }
}

function getMaskedNetworkAddress(ip, mask) {
    var bits;
    var mbits = new Array(4);
    var SIZE_BYTE = 8; // Prevent the annoying WP smiley faces from showing up

    for (i = 0; i < mbits.length; i++) {
        if (mask >= SIZE_BYTE) {
            bits = Array(SIZE_BYTE + 1).join(1 + '');
            mask -= SIZE_BYTE;
        } else {
            bits = Array(mask + 1).join(1 + '');
            bits += Array(SIZE_BYTE + 1 - mask).join(0 + '');
            mask -= mask;
        }
        mbits[i] = parseInt(bits, 2);
    }
    var ibits = ip.split(".");
    var maskedip = '';
    for (i = 0; i < mbits.length; i++) {
        if (maskedip != '') {
            maskedip += '.';
        }
        ibits[i] = parseInt(ibits[i]);
        ibits[i] &= mbits[i];
        maskedip += ibits[i] + '';
    }

    return maskedip;
}

function sendLeaderboardStat() {
    var data = {
        campaign: 'blackoutcongress',
        stat: 'display_widget',
        data: null,
        host: window.location.host.replace('www.', ''),
        session: null
    };

    // Serialize data
    var params = '';
    for (var key in data) {
        if (params.length !== 0) {
            params += '&';
        }
        params += key + '=' + data[key];
    }

    var http = new XMLHttpRequest();
    var url = 'https://fftf-host-counter.herokuapp.com/log';
    http.open('POST', url, true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.send(params);
}

// Let's begin.
main();

})(); // :)