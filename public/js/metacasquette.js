$(document).ready(init);

const rotates360 = {};
const blocked = {};
const deltaImg = {};
const initRotate = {};
var activePressed = null;
var mobile_test = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

function init() {

	$("a#plus").click(function(){
		var cpt = 0;
		$(".model.hidden").each(function(){
			if(cpt<12){
					$(this).removeClass("hidden");
			}
			cpt++;
		});
		initRotateElements();
	});

	initRotateElements();
}

function initRotateElements(){

	$(window).on('scroll', function(){
		$('.wrapper:not(.hidden)').children(".rotate360").each(function(){
				var id = $(this).attr("id");
				if (Utils.isElementInView($('#'+id), false) && !blocked[id]) {
					blocked[id] = true;
					rotates360[id].animate360(2000);
				}
		});
	});


		$('.wrapper:not(.hidden)').children(".rotate360").each(function(){

			var id = $(this).attr("id");
			if(!initRotate[id]){
				initRotate[id] = true;
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
				}
		});
		if(!mobile_test){

			$('.wrapper:not(.hidden)').children(".rotate360").each(function(){
					var id = $(this).attr("id");
					deltaImg[id] = 0;
					rotates360[id].on('press', () => {
						deltaImg[id] = 0;
						activePressed = id;
					});

					rotates360[id].on('delta', ({x, numberOfImages, offsetIndex}) => {
						deltaImg[id] = offsetIndex;
					})

					rotates360[id].on('release', ({index, image}) => {
						if (deltaImg[id] == 0 && id == activePressed) {
							$(this).siblings("a").click();
							activePressed = null;
						}
					});
			});

			$(".img_not_360").on('click',function(){
				$(this).siblings("a").click();
			});

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
				rotateMobile.animate360(4000);
			});
		}

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
