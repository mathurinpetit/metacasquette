$(document).ready(init);

function init() {

	const rotates360 = [];

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
			rotates360.push(rotate);
	});

	for (const rotate of rotates360) {
		rotate.animate360(5000);
	}


	// quand on arrive sur l'image, un tour complet

}
