#!/usr/bin/env ruby
require '../chaos-lib/chaos'

chaos = Chaos.new('chaos.sna')
spells = ['disbelieve', 'raise dead', 'vampire', 'shadow wood', 'magic castle', 'lion', 'elf', 'crocodile', 'goblin', 'orc']
chaos.poke_spells(0, spells)
chaos.poke_spells(1, spells)
chaos.dump_snapshot('chaos_poked.sna')
`open ./chaos_poked.sna`
