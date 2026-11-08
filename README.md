# Lönn AI website

A static website for the Lönn AI project, made of two pages:

- `index.html`: the landing page (hero, problem, how it works, routing video, integration, results chart with the λ dial, dashboard video, pricing, roadmap, call to action)
- `prestudy.html`: a summary of the pre-study

There is no build step, framework or database. It is plain HTML, CSS and JavaScript.

```
index.html
prestudy.html
assets/css/style.css     all styling (colours are at the top)
assets/js/main.js        scroll effects, route animation, chart, λ dial
assets/img/              logos, favicon, video poster
videos/routing.mp4       the routing walkthrough (taken from the pitch deck)
videos/dashboard.mp4     ← ADD THIS (the dashboard demo video)
.nojekyll                tells GitHub Pages to serve files as they are
```

## Add the dashboard video

Save it as `videos/dashboard.mp4`. Until the file exists, the page shows a "coming soon" placeholder.

GitHub refuses files over 100 MB, and smaller files load faster. If the video is large, compress it, for example with HandBrake (preset "Fast 1080p30") or with ffmpeg:

```
ffmpeg -i dashboard-original.mp4 -c:v libx264 -crf 26 -preset veryfast -c:a aac -b:a 128k -movflags +faststart videos/dashboard.mp4
```

`+faststart` lets the video start playing before it has fully downloaded.

Optional: add a poster image (a still frame shown before play) by putting `poster="assets/img/dashboard-poster.jpg"` on the dashboard `<video>` tag in `index.html`.

## Publish on GitHub Pages (free)

1. Create a new repository on GitHub, for example `lonn-ai`.
2. Upload everything in this folder to the repository root. You can drag and drop the files on the repository page ("Add file → Upload files"), or use git:
   ```
   git init
   git add .
   git commit -m "Lönn AI website"
   git branch -M main
   git remote add origin https://github.com/<your-user>/lonn-ai.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**, then **main** and **/ (root)**, and save.
4. After a minute or two, the site is live at `https://<your-user>.github.io/lonn-ai/`.

Every later push updates the site automatically.

## Preview locally

Open `index.html` directly in a browser. To make the videos behave exactly as they will online, you can instead run a small local server from this folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Editing tips

- Text lives directly in the two HTML files.
- The chart and λ dial data are at the top of the results part of `assets/js/main.js` (`LAMBDA` and `SINGLE`).
- The "Request access" buttons open an email to hello@lonnai.com. Search for `mailto:` to change the address, or point the buttons at a Google Form.
- Animations are switched off automatically for visitors who have "reduce motion" turned on.
