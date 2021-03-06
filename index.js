
var loaderUtils = require("loader-utils");

// using: regex, capture groups, and capture group variables.
var templateUrlRegex = /templateUrl\s*:(\s*['"`](.*?)['"`]\s*([,}]))/gm;
var stylesRegex = /styleUrls *:(\s*\[[^\]]*?\])/g;
var stringRegex = /(['`"])((?:[^\\]\\\1|.)*?)\1/g;

function replaceStringsWithRequires(string) {
  return string.replace(stringRegex, function (match, quote, url) {
    if (url.charAt(0) !== ".") {
      url = "./" + url;
    }
    return "require('" + url + "')";
  });
}

module.exports = function(source, sourcemap) {

  var config = {};
  var query = loaderUtils.parseQuery(this.query);
  var styleProperty = 'styles';
  var templateProperty = 'template';

  if (this.options != null) {
    Object.assign(config, this.options['angular2TemplateLoader']);
  }

  Object.assign(config, query);

  if (config.keepUrl === true || config.keepStyleUrl === true) {
    styleProperty = 'styleUrls';
  }

  if (config.keepUrl === true || config.keepTemplateUrl === true) {
    templateProperty = 'templateUrl';
  }

  // Not cacheable during unit tests;
  this.cacheable && this.cacheable();

  var newSource = source.replace(templateUrlRegex, function (match, url) {
    // replace: templateUrl: './path/to/template.html'
    // with: template: require('./path/to/template.html')
    // or: templateUrl: require('./path/to/template.html')
    // if `keepUrl` or `keepTemplateUrl` query parameter is set to true.
    if (config.excludeTemplateRegex) {
      var shouldExclude = new RegExp(config.excludeTemplateRegex).test(url);

      if (shouldExclude) {
        templateProperty = 'template';
      }
    }
    return templateProperty + ":" + replaceStringsWithRequires(url);
  })
    .replace(stylesRegex, function (match, urls) {
      // replace: stylesUrl: ['./foo.css', "./baz.css", "./index.component.css"]
      // with: styles: [require('./foo.css'), require("./baz.css"), require("./index.component.css")]
      // or: styleUrls: [require('./foo.css'), require("./baz.css"), require("./index.component.css")]
      // if `keepUrl` or `keepStyleUrl` query parameter is set to true.
      return styleProperty + ":" + replaceStringsWithRequires(urls);
    });

  // Support for tests
  if (this.callback) {
    this.callback(null, newSource, sourcemap)
  } else {
    return newSource;
  }
};
