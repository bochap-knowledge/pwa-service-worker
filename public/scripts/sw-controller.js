(function () {
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

  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator === false) return;

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
      })
      .catch(error => console.log(`Service Worker registration failed: ${error}`))
  })
})();