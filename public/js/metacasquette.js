$(document).ready(init);

function init() {
	/* ========== DRAWING THE PATH AND INITIATING THE PLUGIN ============= */


	$.fn.scrollPath("getPath")
		// Move to 'start' element
			.moveTo(400, 50, {name: "electronic_card"})
			.lineTo(400, 650,{ callback: function() {
													alert("You've reached the end!");
													console.log(window["step"]);
													}})
			.rotate(Math.PI/2)
		.lineTo(400, 1200, {name: "map"})
		// Arc down and line to 'syntax'
		.arc(200, 1600, 400, -Math.PI/2, Math.PI/2, true)
		.lineTo(600, 2000, {
			callback: function() {
				highlight($(".settings"));
			},
			name: "telecarte"
		})
		// Continue line to 'scrollbar'
		.lineTo(1850, 2000, {
			callback: function() {
				highlight($(".sp-scroll-handle"));
			},
			name: "telecarte_multi_1"
		})
		.arc(2000, 2200, 200, -Math.PI/2, Math.PI/2, false, {rotate: Math.PI/2 ,name: "telecarte_multi_2"})
		.arc(2000, 2600, 200, -Math.PI/2, Math.PI/2, true, {name: "telecarte_multi_3"})
		.arc(2000, 3000, 200, -Math.PI/2, Math.PI/2, false, {name: "telecarte_multi_4"})
		.arc(2000, 3400, 200, -Math.PI/2, Math.PI/2, true, {rotate: -Math.PI/2 ,name: "telecarte_multi_5"})
		.lineTo(3000,3600,{name: "pokemon"})
	 	.arc(2800, 2200, 200, 2*Math.PI, 0, true,{name: "can"})
		// Arc up while rotating

		// Line to 'rotations'
		.lineTo(3000, 950, {
			name: "other_cans"
		})
		.rotate(3*Math.PI/2, {
			name: "rotations-rotated"
		})
		.lineTo(2400,400,{name: "national_gallery"})
		.arc(2300, 300, 100, Math.PI/2, 0, false, {rotate: Math.PI/2 })
		.lineTo(3000,0, {name: "matos"} )
		.lineTo(3000, -900)
		.arc(2850, -900, 150, 0, -Math.PI/2, true,{	name: "all"})

		//Line to 'follow'
		.lineTo(1500, -1050, {
			name: "about"
		})
		// Arc and rotate back to the beginning.
		.arc(1500, 50, 1100, -Math.PI/2, -Math.PI, true, {rotate: Math.PI*2, name: "end"});

	// We're done with the path, let's initate the plugin on our wrapper element
	$(".wrapper").scrollPath({drawPath: false, wrapAround: true});

	// Add scrollTo on click on the navigation anchors
	$("nav").find("a").each(function() {
		var target = $(this).attr("href").replace("#", "");
		$(this).click(function(e) {
			e.preventDefault();

			// Include the jQuery easing plugin (http://gsgd.co.uk/sandbox/jquery/easing/)
			// for extra easing functions like the one below
			$.fn.scrollPath("scrollTo", target, 1000, "easeInOutSine");
		});
	});

	/* ===================================================================== */

	$(".settings .show-path").click(function(e) {
		e.preventDefault();
		$(".sp-canvas").toggle();
	}).toggle(function() {
		$(this).text("Hide Path");
	}, function() {
		$(this).text("Show Path");
	});

	}


function highlight(element) {
	if(!element.hasClass("highlight")) {
		element.addClass("highlight");
		setTimeout(function() { element.removeClass("highlight"); }, 2000);
	}
}
function ordinal(num) {
	return num + (
		(num % 10 == 1 && num % 100 != 11) ? 'st' :
		(num % 10 == 2 && num % 100 != 12) ? 'nd' :
		(num % 10 == 3 && num % 100 != 13) ? 'rd' : 'th'
	);
}
