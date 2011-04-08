#!/usr/bin/env ruby
require '../chaos-lib/chaos'

chaos = Chaos.new('chaos.sna')
chaos.poke_spells(0, ['DISBELIEVE', 'MAGIC SHIELD', 'MAGIC ARMOUR'])
chaos.poke_spells(1, ['DISBELIEVE', 'GOOEY BLOB', 'DARK CITADEL', 'GOLDEN DRAGON'])
chaos.dump_snapshot('chaos_poked.sna')
`open ./chaos_poked.sna`
