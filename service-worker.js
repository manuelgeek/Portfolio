// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//Cache polyfil to support cacheAPI in all browsers
importScripts('cache-polyfill.js');

var dataCacheName = 'manuel';
var cacheName = 'manu';
var filesToCache = [
  '/',
  'index.html',
  'img/favicons/apple-touch-icon-57x57.png',
  'img/favicons/apple-touch-icon-60x60.png',
  'img/favicons/favicon-32x32.png',
  'img/favicons/favicon-16x16.png',
  'img/favicons/apple-touch-icon.png',
  'img/favicons/apple-touch-icon.png',
  'css/normalize.css',
  'css/bootstrap.css',
  'css/owl.css',
  'css/animate.css',
  'fonts/font-awesome-4.1.0/css/font-awesome.min.css',
  'fonts/eleganticons/et-icons.css',
  'css/cardio.css',
  'js/jquery-1.11.1.min.js',
  'js/owl.carousel.min.js',
  'js/bootstrap.min.js',
  'js/wow.min.js',
  'js/typewriter.js',
  'js/jquery.onepagenav.js',
  'js/main.js',
  'js/app.js',
  'img/favicons/android-chrome-48x48.png',
  'img/favicons/android-chrome-36x36.png',
  'manifest.json'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  var dataUrl = 'https://manuel.appslab.co.ke';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
