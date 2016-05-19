// background.js
var Sites = [
		{
			title: '豆瓣',
			key: 'douban',
			url: 'http://www.douban.com/search?cat=1002&q=_QUERY_',
			parse: '.result-list .result',
			details_link: '.title a',
			details_link_parse: /url=([^&]+)/,
			details_list: '#hot-comments, #review_section .mod-bd:last-child'
		}
];
var Tabid = null;
// ajaxRequest
function ajaxRequest(method, url, data, callback, type){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			var resp =  xhr.responseText;
			if ( 'json'==type ) {
				resp = JSON.parse(resp);
			} else if('html' == type){
				resp = (new DOMParser()).parseFromString(resp, 'text/html');
			}
			callback(resp, xhr.status);
		}
	};
	xhr.open(method, url, true);
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	if ('json'===type) xhr.setRequestHeader('Accept', 'application/json');
	if (typeof data === 'string') xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.send(data);
	return xhr;
}

function absolutize(base, url) {
    var d = document.implementation.createHTMLDocument();
    var b = d.createElement('base');
    d.head.appendChild(b);
    var a = d.createElement('a');
    d.body.appendChild(a);
    b.href = base;
    a.href = url;
    return a.href;
}

function parseLink(dom, ref){
	var links = dom.querySelectorAll('a');
	for(var i=0; i<links.length; i++){
		var lk = links[i]; 
		var hf = lk.getAttribute('href');
		if(!/^#|^void|^javascript/.test(hf)) {
			lk.setAttribute('target', '_blank');
			if(!/^https?:\/\//.test(hf)){
				lk.href = absolutize(ref, hf);
			}
		}
	}
	return dom;
}

function parseContent(site, dom){
	parseLink(dom, site.url);
	if(site.details_link){ // 处理详细页面链接地址
		var link = dom.querySelector(site.details_link);
		if(link){
			if(site.details_link_parse){
				var url = site.details_link_parse.exec(link.getAttribute('href'));
				if(url && url[1]){
					link.setAttribute('href',decodeURIComponent(url[1]));
				}
			}
			if(site.details_list){ // 访问详细页面，获取详细信息列表
				ajaxRequest("GET", link.href, null, function(r, status){
					var details  = status == 200 && r  ? 
						site.details_list.split(/,/).map(function(v, k){ 
							var vq = r.querySelector(v);
                            var vh = vq ? parseLink(vq, link.href).innerHTML.replace(/^\s+|\s+$/g, '') : '';
							return vh ? '<div class="kcabout-content-details-box kcabout-content-details-box-'+k+'">'+vh+'</div>' : '';
						}).join('') : null;
					showSite(site, details ? details : '<div class="kcabout-content-no-details">No Details!</div>', 'details');
				}, 'html');
			}
		}
	}
	return dom.innerHTML;
}
function search(query){
	var txt = query.replace(/^\s+|\s$/g, '').replace(/^[《》：]+|[《》：]+$/g, '');
	if ( txt ) {
		for(var i=0; i < Sites.length; i++){
			var site = Sites[i];
			ajaxRequest("GET", site.url.replace(/_QUERY_/, encodeURIComponent(txt)), null, function(r, status) {
				if (status != 200) {
					showSite(site, 'Error Code: ' + status, 'error');
				} else {
					var hm = r.querySelector(site.parse);
					showSite(site, hm ? parseContent(site, hm) : 'No Result Found', hm ? 'append' : 'error');
				}
			}, 'html');
		}
	}
	sendMessage({html: txt, type: 'new'});
}

function showSite(site, cont, type){
	var html = cont;
	if ('error'==type){
		html = '<div class="kcabout-error">'+cont+'</div>';
	}
	sendMessage({html: html, type: type , site: site}, null, Tabid);
}

function sendMessage(msg, callback, tabid){ // null standfor current tab.id
	if (tabid) {
  		chrome.tabs.sendMessage(tabid, msg, function(response) {
	  		if(typeof callback ==='function'){
		  		callback(response);
	  		}
  		});
	} else {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			if(tabs.length>0){
				Tabid = tabs[0].id;
		  		chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
			  		if(typeof callback ==='function'){
				  		callback(response);
			  		}
		  		});
			}
		});
	}
}

// menu 
chrome.contextMenus.create({
    "title": "KcAbout -- 关键词检索",
    "contexts": ["selection", "link"],
    "onclick" : function(sel) {
        search(sel.selectionText);
    }
});
// keypress
chrome.commands.onCommand.addListener(function (command) {
    if (command === "kcabout") {
		sendMessage('getSelection', function(response){ 
			if(response && response.data){
				search(response.data);
			}
		});
    } else if (command === "kcabout-hide") {
		sendMessage('hideKcabout', function(){
			
		});
    }
});
