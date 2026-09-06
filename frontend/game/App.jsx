import React, { useEffect, useRef, useState } from 'react';

const RECORDING_DURATION_SECONDS = 10;
const TYPE_DELAY_MS = 32;
const LINE_GAP_MS = 220;
const POST_SEQUENCE_DELAY_MS = 450;
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

function formatApiErrorDetail(detail) {
  if (detail === null || typeof detail === 'undefined' || detail === '') {
    return '';
  }

  if (typeof detail === 'string') {
    return detail;
  }

  try {
    return JSON.stringify(detail);
  } catch (error) {
    return String(detail);
  }
}

const content = {
  fr: {
    title: 'Crée ta MetaCasquette',
    subtitle: 'Choisi ta langue pour lancer le jeu',
    languageButtons: [
      { key: 'fr', label: 'Français' },
      { key: 'en', label: 'English' },
    ],
    intro1: {
      lines: [
        'Bonjour,',
        'la participation au jeu est très simple :',
        'Dans un premier temps, je te conseille de monter le volume de ton téléphone afin de mieux communiquer avec moi !',
        'Je te propose de créer ta propre',
        'METACASQUETTE',
        'Si elle est réussie, je la fabriquerai dans la',
        'VRAIE VIE',
        'et tu pourras la gagner !',
      ],
      audioSrc: '/sound/intro1_fr.mp3?v=unified-20260906-1',
      videoSources: {
        mp4: '/video/intro_fr.mp4?v=unified-20260906-1',
        webm: '/video/intro_fr.webm?v=unified-20260906-1',
      },
    },
    intro2: {
      lines: [
        'Pour concevoir ta propre',
        'MÉTACASQUETTE',
        'tu auras juste à me dire quel est ton',
        'PRÉNOM',
        'et',
        'CE QUE TU AIMES DANS LA VIE',
        "Je m'occupe du reste !",
      ],
      audioSrc: '/sound/intro2_fr.mp3?v=unified-20260906-1',
    },
    recording: {
      audioSrc: '/sound/speak_explaination_fr.mp3?v=examples-20260906-2',
      lines: [
        'Clique sur le cercle pour parler.',
        'Donne-moi ton prénom',
        'et ce que tu aimes dans la vie.',
      ],
      helper:
        'Tu peux dire ce que tu veux, cela pourrait être : je m’appelle Francis et j’aime les assiettes, ou encore : je suis Anna et j’aime les guitares.',
      startRecordingLabel: 'Commencer',
      stopRecordingLabel: "Arrêter l'enregistrement",
      recordingInProgressLabel: 'Enregistrement en cours',
      listenBackLabel: 'Réécouter',
      uploadLabel: "Envoyer mon audio",
      rerecordLabel: 'Recommencer',
      uploadingLabel: 'Envoi en cours...',
      durationLabel: 'Temps restant',
      permissionError:
        "Le microphone n'est pas accessible. Vérifie les permissions du navigateur.",
      unsupportedError:
        "Ce navigateur ne permet pas encore l'enregistrement pour cette nouvelle version du jeu.",
      uploadError: "L'envoi a échoué. Réessaie dans quelques secondes.",
      uploadSuccessTitle: 'Enregistrement reçu',
      uploadSuccessMessage:
        'Le fichier audio a bien été stocké temporairement sur le serveur.',
    },
    processing: {
      lines: [
        'J’ai bien pris en compte ce que tu m’as dit.',
        'Je vais créer la MétaCasquette que tu demandes.',
        'J’ai besoin d’un petit instant, reste en ligne…',
      ],
      audioSrc: '/sound/transitionSendingRecord_fr.mp3?v=unified-20260906-1',
      soundBlockedLabel: 'Écouter le message',
      retryLabel: 'Réessayer',
      rateLimitMessage: (minutes) => `Tu as atteint la limite de 3 créations par heure pour ta connexion Internet. Réessaie dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      limitUnavailableMessage: 'La création est temporairement indisponible. Réessaie dans un moment.',
    },
    acknowledgement: {
      buildLines: (name, theme) => [
        `Merci ${name},`,
        'je suis en train de préparer ta',
        `MÉTACASQUETTE en ${theme}.`,
        'En attendant, regarde ce que les autres ont fait.',
      ],
      continueLabel: 'Voir les MétaCasquettes des autres joueurs',
    },
    result: {
      buildLines: (name, theme) => [
        `Bravo ${name} !`,
        `Ta MÉTACASQUETTE en ${theme} est prête !`,
        'Est-ce que tu la porterais ?',
      ],
      replayLabel: 'Réécouter le message',
      imageAlt: 'MetaCasquette générée',
      videoReadyLabel: 'La vidéo locale a déjà été produite.',
      videoPendingLabel: 'La vidéo est lancée en arrière-plan.',
      videoUnavailableLabel: 'Aucune vidéo locale n’a été produite pour le moment.',
      selfieTitle: 'Essaie maintenant ta MétaCasquette !',
      selfieStartLabel: 'Prends-toi en photo avec ta MétaCasquette',
      selfieCameraLabel: 'Place ton visage sous la casquette',
      selfieCaptureLabel: 'Prendre la photo',
      selfieRetakeLabel: 'Reprendre la photo',
      selfieDownloadLabel: 'Télécharger ma photo',
      selfieCameraError:
        "La caméra n’est pas accessible. Vérifie l’autorisation de la caméra dans ton navigateur.",
      instagramInvitation:
        'Viens découvrir sur Instagram le résultat de la MétaCasquette que tu as créée !',
      instagramLabel: 'Voir ma MétaCasquette sur Instagram',
      instagramWaitingLabel: 'Publication de ta MétaCasquette sur Instagram en cours…',
      instagramErrorLabel: 'Le Reel n’est pas encore disponible. Réessaie dans un moment.',
      instagramRetryLabel: 'Vérifier la publication',
      instagramAudioSrc: '/sound/selfieInstagram_fr.mp3?v=unified-20260906-1',
    },
    carousel: {
      titleLines: [
        'Je suis en train de fabriquer ta',
        'MÉTACASQUETTE',
        'Voici ce que les autres joueurs ont choisi',
      ],
      loadingLabel: 'Chargement d’une création...',
      nextLabel: 'MétaCasquette suivante',
      emptyLabel: 'Aucune création n’est encore disponible.',
      waitingLabel: 'Je prépare la suite pendant ce temps.',
      textMissingLabel: 'Cette création n’a pas encore de description affichable.',
      soundBlockedLabel: 'Activer le son',
      generationErrorLabel: 'La création de ta MétaCasquette a rencontré un problème.',
    },
    nextLabel: 'Suivant',
    replayLabel: 'Relancer le son',
  },
  en: {
    title: 'Create your MetaCasquette',
    subtitle: 'Choose your language to start the game',
    languageButtons: [
      { key: 'fr', label: 'Français' },
      { key: 'en', label: 'English' },
    ],
    intro1: {
      lines: [
        'Hello,',
        'participating in the game is very simple:',
        'First of all, we advise you to turn up the volume on your phone in order to better communicate with me!',
        'You will create your own',
        'METACASQUETTE',
        'If it is successful, I will make it in',
        'REAL LIFE',
        'and you can win it!',
      ],
      audioSrc: '/sound/intro1_en.mp3?v=unified-20260906-1',
      videoSources: {
        mp4: '/video/intro_en.mp4?v=unified-20260906-1',
        webm: '/video/intro_en.webm?v=unified-20260906-1',
      },
    },
    intro2: {
      lines: [
        'To design your own',
        'MÉTACASQUETTE',
        'you just have to tell me what your',
        'FIRST NAME',
        'is and',
        'WHAT YOU LOVE IN LIFE',
        'I take care of the rest!',
      ],
      audioSrc: '/sound/intro2_en.mp3?v=unified-20260906-1',
    },
    recording: {
      audioSrc: '/sound/speak_explaination_en.mp3?v=examples-20260906-1',
      lines: [
        'Tap the circle to speak.',
        'Tell me your first name',
        'and what you love in life.',
      ],
      helper:
        'You can say: “My name is Francis and I love plates” or “I am Anna and I love guitars”.',
      startRecordingLabel: 'Start recording',
      stopRecordingLabel: 'Stop recording',
      recordingInProgressLabel: 'Recording in progress',
      listenBackLabel: 'Listen again',
      uploadLabel: 'Send my audio',
      rerecordLabel: 'Record again',
      uploadingLabel: 'Uploading...',
      durationLabel: 'Time left',
      permissionError:
        'The microphone is not available. Please check browser permissions.',
      unsupportedError:
        'This browser does not support recording for the new game flow yet.',
      uploadError: 'Upload failed. Please try again in a few seconds.',
      uploadSuccessTitle: 'Recording stored',
      uploadSuccessMessage:
        'The audio file has been stored temporarily on the server.',
    },
    processing: {
      lines: [
        'I’ve taken into account what you told me.',
        'I’m going to create the MetaCasquette you asked for.',
        'I just need a moment, stay with me…',
      ],
      audioSrc: '/sound/transitionSendingRecord_en.mp3?v=unified-20260906-1',
      soundBlockedLabel: 'Play the message',
      retryLabel: 'Try again',
      rateLimitMessage: (minutes) => `Your internet connection has reached the limit of 3 creations per hour. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      limitUnavailableMessage: 'Creation is temporarily unavailable. Please try again shortly.',
    },
    acknowledgement: {
      buildLines: (name, theme) => [
        `Thank you ${name},`,
        'I am preparing your',
        `${theme} MÉTACASQUETTE.`,
        'Meanwhile, look at what the other players have made.',
      ],
      continueLabel: 'Other players’ MetaCasquettes',
    },
    result: {
      buildLines: (name, theme) => [
        `Well done ${name}!`,
        `Your ${theme} METACASQUETTE is ready!`,
        'Would you wear it?',
      ],
      replayLabel: 'Replay the message',
      imageAlt: 'Generated MetaCasquette',
      videoReadyLabel: 'The local video has already been produced.',
      videoPendingLabel: 'The video has started in the background.',
      videoUnavailableLabel: 'No local video has been produced yet.',
      selfieTitle: 'Now try on your MetaCasquette!',
      selfieStartLabel: 'Take a selfie with your MetaCasquette',
      selfieCameraLabel: 'Place your face under the cap',
      selfieCaptureLabel: 'Take the photo',
      selfieRetakeLabel: 'Retake the photo',
      selfieDownloadLabel: 'Download my photo',
      selfieCameraError:
        'The camera is not available. Check the camera permission in your browser.',
      instagramInvitation:
        'Come and discover the result of the MetaCasquette you created on Instagram!',
      instagramLabel: 'See my MetaCasquette on Instagram',
      instagramWaitingLabel: 'Publishing your MetaCasquette on Instagram…',
      instagramErrorLabel: 'The Reel is not available yet. Please try again shortly.',
      instagramRetryLabel: 'Check publication',
      instagramAudioSrc: '/sound/selfieInstagram_en.mp3?v=unified-20260906-1',
    },
    carousel: {
      titleLines: [
        'I am creating your',
        'MÉTACASQUETTE',
        'Here is what other players have chosen',
      ],
      loadingLabel: 'Loading a creation...',
      nextLabel: 'Next MetaCasquette',
      emptyLabel: 'No generated creation is available yet.',
      waitingLabel: 'I am preparing the next step meanwhile.',
      textMissingLabel: 'This creation does not have a displayable description yet.',
      soundBlockedLabel: 'Enable sound',
      generationErrorLabel: 'There was a problem while creating your MetaCasquette.',
    },
    nextLabel: 'Next',
    replayLabel: 'Replay audio',
  },
};

