'use client'

export function SortControl({ sort }: { sort: string }) {
  return (
    <label>
      Sort By:{' '}
      <select
        className="sort-select"
        defaultValue={sort}
        onChange={(e) => {
          const url = new URL(window.location.href)
          url.searchParams.set('sort', e.target.value)
          url.searchParams.delete('page')
          window.location.href = url.toString()
        }}
      >
        <option value="default">Default</option>
        <option value="price-asc">Price low→high</option>
        <option value="price-desc">Price high→low</option>
        <option value="name-asc">Name A→Z</option>
        <option value="popular">Most ordered</option>
        <option value="newest">Newest</option>
      </select>
    </label>
  )
}
