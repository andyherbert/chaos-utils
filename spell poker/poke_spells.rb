#!/usr/bin/env ruby
require '../chaos-lib/chaos'

chaos = Chaos.new('chaos.sna')
spells = ['disbelieve', 'elf', 'king cobra', 'king cobra', 'king cobra', 'king cobra', 'king cobra', 'king cobra', 'king cobra', 'king cobra', 'king cobra', 'king cobra', 'king cobra']
chaos.poke_spells(0, spells)
# chaos.poke_spells(1, spells)
chaos.dump_snapshot('chaos_poked.sna')
`open ./chaos_poked.sna`
