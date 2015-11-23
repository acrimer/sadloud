//substantially based on work by David Ashby (https://github.com/deltamualpha/) and Jim Nielsen (https://github.com/jimniels)

var Handlebars = require('handlebars');
var fs         = require('fs');
var path       = require('path');
var recursive  = require('recursive-readdir');
var Swag       = require('swag');
var people     = require('../src/data/people.json');
var pagesMeta  = require('../src/data/pages-metadata.json');

/*
  Shuffle Function
  http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
function shuffle(array) {
  var currentIndex = array.length,
      temporaryValue,
      randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

module.exports = function() {

  // Register Partials
  var partialsDir = path.join(__dirname, '../templates/partials');
  recursive(partialsDir, function (err, files) {
    if (err) { throw err; }
    files.forEach(function (filename) {
      var matches = /^([^.]+).hbs$/.exec(filename);
      if (!matches) {
        return;
      }
      var name = matches[1].replace(partialsDir + '/', '');
      var template = fs.readFileSync(filename, 'utf8');
      Handlebars.registerPartial(name, template);
    });
  });

  // Swag helpers
  Swag.registerHelpers(Handlebars);

  // Call Sidebar Module
  Handlebars.registerHelper('callSidebarModule', function(module) {
    return 'sidebar/' + module;
  });

  /*
    Get Page Title
    If there's a parent collection, it's a post page
      <Post Title> | <Parent Collection Name> | Sad + Loud
    Otherwise, it's a single page
      <Page Title> | Sad + Loud
  */
  Handlebars.registerHelper('getPageMetaTitle', function(context) {
    var title = '';
    var div = ' // ';

    // Add title and optional parent collection
    if(context.hasOwnProperty('parentCollection')) {
      title += context.title + div + context.parentCollection.name;
    } else if(context.title) {
      title += context.title;
    }

    title += div + 'Sad + Loud';

    return title;
  });

  /*
    Page Meta Description / Keywords
    Get the current page's meta info from pagesMeta.json
  */
  Handlebars.registerHelper('getPageMeta', function(context, options) {
    var key = options.hash.key;

    // If it has a parent collection, inherit it's parent's meta (if present)
    if(context.parentCollection) {
      if(pagesMeta[context.parentCollection.slug]) {
        return pagesMeta[context.parentCollection.slug][key];
      } else {
        return pagesMeta.defaults[key];
      }
    }
    // Otherwise, use the page slug to find an entry in pages meta
    // if not present, use the defaults
    else {
      if(pagesMeta[context.slug]) {
        return pagesMeta[context.slug][key];
      } else {
        return pagesMeta.defaults[key];
      }
    }
  });


  /*
    Slugify
    Convert a number or string to a slug
    i.e. "Let’s Talk Innovation" -> "lets-talk-innovation"
    http://stackoverflow.com/questions/1053902/how-to-convert-a-title-to-a-url-slug-in-jquery
  */
  Handlebars.registerHelper('slugify', function(str) {
    return str
      .toString()
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  });

  /*
    Body Classes
    Creates classes for pages
    See _bodyClasses.scss for more info
  */
  Handlebars.registerHelper('bodyClasses', function(context) {
    var classNames = '';

    // Rubric
    if(context.hasOwnProperty('parentRubric')) {
      classNames += ' parent-rubric-' + Handlebars.helpers.slugify(context.parentRubric);
    }

    // Parent Collection OR Page
    if(context.hasOwnProperty('parentCollection')) {
      //classNames += ' ' + context.parentCollection.slug;
      classNames += ' parent-collection-' + context.parentCollection.slug;
    } else if(context.hasOwnProperty('slug')) {
      classNames += ' ' + context.slug;
    }

    return classNames;
  });

  /*
    Related Posts
    Create a list of related posts and return them
    options.hash.limit - Number of related posts to return (default 5)
    options.hash.currentPostTitle - Title of post being displayed
    options.hash.limitToCategory - If set, limit related posts to this category
  */
  Handlebars.registerHelper('relatedPosts', function(collection, options) {
    var limit = (options.hash.hasOwnProperty('limit')) ? options.hash.limit : 5;
    var relatedPosts = [];
    // collection = shuffle(collection);
    for (var i = 0; i < collection.length; i++) {
      // If it's not the current post, add it as a related post
      if(collection[i].title !== options.hash.currentPostTitle) {
        if(options.hash.hasOwnProperty('limitToCategory')){
          if(collection[i].category === options.hash.limitToCategory) {
            relatedPosts.push(collection[i]);
          };
        } else {
          relatedPosts.push(collection[i]);
        }
        if(relatedPosts.length >= limit) {
          break;
        }
      }
    }
    return relatedPosts;
  });

  /*
    Show Featured Asset
    Helper that determines whether or not to show a post or page
    featured asset.
  */
  Handlebars.registerHelper('showFeaturedAsset', function(context) {
    // First check to see if it even has a featured asset
    if(context.featuredImage || context.featuredYoutube) {
      // If it is post index only show it if it's featured
      // Otherwise, always show it
      if(context.isPostIndex) {
        if(context.featured) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    } else {
      return false;
    }
  });

  /*
    Strip HTML
    Primarily used for post excerpts
  */
  Handlebars.registerHelper("stripHtml", function (str){
    return str.replace(/<[^>]*>/g, '');
  });

  /*
    Get Person Info
    Will get the author info from authors.json
    Object key is author's name, i.e. authors['Andrew Crimer']
  */
  Handlebars.registerHelper("getPersonInfo", function (person, key){
    if(people[person] && people[person][key]) {
      return people[person][key];
    } else {
      return false;
    }
  });

  Handlebars.registerHelper("join", function (context){
    if (Array.isArray(context)) {
      if (context.length === 1) {
        return context[0];
      } else {
        return context.join(", ");
      }
    } else if (typeof context === 'string') {
      return context;
    } else {
      return '';
    }
  });

  Handlebars.registerHelper('limit', function(collection, end, start) {
    return collection.slice(start, end + 1);
  });

  Handlebars.registerHelper('order', function(collection, order){
    var ordered = {};
    order.forEach(function(key) {
      ordered[key] = collection[key];
    });
    return ordered;
  });
};
