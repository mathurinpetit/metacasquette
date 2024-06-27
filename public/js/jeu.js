
 /*
  * Jeu génératif de MétaCasquette
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
      "introduction1" : {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-intro" >Bonjour,</p>'+
        '<p class="animate-text animate-text-intro" >la participation au jeu est très simple : </p>'+
        '<p class="animate-text animate-text-intro" >Dans un premier temps, je te conseille de monter le volume de ton téléphone afin de mieux communiquer avec moi !</p>'+
        '<p class="animate-text animate-text-intro" >Je te propose de créer ta propre </p>'+
        '<p class="animate-text animate-text-intro warm" >METACASQUETTE</p>'+
        '<p class="animate-text animate-text-intro" >Si elle est réussie, je la fabriquerai dans la </p>'+
        '<p class="animate-text animate-text-intro highlight" >VRAIE VIE</p>'+
        '<p class="animate-text animate-text-intro lastOne" >et tu pourras la gagner !</p>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-intro" >Hello,</p>'+
        '<p class="animate-text animate-text-intro" >participating in the game is very simple:</p>'+
        '<p class="animate-text animate-text-intro" >First of all, we advise you to turn up the volume on your phone in order to better communicate with me !</p>'+
        '<p class="animate-text animate-text-intro" >you will create your own</p>'+
        '<p class="animate-text animate-text-intro warm" >METACASQUETTE</p>'+
        '<p class="animate-text animate-text-intro" >If it is successful, I will make it in </p>'+
        '<p class="animate-text animate-text-intro highlight" >REAL LIFE</p>'+
        '<p class="animate-text animate-text-intro lastOne" >and you can win it !</p>'
      },
      "introduction2" : {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-intro2" >Pour concevoir ta propre</p>'+
        '<p class="animate-text animate-text-intro2 warm" >MÉTACASQUETTE</p>'+
        '<p class="animate-text animate-text-intro2" >tu auras juste à me dire quel est ton</p>'+
        '<p class="animate-text animate-text-intro2 firstname" >PRÉNOM</p>'+
        '<p class="animate-text animate-text-intro2" >et</p>'+
        '<p class="animate-text animate-text-intro2 highlight" >CE QUE TU AIMES DANS LA VIE</p>'+
        '<p class="animate-text animate-text-intro2 lastOne" >Je m\'occupe du reste !</p>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-intro2" >To design your own</p>'+
        '<p class="animate-text animate-text-intro2 warm" >MÉTACASQUETTE</p>'+
        '<p class="animate-text animate-text-intro2" >you will just have to tell me what your</p>'+
        '<p class="animate-text animate-text-intro2 firstname" >FIRSTNAME</p>'+
        '<p class="animate-text animate-text-intro2" >is and</p>'+
        '<p class="animate-text animate-text-intro2 highlight" >WHAT YOU LOVE IN LIFE</p>'+
        '<p class="animate-text animate-text-intro2 lastOne" >I take care of the rest !</p>'
      },
      "transitionSendingRecord":{
        'fr' : '<div style="top:55%;">'+
        '<p class="animate-text animate-text-transition warm" >Parfait !</p>'+
        '<p class="animate-text animate-text-transition" >J\'ai bien pris en compte ce que tu m\'as dit.</p>'+
        '<p class="animate-text animate-text-transition" >Cela peut prendre un peu de temps, car je réfléchis à comment je peux appliquer ton idée.</p>'+
        '<p class="animate-text animate-text-transition" >En attendant, je te propose de regarder ce que les</p></div>'+
        '<p class="animate-text animate-text-transition highlight" >autres joueurs</p>'+
        '<p class="animate-text animate-text-transition" >ont choisi</p></div>',
        'en' : '<div style="top:55%;">'+
        '<p class="animate-text animate-text-transition warm" >Perfect !</p>'+
        '<p class="animate-text animate-text-transition" >I took into account what you told me.</p>'+
        '<p class="animate-text animate-text-transition" >This may take a little while as I think about how I can implement your idea!</p>'+
        '<p class="animate-text animate-text-transition" >In the meantime, I suggest you look at what the other players have chosen.</p></div>'
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
      "takePictureOrNext": {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-takepicture" >Attends, ne pars pas tout de suite sinon tu ne pourras pas gagner !</p>'+
          '<p class="animate-text animate-text-takepicture" >Tu peux te prendre en photo avec</p>'+
          '<p class="animate-text animate-text-takepicture warm " >ta MétaCasquette !</p>'+
          '<p class="animate-text animate-text-takepicture lastOne" >Montres toi sur ton meilleur jour, cette photo sera un bon souvenir pour toi !</p></div>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-takepicture" >Wait, don\'t leave yet otherwise you won\'t be able to win !</p>'+
          '<p class="animate-text animate-text-takepicture" >You can take a photo of yourself with</p>'+
          '<p class="animate-text animate-text-takepicture warm " >your MetaCasquette</p>'+
          '<p class="animate-text animate-text-takepicture lastOne" >Show yourself on your best day, this photo will be a good memory for you !</p></div>'
      },
      "lastMsg" : {
        'fr' : '<div style="top:55%;"><p class="animate-text animate-text-lastMsg" >Si tu veux gagner, il faudra te rendre sur mon instagram !</p>'+
          '<p class="animate-text animate-text-lastMsg" >J\'ai déjà posté pour toi ce que tu as choisi !</p>'+
          '<p class="animate-text animate-text-lastMsg warm " >Alors commente le réel</p>'+
          '<p class="animate-text animate-text-lastMsg " >pour que je sache qui tu es et tu </p>'+
          '<p class="animate-text animate-text-lastMsg highlight" >gagneras</p>'+
          '<p class="animate-text animate-text-lastMsg lastOne" >peut-être la MétaCasquette que tu as inventée !</p></div>',
        'en' : '<div style="top:55%;"><p class="animate-text animate-text-lastMsg" >If you want to win, you\'ll have to go to my Instagram !</p>'+
          '<p class="animate-text animate-text-lastMsg" >I have already posted for you what you chose !</p>'+
          '<p class="animate-text animate-text-lastMsg warm " >So comment on the real</p>'+
          '<p class="animate-text animate-text-lastMsg " >and I will know who you are ! You might</p>'+
          '<p class="animate-text animate-text-lastMsg highlight" >win</p>'+
          '<p class="animate-text animate-text-lastMsg lastOne" >the MétaCasquette you invented !</p></div>'
      },
      "textButtonNext":{
        'fr' : "Suivant →",
        'en' : "Next →"
      },
      "textButtonRecord":{
        'fr' : 'Clique sur le cercle pour parler. Tu vas créer une MétaCasquette en ce que tu aimes ! Énonce une phrase entière comme "J\'adore les stylos et je suis Camille !" ou "Je m\'appelle Andréa et j\'aime les chaussures ! "',
        'en' : 'Click on the circle to speak... Don\'t hesitate to give me a whole sentence like "I love pens and I\'m Camille!" or “My name is Andréa and I like shoes!”. You can also mix things up like "I like flowers and video games and my name is Steve!"'
      },
      "textButtonReady":{
        'fr' : ', regardons le choix des autres joueurs →',
        'en' : ', let\'s look at the choices of other players →'
      },
      "textButtonStopRecord":{
        'fr' : 'Clickez pour arrêter l\'enregistrement',
        'en' : 'Click to stop recording'
      },
      "carrousselInitBtn":{
        'fr' : 'Voir le choix des autres joueurs en attendant la création →',
        'en' : 'See other players\' choices while waiting for creation →'
      },
      "carrousselNext":{
        'fr' : 'MétaCasquette suivante →',
        'en' : 'Next MetaCasquette →'
      },
       "textMetaCasquetteButtonReady":{
        'fr' : ', ta MétaCasquette est prête !',
        'en' : ', your MetaCasquette is ready !'
      },
      "textDownloadImageButton":{
       'fr' : 'Télécharge ta MétaCasquette ici →',
       'en' : 'Download your MétaCasquette here →'
     },
     "realNotReady":{
      'fr' : 'Votre réel est en court de réalisation...',
      'en' : 'Your reality is being created...'
    },
    "realIsReady":{
     'fr' : 'Votre réel est prêt !',
     'en' : 'Your real is ready !'
   },
   "takePictureBtnLegend":{
    'fr' : 'Prendre une photo',
    'en' : 'Take a picture'
  },
  "textButtonKeepPicture":{
   'fr' : 'Je garde cette photo !',
   'en' : 'I keep this picture !'
 }


}

/*
* Récupération des Cookies
*/
var langue = getCookie("langue");
var mc1 = getCookie("mc1");
var mc2 = getCookie("mc2");


