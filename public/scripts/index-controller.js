(function () {
  const pushApplicationKey = 'BI3lMy8rtcJyacFu-S5Od_YgZmVyHDVZIgTRZENbN6r5zoYbJmYWEvsV2eDpDXlOKwccA-GQcqWwumI9wWTHqm0';

  const updateReady = (worker) => {
    const toast = document.getElementById('toast-container');
    const refresh = document.getElementById('toast-refresh');
    const close = document.getElementById('toast-close');
    refresh.onclick = () => {
      worker.postMessage({
        updated: true
      });
      toast.setAttribute('aria-hidden', true);
    };

    close.onclick = () => {
      toast.setAttribute('aria-hidden', true);
    };
    toast.setAttribute('aria-hidden', false);
  };

  const trackInstalling = (worker) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        updateReady(worker);
      }
    });
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  window.addEventListener('load', () => {
    // skip the PWA stack if any of the required elements are not available in the browser
    if ('serviceWorker' in navigator === false || 'PushManager' in window === false || "Notification" in window === false) return;

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        if (!navigator.serviceWorker.controller) return;

        // Code from this point onwards applies if the page is already controlled by a serivce worker
        // It is used mainly for providing the ability for a user to choose to activate a new version of the service worker.
        // This is an opinion but it is considered to be polite to allow the user to control the activation.
        // The reason is that the app might have data in the origin level storages that are awaiting to be synced to the server.
        // This can happen when data is created on the client but the network is unstable or down so it is stored in storage till the server is online again.
        console.log('This page is currently controlled by:');
        console.log(navigator.serviceWorker.controller);

        // If there is an updated worker already waiting, call update ready.
        // This happens the existing worker session is not closed and the user refreshes the browser
        // or opens a new browser tab        
        if (registration.waiting) {
          console.log('Trigger update ready by registration.waiting');
          updateReady(registration.waiting);
          return;
        }
    
        // Not sure when this is called
        if (registration.installing) {
          console.log('Track installing by registration.installing.');
          trackInstalling(registration.installing);
          return;
        }

        // Otherwise listen for new workers arriving, track its progress and call update ready if installed
        // This is triggered when there is a new service worker that should replace the current version appears
        registration.addEventListener('updatefound', function () {
          console.log('Track installing by updatefound event.');
          trackInstalling(registration.installing);
        });
    
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });

        Notification.requestPermission(function (permission) {
          console.log('Client has enabled notifications');
        });        

        // The subscribe call will trigger a Notification.requestPermission call.
        // But usually applications will want more control over this and make it's own call
        registration.pushManager.subscribe({
          userVisibleOnly: true,                                        // This prevents rougue applications from running notifications in the background without user knowledge and chrome only supports this
          applicationServerKey: urlBase64ToUint8Array(pushApplicationKey)  // This prevents random applications from sending notifications to your service worker. Since the server needs to send a header signed with the equilvalent private key
        })
        .then((subscription) => {
          fetch('http://localhost:8000/api/register-notification/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(subscription)
          })
          .then((response) => {
            console.log('Client has been subscribed');
            console.log(subscription);
          })
        });
      })
      .catch(error => console.log(`Service Worker registration failed: ${error}`))

    const what = document.getElementById('what');
    what.onclick = (event) => {
      event.preventDefault();
      fetch('http://localhost:8000/api/send-notification/')
        .then((response) => {
          console.log('Trigger push notification');
        });
      window.open('https://developers.google.com/web/fundamentals/primers/service-workers/', '_blank');
    };
  })
})();