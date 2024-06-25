/**
 * Very basic react demo of how to use the HeyGen Streaming Avatar SDK
 */
import { useEffect, useRef, useState } from 'react';
import { Configuration, NewSessionData, StreamingAvatarApi} from '@heygen/streaming-avatar';
import './App.css';
import { getToken } from './getToken';
//import { start } from 'repl';

function App() {
  const [stream, setStream] = useState<MediaStream> ();
  const [debug, setDebug] = useState<string> ();
  //let avatar = useRef<StreamingAvatarApi | null> (null);
  const fetchToken = async () => {
    const token = await getToken();
    console.log("\n-------_______--------\n Value of the token:"+token+"\n--------------\n")
    return String(token);
  }
  
  const token = fetchToken();
  console.log("\n--------------\nToken in APP:"+token+"\n\n")
  const avatar = useRef(new StreamingAvatarApi(
    new Configuration({accessToken: token})
  ));
  const [text, setText] = useState<string>("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false); // État pour contrôler la visibilité des boutons

  const [data, setData] = useState<NewSessionData>();
  const mediaStream = useRef<HTMLVideoElement>(null);



  async function useGrab(){
    try{
      
        if(avatar.current!=null){
        const res = await avatar.current.createStartAvatar(
        { newSessionRequest: 
          { quality: "low",
            avatarName: avatarId, 
            voice:{voiceId: voiceId}
          }
        }, setDebug);
        setData(res);
        setStream(avatar.current.mediaStream);
      }
    } catch (error) {

    }  
  };

  async function stop(){
    if (avatar.current && data?.sessionId) {
      await avatar.current.stopAvatar({stopSessionRequest: {sessionId: data?.sessionId}}).catch((e) => {
        setDebug(e.message);
      });
    }
  }

  useEffect(()=>{
    if(stream && mediaStream.current){
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
      }
    }
  }, [mediaStream, stream])


  let mediaRecorder = useRef<MediaRecorder | null>(null); // Utilisation de ref pour mediaRecorder
  let audioChunks = useRef<Blob[]>([]); // Utilisation de ref pour audioChunks


  const startButton = document.getElementById('StartRecording');
  const stopButton = document.getElementById('StopRecording');
  

  async function getAudioRecord() {
    try {
      setIsRecording(true);
      if(startButton != null && stopButton!= null){
        startButton.style.display = 'none';
        stopButton.style.display = 'inline';
      }

      // Démarrer l'enregistrement
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event: BlobEvent) => {
          audioChunks.current.push(event.data);
      };

      mediaRecorder.current.start();
      console.log(" \n\n\n- - -- - - media-Started \n\n\n")
    } catch(error) {

    }
  }


  async function handleAvatar() {
    if(startButton != null && stopButton!= null){
      stopButton.style.display = 'none';
      startButton.style.display = 'inline';
    }

    // Arrêter l'enregistrement
    setIsRecording(false);
    console.log(" \n\n\n- - -- - - media-Strooped \n\n\n")
    if (mediaRecorder.current!=null){
      mediaRecorder.current.stop();
      console.log(" \n\n\n- - -- - - media-Stoped \n\n\n")


      mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
          
          // Créez un FormData pour envoyer le fichier audio
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.mp3');

          /* Envoie à L'API */
          
          try {
              const response = await fetch('https://bs-avatar-api-staging-6952e3e70030.herokuapp.com/response', { 
                  method: 'POST',
                  body: formData,
              });

              if (response.ok) {
                  console.log('Audio successfully sent to the API');
                  await handleSpeak(response)
                  console.log("Response of the LLM :", response)
              } else {
                  console.error('Error sending audio to the API', response.statusText);
              }
          } catch (error) {
              console.error('Error:', error);
          }
          
          
      };
    }
  }

  async function handleSpeak(response: any){
    
    if (avatar.current && data?.sessionId) {
      await avatar.current.speak({taskRequest: {text: response, sessionId: data?.sessionId}}).catch((e) => {
        setDebug(e.message);
      });
    }
  }//<input className="InputField" placeholder='Type something for the avatar to say' value={text} onChange={(v)=>setText(v.target.value)}/>
  
  return (
    <div className="HeyGenStreamingAvatar">
      <header className="App-header">
        <p>
          {debug}
        </p>
        <div className="LabelPair">
          <label>Avatar ID </label>
          <input className="InputField2" placeholder='Avatar ID' value={avatarId} onChange={(v)=>setAvatarId(v.target.value)}/>
          
        </div>
        <div className="LabelPair">
          <label>Voice ID</label>
          <input className="InputField2" placeholder='Voice ID' value={voiceId} onChange={(v)=>setVoiceId(v.target.value)}/>
        </div>
        <div className="Actions">
          
          <button id='startButton' onClick={getAudioRecord} style={{ display: isRecording ? 'none' : 'inline' }}>Start Recording </button>
          <button id='stopButton' onClick={handleAvatar} style={{ display: isRecording ? 'inline' : 'none' }}>Stop Recording</button>
          <button onClick={useGrab}>Start</button>
          <button onClick={stop}>Stop</button>
        </div>
        
        <div className="MediaPlayer">
          <video playsInline autoPlay width={500} ref={mediaStream}></video>
        </div>

      </header>
    </div>
  );
}

export default App;