/*
* Utilisation des Cookies
*/
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


/*
* Fonctions d'aides
*/

function changeStep(stepA,stepB){
  $(".step"+stepB).show();
  $(".step"+stepA).hide();
}

function createStepButton(step,id,text){
  step.append("<br/><br/><button id='"+id+"' style='width : 90%; font-size:40pt; border-radius: 25px; white-space: normal;' class='btn btn-default btn-lg'>"+text+"</button>");

}

function animate_text(animateTextClass, nextFunction, arg){
  let delay = 71,
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
          ,2000);
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

/*
 * Etapes 0 => retour d'erreurs
 */

 function displayMaxGame(){
       window.mp3Maxgame = new Audio('../sound/maxGame_'+langue+'.mp3');
       mp3Maxgame.play();

       changeStep(2,0); // ??? de quelle étape cela part ?
       $(".step0").append(texts['already_played'][langue]);
       animate_text("animate-text-intro",);
       displayBtnStep2(); // Afficher le bouton de réél instagram
   }


 function forbiddenCreation(){
       window.mp3ForbidenCreation = new Audio('../sound/forbiddenCreation_'+langue+'.mp3');
       mp3ForbidenCreation.play();

       $(".step0").empty();
       changeStep(2,0); // ??? de quelle étape cela part ?
       $(".step0").append(texts['forbiddenCreation'][langue]);
       animate_text("animate-text-forbiddenCreation",);
       displayBtnStep2();
   }

