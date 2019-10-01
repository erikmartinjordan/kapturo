import React, { useEffect, useState } from 'react';
import mainLogo from'./mainLogo.png';
import firebase from 'firebase';
import './App.css';

var config = {
    apiKey: "AIzaSyB1caNJEEBjbz944Rlf9hZMTyyH5GHypLU",
    authDomain: "autosnapshoturl.firebaseapp.com",
    databaseURL: "https://autosnapshoturl.firebaseio.com",
    projectId: "autosnapshoturl",
    storageBucket: "autosnapshoturl.appspot.com",
    messagingSenderId: "861423952485",
    appId: "1:861423952485:web:5a6a8b7d019e6bb4139c8c"
};

firebase.initializeApp(config);


function App() {
    
    const [imgURL, setImgURL] = useState(null);
    const [status, setStatus] = useState('Green');
    const [statusMessage, setStatusMessage] = useState('Ready to capture') 
        
    useEffect( () => {
        
        window.ipcRenderer.on('ping', (event, message) => { 
                        
            var blob = new Blob([message], {type: 'img/png'});
                
            var task = firebase.storage().ref().child('/captures/img.png').put(blob);
            
            task.on('state_changed', (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                
                setStatus('Yellow');
                
                switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                    setStatusMessage('Upload is paused');
                    break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                    setStatusMessage('Upload is running: ' + Math.round(progress) + '% done');
                    break;
                }
            }, (error) => {
                // Handle unsuccessful uploads
                setStatus('Red');
                setStatusMessage('There was an error. Please, try it again.');
            }, () => {
                
                task.snapshot.ref.getDownloadURL().then( downloadURL => setImgURL(downloadURL) );
                setStatus('Green');
                setStatusMessage('Ready to capture');
            });
        });    
        
    }, []);
            
    return (
    <div className = 'App'>
        <div className = 'Header-Arrow'></div>
        <div className = 'Header'>
            <div className = 'Title'>Kaptura</div>
        </div>
        <div className = 'Box'>
        { imgURL 
            ? <div className = 'Completed'>
                <img src = {imgURL}></img>
              </div>
            : <div className = 'Waiting'>
                <img src = {mainLogo}></img>
                <p>Press <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>4</kbd></p>
             </div>
        }
        </div>
        <div className = 'Footer'>
            <div className = {'Color ' + status}></div>
            <p>{statusMessage}</p>
        </div>
    </div>
    );
}

export default App;