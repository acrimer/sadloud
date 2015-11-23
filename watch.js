var Metalsmith = require('metalsmith');
var templates = require('metalsmith-templates');
var metadata = require('metalsmith-metadata');
var fileMetadata = require('metalsmith-fileMetadata');
var markdown = require('metalsmith-markdown');
var layouts = require('metalsmith-layouts');
var watch = require('metalsmith-watch');
var paginate = require('metalsmith-paginate');
var partial = require('metalsmith-partial');
var sitemap = require('metalsmith-sitemap');
var feed = require('metalsmith-feed');
var drafts = require('metalsmith-drafts');
var permalinks = require('metalsmith-permalinks');
var tags = require('metalsmith-tags');

new Metalsmith(__dirname)
  .ignore('.DS_Store')
  .use(markdown())
  .use(layouts('handlebars'))
  .use(drafts())
  .use(metadata())
  .use(function(files, metalsmith, done){
    metadata = metalsmith.metadata();
    require('./lib/handlebars.js')();
    done();
  })
  .use(fileMetadata([
  	{
  		pattern: "posts/**/*.md",
  		metadata: {
  			template: "post-single.hbs",
  			name: 'Sad + Loud',
  			slug: 'posts'
  		}
  	}]))
  .use(paginate({
  	perPage: 10,
  	path: "/posts"
  }))
  .use(permalinks({
    relative: false
  }))
  .use(tags({
    blogs: {
      handle: 'categories',
      path: '/posts/tags/:tag.html',
      template: 'post-tags.hbs',
      pathPage: "/posts/tags/:tag/page-:num.html",
      perPage: 10,
      metadata: {
        title: "Sad + Loud",
        description: "Only :tag music",
      }
    }
  }))
  .use(markdown())
  .use(partial({
    directory: './templates/partials',
    engine: 'handlebars'
  }))
  .use(templates({
  	engine: 'handlebars',
  	directory: 'templates'
  }))
  .build(function(err) {
    if (err) throw err;
  });