/*
 * Initialisation de l'étape 1
 */

function init_step1() {
  $(".step0 a").click(function(){

      langue = $(this).attr("data-id");
      $(".recordSpanBtn").html(texts['textButtonRecord'][langue]);
      var ios = isIOSIPhone();
      setCookie("langue",langue);

      // changeStep(0,3);
      // init_step3();
      // return;

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

          displayBtnStep2();


        });
      }else{
        window.mp3Introduction = new Audio('../sound/intro1_'+langue+'.mp3');
        mp3Introduction.play();

        $(".step1").css('width','90%');
        $(".step1").css('top','50%');
        $(".step1").prepend(texts['introduction1'][langue]);
        animate_text("animate-text-intro",displayBtnStep2,);

      }

  });
}

/*
 * Création bouton vers étape 2
 */
function displayBtnStep2(){
  createStepButton($(".step1"),"btnStep2",texts['textButtonNext'][langue]);
  $("#btnStep2").on('touchstart',function (event) {
      event.preventDefault();
      $(this).hide();
      init_step2();
    });

}

/*
 * Initialisation de l'étape 2
 */

function init_step2(){
  changeStep(1,2);
  window.mp3Introduction2 = new Audio('../sound/intro2_'+langue+'.mp3');
  mp3Introduction2.play();

  $(".step2").css('width','90%');
  $(".step2").css('top','50%');
  $(".step2").prepend(texts['introduction2'][langue]);
  animate_text("animate-text-intro2",displayBtnStep3,);
}

/*
 * Création bouton vers étape 3
 */

function displayBtnStep3(){
  createStepButton($(".step2"),"btnStep3",texts['textButtonNext'][langue]);
  $("#btnStep3").on('touchstart',function (event) {
      event.preventDefault();
      changeStep(2,3);
      init_step3();
    });

}

/*
 * Initialisation de l'étape 3
 */

