import React, { useEffect, useState } from 'react';
import ReactTimeAgo from 'react-time-ago';
import JavascriptTimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import mainLogo from './mainLogo.png';
import firebase from 'firebase';
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
    const [imgURL, setImgURL] = useState(null);
    const [status, setStatus] = useState('Green');
    const [statusMessage, setStatusMessage] = useState('Ready to capture'); 
        
    useEffect( () => {
            
        // Waiting until user make screencapture
        window.ipcRenderer.on('ping', (event, message) => { 
         
            // Getting the image
            var blob = new Blob([message[0]], {type: 'image/png'});
            
            // Getting the machine id
            var uid = message[1];
            
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
                
            }, () => {
                
                task.snapshot.ref.getDownloadURL().then( downloadURL => {
                    
                    // Setting status of variables
                    setStatus('Green');
                    setStatusMessage('Ready to capture: press (⌘ + ⇧ + 3) or (⌘ + ⇧ + 4)');
                    setImgName('kapture' + timeStamp + '.png');
                    setImgURL('ok'); 
                    
                    // Shorten URL and    
                    // Writing uRL in clipboard
                    shortenURL(downloadURL).then( shortURL => window.clipboard.writeText(shortURL) );
                    
                    // Sending notification
                    new Notification('Woof-woof!', {
                        body: 'Screencapture URL was copied to your clipboard' 
                    });
                        
                    // Getting old captures if there are any
                    var images = firebase.storage().ref().child(uid);
                        
                    // Getting the references of these images
                    images.listAll().then( result => { 
                        
                        // It's important to declare this variable before map function
                        // If declared inside map, the state will break
                        let state = [];
                        
                        if(result){
                            // Getting the URL for each reference and
                            // Creating an array with title of the image and the URL 
                            // Only last 5 captures are displayed
                            result.items.reverse().slice(0, 5).map( reference => {
                                
                                // Getting title
                                let title = parseInt( (reference.name).slice(0, -4) );
                                
                                // Getting downloadURL
                                reference.getDownloadURL().then( downloadURL => shortenURL(downloadURL) ).then(shortURL => {
                                    
                                    // This is the new object containing title and url
                                    let object = {title: title, url: shortURL};
                                    
                                    // Appending the new array to the old state
                                    state = [...state, object];
                                    
                                    // Sorting the array
                                    state = state.sort( (a, b) => (a.title > b.title) ? -1 : 1 );
                                    
                                    // Setting the new state
                                    setItems(state);
                                    
                                });
                                  
                            });
                            
                        }
                        
                    }).catch( error => {
                      // Handle any errors
                      setStatus('Red');
                      setStatusMessage('There was an error. Please, try it again.');
                    });
                });
                
            });
        });    
        
    }, []);
    
    const shortenURL = async (longURL) => {
        
        let url = 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyB1caNJEEBjbz944Rlf9hZMTyyH5GHypLU';
        
        let longDynamicLink = 'https://kaptura.page.link/?link=' + encodeURIComponent(longURL);
        
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
            <div  className = 'Title'>Kaptura</div>
        </div>
        <div className = 'Box'>
        { !imgURL 
        ? <div className = 'Waiting'>
            <img src = {mainLogo}></img>
            <p>Press</p>
            <p><kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>3</kbd></p>
            <p>or</p>
            <p><kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>4</kbd></p>
          </div>
        : <div className = 'Completed'>
            { items && items.map( (item, key) => 
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