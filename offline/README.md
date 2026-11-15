# Offline version

[`Splunk-Pipeline-Explorer-Build-228.html`](Splunk-Pipeline-Explorer-Build-228.html) is the Splunk Pipeline Explorer, Build 228, as one file. Save it anywhere and open it in a browser: it needs no network.

- It is the same file as `index.html` at Build 228. Every build's `index.html` works offline in the same way; this copy keeps Build 228 under a name that says which build it is.
- Only the links to Splunk's documentation need a connection.
- Saved topologies and canvas layouts are kept in the browser's own storage, on that computer. To move a topology to another machine, use Export JSON in the Builder, and Import it there.

## How it was checked

[`tools/offline-check.js`](../tools/offline-check.js) opens a page with the browser offline, and blocks any request other than the page's own file, a `data:` URL or a `blob:` URL:

```
node tools/offline-check.js offline/Splunk-Pipeline-Explorer-Build-228.html [app package, or -] [download folder]
```

With the Fortinet FortiGate add-on's package (not in the repository, as Splunk licenses it), all 23 checks pass on this file:
- all 10 views and all 28 OV tabs draw;
- the evidence pack downloads as a ZIP;
- the Config view reads the package, with Where it acts and what each tier gets; Try all samples gives its summary; the map saves as an image;
- the Builder's Export JSON, Export SVG and Export PNG, and its architecture pack, each make their file;
- no request leaves the page, and there are no page errors.

Without a package, the check uses the page's example, which has no samples, so Try all samples is skipped and 22 checks pass. A copy of the page that loads a stylesheet from another host and fetches after loading fails the check, which names both requests.
