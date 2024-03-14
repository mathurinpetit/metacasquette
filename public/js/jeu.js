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





function changeStep(stepA,stepB){
  $(".step"+stepB).show();
  $(".step"+stepA).hide();
}

function init_step1() {
  
  $(".step0 a").click(function(){

      changeStep(0,1);

      let video1 = document.getElementById("video1");

      function playVid() {
          video1.play();
      }
      playVid();

      video1.addEventListener("ended", (event) => {

        changeStep(1,2);

      });

  });
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

   const xhr = new XMLHttpRequest();
   xhr.open('POST', '/jeu/eab7306f-49f6-45ef-bfa3-a376be81b31f/upload', true);
   xhr.send(formData);
   xhr.onload = function() {
       var responseObj = JSON.parse(xhr.response);
       if(responseObj.success){
         displayResultAndWaiting(responseObj);
       }else{
           //TODO : ici faire le cas ou cette IP.../user/agent a dejà jouer 2 fois !
       }
     };
  }

  function transitionSendingRecord(){
      $(".recordBtn").hide();
      $(".recordSpanBtn").hide();
      window.mp3Transition = new Audio('../sound/transitionSendingRecord_fr.mp3');
      mp3Transition.play();
      $(".step2").css('width','90%');
      $(".step2").append(
      '<p class="animate-text animate-text-transition" >Parfait !</p>'+
      '<p class="animate-text animate-text-transition" >Je vais prendre en compte</p>'+
      '<p class="animate-text animate-text-transition" >ce que tu viens de me dire</p>'+
      '<p class="animate-text animate-text-transition" >très rapidement !</p>');
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

   function writeUTFBytes(view, offset, string) {
       for (var i = 0; i < string.length; i++) {
           view.setUint8(offset + i, string.charCodeAt(i));
       }
   }

  startRecordingButton.addEventListener("touchstart", function () {
      if(!isRecording) {
        // Initialize recorder
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        navigator.getUserMedia(
        {
            audio: true
        },
        function (e) {
            recordingLength = 0;
            leftchannel = [];
            rightchannel = [];
            $(".recordBtn").attr('src', '/img/record.png');
            $(".recordSpanBtn").removeClass('btn-default').addClass('btn-danger').html("Clickez pour arreter");
            $(".recordGif").show();

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
        },
         function (e) {
            console.error(e);
        });
      }else{
        $(".recordBtn").attr('src', '/img/record_ready.png');
        $(".recordSpanBtn").removeClass('btn-danger').addClass('btn-default').html("Clickez pour répondre");
        $(".recordGif").hide();


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

  });


}

function displayResultAndWaiting(responseObj){
      window.mp3Reponse = new Audio('../'+responseObj.result.mp3Reponse);
      mp3Reponse.play();

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

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/jeu/eab7306f-49f6-45ef-bfa3-a376be81b31f/createmetacasquette', true);
    xhr.send(formData);
    xhr.onload = function() {
        var responseCreatedObj = JSON.parse(xhr.response);
        if(responseCreatedObj.success){
          advertisingBeforeCamera(responseCreatedObj,responseObj);
        }else{
            //TODO : ici faire le cas ou cette IP.../user/agent a dejà jouer 2 fois !
        }
      };
  }

init_step1();
init_step2();


 let camera_button = document.querySelector("#start-camera");
 let video2 = document.querySelector("#video2");
 let click_button = document.querySelector("#click-photo");
 let canvas = document.querySelector("#canvas");
 let canvas2 = document.querySelector("#canvas2");

 camera_button.addEventListener('touchstart', async function() {
      $(".startCamera").hide();
    	let stream = await navigator.mediaDevices.getUserMedia({ video: true });
 	    video2.srcObject = stream;
      setTimeout(function() {
        $("#cap_img").animate({ "top": "-=0px" }, "slow" );
        $("#click-photo").show();
      },500);
 });

 click_button.addEventListener('touchstart', function() {
    	let image_data_url = canvas.toDataURL('image/jpeg');

      var ctx=canvas.getContext("2d");
      var img=new Image();
      img.onload = function(){
             ctx.drawImage(img,0,0);
      };

      var img_casquette=new Image();
      img_casquette.onload = function(){
             ctx.drawImage(img_casquette,0,0);
      };
      img_casquette.src = $('#cap_img').attr('src');
      canvas.getContext('2d').drawImage(video2, 0, 0, canvas.width, canvas.height);
      canvas.getContext('2d').drawImage(img_casquette, 0, 0, canvas.width, canvas.height);
    	console.log(image_data_url);
 });

function advertisingBeforeCamera(responseCreatedObj, responseObj){

    $(".step5").show();
    $(".step4").hide();


    $("#result_img").attr('src','/'+responseCreatedObj.result.filename);

    window.mp3Ready = new Audio('../'+responseObj.result.mp3Ready);
    mp3Ready.play();

    $(".step5 .result-text").append(responseObj.result.textReadySections);
    animate_text("animate-text-ready",advertisingForGame, responseCreatedObj);
  }

  function advertisingForGame(responseCreatedObj){

    window.mp3Advertising = new Audio('../sound/advertisingForGame_fr.mp3');
    mp3Advertising.play();

    $(".step5 .result-text").children().remove();
    $(".step5 .result-text").append('<p class="animate-text animate-text-advertising" >Maintenant, tu vas pouvoir te prendre en photo avec </p><p class="animate-text animate-text-advertising lastOne" >ta MétaCasquette !</p>');
    animate_text("animate-text-advertising",pictureMetacasquette,responseCreatedObj);


}


function pictureMetacasquette(responseCreatedObj){

      $("#cap_img").attr('src','/'+responseCreatedObj.result.filename);
      $(".step6").show();
      $(".step5").hide();
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

  if($(".step5:visible").length){
    return;
  }

  changeStep(3,4);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/jeu/eab7306f-49f6-45ef-bfa3-a376be81b31f/randomgenerated', true);
  xhr.send(null);
  xhr.onload = function() {
      var responseObj = JSON.parse(xhr.response);
      if(responseObj.success){
        $('#image_carroussel').attr('src', '/jeudatas/'+responseObj.result.imagePath);
        $('#titre_carroussel').html(responseObj.result.text);

        if(responseObj.result.soundPath){
          window.mp3CarrousselCurrent = new Audio('/jeudatas/'+responseObj.result.soundPath);
          mp3CarrousselCurrent.play();

          mp3CarrousselCurrent.onended = (event) => {
            setTimeout(function() {
              carrousselBeforePicture();
            },3000);
          };
        }else{
          setTimeout(function() {
            carrousselBeforePicture();
          },5000);
        }
      }
  };



}
