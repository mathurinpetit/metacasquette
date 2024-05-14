
 /*  Liste ici des Etapes du jeu interactif
  *  Etape0 Affichage => choix de la langue
  *  Etape1 Affichage => video d'introduction pour les appareils android et défilement de texte pour les ios
  *  Etape2 Enregistrement audio TODO : Ajouter compteur
  *  Etape3 Message d'attente
  *  Etape4 Retour audio
  *  Etape5 Carroussel
  *  Etape6 Resultat et message personnalisé
  *  Etape7 Annonce photo
  *  Etape8 Photo
  *  Etape9 Partage
  */

if($(".generativGame").length){

$(".email").html('<a href="/" class="btn btn-default" style="height:80px; background-color:black; color :white;  font-size: 30px; border:2px solid white; font-weight : bold;">← <img height="60" src="/img/logo/logo_detache_white.png" alt="/MetaCasquette"></h1>')


var texts = {

      "already_played_cookie" : {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-chosen" >Tu as déjà choisi tes deux MétaCasquette du jour !</p><p class="animate-text animate-text-chosen" >Reviens demain pour rejouer !</p>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-chosen" >You have already chosen your two MétaCasquette of the day!</p><p class="animate-text animate-text-chosen" >Come back tomorrow to play again!</p>'
      },
      "already_played" : {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-intro" >Désolé !</p><p class="animate-text animate-text-intro" >Tu ne peux jouer que deux fois par jour à ce jeu !</p><p class="animate-text animate-text-intro" >Mais reviens demain !</p><p class="animate-text animate-text-intro" onClick="window.location.href=window.location.href">Clique ici pour revenir au début...</p></div>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-intro" >Sorry !</p><p class="animate-text animate-text-intro" >You can only play this game twice a day!</p><p class="animate-text animate-text-intro" >But come back tomorrow!</p><p class="animate-text animate-text-intro" onClick="window.location.href=window.location.href">Click here to go back to the beginning...</p></div>',
      },
      "introduction" : {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-intro" >Bonjour,</p>'+
        '<p class="animate-text animate-text-intro" >la participation au jeu est très simple : </p>'+
        '<p class="animate-text animate-text-intro" >Dans un premier temps, nous te conseillons de monter le volume de ton téléphone !</p>'+
        '<p class="animate-text animate-text-intro" >Maintenant tu vas juste me dire quel est ton</p>'+
        '<p class="animate-text animate-text-intro warm" >PRÉNOM</p>'+
        '<p class="animate-text animate-text-intro" >et</p>'+
        '<p class="animate-text animate-text-intro highlight" >CE QUE TU AIMES DANS LA VIE !</p>'+
        '<p class="animate-text animate-text-intro lastOne" >Juste après que j\'ai fini de parler tu pourras appuyer sur le bouton pour t\'enregistrer</p>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-intro" >Hello,</p>'+
        '<p class="animate-text animate-text-intro" >participating in the game is very simple:</p>'+
        '<p class="animate-text animate-text-intro" >First of all, we advise you to turn up the volume on your phone!</p>'+
        '<p class="animate-text animate-text-intro" >Now you\'re just going to tell me what your</p>'+
        '<p class="animate-text animate-text-intro warm" >FIRST NAME</p>'+
        '<p class="animate-text animate-text-intro" >and</p>'+
        '<p class="animate-text animate-text-intro highlight" >WHAT YOU LOVE IN LIFE!</p>'+
        '<p class="animate-text animate-text-intro lastOne" >Right after I finish speaking you can press the button to register your answer</p>'
      },
      "transitionSendingRecord":{
        'fr' : '<div style="top:55%;">'+
        '<p class="animate-text animate-text-transition warm" >Parfait !</p>'+
        '<p class="animate-text animate-text-transition" >Je vais prendre en compte</p>'+
        '<p class="animate-text animate-text-transition" >ce que tu viens de me dire</p>'+
        '<p class="animate-text animate-text-transition" >très rapidement !</p></div>',
        'en' : '<div style="top:55%;">'+
        '<p class="animate-text animate-text-transition warm" >Perfect !</p>'+
        '<p class="animate-text animate-text-transition" >I\'m going to pay attention to what you just told me very soon</p></div>'
      },
      "forbiddenCreation" : {
        'fr' :'<div style="top:55%;"><p class="animate-text animate-text-forbiddenCreation" >Désolé !</p>'+
        '<p class="animate-text animate-text-forbiddenCreation" >Je ne peux pas Créer une telle MétaCasquette</p>'+
        '<p class="animate-text animate-text-forbiddenCreation" >Tu vas devoir me trouver autre chose</p>'+
        '<p class="animate-text animate-text-forbiddenCreation" onClick="window.location.href=window.location.href">Clique ici pour revenir au début...</p></div>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-forbiddenCreation" >Sorry !</p>'+
        '<p class="animate-text animate-text-forbiddenCreation" >I cannot Create such a MétaCasquette</p>'+
        '<p class="animate-text animate-text-forbiddenCreation" >You\'re going to have to find me something else</p>'+
        '<p class="animate-text animate-text-forbiddenCreation" onClick="window.location.href=window.location.href">Click here to go back to the beginning...</p></div>'
      },
      "advertisingForGame": {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-advertising" >Maintenant, tu vas pouvoir te prendre en photo avec </p>'+
          '<p class="animate-text animate-text-advertising lastOne" >ta MétaCasquette !</p></div>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-advertising" >Now you will be able to take a photo of yourself with</p>'+
          '<p class="animate-text animate-text-advertising lastOne" >your MétaCasquette !</p></div>'
      }

}


var langue = getCookie("langue");
var mc1 = getCookie("mc1");
var mc2 = getCookie("mc2");

if(mc1 && mc2 && langue){
  $(".step0").html("");
  $(".step0").css('width','90%');
  var mc1Txt = "";
  fetch('/jeudatas/'+mc1+'.txt')
  .then(response => response.text())
  .then((data) => {
    $(".step0").append('<img id="" width="90%" atl="metacasquette" src="/jeudatas/'+mc1+'_layer.png" style="top: 5%;position: sticky;">'+
    '<h1 id="titre_carroussel">'+data+'</h1>');
  });

  var mc2Txt = "";
  fetch('/jeudatas/'+mc2+'.txt')
  .then(response => response.text())
  .then((data) => {
    $(".step0").append('<img id="" width="90%" atl="metacasquette" src="/jeudatas/'+mc2+'_layer.png" style="top: 5%;position: sticky;">'+
    '<h1 id="titre_carroussel">'+data+'</h1>');
  });

  $(".step0").append(texts['already_played_cookie'][langue]);

  animate_text("animate-text-chosen",);
}

function isIOSIPhone() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return true;
    }

    return false;
}

