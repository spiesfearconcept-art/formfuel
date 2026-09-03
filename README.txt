FormFuel — deploy bundle
========================

Works on GitHub Pages, Netlify, Cloudflare Pages — any static HTTPS host.
All eight files must sit together at the same level.

  index.html        the app
  manifest.json     makes it installable
  sw.js             offline + caching
  icon-*.png        home-screen icons
  .nojekyll         stops GitHub Pages processing the files (harmless elsewhere)


GITHUB PAGES
  1. New repository (must be PUBLIC for free Pages).
  2. Upload all these files to the repo root — drag them into the
     "uploading an existing file" box on github.com, no git needed.
     Make sure .nojekyll goes up too (it's a hidden file: on macOS press
     Cmd+Shift+. in Finder to show hidden files before dragging).
  3. Settings -> Pages -> Source: "Deploy from a branch",
     Branch: main, folder: / (root). Save.
  4. Live in ~1 minute at  https://<you>.github.io/<repo>/

  Every path in here is relative, so serving from a subfolder works.

NETLIFY
  app.netlify.com/drop  -- drag this whole folder in.


WHEN YOU DEPLOY AN UPDATE
  Change CACHE in sw.js ("formfuel-v2" -> "formfuel-v3"), or people
  keep the old build forever.

IT MUST BE HTTPS
  The camera will not start otherwise and the service worker will not
  register. GitHub Pages and Netlify are both https by default.
