# SubPlayer

This is a fork of SubPlayer with added support for YouTube, Indic languages with transliteration, and original subtitle retention.

[Original project](https://subplayer.js.org/) by [zhw2590582](https://github.com/zhw2590582/SubPlayer)

![Screenshot](./public/screenshot.png)
## Live Demo

[Vercel Deployment](https://subplayer-payyup.vercel.app/)

## Usage

* Please wait for the sample video and subtitles to load from Vercel servers upon first visit.

* Select a language and click "Translation" from the right menu to translate from English and toggle it by using the "Use translated subtitles?" checkbox. The selected language is then used for editing and export.
  * If translated subs do not exist, English subs will be used upon export even if the box is checked.

* Enter YouTube link and click on "Import YouTube" to fetch a video from YouTube along with its eng captions.

* Since the direct video link returned by the [public API](https://youtube-dl-utils-api.herokuapp.com/get_youtube_video_link_with_captions) does not respond with an 'Access-Control-Allow-Origin' header and returns an opaque response without CORS enabled, [this Google Chrome extension](https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc) is needed to download the video from YouTube servers in order to load its waveform and ultimately export it after burning subtitles.
  * This issue can only be fixed from the backend

* If "Error downloading video" pop-up is displayed, the extension is probably not enabled.

* Video cannot be exported until it's completely downloaded in the background.

* The site is reloaded upon successful video export to clear MEMFS and prevent memory leak.
  * This causes the YouTube video to reload upon every video export.

* Persisted YouTube videos must be reimported to generate their waveforms. 

* COEP and COOP headers are enabled in order to use SharedArrayBuffer for FFmpeg.

* The fonts for subtitles are automatically changed based on their language. This is achieved by using multiple different fonts (namely Noto Sans).

* Upon splitting a subtitle, only the language selected is split, while the other is duplicated. This is done to prevent incorrect splitting of the other language.