function changeStep(stepA,stepB){
  $(".step"+stepB).show();
  $(".step"+stepA).hide();
}

function init_step1() {

  $(".step0 a").click(function(){

      langue = $(this).attr("data-id");
      var ios = isIOSIPhone();
      setCookie("langue",langue);

      var hasPlayMoreThan2 = $("#hasPlayMoreThan2").attr("data-value");
      if(parseInt(hasPlayMoreThan2) > 1){
        changeStep(0,3);
        displayMaxGame();
        return;
      }
      changeStep(0,1);

      if(!ios){
        let video1 = document.getElementById("video_"+langue);

        function playVid() {
            video1.style.display = '';
            video1.play();
        }
        playVid();
        video1.addEventListener("ended", (event) => {

          changeStep(1,2);

        });
      }else{
        window.mp3Introduction = new Audio('../sound/intro_'+langue+'.mp3');
        mp3Introduction.play();

        $(".step1").css('width','90%');
        $(".step1").css('top','50%');
        $(".step1").append(texts['introduction'][langue]);
        animate_text("animate-text-intro",transition1To2,);

      }

  });
}

function transition1To2(){
  changeStep(1,2);
}

function init_step2(){
  var startRecordingButton = document.getElementById("startRecordingButton");

  var leftchannel = [];
  var rightchannel = [];
  var recorder = null;
  var recordingLength = 0;
  var volume = null;
  var mediaStream = null;
  var sampleRate = 44100;
  var context = null;
  var blob = null;
  var isRecording = false;

  function postBlob(blob){
   const formData = new FormData();
   formData.append('file', blob);
   formData.append('langue', langue);

   const xhr = new XMLHttpRequest();
   xhr.open('POST', '/jeu/'+$('.generativGame').attr("data-key")+'/upload', true);
   xhr.send(formData);
   xhr.onload = function() {
       var responseObj = JSON.parse(xhr.response);
       if(responseObj.success){
         displayResultAndWaiting(responseObj);
       }else{
          if(responseObj.reason == "maxGame"){
            displayMaxGame();
          }
       }
     };
  }

  function transitionSendingRecord(){
      $(".recordBtn").hide();
      $(".recordSpanBtn").hide();
      $(".step2").prepend('<img src="/video/eyes.gif" class="eyes" style="width:110%; position: absolute; left:-5%;" ><br/>');
      window.mp3Transition = new Audio('../sound/transitionSendingRecord_'+langue+'.mp3');
      mp3Transition.play();
      $(".step2").css('width','90%');
      $(".eyes").css('top','-100%');
      $(".step2").append(texts['transitionSendingRecord'][langue]);
      animate_text("animate-text-transition",);

  }


   function flattenArray(channelBuffer, recordingLength) {
       var result = new Float32Array(recordingLength);
       var offset = 0;
       for (var i = 0; i < channelBuffer.length; i++) {
           var buffer = channelBuffer[i];
           result.set(buffer, offset);
           offset += buffer.length;
       }
       return result;
   }

   function interleave(leftChannel, rightChannel) {
       var length = leftChannel.length + rightChannel.length;
       var result = new Float32Array(length);

       var inputIndex = 0;

       for (var index = 0; index < length;) {
           result[index++] = leftChannel[inputIndex];
           result[index++] = rightChannel[inputIndex];
           inputIndex++;
       }
       return result;
   }




   function timer(nbSec,recorder,context,mediaStream){
       var sec = nbSec;
       var timer = setInterval(function(){
           document.getElementById('safeTimerDisplay').innerHTML=''+sec;
           sec--;
           if (sec < 0) {
               clearInterval(timer);
               stopRecordingAndSend(recorder,context,mediaStream);
           }
       }, 1000);
   }

   function stopRecordingAndSend(recorder,context,mediaStream){

     $("#startRecordingButton").hide();
     $(".recordGif").hide();
     $("#safeTimerDisplay").hide();

     recorder.disconnect(context.destination);
     mediaStream.disconnect(recorder);

     transitionSendingRecord();

     setTimeout(function() {
       // we flat the left and right channels down
       // Float32Array[] => Float32Array
       var leftBuffer = flattenArray(leftchannel, recordingLength);
       var rightBuffer = flattenArray(rightchannel, recordingLength);
       // we interleave both channels together
       // [left[0],right[0],left[1],right[1],...]
       var interleaved = interleave(leftBuffer, rightBuffer);

       // we create our wav file
       var buffer = new ArrayBuffer(44 + interleaved.length * 2);
       var view = new DataView(buffer);

       // RIFF chunk descriptor
       writeUTFBytes(view, 0, 'RIFF');
       view.setUint32(4, 44 + interleaved.length * 2, true);
       writeUTFBytes(view, 8, 'WAVE');
       // FMT sub-chunk
       writeUTFBytes(view, 12, 'fmt ');
       view.setUint32(16, 16, true); // chunkSize
       view.setUint16(20, 1, true); // wFormatTag
       view.setUint16(22, 2, true); // wChannels: stereo (2 channels)
       view.setUint32(24, sampleRate, true); // dwSamplesPerSec
       view.setUint32(28, sampleRate * 4, true); // dwAvgBytesPerSec
       view.setUint16(32, 4, true); // wBlockAlign
       view.setUint16(34, 16, true); // wBitsPerSample
       // data sub-chunk
       writeUTFBytes(view, 36, 'data');
       view.setUint32(40, interleaved.length * 2, true);

       // write the PCM samples
       var index = 44;
       var volume = 1;
       for (var i = 0; i < interleaved.length; i++) {
           view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
           index += 2;
       }

       // our final blob
       blob = new Blob([view], { type: 'audio/wav' });
       isRecording = false;

       if (blob == null) {
           return;
       }
       postBlob(blob);
     },500);
   }



   function writeUTFBytes(view, offset, string) {
       for (var i = 0; i < string.length; i++) {
           view.setUint8(offset + i, string.charCodeAt(i));
       }
   }

  startRecordingButton.addEventListener("touchstart", function (event) {
      event.preventDefault();
      if(!isRecording) {
        // Initialize recorder

        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then((e) => {
            recordingLength = 0;
            leftchannel = [];
            rightchannel = [];
            $("#startRecordingButton").css('background-color', '#f41414');
            $("#startRecordingButton").css('border', '20px solid #bd2f2f');
            $(".recordSpanBtn").removeClass('btn-default').addClass('btn-danger').html("Clickez pour arrêter l'enregistrement");
            $("#safeTimerDisplay").show();
            $(".recordGif").show();
            $(".arrowGif").hide();
            // creates the audio context
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            context = new AudioContext();
            // creates an audio node from the microphone incoming stream
            mediaStream = context.createMediaStreamSource(e);

            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
            // bufferSize: the onaudioprocess event is called when the buffer is full
            var bufferSize = 2048;
            var numberOfInputChannels = 2;
            var numberOfOutputChannels = 2;
            if (context.createScriptProcessor) {
                recorder = context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
            } else {
                recorder = context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
            }

            recorder.onaudioprocess = function (e) {
                leftchannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
                rightchannel.push(new Float32Array(e.inputBuffer.getChannelData(1)));
                recordingLength += bufferSize;

            }

            // we connect the recorder
            mediaStream.connect(recorder);
            recorder.connect(context.destination);
            isRecording = true;
            timer(10,recorder,context,mediaStream);
        });

      }else{
        stopRecordingAndSend(recorder,context,mediaStream);

      }

  });
}

