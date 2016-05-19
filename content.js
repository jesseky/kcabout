// content.js 
var Con = null;

function showContent() {
    if (!/kcabout-content-show/.test(Con.className)) {
        Con.className += (Con.className ? ' ' : '') + 'kcabout-content-show';
    }
}

function hideContent() {
    if (/kcabout-content-show/.test(Con.className)) {
        Con.className = Con.className.replace(/\s*kcabout-content-show/, '');
    }
}

function createContent() {
    if (null === Con) {
        Con = document.createElement('div');
        Con.setAttribute('id', 'kcabout_content');
        Con.setAttribute('class', 'kcabout-content');
        Con.innerHTML = '<div class="kcabout-content-in"><b class="kcabout-content-close">×</b><h1 class="kcabout-content-h1"></h1><section class="kcabout-content-cont"></section></div>';
        document.body.appendChild(Con);
        Con.querySelector('.kcabout-content-close').addEventListener('click', function (evt) {
            hideContent();
        }, false);
    }
}

function appendContent(request) {
    createContent();
    if ('append' === request.type || 'error' === request.type) {
        var loading = Con.querySelector('.kcabout-content-cont .kcabout-content-loading');
        if (loading) {
            Con.querySelector('section.kcabout-content-cont').removeChild(loading);
        }
        var html = '<article class="kcabout-content-article kcabout-content-article-' + request.site.key + '">' +
            '<h2 class="kcabout-content-site-title">' + request.site.title + '</h2>' +
            '<div class="kcabout-content-site-html">' + request.html + '</div>' +
            (request.site.details_list && 'error' !== request.type ? '<div class="kcabout-content-site-details"><div class="kcabout-content-details-loading"><div class="kcabout-spinner"></div><div>...DETAILS...</div></div></div>' : '') + '</article>';
        Con.querySelector('section.kcabout-content-cont').innerHTML += html;
    } else if ('details' === request.type) {
        var dq = Con.querySelector('.kcabout-content-article-' + request.site.key + ' .kcabout-content-site-details');
        if (dq) {
            dq.innerHTML = request.html;
        }
    } else { // 'new' == type
        Con.querySelector('h1.kcabout-content-h1').innerHTML = request.html;
        Con.querySelector('section.kcabout-content-cont').innerHTML = '<div class="kcabout-content-loading"><div class="kcabout-spinner"></div><div>...LOADING...</div></div>';
    }
    setTimeout(function () {
        showContent();
    }, 50);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if ('getSelection' === request) {
        var txt = window.getSelection().toString();
        if (txt) {
            sendResponse({
                data: txt
            });
        } else {
            hideContent();
        }
    } else if ('hideKcabout' === request) {
        hideContent();
    } else if (request.html && request.type) {
        appendContent(request);
    }
});