function init_step3(){

  window.speakExplaination = new Audio('../sound/speak_explaination_'+langue+'.mp3');
  speakExplaination.play();

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
         $("#textButtonReady").html(responseObj.result.name+texts['textButtonReady'][langue])
         $('#textButtonReady').show();
         $('#textButtonReady').on('touchstart',function (event) {
             event.preventDefault();
             $(this).hide();
             displayResultAndWaiting(responseObj);
           });
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
      $(".step3").prepend('<img src="/video/eyes.gif" class="eyes" style="width:110%; position: absolute; left:-5%;" >');
      window.mp3Transition = new Audio('../sound/transitionSendingRecord_'+langue+'.mp3');
      mp3Transition.play();
      $(".step3").css('width','90%');
      $(".eyes").css('top','-100%');
      $(".step3").append(texts['transitionSendingRecord'][langue]);
      $(".step3").append("<br/><br/><button id='textButtonReady' style='display:none; width : 100%; font-size:30pt; border-radius: 25px; white-space: normal;' class='btn btn-default btn-lg'></button>");
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
               if($(".step3").is(":visible")){
                 console.log(recorder,mediaStream);
                 stopRecordingAndSend(recorder,context,mediaStream);
                }
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

  var lockedButton = false;
  startRecordingButton.addEventListener("touchstart", function (event) {
      event.preventDefault();
      speakExplaination.pause();

      if(!isRecording) {
        // Initialize recorder
        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then((e) => {
            lockedButton = true;
            setTimeout(function() {
              lockedButton = false;
            },5000);
            recordingLength = 0;
            leftchannel = [];
            rightchannel = [];
            $("#startRecordingButton").css('background-color', '#f41414');
            $("#startRecordingButton").css('border', '20px solid #bd2f2f');
            $(".recordSpanBtn").removeClass('btn-default').addClass('btn-danger').html(texts['textButtonStopRecord'][langue]);
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

      }else if (!lockedButton) {
        stopRecordingAndSend(recorder,context,mediaStream);
      }
  });
}


/*
 * Etape 4 => On a le mp3, on fait un peu patienter
 */

function displayResultAndWaiting(responseObj){
      window.mp3Transition.pause();
      changeStep(3,4);
      window.mp3Reponse = new Audio('../'+responseObj.result.mp3Reponse);
      mp3Reponse.play();
      $(".step4").empty();
      $(".step4").append(responseObj.result.textReponseSections);
      animate_text("animate-text-response",displayBtnStep5);
      setTimeout(function() {
        createMetaCasquette(responseObj);
      },1);
  }

  /*
   * Etape 5 => Valorisation de l'utilisateur, on lui spécifie qu'on a bien compris
   */
  function displayBtnStep5(){
    createStepButton($(".step4"),"btnStep5",texts['carrousselInitBtn'][langue]);

    $("#btnStep5").on('touchstart',function (event) {
        event.preventDefault();
        $(this).hide();
        carrousselBeforePicture();
      });
  }


  function carrousselBeforePicture(){

    if($(".step0").is(":visible")){
      return;
    }
    changeStep(4,5);
    $("#carrousselNext").unbind();
    $("#carrousselNext").hide();
    $("#carrousselNext").html(texts['carrousselNext'][langue]);
    $("#carrousselNext").on('touchstart',function (event) {
        event.preventDefault();
        $(this).hide();
        carrousselBeforePicture();
      });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/jeu/'+$('.generativGame').attr("data-key")+'/randomgenerated', true);
    xhr.send(null);
    xhr.onload = function() {
        var responseObj = JSON.parse(xhr.response);
        if(responseObj.success){
          $('#image_carroussel').attr('src', '/jeudatas/'+responseObj.result.imagePath);
          $('#titre_carroussel').html(responseObj.result.text);

            window.mp3CarrousselCurrent = new Audio('/jeudatas/'+responseObj.result.soundPath);
            mp3CarrousselCurrent.play();
            mp3CarrousselCurrent.onended = (event) => {
              setTimeout(function() {
                $("#carrousselNext").show();
              },2000);
            }
        }
    };

  }

  function createMetaCasquette(responseObj){
    const formData = new FormData();
    formData.append('whatilove', responseObj.result.whatilove);
    formData.append('name', responseObj.result.name);
    formData.append('idUser', responseObj.result.idUser);
    $("#canvas").attr("data-nameOfPic","Metacaquette_"+responseObj.result.name+"_"+responseObj.result.whatilove+"_myPic.png")
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
          // ICI On crée le btn de resultat !
          $("#carrousselNext").unbind();
          $("#carrousselNext").attr("id","resultMetaCasquette");
          $("#resultMetaCasquette").html(responseObj.result.name+texts['textMetaCasquetteButtonReady'][langue]);
          $("#resultMetaCasquette").show()

          $("#resultMetaCasquette").on('touchstart',function (event) {
              event.preventDefault();
              $(this).hide();
              advertisingBeforeCamera(responseCreatedObj,responseObj);
            });

          xhr.open('POST', '/jeu/'+$('.generativGame').attr("data-key")+'/createVideoForInsta', true);
          xhr.send(formData);
          xhr.onload = function() {
            var responseLink = JSON.parse(xhr.response);
            if(responseLink.success && responseLink.success != "0"){
              $("#reel_insta").attr("href",responseLink.link);
              $("#reel_insta_msg").html(texts['realIsReady'][langue]);
              $(".loader").hide();
            }
          }

        }else{
          if(responseObj.reason == "maxGame"){
            displayMaxGame();
          }else{
            forbiddenCreation();
          }
        }
      };
  }

 let camera_button = document.querySelector("#start-camera");
 let video2 = document.querySelector("#video2");
 let click_button = document.querySelector("#click-photo");
 let canvas = document.querySelector("#canvas");


 camera_button.addEventListener('touchstart', async function(event) {
      event.preventDefault();
      $(".takePictureOrNext").hide();

      $(".btnPicturePanel").hide();

    	let stream = await navigator.mediaDevices.getUserMedia({ video: true });
 	    video2.srcObject = stream;
      setTimeout(function() {
        $("#click-photo").show();
        $("#cap_img").after($(video2));
        $("#cap_img").attr( "style", "left:25%;top: 150px;position: absolute; z-index:998; width:50%" );

      },100);
 });

 click_button.addEventListener('touchstart', function(event) {
      event.preventDefault();
    	let image_data_url = canvas.toDataURL('image/jpeg');

      video2 = document.querySelector("#video2");

      var width = parseInt(document.defaultView.getComputedStyle(video2).width);
      var height = parseInt(document.defaultView.getComputedStyle(video2).height);
      canvas.width = width;
      canvas.height = height;

      var context=canvas.getContext("2d");

      context.translate(width, 0);
      context.scale(-1, 1);
      context.fillRect(0,0,width,height);
      context.drawImage(video2,0,0,width,height);

      var img_casquette=new Image();
      var width_casquette = parseInt($('#cap_img').width());
      var height_casquette = parseInt($('#cap_img').height());

      var left_casquette = parseInt($('#cap_img').offset().left);
      var top_casquette = parseInt($('#cap_img').offset().top);

      img_casquette.src = $('#cap_img').attr('src');

      img_casquette.onload = function(){
             context.translate(width, 0);
             context.scale(-1, 1);
             context.drawImage(img_casquette,left_casquette,150, width_casquette, height_casquette);
      };

      $(canvas).css("position","relative");
      $(canvas).css("z-index","1");

      $("#video2").hide();
      $('#cap_img').hide();
      $("#click-photo").hide();

      window.mp3Valorisation = new Audio('../sound/mp3Valorisation_'+langue+'.mp3');
      mp3Valorisation.play();

      displayBtnStep8();
 });

