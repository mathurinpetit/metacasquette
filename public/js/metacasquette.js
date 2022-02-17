$(document).ready(init);

function init() {

	var mobile_test = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

	const rotates360 = {};
	const blocked = {};

	$(".rotate360").each(function(){

		var id = $(this).attr("id");
		var name = $(this).data("name");
		var numberPictures = $(this).data("number");
		var rotate = new ProductViewer({
				element: 		document.getElementById(id),
				imagePath: 		"../img/casquettes/"+name+"/product",
				filePrefix: 	'',
				fileExtension: '.jpg',
				numberOfImages: numberPictures
			});
			rotates360[id] = rotate;
			blocked[id] = false;
	});




	if(!mobile_test){
		$('.overlay-mobile').each(function(){
			$(this).remove();
		});
		$('.img-mobile').each(function(){
			$(this).remove();
		});
	}else{
		$(".rotate360mobile").each(function(){
			var id = $(this).attr("id");
			var name = $(this).data("name");
			var numberPictures = $(this).data("number");
			var rotateMobile = new ProductViewer({
					element: 		document.getElementById(id),
					imagePath: 		"../img/casquettes/"+name+"/product",
					filePrefix: 	'',
					fileExtension: '.jpg',
					numberOfImages: numberPictures
				});
			rotateMobile.once('loaded', () => $('#'+id+' .product-viewer__image').addClass("img-popup-mobile"));
		});
	}
	window.addEventListener('scroll',(event) => {
	$(".rotate360").each(function(){
			var id = $(this).attr("id");
			if (Utils.isElementInView($('#'+id), false) && !blocked[id]) {
				blocked[id] = true;
				rotates360[id].animate360(2000);
			}
		});
	});

}


function Utils() {

}

Utils.prototype = {
    constructor: Utils,
    isElementInView: function (element, fullyInView) {
        var pageTop = $(window).scrollTop();
        var pageBottom = pageTop + $(window).height();
        var elementTop = $(element).offset().top;
        var elementBottom = elementTop + $(element).height();

        if (fullyInView === true) {
            return ((pageTop < elementTop) && (pageBottom > elementBottom));
        } else {
            return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
        }
    }
};

var Utils = new Utils();
