

$(".step0 a").click(function(){
  $(".step1").show();
  $(".step0").hide();
  let video = document.getElementById("video1");

  function playVid() {
      video.play();
  }
  playVid();

  video.addEventListener("ended", (event) => {
    $(".step2").show();
    $(".step1").hide();
  });

});


 var startRecordingButton = document.getElementById("startRecordingButton");

 var downloadButton = document.getElementById("downloadButton");


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
       console.log("end !");
       recorder.disconnect(context.destination);
       mediaStream.disconnect(recorder);

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
     }

 });

function displayResultAndWaiting(responseObj){
    window.mp3Reponse = new Audio('../'+responseObj.result.mp3Reponse);
    mp3Reponse.play();
    $(".step3").show();
    $(".step2").hide();
    $(".step3").append(responseObj.result.textReponseSections);
    animate_text();
    setTimeout(function() {
      createMetaCasquette(responseObj);
    },1000);

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
      var responseObj = JSON.parse(xhr.response);
      if(responseObj.success){
        advertisingAndCameraOpen(responseObj);
      }else{
          //TODO : ici faire le cas ou cette IP.../user/agent a dejà jouer 2 fois !
      }
    };
}

function advertisingAndCameraOpen(responseObj){
    $("#result_img").attr('src','/'+responseObj.result.filename);
    $(".step5").show();
    $(".step4").hide();

}

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

 function animate_text()
{
  let delay = 70,
      delay_start = 0,
      contents,
      letters;

  $(".animate-text").each(function(index, obj) {
    contents = $(obj).text().trim();
    $(obj).html(''); // on vide le contenu
    letters = contents.split("");
    var first = true;

    $(letters).each(function(index_1, letter) {


      setTimeout(function() {
        if(first){ $(obj).css('visibility','visible'); first=false; }
        // ---------
        // effet machine à écrire simple
        $(obj).html( $(obj).html() + letter ); // on ajoute chaque lettre l une après l autre
        // ---------
        // ---------
        if($(obj).hasClass('lastOne')){
          setTimeout(function() {
            carrousselBeforePicture();
          },4000);
        }
      }, delay_start + delay * index_1);
    });
    // le suivant démarre à la fin du précédent
    delay_start += delay * letters.length;
  });
}

function carrousselBeforePicture(){
  $(".step4").show();
  $(".step3").hide();
}