function advertisingBeforeCamera(responseCreatedObj, responseObj){
    changeStep(5,6);
    document.querySelectorAll('audio').forEach(el => el.pause());

    $("#result_img").attr('src','/'+responseCreatedObj.result.filename);

    window.mp3Ready = new Audio('../'+responseObj.result.mp3Ready);
    mp3Ready.play();

    $(".step6 .result-text").append(responseObj.result.textReadySections);
    animate_text("animate-text-ready",downloadProposition, responseObj);
  }

  /*
   * Step 6 => téléchargement de l'image et en même temps on lance étape 7
   */
  function downloadProposition(responseObj){
    createStepButton($(".step6"),"download_casquette_result",texts['textDownloadImageButton'][langue]);
    $("#download_casquette_result").css("top","10%").css("position","relative");
    $("#download_casquette_result").on('touchstart',function (event) {
        event.preventDefault();

        var link = document.createElement('a');
        link.download = "metacasquette_"+responseObj.result.name+"_"+responseObj.result.whatilove+".png";
        link.href = $('#result_img').attr("src");
        link.click();

        init_step7();
      });
  }

  /*
   * Etape 7 => téléchargement de l'image et en même temps on lance étape 7
   */
  function init_step7(){

    $("#cap_img").attr('src',$("#result_img").attr("src"));
    changeStep(6,7);
    window.mp3Advertising = new Audio('../sound/advertisingForGame_'+langue+'.mp3');
    mp3Advertising.play();
    $(".step7 .takePictureOrNext").append(texts['takePictureOrNext'][langue]);
    animate_text("animate-text-takepicture",displayTakePictureElts);

  }

  function displayTakePictureElts(){
    $(".step7 .startCamera_text").html(texts['takePictureBtnLegend'][langue]).show();
    $(".btnPicturePanel").show();
  }

  function displayBtnStep8(){
    $("#btnStep8").html(texts['textButtonKeepPicture'][langue]).show();
    $("#btnStep8").on('touchstart',function (event) {
        event.preventDefault();

        var link = document.createElement('a');
        link.download = $("#canvas").attr("data-nameOfPic");
        link.href = canvas.toDataURL()
        link.click();

        $(this).hide();
        init_step8();
      });
  }

  function init_step8(){
    $('#finish_img').attr('src', $('#cap_img').attr('src'));
    $("#reel_insta_msg").html(texts['realNotReady'][langue]);
    changeStep(7,8);

    window.lastMsg = new Audio('../sound/lastMsg_'+langue+'.mp3');
    lastMsg.play();

    $(".step8 .lastMsg").append(texts['lastMsg'][langue]);
    animate_text('animate-text-lastMsg',displayLastBtn)
  }

  function displayLastBtn(){
    $("#lastPanelBtn").show();
  }

if($(".gameParticipation").length){
  $('.overlay-mask').css('position','absolute');$('.overlay-mask').css('top','0');
  $(".email").html('<a href="/" class="btn btn-default" style="height:80px; background-color:black; color :white;  font-size: 30px; border:2px solid white; font-weight : bold;">← <img height="60" src="/img/logo/logo_detache_white.png" alt="/MetaCasquette"></h1>')
}


init_step1();
}
