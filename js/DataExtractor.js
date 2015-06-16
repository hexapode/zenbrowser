
var cheerio = require('cheerio');

function Extractor() {


  this.extract = function(html, url) {
    this.url = url;
    this.getDomainFromURL();

    console.log('URL', url);
    console.log('domain', this.domain);
    this.html = html;

    this.doc = cheerio.load(html);
    this.data = {};
    // do some inits
    this.initMetas();


    // Extraction Time
    // this.data.meta = this.meta;

    this.data.charset = this.getCharset();
    this.data.title = this.getTitle();
    this.data.image = this.getHeaderImage();
    this.data.sourceImage = this.getSourceImage();
    this.data.description = this.getDescription();
    this.data.text = this.extractText();
    this.data.summary = this.summaryText(this.data.text);

    return this.data;
  };


  this.summaryText = function(html) {
    var paragraphs = html.split('\n');

    for (var i = 0; i < paragraphs.length; ++i) {

    }
  };

  this.getDomainFromURL = function() {
    // remove pre //
    var url = this.url;

    if (url.indexOf('://') != -1) {
      var treamIndex = url.indexOf('://') + 3;
      url = url.substring(treamIndex );
    }
    else if (indexOf('//') === 0) {
       url = url.substring(2);
    }
    console.log('Stripped URL', url);
    // remove endDoman
    var slashIndex = url.indexOf('/');
    if (slashIndex != -1) {
      url = url.substring(0,slashIndex);
    }
    console.log('Final URL', url);
    this.domain = url;

  };

  this.getDescription = function() {
    return this.getFromMeta(['og:description', 'description'])
  };

  this.getCharset = function() {
    if (this.charset) {
      return this.charset;
    }
    return "UTF-8";
  }

  this.getTitle = function() {

    var title = this.getFromMeta(['og:title', 'twitter:title', 'sailthru.title']);

    if (!title) {
       title = this.doc('title').html();
    }

   

    
    /*
      Check for delimiters in title
    */
    var commonTitleDelimiters = ['|', '-', '»', ':', '>', '·', '&#xB7;'];
    var delimiterFound = false;

    for (var i = 0; !delimiterFound && i < commonTitleDelimiters.length; ++i) {
      if (title.indexOf(commonTitleDelimiters[i]) !== -1) {
        delimiterFound = 1;
        var maxLenght = 0;
        var titleSplit = title.split(commonTitleDelimiters[i]);
        for (var j = 0; j < titleSplit.length; ++j) {
          if (titleSplit[j].length > maxLenght) {
            maxLenght = titleSplit[j].length;
            title = titleSplit[j];
          }
        }
      }
    }

    return title;
  };

  this.getSourceImage = function() {
    var authorLogo = this.getFromMeta(['twitter:site', 'twitter:author']);
    if (authorLogo) {
      return "https://twitter.com/" + authorLogo + "/profile_image?size=original";
    }
    return '';
  }

  this.getHeaderImage = function() {
    return this.getFromMeta([
      'og:image',
      'itemprop=image',
      'twitter:image:src',
      'twitter:image',
      'twitter:image0'
    ]);
  }


  this.getFromMeta = function(keys) {
    for (var i = 0; i < keys.length; ++i) {
      if (this.meta[keys[i]]) {
        return this.meta[keys[i]];
      }
    }
    return null;
  }

  this.initMetas = function() {
    this.meta = {};
    var rawMetas = this.doc('meta');

   for (var i = 0; i < rawMetas.length; ++i) {
      if (rawMetas[i].attribs.name) {
       this.meta[rawMetas[i].attribs.name] = rawMetas[i].attribs.content;
      }
      else if (rawMetas[i].attribs.property) {
         this.meta[rawMetas[i].attribs.property] = rawMetas[i].attribs.content;
      }
      if (rawMetas[i].attribs.charset) {
        this.charset = rawMetas[i].attribs.charset;
      }
    }
  }

  this.extractText = function() {
    var node = this.doc('body');

    var totalScore = this.buildNodeTree(node[0], 1);
    var linkScore = this.computeLinkScore(node[0]);
    console.log(totalScore);
    console.log('Links', linkScore);
    
    this.bestNode = null;
    this.selectBestNode(node[0]);
    var html = this.getPresentableHTMLFromNode(this.bestNode); 

    return html;
  };

  this.getPresentableHTMLFromNode = function(node) {
    var text = '';
    //console.log(node.type);

    var childText=  '';
    for (var i = 0; node.children && i < node.children.length; ++i) {
      if (node.children[i].type !== 'script' &&  node.children[i].type !== 'style') {
        childText += this.getPresentableHTMLFromNode(node.children[i]);
      }
    }

    if (childText) {
      childText = childText.trim();
      if (node.type == 'tag' && (node.name == 'h1' || node.name == 'h2' ||  node.name == 'h3' ||  node.name == 'h4' ||  node.name == 'h5' ||  node.name == 'h6')) { 
        if (childText.trim() === this.data.title.trim()) {
          childText = '';
        }
        else {
          text += '<b>' + childText + '</b>';
        }
      }
      else if (node.type == 'tag' && (node.name == 'b' || node.name == 'strong')) { 
        text += '<b>' + childText + '</b>';
      }
      else if (node.type == 'tag' && node.name == 'i') { 
        text += '<i>' + childText + '</i>';
      }
      else if (node.type == 'tag' && node.name == 'ul') { 
        text += '<ul>' + childText + '</ul>';
      }
      else if (node.type == 'tag' && node.name == 'ol') { 
        text += '<ol>' + childText + '</ol>';
      }
      else if (node.type == 'tag' && node.name == 'li') { 
        text += '<li>' + childText + '</li>';
      }
      else if (node.type == 'tag' && node.name == 'pre') { 
        text += '<pre>' + childText.replace(/\n/g, '<br_code>') + '</pre>';
      }
      else if (node.type == 'tag' && node.name == 'table') { 
        text += '<table>' + childText + '</table>';
      }
      else if (node.type == 'tag' && node.name == 'tr') { 
        text += '<tr>' + childText + '</tr>';
      }
      else if (node.type == 'tag' && node.name == 'td') { 
        text += '<td>' + childText + '</td>';
      }
      else if (node.type == 'tag' && node.name == 'th') { 
        text += '<th>' + childText + '</th>';
      }
      else if (node.type == 'tag' && node.name == 'code' && node.parent.name == 'pre') { 
        if (node.attribs['data-lang']) {
          text += '<code class="' + node.attribs['data-lang'] + '" data-lang="'+ node.attribs['data-lang'] + '">';
        }
        else if (node.attribs['class']) {
          text += '<code class="' + node.attribs['class'] + '" data-lang="'+ node.attribs['class'] + '">';
        }
        else {
          text +=  '<code>';
        }
        text += childText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code>';

      }
      else if (node.type == 'tag' && node.name == 'a') { 
        if (node.attribs['href']) {
          var href = node.attribs['href'];
          console.log('HREF', href);
          if (href.indexOf('://') === -1 && href.indexOf('//') === -1) {
            href = this.domain + '/' + href;
            console.log('HREFCORRECTED', href);
          }
          text += '<a class="link" onclick="Navigate(\'' + href + '\')">' + childText + '</a>';
        }
        else if (node.attribs['name']) {
          text += '<a name="' + node.attribs['name'] + '">' + childText + '</a>';
        }
        else {
          text += childText;
        }
      }
      else if (node.type == 'tag' && node.name == 'p') { 
        text += childText + '\n';
      }
      else {
        text += childText;
      }
    }

    if (node.type == 'text') {
      text += node.data;
    }
    if (node.type == 'tag' && node.name == 'br') { 
      text += '\n'
    }
    if (node.type == 'tag' && node.name == 'img') {
    
      var url = node.attribs.src;

      //console.log('img', url);
      if (url) {
        if (url.indexOf('://') != -1 || url.indexOf('//') === 0 || url.indexOf('data:') === 0) {
          if (url.indexOf('//') === 0) {
            url = 'http:' + url;
          }
          text += '<img src="'+  url + '"/>\n';
        } 
        else {
          text += '<img src="http://'+ this.domain   + url + '"/>\n';
        }
      }
    }

    return text;
  };

  this.buildNodeTree = function(node, depth) {
    var nodeScore = 0;
    for (var i = 0; node.children && i < node.children.length; ++i) {
      
      if (node.children[i].type === 'text') {
        nodeScore += this.analyseTextNodeValue(node.children[i].data)
      }
      else if (node.children[i].type !== 'script' &&  node.children[i].type !== 'style') {
        nodeScore += this.buildNodeTree(node.children[i], depth + 1);
      }
    }

    node.nodeScore = nodeScore;
    node.depth = depth;

    return nodeScore;
  }

  this.analyseTextNodeValue = function(nodeValue) {
    var value = 0;

    // count Words
    var str = nodeValue.replace(/(\n|\t|\r)/g, ' ');
    var strSplit = str.split(' ');

    for (var i = 0; i < strSplit.length; ++i) {

      if (strSplit[i].length > 1) {
        value++;
      }
    }

    return value;
  };

  this.computeLinkScore = function(node) {
    var score = 0;
    var linkScore = 0;
    for (var i = 0; node.children && i < node.children.length; ++i) {

      if (node.children[i].type === 'tag' && node.children[i].name === 'a') {
        linkScore += 1
      }
      else if (node.children[i].type !== 'script' &&  node.children[i].type !== 'style') {
        linkScore += this.computeLinkScore(node.children[i]);
      }
    }

    node.linkScore = linkScore;
    if (!node.nodeScore) {
      node.ratio = 0;
    }
    else {
      if (linkScore === 0) {
         node.ratio = node.nodeScore * node.nodeScore / .9;
      }
      else {
        node.ratio = node.nodeScore * node.nodeScore / linkScore;
      }
    }

  /*  console.log('-----==== NODE =====-----');
    console.log('link :', linkScore);
    console.log('words :', node.nodeScore)
    console.log('ratio :', node.ratio);
    
    console.log('');
    console.log('');*/
    return linkScore;
  };

  this.selectBestNode = function(node) {
    if (!node || node.ratio === 0) {
      return false;
    }

    if (!node.nodeScore) {
      node.nodeScore = 0;
    }
    if (!node.ratio) {
      node.ratio = 0;
    }

    var nodeScore = node.ratio;

    if (this.bestNode == null || nodeScore > this.bestNode.bestScore) {
      this.bestNode = node;
      this.bestNode.bestScore = nodeScore;
    }

    for (var i = 0; node.children && i < node.children.length; ++i) {
      this.selectBestNode(node.children[i]);
    }
  }
}




function DataExtractor(html, url) {

  var extractor = new Extractor();
  return extractor.extract(html, url);
}

module.exports = DataExtractor;