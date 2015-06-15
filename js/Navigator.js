var dataExtractor = require('./DataExtractor.js');
var request = require('request');
var fs = require('fs');


var isNavInProgress = false;
var HISTORY = ['http://news.ycombinator.com/'];
function NavigateTo(url) {

  if (isNavInProgress) {
    return false;
  }

  ga('send', 'pageview', {
    'page' : 'ZenBrowser',
    'title': url
    });
 
  isNavInProgress = true;
  request(url, function(error, response, body) {
    isNavInProgress = false;
    var extracted = dataExtractor(body, url)
    console.log("\n\n======= RESULT ======\n\n");
    console.log(extracted);

    var buildOutput = articleGenerator(extracted, url);
    document.getElementById('container').innerHTML = buildOutput;
  }); 
}

function Navigate(url) {
  if (isNavInProgress) {
    return false;
  }
  HISTORY.push(url);
  NavigateTo(url);
}

function NavigateBack() {
  if (isNavInProgress) {
    return false;
  }
  if (HISTORY.length) {
    var url = HISTORY[HISTORY.length - 1];
    HISTORY.splice(HISTORY.length - 1, 1);
    NavigateTo(url);
    if (HISTORY.length == 0) {
      HISTORY.push(url);
    }
  }
}

function NavigateNext() {
  if (isNavInProgress) {
    return false;
  }
}






function articleGenerator(dom, url) {

  //result = result.replace(/_image_/g, dom.image);

  var main = dom.text;

  // Clean tables
  main = main.replace(/<\/td>[^<]+<td>/g, '</td><td>');
  main = main.replace(/<\/tr>[^<]+<tr>/g, '</tr><tr>');
  main = main.replace(/<\/th>[^<]+<th>/g, '</th><th>');
  main = main.replace(/<\/td>[^<]+<\/tr>/g, '</td></tr>');
  main = main.replace(/<\/td>[^<]+<\/th>/g, '</td></th>');
  main = main.replace(/<table>[^<]+<tr>/g, '<table><tr>');
  main = main.replace(/<table>[^<]+<th>/g, '<table><th>');
  main = main.replace(/<\/th>[^<]+<tr>/g, '</th><tr>');
  main = main.replace(/<\/th>[^<]+<\/tr>/g, '</th></tr>');
  main = main.replace(/<tr>[^<]+<th>/g, '<tr><th>');
  main = main.replace(/<tr>[^<]+<td>/g, '<tr><td>');


  // Clean Lists
  main = main.replace(/<\/li>[^<]+<li>/g, '</li><li>');
  main = main.replace(/<\/li>[^<]+<\/ol>/g, '</li></ol>');
  main = main.replace(/<\/li>[^<]+<\/ul>/g, '</li></ul>');
  main = main.replace(/<ol>[^<]+<li>/g, '<ol><li>');
  main = main.replace(/<ul>[^<]+<li>/g, '<ul><li>');


  // Clean pre
  // main = main.replace(/>[^<]+<pre>/g, '><pre>');


  main = main.replace(/\r/g, '');
  main = main.replace(/\n\n/g, '\n');
  main = main.replace(/\n\n/g, '\n');
  main = main.replace(/\n\n/g, '\n');
  main = main.replace(/\n\n/g, '\n');
  main = main.replace(/\n\n/g, '\n');

  main = main.replace(/\n/g, '</p><p>&nbsp;&nbsp;&nbsp;');

  // Clean PRE
  main = main.replace(/<p>\&nbsp;\&nbsp;\&nbsp;<pre>/g, '<pre>');
  main = main.replace(/<\/pre><\/p>/g, '</pre>');

// Clean Table
  main = main.replace(/<p>\&nbsp;\&nbsp;\&nbsp;<table>/g, '<table>');
  main = main.replace(/<\/table><\/p>/g, '</table>');

  main = main.replace(/\n/g, '');
  main = main.replace(/\<p\>&nbsp;&nbsp;&nbsp;\<\/p\>/g, '');
  main = '<p>&nbsp;&nbsp;&nbsp;' + main + '</p>';
  main = main.replace(/\\r/g, '');
  main = main.replace(/\\n/g, '');

  main = main.replace(/<br_code>/g, '\n');

  return '<h1>' + dom.title + '</h1>' + main;
 
}
