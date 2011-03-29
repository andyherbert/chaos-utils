# Various utilities and resources for the Sinclair Spectrum computer game ‘Chaos’

## gooey-blob-group/grab

    Usage: grab [--rehash]

Each page will be loaded every 10 seconds and appended to gooeyblob.html
All the messages will by saved as gooeyblob.json

--rehash switch, reloads from gooeyblob.json to create gooeyblob.html 

Requires OS X, Safari, hpricot, and json gems

## ripper/lib/chaos.rb

Ruby library to obtain information from a spectrum snapshot with chaos loaded
into memory.

## ripper/chaos2json

    Usage: chaos2json (requires chaos.sna in working directory)
  
Will create `gfx/` for ripped graphics, and `data/` for various lookup tables.

# Contact

andy.herbert@gmail.com