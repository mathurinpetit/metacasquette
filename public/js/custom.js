(function($) {
  $(document).ready(function() {
    /* IF YOU WANT TO APPLY SOME BASIC JQUERY TO REMOVE THE VIDEO BACKGROUND ON A SPECIFIC VIEWPORT MANUALLY
    var is_mobile = false;
    if( $('.player').css('display')=='none') {
    is_mobile = true;
  }
  if (is_mobile == true) {
  //Conditional script here
  $('.big-background, .small-background-section').addClass('big-background-default-image');
}else{
$(".player").mb_YTPlayer();
}
});
*/
/*  IF YOU WANT TO USE DEVICE.JS TO DETECT THE VIEWPORT AND MANIPULATE THE OUTPUT  */

//Device.js will check if it is Tablet or Mobile - http://matthewhudson.me/projects/device.js/
if (!device.tablet() && !device.mobile()) {
  $(".player").mb_YTPlayer();
} else {
  //jQuery will add the default background to the preferred class
  $('.video-background').addClass(
    'video-background-default-image');
  }
  (function(){
    $('.carousel-showmanymoveone .item').each(function(){
      var itemToClone = $(this);
      var nbmax=2;
      if (!device.tablet() && !device.mobile()){
        nbmax=3;
      }
      for (var i=1;i<nbmax;i++) {
        itemToClone = itemToClone.next();

        // wrap around if at end of item collection
        if (!itemToClone.length) {
          itemToClone = $(this).siblings(':first');
        }

        // grab item, clone, add marker class, add to collection
        itemToClone.children(':first-child').clone()
        .addClass("cloneditem-"+(i))
        .appendTo($(this));
      }
    });
  }());

  $(".slide").each(function(){
      var slide = document.getElementById($(this).attr('id'));
      var modelesSlide = $(this);
      var mc = new Hammer(slide);
      mc.on("panleft", function(ev) {
        modelesSlide.children('.right').click();
      });
      mc.on("panright", function(ev) {
        modelesSlide.children('.left').click();
    });
  });
});


})(jQuery);
