# Various utilities and resources for the Sinclair Spectrum computer game ‘Chaos’

## gooey-blob-group/grab

Dumps all the messages from the ‘GooeyBlob’ Yahoo group into a single html
and json file.

    Usage: grab [--rehash]

Each page will be loaded every 10 seconds and appended to gooeyblob.html
All the messages will by saved as gooeyblob.json

--rehash switch, reloads from gooeyblob.json to create gooeyblob.html 

Requires OS X, Safari, hpricot, and json gems

## ripper/lib/chaos.rb

Ruby library to obtain information from a spectrum snapshot with chaos loaded
into memory.

## ripper/chaos2json

Uses the Chaos ruby library to output all the data hidden in a snapshot to
json.

    Usage: chaos2json (requires chaos.sna in working directory)

If `chaos.scr` containing the loading screen is also located in the working
directory, then it will be appended to the json object.

# Contact

andy.herbert@gmail.com