function isIOSDevice() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function getPreferredMimeType() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return '';
  }

  for (const mimeType of SUPPORTED_MIME_TYPES) {
    if (window.MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return '';
}

function getFileExtension(mimeType) {
  if (mimeType.includes('mp4')) {
    return 'm4a';
  }

  if (mimeType.includes('ogg')) {
    return 'ogg';
  }

  if (mimeType.includes('wav')) {
    return 'wav';
  }

  return 'webm';
}

function getLineToneClass(line) {
  if (line.includes('METACASQUETTE') || line.includes('MÉTACASQUETTE')) {
    return 'game-line game-line-warm';
  }

  if (line === 'VRAIE VIE' || line === 'REAL LIFE' || line === 'CE QUE TU AIMES DANS LA VIE' || line === 'WHAT YOU LOVE IN LIFE') {
    return 'game-line game-line-highlight';
  }

  if (line === 'PRÉNOM' || line === 'FIRST NAME') {
    return 'game-line game-line-firstname';
  }

  return 'game-line';
}

function useTypewriterLines(lines, active) {
  const [revealedLines, setRevealedLines] = useState(lines.map(() => ''));
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setRevealedLines(lines.map(() => ''));
    setIsFinished(false);

    if (!active) {
      return undefined;
    }

    let cancelled = false;
    const timers = [];
    let currentDelay = 0;

    lines.forEach((line, lineIndex) => {
      for (let characterIndex = 0; characterIndex < line.length; characterIndex += 1) {
        const timer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          setRevealedLines((previous) => {
            const next = previous.slice();
            next[lineIndex] = line.slice(0, characterIndex + 1);
            return next;
          });
        }, currentDelay + characterIndex * TYPE_DELAY_MS);

        timers.push(timer);
      }

      currentDelay += line.length * TYPE_DELAY_MS + LINE_GAP_MS;
    });

    const completionTimer = window.setTimeout(() => {
      if (!cancelled) {
        setIsFinished(true);
      }
    }, currentDelay + POST_SEQUENCE_DELAY_MS);

    timers.push(completionTimer);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [active, lines]);

  return { revealedLines, isFinished };
}

