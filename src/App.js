import React, { useEffect, useState }   from 'react';
import Loading                          from './Loading';
import ReactTimeAgo                     from 'react-time-ago';
import JavascriptTimeAgo                from 'javascript-time-ago';
import en                               from 'javascript-time-ago/locale/en';
import mainLogo                         from './mainLogo.png';
import mainLogoPaused                   from './mainLogoPaused.png';
import firebase                         from 'firebase';
import './App.css';

// Initialize the desired locales.
JavascriptTimeAgo.locale(en);

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
    
    const [items, setItems] = useState([]);
    const [imgName, setImgName] = useState(null);
    const [mode, setMode] = useState('on');
    const [showScreenshots, setShowScreenshots] = useState(null);
    const [status, setStatus] = useState('Green');
    const [statusMessage, setStatusMessage] = useState('Ready to capture');
    const [userID, setUserID] = useState(null);
        
    useEffect( () => {
        
        // First render, app waits for user id
        // After getting uid a listener is added to upload captures
        window.ipcRenderer.on('uid', (event, uid) => {
                
            // Waiting until user make screencapture
            window.ipcRenderer.on('ping', (event, pic) => { uploadCapture(pic, uid) });
            
             // Setting uid as new state
            setUserID(uid);
            
        });
        
        // A stats listener is also launched 
        // Waiting for status changes = 'on' or 'off'
        window.ipcRenderer.on('status', (event, mode) => {
            
            // First, old listeners need to be removed
            window.ipcRenderer.removeAllListeners('ping');
                
            // If mode is 'on', application waits for captures
            if(mode === 'on'){ 
                window.ipcRenderer.on('ping', (event, pic) => { uploadCapture(pic, userID) });
                setStatus('Green'); 
                setStatusMessage('Ready to capture'); 
                setMode('on');
            }
            
            // If mode is 'off', application don't upload captures and shows messages
            if(mode === 'off'){
                setStatus('Yellow'); 
                setStatusMessage('Uploads are paused: please, turn on Kaptura.');
                setMode('off');
            }
            
        });
            
    }, []);
    
    const uploadCapture = (pic, uid) => {
        
        // Getting the image
        var blob = new Blob([pic], {type: 'image/png'});
        
        // Getting timeStamp
        var timeStamp = Date.now();

        // Uploading the image to firebase
        var task = firebase.storage().ref().child(uid + '/' + timeStamp + '.png').put(blob);

        task.on('state_changed', snapshot => {
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
        }, error => {

            // Handle unsuccessful uploads
            setStatus('Red');
            setStatusMessage('There was an error. Please, try it again.');

        }, async () => {

            // Getting donwloadURL
            let downloadURL = await task.snapshot.ref.getDownloadURL();

            // Shorten URL and    
            let shortURL = await shortenURL(downloadURL);
            
             // Writing uRL in clipboard
            window.clipboard.writeText(shortURL)

            // Sending notification
            new Notification('Kapturo', { body: 'Screencapture URL was copied to your clipboard' });
            
            // Setting status of variables
            setStatus('Green');
            setStatusMessage('Ready to capture');
            
            // Display all captures
            displayCaptures(uid);

        });
        
        
    }
    
    const displayCaptures = async (uid) => {
        
         // First state: loading
        setShowScreenshots('Loading');
        
        // Getting the folder 
        let folder = firebase.storage().ref().child(uid);
        
        // Getting all the images
        let images = await folder.listAll();
            
        if(images){
            
            // It's important to declare this variable before map function
            // If declared inside map, the state will break
            let state = [];
            
            // Getting the URL for each reference and
            // Creating an array with title of the image and the URL 
            // Only last 5 captures are displayed
            await Promise.all(images.items.reverse().slice(0, 5).map( async (image, key) => {
               
                // Getting title
                let title = parseInt( (image.name).slice(0, -4) );
                
                // Getting downloadURL
                let dwnldURL = await image.getDownloadURL();
                let shortURL = await shortenURL(dwnldURL);
                
                // This is the new object containing title and url
                let object = {title: title, url: shortURL};
                    
                // Appending the new array to the old state
                state = [...state, object];
                    
                // Sorting the array
                state = state.sort( (a, b) => (a.title > b.title) ? -1 : 1 );
                    
            })); 
            
            // Setting new state and showing screenshots
            setItems(state);
            setShowScreenshots(true);
        }
    }
    
    const shortenURL = async (longURL) => {
        
        let url = 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyB1caNJEEBjbz944Rlf9hZMTyyH5GHypLU';
        
        let longDynamicLink = 'https://kapturo.page.link/?link=' + encodeURIComponent(longURL);
        
        let response = await fetch(url, {
          "method": "POST",
          "headers": {
            "content-type": "application/json"
          },
          "body": JSON.stringify({"longDynamicLink": longDynamicLink})
        });
        
        let data = await response.json();
        
        return data.shortLink;
        
    }
        
    return (
    <div className = 'App'>
        <div className = 'Header-Arrow'></div>
        <div className = 'Header'>
            <div className = 'Dummy'>
            </div>
            <div className = 'Title' onClick = { () => setShowScreenshots(false) }>Kapturo</div>
            <div className = 'History'>
                <svg onClick = { () => displayCaptures(userID) }xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path fill = "white" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
            </div>
        </div>
        <div className = 'Box'>
        { !showScreenshots 
        ? <div className = 'Waiting'>
          { mode === 'on'
          ? <>
                <img src = {mainLogo}></img>
                <p>Press</p>
                <p><kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>3</kbd></p>
                <p>or</p>
                <p><kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>4</kbd></p>
            </>
          : <>
                <img src = {mainLogoPaused}></img>
                <p>Kapture is paused.</p> 
                <p>Turn it on to save captures again.</p>
            </>
          }   
          </div>
        : <div className = 'Completed'>
            <h2>Last screenshots</h2>
            { showScreenshots === 'Loading' && <Loading/>}
            { showScreenshots !== 'Loading' && items && items.map( (item, key) => 
                <div className = 'File' key = {key}>
                    <img src = {item.url}></img>
                    <div className = 'Title-Description'>
                        <div className = 'Title'><ReactTimeAgo date = {item.title}/></div>
                        <div className = 'Description'>{item.url}</div>
                    </div>   
                </div>)
            }
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