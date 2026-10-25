import Link from 'next/link'

export type TileData = {
  id: number
  title: string
  href: string
  imageIndex: number
}

export function CategoryTiles({ tiles }: { tiles: TileData[] }) {
  return (
    <section className="mb-4">
      <div className="tiles-grid">
        {tiles.map((tile) => {
          const idx = ((tile.imageIndex - 1) % 40) + 1
          const padded = String(idx).padStart(2, '0')
          return (
            <Link key={tile.id} href={tile.href} className="category-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/placeholders/tiles/tile-${padded}.svg`}
                alt={tile.title}
                className="category-tile-img"
                width={120}
                height={120}
              />
              <span className="category-tile-label">{tile.title}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
