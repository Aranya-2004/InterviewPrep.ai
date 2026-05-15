// src/hooks/useSpeechToText.js
import { useState, useEffect, useRef } from "react";

export default function useSpeechToText(language = "en-US") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;       // Keeps listening until stopped
    recog.interimResults = true;   // Allows real-time transcription
    recog.lang = language;

    recog.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptChunk + " ";
        } else {
          interimTranscript += transcriptChunk;
        }
      }
      setTranscript((prev) => prev + finalTranscript + interimTranscript);
    };

    recog.onend = () => {
      setListening(false);
    };

    recog.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognitionRef.current = recog;
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.error("Speech recognition start error:", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const resetTranscript = () => setTranscript("");

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
  };
}
