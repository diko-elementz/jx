


self.onmessage = function (evt) {

   //var xhr = new XMLHttpRequest();
   //xhr.open('GET', evt.data, false);
   //xhr.send(null);
   //xhr = null;
   //
   //self.postMessage(evt.data);
   importScripts(evt.data);

   //console.log('worker received data: ', parent);

};

console.log('loaded worker!');


