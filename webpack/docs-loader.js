const marked = require('marked')
module.exports = function(content) {
  this.cacheable && this.cacheable()
  this.callback(
    null,
    `module.exports = function(Component){
        Component.options.beforeCreate.push(function(){
            var docs='${marked(content, { sanitize: true })
              .trim()
              .replace(/[\n\r]/g, '')}';
            Object.defineProperty(this,"$docs",{
                get:function(){return docs}
            })
        })
    }\n`
  )
}