function displayMaxGame(){
      window.mp3Maxgame = new Audio('../sound/maxGame_'+langue+'.mp3');
      mp3Maxgame.play();

      changeStep(2,3);
      $(".step3").append(texts['already_played'][langue]);
      animate_text("animate-text-intro",);
  }


  function forbiddenCreation(){
        window.mp3ForbidenCreation = new Audio('../sound/forbiddenCreation_'+langue+'.mp3');
        mp3ForbidenCreation.play();

        changeStep(4,3);
        $(".step3").empty();
        $(".step3").append(texts['forbiddenCreation'][langue]);
        animate_text("animate-text-forbiddenCreation",);
    }

function displayResultAndWaiting(responseObj){

      window.mp3Reponse = new Audio('../'+responseObj.result.mp3Reponse);
      mp3Reponse.play();
      $(".step3").empty();
      changeStep(2,3);
      $(".step3").append(responseObj.result.textReponseSections);
      animate_text("animate-text-response",carrousselBeforePicture,);
      setTimeout(function() {
        createMetaCasquette(responseObj);
      },2000);

  }

  function createMetaCasquette(responseObj){
    const formData = new FormData();
    formData.append('whatilove', responseObj.result.whatilove);
    formData.append('name', responseObj.result.name);
    formData.append('idUser', responseObj.result.idUser);

    $("#share_"+langue).find("#download_result").attr('data-name',"metacasquette_"+responseObj.result.name+"_"+responseObj.result.whatilove+".png")

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/jeu/'+$('.generativGame').attr("data-key")+'/createmetacasquette', true);
    xhr.send(formData);
    xhr.onload = function() {
        var responseCreatedObj = JSON.parse(xhr.response);
        if(responseCreatedObj.success && responseCreatedObj.success != "0"){
          if(!getCookie("mc1")){
            setCookie("mc1",responseObj.result.idUser);
          }else if(!getCookie("mc2")){
             setCookie("mc2",responseObj.result.idUser);
          }
          advertisingBeforeCamera(responseCreatedObj,responseObj);
        }else{
          if(responseObj.reason == "maxGame"){
            displayMaxGame();
          }else{
            forbiddenCreation();
          }
        }
      };
  }