function SequenceStage({
  copy,
  lines,
  audioSrc,
  videoSources,
  preferVideo,
  onContinue,
}) {
  const [mediaDone, setMediaDone] = useState(false);
  const [mediaMode, setMediaMode] = useState(preferVideo && videoSources ? 'video' : 'audio');
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const { revealedLines, isFinished } = useTypewriterLines(lines, true);
  const hideTextOverlay = mediaMode === 'video' && Boolean(videoSources);

  useEffect(() => {
    setMediaDone(false);
    setMediaMode(preferVideo && videoSources ? 'video' : 'audio');
  }, [audioSrc, preferVideo, videoSources]);

  useEffect(() => {
    setMediaDone(false);

    if (mediaMode === 'video') {
      const videoElement = videoRef.current;

      if (!videoElement) {
        setMediaMode('audio');
        return undefined;
      }

      const handleEnded = () => setMediaDone(true);
      const handleError = () => setMediaMode('audio');

      videoElement.currentTime = 0;
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('error', handleError);

      const playPromise = videoElement.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setMediaMode('audio');
        });
      }

      return () => {
        videoElement.pause();
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('error', handleError);
      };
    }

    if (!audioSrc) {
      setMediaDone(true);
      return undefined;
    }

    const audioElement = new Audio(audioSrc);
    audioRef.current = audioElement;

    const handleEnded = () => setMediaDone(true);
    const handleError = () => setMediaDone(true);

    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);

    const playPromise = audioElement.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setMediaDone(true);
      });
    }

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [audioSrc, mediaMode]);

  return (
    <section className="game-stage game-stage-sequence">
      {mediaMode === 'video' && videoSources && (
        <video
          ref={videoRef}
          className="game-stage-video"
          playsInline
          preload="auto"
        >
          <source src={videoSources.mp4} type="video/mp4" />
          <source src={videoSources.webm} type="video/webm" />
        </video>
      )}

      <div className="game-stage-backdrop" />

      <div className={`game-stage-content${hideTextOverlay ? ' game-stage-content-video-only' : ''}`}>
        {!hideTextOverlay && (
          <div className="game-lines">
            {lines.map((line, lineIndex) => {
              const visibleText = revealedLines[lineIndex];
              const isVisible = visibleText.length > 0;
              const isActiveLine = isVisible && visibleText.length < line.length;

              return (
                <p
                  key={`${lineIndex}-${line}`}
                  className={`${getLineToneClass(line)}${isVisible ? ' is-visible' : ''}`}
                >
                  {visibleText}
                  {isActiveLine && <span className="game-cursor" />}
                </p>
              );
            })}
          </div>
        )}

        {mediaDone && (hideTextOverlay || isFinished) && (
          <button type="button" className="game-next-button" onClick={onContinue}>
            {copy.nextLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function RecordingStage({
  copy,
  uploadUrl,
  gameId,
  language,
  onUploadComplete,
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadState, setUploadState] = useState('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(RECORDING_DURATION_SECONDS);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [uploadResponse, setUploadResponse] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const promptAudioRef = useRef(null);
  const isRecording = uploadState === 'recording';
  const hasRecordedClip = Boolean(recordedBlob && recordedUrl);
  const isUploading = uploadState === 'uploading';
  const isProcessing = uploadState === 'processing';
  const { revealedLines, isFinished } = useTypewriterLines(copy.lines, true);

  useEffect(() => {
    const audioElement = new Audio(copy.audioSrc);
    promptAudioRef.current = audioElement;
    const playPromise = audioElement.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
      promptAudioRef.current = null;
    };
  }, [copy.audioSrc]);

  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordedUrl]);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    if (remainingSeconds <= 0) {
      stopRecording();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setRemainingSeconds((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isRecording, remainingSeconds]);

  function stopActivePlayback() {
    if (promptAudioRef.current) {
      promptAudioRef.current.pause();
      promptAudioRef.current.currentTime = 0;
    }

    if (typeof document === 'undefined') {
      return;
    }

    document.querySelectorAll('#metacasquette-game-app audio, #metacasquette-game-app video').forEach((mediaElement) => {
      if (typeof mediaElement.pause === 'function') {
        mediaElement.pause();
      }

      if (typeof mediaElement.currentTime === 'number') {
        mediaElement.currentTime = 0;
      }
    });
  }

  async function startRecording() {
    setErrorMessage('');
    setUploadResponse(null);

    if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
      setErrorMessage(copy.unsupportedError);
      return;
    }

    const mimeType = getPreferredMimeType();

    try {
      stopActivePlayback();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = mimeType ? new window.MediaRecorder(stream, { mimeType }) : new window.MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setRemainingSeconds(RECORDING_DURATION_SECONDS);
      setRecordedBlob(null);

      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl('');
      }

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener(
        'stop',
        () => {
          const blobType = recorder.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: blobType });
          const nextUrl = URL.createObjectURL(blob);

          setRecordedBlob(blob);
          setRecordedUrl(nextUrl);
          setUploadState('ready');

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        },
        { once: true }
      );

      recorder.start();
      setUploadState('recording');
    } catch (error) {
      setErrorMessage(copy.permissionError);
      setUploadState('idle');
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    recorder.stop();
    setUploadState('processing');
  }

  async function uploadRecording() {
    if (!recordedBlob) {
      return;
    }

    setErrorMessage('');
    setUploadState('uploading');

    const mimeType = recordedBlob.type || 'audio/webm';
    const fileName = `recording.${getFileExtension(mimeType)}`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          'X-MetaCasquette-File-Name': fileName,
          'X-MetaCasquette-Language': language,
        },
        body: recordedBlob,
      });

      const responseText = await response.text();
      let responseData = null;

      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        responseData = null;
      }

      if (!response.ok || !responseData || !responseData.success) {
        const nextError = new Error(
          (responseData && responseData.reason) || `http_${response.status || 'unknown'}`
        );

        nextError.detail = formatApiErrorDetail(responseData && responseData.detail ? responseData.detail : '');

        throw nextError;
      }

      setUploadResponse(responseData);
      setUploadState('uploaded');

      if (typeof onUploadComplete === 'function') {
        onUploadComplete(responseData);
      }
    } catch (error) {
      const errorDetails = {
        missingFile: language === 'fr' ? 'Aucun fichier audio n’a été transmis.' : 'No audio file was transmitted.',
        invalidMimeType: language === 'fr' ? 'Le format audio reçu par le serveur est invalide.' : 'The audio format received by the server is invalid.',
        storageUnavailable: language === 'fr' ? 'Le dossier temporaire du serveur est indisponible.' : 'The temporary server directory is unavailable.',
        storageFailure: language === 'fr' ? "Le serveur n'a pas réussi à écrire le fichier audio." : 'The server could not store the audio file.',
        unexpectedUploadFailure: language === 'fr' ? "Une exception serveur s'est produite pendant l'upload." : 'A server exception occurred during upload.',
        unknownGame: language === 'fr' ? 'La route du jeu est inconnue.' : 'The game route is unknown.',
        http_404: language === 'fr' ? "La route d'upload n'existe pas côté serveur." : 'The upload route does not exist on the server.',
        http_500: language === 'fr' ? 'Le serveur répond avec une erreur 500 pendant l’upload.' : 'The server returns a 500 error during upload.',
        http_403: language === 'fr' ? 'Le serveur refuse l’upload.' : 'The server refuses the upload.',
        http_unknown: language === 'fr' ? 'Le serveur a renvoyé une réponse invalide.' : 'The server returned an invalid response.',
      };

      const errorDetail = typeof error.detail === 'string' && error.detail !== '' ? ` ${error.detail}` : '';
      const baseErrorMessage = errorDetails[error.message] || copy.uploadError;

      setErrorMessage(baseErrorMessage + errorDetail);
      setUploadState('ready');
    }
  }

  function resetRecording() {
    setErrorMessage('');
    setUploadResponse(null);
    setUploadState('idle');
    setRemainingSeconds(RECORDING_DURATION_SECONDS);
    setRecordedBlob(null);

    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl('');
    }
  }

  return (
    <section className="game-stage game-stage-recording">
      <div className="game-stage-backdrop" />

      <div className="game-stage-content">
        <div className="game-lines game-lines-recording">
          {copy.lines.map((line, lineIndex) => {
            const visibleText = revealedLines[lineIndex];
            const isVisible = visibleText.length > 0;
            const isActiveLine = isVisible && visibleText.length < line.length;

            return (
              <p
                key={`${lineIndex}-${line}`}
                className={`${getLineToneClass(line)}${isVisible ? ' is-visible' : ''}`}
              >
                {visibleText}
                {isActiveLine && <span className="game-cursor" />}
              </p>
            );
          })}
        </div>

        <p className={`game-recording-helper${isFinished ? ' is-visible' : ''}`}>
          {copy.helper}
        </p>

        <div className="game-recorder-area">
          <div className={`game-recorder-status${(isRecording || hasRecordedClip || isProcessing) ? ' is-visible' : ''}`}>
            <span>{copy.durationLabel}</span>
            <strong>{remainingSeconds}s</strong>
          </div>

          <button
            type="button"
            className={`game-record-button${isRecording ? ' game-record-button-live' : ''}${(hasRecordedClip || isProcessing) ? ' game-record-button-ready' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={hasRecordedClip || isProcessing || isUploading}
            aria-label={isRecording ? copy.stopRecordingLabel : copy.startRecordingLabel}
          >
            <img
              src="/img/record.png"
              alt=""
              className="game-record-icon"
            />
          </button>

          <div className="game-recording-animation" aria-hidden="true">
            {isRecording && <img src="/img/sound_recording.gif" alt="" />}
          </div>

          <p className="game-recording-status-text">
            {isRecording ? copy.stopRecordingLabel : ''}
          </p>

          <div className="game-audio-preview" style={{ visibility: recordedUrl ? 'visible' : 'hidden' }} aria-hidden={!recordedUrl}>
            <audio controls src={recordedUrl || undefined} tabIndex={recordedUrl ? 0 : -1} className="game-audio-player" />
          </div>

          {errorMessage && <p className="game-error-message">{errorMessage}</p>}

          <div
              className="game-action-row game-recording-actions"
              style={{ visibility: hasRecordedClip ? 'visible' : 'hidden' }}
              aria-hidden={!hasRecordedClip}
            >
              <button
                type="button"
                className="game-secondary-button game-rerecord-button"
                aria-label={copy.rerecordLabel}
                title={copy.rerecordLabel}
                onClick={resetRecording}
                disabled={!hasRecordedClip || isRecording || isUploading}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10a9 9 0 1 1 2.6 8.4" />
                  <path d="M3 4v6h6" />
                </svg>
              </button>
              <button
                type="button"
                className="game-next-button"
                onClick={uploadRecording}
                disabled={!recordedBlob || isRecording || isUploading}
              >
                {isUploading ? copy.uploadingLabel : copy.uploadLabel}
              </button>
            </div>

          {uploadResponse && (
            <div className="game-upload-success">
              <h2>{copy.uploadSuccessTitle}</h2>
              <p>{copy.uploadSuccessMessage}</p>
              <dl className="game-upload-meta">
                <div>
                  <dt>gameId</dt>
                  <dd>{gameId}</dd>
                </div>
                <div>
                  <dt>recordingId</dt>
                  <dd>{uploadResponse.recordingId}</dd>
                </div>
                <div>
                  <dt>file</dt>
                  <dd>{uploadResponse.fileName}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function buildGeneratedAssetUrl(gameId, fileName) {
  return `/jeu/${encodeURIComponent(gameId)}/generated/${encodeURIComponent(fileName)}`;
}

function buildProcessRecordingUrl(gameId, recordingId) {
  return `/jeu/${encodeURIComponent(gameId)}/recordings/${encodeURIComponent(recordingId)}/process`;
}

function buildRecordingStatusUrl(gameId, recordingId) {
  return `/jeu/${encodeURIComponent(gameId)}/recordings/${encodeURIComponent(recordingId)}/status`;
}

function ProcessingStage({
  copy,
  gameId,
  recordingId,
  playbackRef,
  onComplete,
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const { revealedLines } = useTypewriterLines(copy.lines, true);

  function playTransitionMessage() {
    if (!copy.audioSrc) {
      return;
    }

    const audioElement = playbackRef.current || new Audio();
    playbackRef.current = audioElement;
    audioElement.src = copy.audioSrc;
    audioElement.preload = 'auto';
    audioElement.currentTime = 0;

    const playPromise = audioElement.play();

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => setSoundBlocked(false))
        .catch(() => setSoundBlocked(true));
    }
  }

  async function processRecording() {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(buildProcessRecordingUrl(gameId, recordingId), {
        method: 'POST',
      });
      const payload = await response.json();

      if (response.status === 429 && payload.reason === 'creationRateLimited') {
        throw new Error(copy.rateLimitMessage(Math.max(1, Math.ceil(payload.retryAfter / 60))));
      }
      if (payload.reason === 'creationLimitUnavailable') {
        throw new Error(copy.limitUnavailableMessage);
      }

      if (!response.ok || !payload || !payload.success || !payload.result) {
        throw new Error(
          payload && typeof payload.detail !== 'undefined'
            ? formatApiErrorDetail(payload.detail)
            : payload && payload.reason
              ? payload.reason
              : `http_${response.status || 'unknown'}`
        );
      }

      if (typeof onComplete === 'function') {
        onComplete(payload.result);
      }
    } catch (error) {
      setErrorMessage(String(error && error.message ? error.message : 'unknown'));
      setLoading(false);
    }
  }

  useEffect(() => {
    processRecording();
  }, [gameId, recordingId]);

  useEffect(() => {
    playTransitionMessage();

    return () => {
      const audioElement = playbackRef.current;

      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [copy.audioSrc, playbackRef]);

  return (
    <section className="game-stage game-stage-processing">
      <div className="game-stage-backdrop" />

      <div className="game-stage-content">
        <div className="game-lines">
          {copy.lines.map((line, lineIndex) => {
            const visibleText = revealedLines[lineIndex];
            const isVisible = visibleText.length > 0;
            const isActiveLine = isVisible && visibleText.length < line.length;

            return (
              <p key={`${lineIndex}-${line}`} className={`${getLineToneClass(line)}${isVisible ? ' is-visible' : ''}`}>
                {visibleText}
                {isActiveLine && <span className="game-cursor" />}
              </p>
            );
          })}
        </div>

        {loading && (
          <div
            className="game-processing-loader"
            role="status"
            aria-live="polite"
            aria-label={copy.lines[copy.lines.length - 1]}
          >
            <span className="game-loader" aria-hidden="true" />
          </div>
        )}
        {soundBlocked && (
          <button type="button" className="game-secondary-button" onClick={playTransitionMessage}>
            {copy.soundBlockedLabel}
          </button>
        )}
        {errorMessage && <p className="game-error-message">{errorMessage}</p>}

        {!loading && (
          <button type="button" className="game-next-button" onClick={processRecording}>
            {copy.retryLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function AcknowledgementStage({
  copy,
  result,
  playbackRef,
  onContinue,
}) {
  const linesRef = useRef(null);
  const continueRequestedRef = useRef(false);
  const [mediaDone, setMediaDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [continueRequested, setContinueRequested] = useState(false);

  if (!linesRef.current) {
    linesRef.current = copy.buildLines(result.name, result.whatilove);
  }

  const lines = linesRef.current;
  const { revealedLines, isFinished } = useTypewriterLines(lines, true);

  function continueToCarousel() {
    const audioElement = playbackRef.current;

    if (mediaDone || !audioElement || !result.responseMp3Url) {
      onContinue();
      return;
    }

    continueRequestedRef.current = true;
    setContinueRequested(true);

    if (!audioElement.paused && !audioElement.ended) {
      setIsPlaying(true);
      return;
    }

    audioElement.src = result.responseMp3Url;
    audioElement.currentTime = 0;

    const playPromise = audioElement.play();

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }

  useEffect(() => {
    if (!result.responseMp3Url) {
      setMediaDone(true);
      return undefined;
    }

    const audioElement = playbackRef.current || new Audio();
    playbackRef.current = audioElement;
    audioElement.src = result.responseMp3Url;
    audioElement.preload = 'auto';
    audioElement.currentTime = 0;
    const finishMessage = () => {
      setMediaDone(true);
      setIsPlaying(false);

      if (continueRequestedRef.current) {
        onContinue();
      }
    };

    audioElement.addEventListener('ended', finishMessage);
    audioElement.addEventListener('error', finishMessage);
    const playPromise = audioElement.play();

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.removeEventListener('ended', finishMessage);
      audioElement.removeEventListener('error', finishMessage);
    };
  }, [onContinue, playbackRef, result.responseMp3Url]);

  return (
    <section className="game-stage game-stage-acknowledgement">
      <div className="game-stage-backdrop" />
      <div className="game-stage-content">
        <div className="game-lines game-lines-acknowledgement">
          {lines.map((line, lineIndex) => {
            const visibleText = revealedLines[lineIndex];
            const isVisible = visibleText.length > 0;
            const isActiveLine = isVisible && visibleText.length < line.length;

            return (
              <p key={`${lineIndex}-${line}`} className={`${getLineToneClass(line)}${isVisible ? ' is-visible' : ''}`}>
                {visibleText}
                {isActiveLine && <span className="game-cursor" />}
              </p>
            );
          })}
        </div>

        {isFinished && (
          <button
            type="button"
            className="game-next-button"
            onClick={continueToCarousel}
            disabled={continueRequested && isPlaying}
          >
            {copy.continueLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function ResultStage({
  copy,
  result,
  playbackRef,
  gameId,
}) {
  const linesRef = useRef(null);
  const stageRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const selfieHatRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const [selfieMode, setSelfieMode] = useState('idle');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [reelUrl, setReelUrl] = useState(result.instagramReelUrl || '');
  const [publicationError, setPublicationError] = useState(false);
  const [publicationCheck, setPublicationCheck] = useState(0);

  useEffect(() => {
    if (reelUrl || !result.recordingId) return undefined;
    let cancelled = false;
    let timer;
    const started = Date.now();
    const controller = new AbortController();
    setPublicationError(false);
    async function checkPublication() {
      try {
        const response = await fetch(buildRecordingStatusUrl(gameId, result.recordingId), {
          method: 'POST', cache: 'no-store', signal: controller.signal,
        });
        const payload = await response.json();
        if (cancelled) return;
        if (response.ok && payload.success && payload.result) {
          const publication = payload.result;
          if (publication.instagramReelUrl && /^https:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/.test(publication.instagramReelUrl)) {
            setReelUrl(publication.instagramReelUrl);
            return;
          }
          if (['failed', 'timeout', 'publication_unknown', 'unavailable'].includes(publication.instagramStatus)) {
            setPublicationError(true);
            return;
          }
        } else if (!response.ok || !payload.success) {
          setPublicationError(true);
          return;
        }
      } catch (error) {
        if (cancelled) return;
      }
      if (Date.now() - started >= 15 * 60 * 1000) {
        setPublicationError(true);
        return;
      }
      if (!cancelled) timer = window.setTimeout(checkPublication, 5000);
    }
    checkPublication();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [gameId, result.recordingId, reelUrl, publicationCheck]);


  if (!linesRef.current) {
    linesRef.current = copy.buildLines(result.name, result.whatilove);
  }

  const lines = linesRef.current;
  const { revealedLines } = useTypewriterLines(lines, true);

  useEffect(() => {
    if (!result || !result.readyMp3Url) {
      return undefined;
    }

    const audioElement = playbackRef.current || new Audio();
    playbackRef.current = audioElement;
    audioElement.src = result.readyMp3Url;
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  }, [playbackRef, result.readyMp3Url]);

  useEffect(() => {
    if (selfieMode !== 'camera') {
      return undefined;
    }

    let cancelled = false;
    let activeStream = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
        });
        activeStream = stream;

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;

        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          const playPromise = cameraVideoRef.current.play();

          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError(copy.selfieCameraError);
          setSelfieMode('idle');
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;

      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }

      if (cameraStreamRef.current === activeStream) {
        cameraStreamRef.current = null;
      }

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
      }
    };
  }, [copy.selfieCameraError, selfieMode]);

  useEffect(() => {
    if (selfieMode !== 'idle' && stageRef.current) {
      stageRef.current.scrollTop = 0;
      stageRef.current.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [selfieMode]);

  function stopCamera() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }

  function openCamera() {
    setCameraError('');

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setCameraError(copy.selfieCameraError);
      return;
    }

    setSelfieMode('camera');
  }

  function playInstagramInvitation() {
    if (!copy.instagramAudioSrc) {
      return;
    }

    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current.currentTime = 0;
    }

    const audioElement = playbackRef.current || new Audio();
    playbackRef.current = audioElement;
    audioElement.src = copy.instagramAudioSrc;
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }

  function captureSelfie() {
    const videoElement = cameraVideoRef.current;
    const hatImage = selfieHatRef.current;

    if (!videoElement || videoElement.readyState < 2 || !hatImage || !hatImage.complete || !hatImage.naturalWidth) {
      setCameraError(copy.selfieCameraError);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const previewBounds = videoElement.getBoundingClientRect();
      const hatBounds = hatImage.getBoundingClientRect();
      if (!previewBounds.width || !previewBounds.height) {
        throw new Error('Camera preview has no size');
      }
      const canvasWidth = 1080;
      const canvasHeight = Math.round(canvasWidth * previewBounds.height / previewBounds.width);
      const context = canvas.getContext('2d');
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const coverScale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);
      const sourceWidth = canvasWidth / coverScale;
      const sourceHeight = canvasHeight / coverScale;
      const sourceX = (videoWidth - sourceWidth) / 2;
      const sourceY = (videoHeight - sourceHeight) / 2;

      context.drawImage(
        videoElement,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvasWidth,
        canvasHeight,
      );

      // Match the actual preview, including the image's object-fit: contain.
      const hatScale = Math.min(
        hatBounds.width / hatImage.naturalWidth,
        hatBounds.height / hatImage.naturalHeight,
      );
      const displayedWidth = hatImage.naturalWidth * hatScale;
      const displayedHeight = hatImage.naturalHeight * hatScale;
      const scaleX = canvasWidth / previewBounds.width;
      const scaleY = canvasHeight / previewBounds.height;
      context.drawImage(
        hatImage,
        (hatBounds.left - previewBounds.left + (hatBounds.width - displayedWidth) / 2) * scaleX,
        (hatBounds.top - previewBounds.top + (hatBounds.height - displayedHeight) / 2) * scaleY,
        displayedWidth * scaleX,
        displayedHeight * scaleY,
      );

      setCapturedPhotoUrl(canvas.toDataURL('image/jpeg', 0.92));
      stopCamera();
      setSelfieMode('captured');
      setCameraError('');
      playInstagramInvitation();
    } catch (error) {
      setCameraError(copy.selfieCameraError);
    }
  }

  function retakeSelfie() {
    setCapturedPhotoUrl('');
    setCameraError('');
    setSelfieMode('camera');
  }

  return (
    <section ref={stageRef} className={`game-stage game-stage-result${selfieMode !== 'idle' ? ' game-stage-selfie' : ''}`}>
      <div className="game-stage-backdrop" />

      <div className="game-stage-content">
        <div className="game-result-shell">
          <div style={{ display: selfieMode === 'idle' ? 'contents' : 'none' }}>
          <div className="game-lines game-lines-result">
            {lines.map((line, lineIndex) => {
              const visibleText = revealedLines[lineIndex];
              const isVisible = visibleText.length > 0;
              const isActiveLine = isVisible && visibleText.length < line.length;

              return (
                <p key={`${lineIndex}-${line}`} className={`${getLineToneClass(line)}${isVisible ? ' is-visible' : ''}`}>
                  {visibleText}
                  {isActiveLine && <span className="game-cursor" />}
                </p>
              );
            })}
          </div>

          {result.imageUrl && !imageError && (
            <img
              src={result.imageUrl}
              alt={copy.imageAlt}
              className="game-result-image"
              onError={() => setImageError(true)}
            />
          )}

          {imageError && <p className="game-error-message">{copy.imageAlt}</p>}

          </div>

          {result.imageUrl && !imageError && (
            <div className="game-selfie-shell">
              {selfieMode === 'idle' && <p className="game-selfie-title">{copy.selfieTitle}</p>}

              {selfieMode === 'idle' && (
                <button type="button" className="game-next-button" onClick={openCamera}>
                  {copy.selfieStartLabel}
                </button>
              )}

              {selfieMode === 'camera' && (
                <>
                  <p className="game-selfie-instruction">{copy.selfieCameraLabel}</p>
                  <div className="game-selfie-camera">
                    <video
                      ref={cameraVideoRef}
                      className="game-selfie-video"
                      autoPlay
                      muted
                      playsInline
                    />
                    <img ref={selfieHatRef} src={result.imageUrl} alt="" className="game-selfie-hat" />
                    <span className="game-selfie-face-guide" aria-hidden="true" />
                  </div>
                  <button type="button" className="game-next-button" onClick={captureSelfie}>
                    {copy.selfieCaptureLabel}
                  </button>
                </>
              )}

              {selfieMode === 'captured' && capturedPhotoUrl && (
                <>
                  <img
                    src={capturedPhotoUrl}
                    alt={copy.selfieTitle}
                    className="game-selfie-photo"
                  />
                  <div className="game-action-row game-selfie-actions">
                    <button type="button" className="game-secondary-button" onClick={retakeSelfie}>
                      {copy.selfieRetakeLabel}
                    </button>
                    <a
                      className="game-secondary-button"
                      href={capturedPhotoUrl}
                      download={`metacasquette-${result.recordingId || 'photo'}.jpg`}
                    >
                      {copy.selfieDownloadLabel}
                    </a>
                  </div>
                  <p className="game-instagram-invitation">{copy.instagramInvitation}</p>
                  {reelUrl ? (
                    <a className="game-next-button game-instagram-button" href={reelUrl} target="_blank" rel="noreferrer">
                      {copy.instagramLabel}
                    </a>
                  ) : publicationError ? (
                    <div className="game-instagram-status" role="status">
                      <p>{copy.instagramErrorLabel}</p>
                      <button type="button" className="game-secondary-button" onClick={() => setPublicationCheck((value) => value + 1)}>
                        {copy.instagramRetryLabel}
                      </button>
                    </div>
                  ) : (
                    <div className="game-instagram-status" role="status" aria-live="polite">
                      <span className="game-loader" aria-hidden="true" />
                      <p>{copy.instagramWaitingLabel}</p>
                    </div>
                  )}
                </>
              )}

              {cameraError && <p className="game-error-message">{cameraError}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CarouselStage({
  copy,
  gameId,
  generationError,
  playbackRef,
}) {
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [audioLocked, setAudioLocked] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const requestIdRef = useRef(0);
  const cycleTimerRef = useRef(null);
  const lastImagePathRef = useRef('');

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;

      if (playbackRef.current) {
        playbackRef.current.pause();
        playbackRef.current.currentTime = 0;
      }

      if (cycleTimerRef.current) {
        window.clearTimeout(cycleTimerRef.current);
      }
    };
  }, []);

  function scheduleNextCreation(delay = 900) {
    if (cycleTimerRef.current) {
      window.clearTimeout(cycleTimerRef.current);
    }

    cycleTimerRef.current = window.setTimeout(loadRandomCreation, delay);
  }

  async function loadRandomCreation() {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setStatus('loading');
    setErrorMessage('');
    setAudioLocked(true);
    setSoundBlocked(false);

    if (cycleTimerRef.current) {
      window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }

    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current.currentTime = 0;
    }

    try {
      const excludeQuery = lastImagePathRef.current
        ? `?exclude=${encodeURIComponent(lastImagePathRef.current)}`
        : '';
      const response = await fetch(`/jeu/${encodeURIComponent(gameId)}/randomgenerated${excludeQuery}`, {
        method: 'POST',
      });
      const payload = await response.json();

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok || !payload || !payload.success || !payload.result) {
        const reason = payload && payload.reason ? payload.reason : 'unknown';

        if (reason === 'noGeneratedContent') {
          setStatus('empty');
          setAudioLocked(false);
          scheduleNextCreation(3000);
          return;
        }

        throw new Error(reason);
      }

      const nextItem = {
        imagePath: payload.result.imagePath,
        imageUrl: buildGeneratedAssetUrl(gameId, payload.result.imagePath),
        soundUrl: payload.result.soundPath ? buildGeneratedAssetUrl(gameId, payload.result.soundPath) : '',
        text: payload.result.text || '',
      };

      lastImagePathRef.current = nextItem.imagePath;
      setItem(nextItem);
      setStatus('ready');

      if (!nextItem.soundUrl) {
        setAudioLocked(false);
        scheduleNextCreation(4500);
        return;
      }

      const audioElement = playbackRef.current || new Audio();
      playbackRef.current = audioElement;
      audioElement.src = nextItem.soundUrl;
      audioElement.currentTime = 0;

      const unlockAudio = () => {
        if (requestId === requestIdRef.current) {
          setAudioLocked(false);
          setSoundBlocked(false);
          scheduleNextCreation();
        }
      };

      audioElement.addEventListener('ended', unlockAudio, { once: true });
      audioElement.addEventListener('error', unlockAudio, { once: true });

      const playPromise = audioElement.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          if (requestId === requestIdRef.current) {
            setAudioLocked(false);
            setSoundBlocked(true);
            scheduleNextCreation(6500);
          }
        });
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setStatus('error');
      setAudioLocked(false);
      setErrorMessage(String(error && error.message ? error.message : 'unknown'));
      scheduleNextCreation(3000);
    }
  }

  function enableCurrentSound() {
    if (!playbackRef.current) {
      return;
    }

    if (cycleTimerRef.current) {
      window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }

    playbackRef.current.currentTime = 0;
    const playPromise = playbackRef.current.play();

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          setSoundBlocked(false);
          setAudioLocked(true);
        })
        .catch(() => {
          setSoundBlocked(true);
          setAudioLocked(false);
          scheduleNextCreation(6500);
        });
    }
  }

  useEffect(() => {
    loadRandomCreation();
  }, []);

  return (
    <section className="game-stage game-stage-carousel">
      <div className="game-stage-backdrop" />

      <div className="game-stage-content">
        <div className="game-lines game-lines-carousel">
          {copy.titleLines.map((line) => (
            <p key={line} className={`${getLineToneClass(line)} is-visible`}>
              {line}
            </p>
          ))}
        </div>

        <div className="game-carousel-shell">
          {status === 'loading' && <p className="game-carousel-status">{copy.loadingLabel}</p>}
          {status === 'empty' && <p className="game-carousel-status">{copy.emptyLabel}</p>}
          {status === 'error' && <p className="game-error-message">{errorMessage}</p>}
          {generationError && <p className="game-error-message">{generationError}</p>}

          {item && (
            <figure className="game-carousel-card">
              <img
                src={item.imageUrl}
                alt={item.text || item.imagePath}
                className="game-carousel-image"
              />
              <figcaption className="game-carousel-text">
                {item.text || copy.textMissingLabel}
              </figcaption>
              <div className="game-carousel-progress" aria-hidden="true">
                <span key={item.imagePath} className="game-carousel-progress-fill" />
              </div>
            </figure>
          )}

          {soundBlocked && (
            <button type="button" className="game-secondary-button" onClick={enableCurrentSound}>
              {copy.soundBlockedLabel}
            </button>
          )}

          <button
            type="button"
            className="game-next-button"
            onClick={loadRandomCreation}
            disabled={status === 'loading' || audioLocked}
          >
            {copy.nextLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function App({ rootElement }) {
  const uploadUrl = rootElement.dataset.uploadUrl;
  const frenchFlag = rootElement.dataset.frenchFlag;
  const englishFlag = rootElement.dataset.englishFlag;
  const gameId = rootElement.dataset.gameId;

  const [language, setLanguage] = useState(null);
  const [screen, setScreen] = useState('language');
  const [preferVideo, setPreferVideo] = useState(false);
  const [recordingUpload, setRecordingUpload] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);
  const [generationError, setGenerationError] = useState('');
  const playbackRef = useRef(null);

  const copy = content[language || 'fr'];
  const pendingRecordingId = generationResult && generationResult.generationPending
    ? generationResult.recordingId
    : '';

  useEffect(() => {
    if (!pendingRecordingId) {
      return undefined;
    }

    let cancelled = false;
    let pollTimer = null;

    async function pollGenerationStatus() {
      try {
        const response = await fetch(buildRecordingStatusUrl(gameId, pendingRecordingId), {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        const payload = await response.json();

        if (cancelled) {
          return;
        }

        if (response.ok && payload && payload.success && payload.ready && payload.result) {
          setGenerationResult(payload.result);
          setGenerationError('');
          setScreen('result');
          return;
        }

        if (!response.ok || !payload || !payload.success) {
          setGenerationError(copy.carousel.generationErrorLabel);
          return;
        }
      } catch (error) {
      }

      if (!cancelled) {
        pollTimer = window.setTimeout(pollGenerationStatus, 3000);
      }
    }

    pollGenerationStatus();

    return () => {
      cancelled = true;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [copy.carousel.generationErrorLabel, gameId, pendingRecordingId]);

  function chooseLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setPreferVideo(!isIOSDevice());
    setScreen('intro1');
  }

  if (screen === 'language') {
    return (
      <section className="game-stage game-stage-language">
        <div className="game-stage-backdrop" />
        <div className="game-stage-content">
          <p className="game-language-caption">{copy.subtitle}</p>
          <div className="game-language-list">
            <button
              type="button"
              className="game-language-button"
              onClick={() => chooseLanguage('fr')}
              aria-label={copy.languageButtons[0].label}
              title={copy.languageButtons[0].label}
            >
              <img src={frenchFlag} alt="" className="game-flag" />
            </button>
            <button
              type="button"
              className="game-language-button"
              onClick={() => chooseLanguage('en')}
              aria-label={copy.languageButtons[1].label}
              title={copy.languageButtons[1].label}
            >
              <img src={englishFlag} alt="" className="game-flag" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (screen === 'intro1') {
    return (
      <SequenceStage
        copy={copy}
        lines={copy.intro1.lines}
        audioSrc={copy.intro1.audioSrc}
        videoSources={copy.intro1.videoSources}
        preferVideo={preferVideo}
        onContinue={() => setScreen('intro2')}
      />
    );
  }

  if (screen === 'intro2') {
    return (
      <SequenceStage
        copy={copy}
        lines={copy.intro2.lines}
        audioSrc={copy.intro2.audioSrc}
        preferVideo={false}
        onContinue={() => setScreen('record')}
      />
    );
  }

  if (screen === 'record') {
    return (
      <RecordingStage
        copy={copy.recording}
        uploadUrl={uploadUrl}
        gameId={gameId}
        language={language || 'fr'}
        onUploadComplete={(uploadData) => {
          setRecordingUpload(uploadData);
          setScreen('processing');
        }}
      />
    );
  }

  if (screen === 'processing' && recordingUpload && recordingUpload.recordingId) {
    return (
      <ProcessingStage
        copy={copy.processing}
        gameId={gameId}
        recordingId={recordingUpload.recordingId}
        playbackRef={playbackRef}
        onComplete={(result) => {
          setGenerationResult(result);
          setGenerationError('');
          setScreen('acknowledgement');
        }}
      />
    );
  }

  if (screen === 'acknowledgement' && generationResult) {
    return (
      <AcknowledgementStage
        copy={copy.acknowledgement}
        result={generationResult}
        playbackRef={playbackRef}
        onContinue={() => setScreen('carousel')}
      />
    );
  }

  if (screen === 'carousel' && generationResult) {
    return (
      <CarouselStage
        copy={copy.carousel}
        gameId={gameId}
        generationError={generationError}
        playbackRef={playbackRef}
      />
    );
  }

  if (screen === 'result' && generationResult) {
    return (
      <ResultStage
        copy={copy.result}
        result={generationResult}
        playbackRef={playbackRef}
        gameId={gameId}
      />
    );
  }

  return null;
}

export default App;
