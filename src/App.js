import React, { useEffect, useState } from 'react';
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
    
    useEffect( () => {
        
        window.ipcRenderer.on('ping', (event, message) => { 
                        
            var blob = new Blob([message], {type: 'img/png'});
                
            var task = firebase.storage().ref().child('/captures/img.png').put(blob);
            
            task.on('state_changed', (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    break;
                }
            }, (error) => {
            // Handle unsuccessful uploads
            }, () => {task.snapshot.ref.getDownloadURL().then( downloadURL => setImgURL(downloadURL) );
            });
        });    
        
    }, []);
            
    return (
    <div className = 'App'>
        <div className = 'Header-Arrow'></div>
        <div className = 'Box'>
        { imgURL 
            ? <img src = {imgURL}></img>
            : <p>Press <kbd>⌘</kbd> + ⇧ + 4</p>
        }
        </div>
    </div>
    );
}

export default App;