init_step1();
init_step2();


 let camera_button = document.querySelector("#start-camera");
 let video2 = document.querySelector("#video2");
 let click_button = document.querySelector("#click-photo");
 let canvas = document.querySelector("#canvas");


 camera_button.addEventListener('touchstart', async function() {
      $(".startCamera").hide();
      $(".arrowGifCam").hide();
    	let stream = await navigator.mediaDevices.getUserMedia({ video: true });
 	    video2.srcObject = stream;
      setTimeout(function() {
        $("#click-photo").show();
        $("#cap_img").after($(video2));
        $("#cap_img").attr( "style", "left:25%;top: 150px;position: absolute; z-index:998; width:50%" );

      },2000);
 });

 click_button.addEventListener('touchstart', function() {
    	let image_data_url = canvas.toDataURL('image/jpeg');

      width = parseInt(document.defaultView.getComputedStyle(video2).width);
      height = parseInt(document.defaultView.getComputedStyle(video2).height);
      canvas.width = width;
      canvas.height = height;

      var context=canvas.getContext("2d");

      context.fillRect(0,0,width,height);
      context.drawImage(video2,0,0,width,height);

      var img_casquette=new Image();
      width_casquette = parseInt($('#cap_img').width());
      height_casquette = parseInt($('#cap_img').height());

      left_casquette = parseInt($('#cap_img').offset().left);
      top_casquette = parseInt($('#cap_img').offset().top);

      img_casquette.src = $('#cap_img').attr('src');

      img_casquette.onload = function(){
             context.drawImage(img_casquette,left_casquette,150, width_casquette, height_casquette);
      };

      $(canvas).css("position","relative");
      $(canvas).css("z-index","1");
      $("#video2").hide();
      $('#cap_img').hide();
      $("#click-photo").hide();



      $(".download_result").each(function(){
          $(this).click(function download (){
             var link = document.createElement('a');
             link.download = $(this).attr('data-name');
             link.href = canvas.toDataURL()
             link.click();
           });
      });

      $(".download_casquette_result").each(function(){
          $(this).click(function download (){
             var link = document.createElement('a');
             link.download = $(this).attr('data-name');
             link.href = $('#cap_img').attr("src");
             link.click();
           });
      });

      window.mp3EndExplanations = new Audio('../sound/endExplanations_'+langue+'.mp3');
      mp3EndExplanations.play();
      setTimeout(function() {
        $("#share_"+langue).show();
      }, 1000);
 });

