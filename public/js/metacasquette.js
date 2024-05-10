$(document).ready(init);

const rotates360 = {};
const blocked = {};
const deltaImg = {};
const initRotate = {};
var activePressed = null;
var mobile_test = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

function init() {

	$('.camera_upload').each(function(){
  	const fileInput = document.getElementById($(this).attr('id'));
		const progressBar = document.getElementById('progress');
		fileInput.onchange = () => {
		  const file = fileInput.files[0];
			const formData = new FormData();
			formData.append('file', file);
			formData.append('typeImg', $(this).attr('typeImg'));
			var id = $(this).attr('id').split('_')[1];
			formData.append('id',id);
			 const xhr = new XMLHttpRequest();
			   xhr.open('POST', '/admin/upload', true);
			   xhr.upload.onprogress = e => {
			     if (e.lengthComputable) {
			       const percentComplete = (e.loaded / e.total) * 100;
			       progressBar.style.width = `${percentComplete}%`;
			     }
			   };
			   xhr.send(formData);
				 xhr.onload = function() {
				 response = xhr.response;
				 console.log(response);
		     var responseObj = JSON.parse(response);
			     if(responseObj.upload == "done"){
			       location.reload();
			     }
		     };
		}
	});

	if($('.camera_upload').length){
		$(window).load(function() {
			$('img').each(function(){
				var theImage = new Image();
				theImage.src = $(this).attr("src");
				var danger = "";
				if(theImage.width+theImage.height > 2801){
					danger = 'text-danger';
				}
				$('<span class="legend '+danger+'">'+theImage.width+'x'+theImage.height+'</span>').insertAfter($(this));
			});
		});
	}

	$('tr[data-href]').on("click", function() {
    document.location = $(this).data('href');
	});

	$("a#plus").click(function(){
		buttonPlusClick();
	});

	$("a#plus").on('tap', function(){
		buttonPlusClick();
	});

	initRotateElements();
}

function buttonPlusClick(){
	var cpt = 0;
	$(".model.hidden").each(function(){
		if(cpt<12){
				$(this).removeClass("hidden");
		}
		cpt++;
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
		if($(window).scrollTop() + $(window).height() + 50 >= $(document).height()) {
	       $("a#plus").click();
	   }
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

			$('.wrapper:not(.hidden)').children(".img_not_360").each(function(){
				$(this).on('click',function(){
					$(this).siblings("a").click();
				});
			});

			$('.overlay-mobile').each(function(){
				$(this).remove();
			});
			$('.img-mobile').each(function(){
				$(this).remove();
			});

			$("#modalJeu").modal('show');

		}else{




			$(".rotate360mobile:visible").each(function(){
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
