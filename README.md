# SubPlayer

This is a fork of SubPlayer with added support for YouTube, Indic languages with transliteration, and original subtitle retention.

![Screenshot](./public/screenshot.png)
## Live Demo

[Vercel Deployment](https://subplayer-payyup.vercel.app/)

[Original](https://subplayer.js.org/)

## Usage

* Since the direct video link returned by the [public API](https://youtube-dl-utils-api.herokuapp.com/get_youtube_video_link_with_captions) does not respond with a 'Access-Control-Allow-Origin' header and returns an opaque response without CORS enabled, [this Google Chrome extension](https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc) is needed to fetch the video from YouTube servers.

* The entire YouTube video is then downloaded along with eng subtitles before it can be played/edited.

## License

MIT © Harvey Zack