function advertisingBeforeCamera(responseCreatedObj, responseObj){
    changeStep(4,5);
    document.querySelectorAll('audio').forEach(el => el.pause());

    $("#result_img").attr('src','/'+responseCreatedObj.result.filename);

    window.mp3Ready = new Audio('../'+responseObj.result.mp3Ready);
    mp3Ready.play();

    $(".step5 .result-text").append(responseObj.result.textReadySections);
    animate_text("animate-text-ready",advertisingForGame, responseCreatedObj);
  }

  function advertisingForGame(responseCreatedObj){

    window.mp3Advertising = new Audio('../sound/advertisingForGame_'+langue+'.mp3');
    mp3Advertising.play();

    $(".step5 .result-text").children().remove();
    $(".step5 .result-text").append(texts['advertisingForGame'][langue]);
    animate_text("animate-text-advertising",pictureMetacasquette,responseCreatedObj);


}


function pictureMetacasquette(responseCreatedObj){

      $("#cap_img").attr('src',"/"+responseCreatedObj.result.filename);
      changeStep(5,6);
}

 function animate_text(animateTextClass, nextFunction, arg)
 {
  let delay = 70,
      delay_start = 0,
      contents,
      letters;

  $("."+animateTextClass).each(function(index, obj) {
    contents = $(obj).text().trim();
    $(obj).html(''); // on vide le contenu
    letters = contents.split("");
    var first = true;

    $(letters).each(function(index_1, letter) {
      setTimeout(function() {
        if($(obj).hasClass('lastOne') && first){
          setTimeout(function() {
              return nextFunction(arg);
          }
          ,4000);
        }
        if(first){ $(obj).css('visibility','visible'); first=false; }
        // effet machine à écrire simple
        $(obj).html( $(obj).html() + letter ); // on ajoute chaque lettre l une après l autre

      }, delay_start + delay * index_1);
    });
    // le suivant démarre à la fin du précédent
    delay_start += delay * letters.length;
  });
}

function carrousselBeforePicture(){

  if($(".step5").is(":visible")){
    return;
  }

  changeStep(3,4);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/jeu/'+$('.generativGame').attr("data-key")+'/randomgenerated', true);
  xhr.send(null);
  xhr.onload = function() {
      var responseObj = JSON.parse(xhr.response);
      if(responseObj.success){
        $('#image_carroussel').attr('src', '/jeudatas/'+responseObj.result.imagePath);
        $('#titre_carroussel').html(responseObj.result.text);

        if(!isIOSIPhone() && responseObj.result.soundPath){
          window.mp3CarrousselCurrent = new Audio('/jeudatas/'+responseObj.result.soundPath);
          mp3CarrousselCurrent.play();

          mp3CarrousselCurrent.onended = (event) => {
            setTimeout(function() {
              carrousselBeforePicture();
            },2000);
          };
        }else{
          setTimeout(function() {
            carrousselBeforePicture();
          },3000);
        }
      }
  };



}

function setCookie(cname, cvalue) {
  const d = new Date();
  d.setTime(d.getTime() + (24*60*60*1000));
  let expires = "Max-Age="+ $("#next").attr("data-value");;
  document.cookie = cname + "=" + cvalue + ";" + expires + "; SameSite=Strict ;path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
}


if($(".gameParticipation").length){
  $('.overlay-mask').css('position','absolute');$('.overlay-mask').css('top','0');
  $(".email").html('<a href="/" class="btn btn-default" style="height:80px; background-color:black; color :white;  font-size: 30px; border:2px solid white; font-weight : bold;">← <img height="60" src="/img/logo/logo_detache_white.png" alt="/MetaCasquette"></h1>')
}
